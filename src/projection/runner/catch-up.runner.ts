import { Inject, Injectable, Optional } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { SENSOR_VALUE_PUBLISHER, type SensorValuePublisher } from '@/projection/kafka/sensor-value.publisher';
import {
  IntegrityViolation,
  ProjectionResult,
  Projector,
} from '@/projection/projector/projector';
import {
  EVENT_STORE_READER,
  EventStoreEventRow,
  type EventStoreReaderRepository,
} from '@/projection/repository/event-store-reader.repository';
import {
  PROJECTION_CURSOR,
  type ProjectionCursorRepository,
} from '@/projection/repository/projection-cursor.repository';
import { DRIZZLE, type Drizzle } from '@/shared/database/drizzle.provider';
import { LogAction, LogContext } from '@/shared/logger/logging-context';

@Injectable()
export class CatchUpRunner {
  private static readonly BATCH_SIZE: number = 500;

  constructor(
    private readonly logger: PinoLogger,
    @Inject(DRIZZLE)
    private readonly db: Drizzle,
    @Inject(EVENT_STORE_READER)
    private readonly reader: EventStoreReaderRepository,
    @Inject(PROJECTION_CURSOR)
    private readonly cursors: ProjectionCursorRepository,
    @Optional()
    @Inject(SENSOR_VALUE_PUBLISHER)
    private readonly sensorPublisher?: SensorValuePublisher,
  ) {
    this.logger.setContext(CatchUpRunner.name);
  }

  async run<Insert>(projector: Projector<Insert>): Promise<ProjectionResult> {
    const startedAt: number = Date.now();
    const fromSeq: number = await this.cursors.getOrInit(projector.name);

    this.logger.info(
      {
        action: LogAction.PROJECTION_START,
        [LogContext.PROJECTOR_NAME]: projector.name,
        [LogContext.FROM_SEQ]: fromSeq,
      },
      "catch-up 시작",
    );

    let lastProcessed: number = fromSeq;
    let processed: number = 0;

    for (;;) {
      const events: EventStoreEventRow[] = await this.reader.fetchAfter(
        lastProcessed,
        CatchUpRunner.BATCH_SIZE,
      );

      if (events.length === 0) {
        break;
      }

      const batchFrom: number = lastProcessed;
      const batchTo: number = events[events.length - 1].globalSeq;

      const rows: Insert[] = [];

      try {
        await this.db.transaction(async (tx) => {
          for (const event of events) {
            const row: Insert = projector.map(event);

            await projector.upsert(tx, row);
            rows.push(row);
          }

          await this.cursors.update(tx, projector.name, batchTo);
        });
      } catch (err) {
        this.logger.error(
          {
            action: LogAction.DB_ERROR,
            err,
            [LogContext.PROJECTOR_NAME]: projector.name,
            [LogContext.FROM_SEQ]: batchFrom,
            [LogContext.TO_SEQ]: batchTo,
          },
          "투영 트랜잭션 실패",
        );

        throw err;
      }

      // 커밋 성공 후에만, TX 밖에서 센서 값 발행(best-effort).
      await this.publishSensorValues(projector, rows, events);

      // 커밋된 행에 프로젝터별 정합성 규칙을 적용해 위반을 표준 이상 로그로 방출한다.
      this.emitIntegrityViolations(projector, rows, events);

      this.logger.info(
        {
          action: LogAction.PROJECTION_BATCH,
          [LogContext.PROJECTOR_NAME]: projector.name,
          [LogContext.BATCH_FETCHED]: events.length,
          [LogContext.FROM_SEQ]: batchFrom,
          [LogContext.TO_SEQ]: batchTo,
        },
        "배치 처리",
      );
      this.logger.debug(
        {
          action: LogAction.CURSOR_ADVANCED,
          [LogContext.PROJECTOR_NAME]: projector.name,
          [LogContext.TO_SEQ]: batchTo,
        },
        "커서 이동",
      );

      lastProcessed = batchTo;
      processed += events.length;

      if (events.length < CatchUpRunner.BATCH_SIZE) {
        break;
      }
    }

    this.logger.info(
      {
        action: LogAction.PROJECTION_DONE,
        [LogContext.PROJECTOR_NAME]: projector.name,
        [LogContext.FROM_SEQ]: fromSeq,
        [LogContext.TO_SEQ]: lastProcessed,
        [LogContext.PROCESSED]: processed,
        [LogContext.DURATION_MS]: Date.now() - startedAt,
      },
      "catch-up 완료",
    );

    return {
      projectorName: projector.name,
      fromSeq,
      toSeq: lastProcessed,
      processed,
    };
  }

  // 투영된 행을 센서 값 토픽으로 발행한다. 발행기가 없거나(테스트/multimodal) 프로젝터가
  // 변환을 미구현하면 건너뛴다. Kafka 장애는 경고만 남기고 삼켜 투영을 막지 않는다.
  private async publishSensorValues<Insert>(
    projector: Projector<Insert>,
    rows: Insert[],
    events: EventStoreEventRow[],
  ): Promise<void> {
    if (
      this.sensorPublisher === undefined ||
      projector.toSensorValueMessages === undefined
    ) {
      return;
    }

    try {
      const messages = projector.toSensorValueMessages(rows, events);

      if (messages.length > 0) {
        await this.sensorPublisher.publish(messages);
      }
    } catch (error) {
      this.logger.error(
        {
          action: LogAction.SENSOR_PUBLISH_FAILED,
          error,
          [LogContext.PROJECTOR_NAME]: projector.name,
        },
        "센서 값 발행 실패(투영은 커밋됨)",
      );
    }
  }

  // 투영된 각 행에 프로젝터별 정합성 규칙(checkIntegrity)을 적용하고, 위반을 error 레벨
  // 표준 로그로 방출한다. error(>=40)라 로그 레인 1차 게이트(prejudge)를 트리거하고
  // 기존 분석 그래프가 근본원인 → 권고 문서를 산출한다. 검사 미구현 프로젝터는 건너뛴다.
  // 로그 윈도우는 msg 만 LLM 에 노출하므로 violation.detail 을 msg 로 싣고, 나머지는
  // 구조화 컬럼으로 함께 남긴다. 검사 예외는 삼켜(투영은 이미 커밋) 진행을 막지 않는다.
  private emitIntegrityViolations<Insert>(
    projector: Projector<Insert>,
    rows: Insert[],
    events: EventStoreEventRow[],
  ): void {
    if (projector.checkIntegrity === undefined) {
      return;
    }

    for (let i = 0; i < rows.length; i++) {
      let violations: IntegrityViolation[];

      try {
        violations = projector.checkIntegrity(rows[i], events[i]);
      } catch (error) {
        this.logger.error(
          {
            action: LogAction.DB_ERROR,
            error,
            [LogContext.PROJECTOR_NAME]: projector.name,
            [LogContext.GLOBAL_SEQ]: events[i].globalSeq,
          },
          "정합성 검사 실패(투영은 커밋됨)",
        );

        continue;
      }

      for (const violation of violations) {
        this.logger.error(
          {
            action: LogAction.PROJECTION_INTEGRITY_VIOLATION,
            [LogContext.PROJECTOR_NAME]: projector.name,
            [LogContext.READ_MODEL_NAME]: violation.readModelName,
            [LogContext.SCENE_KEY]: violation.sceneKey,
            [LogContext.ATTEMPT_NUM]: violation.attemptNum,
            [LogContext.STREAM_ID]: violation.streamId,
            [LogContext.GLOBAL_SEQ]: violation.globalSeq,
            [LogContext.RULE_NAME]: violation.ruleName,
            [LogContext.AFFECTED_COLUMNS]: violation.affectedColumns,
            [LogContext.OBSERVED_VALUE]: violation.observedValue,
            [LogContext.EXPECTED]: violation.expected,
          },
          violation.detail,
        );
      }
    }
  }
}

# Self-Adaptive CQRS 분석 리포트

## 근본원인 분석
- 요약: 사용자가 여러 번 카드 단건 조회 요청을 하였으나, 모든 요청에서 'insight 카드 없음'이라는 응답을 받았다. 이는 카드 데이터의 존재 여부를 적절히 반영하지 못하는 기존 Read Model의 부족을 나타낸다.
- 타임라인: 03:11:42 - 비정상 선판단 발생, 카드 렌더링 및 데이터 조회. 03:12:24 - 분석 리포트 생성 완료. 03:18:09 - 카드 단건 조회 요청 수신 및 렌더링 완료. 03:18:12 - 시드 요청 수신 및 완료. 03:18:16 - 정상 선판단. 03:18:17 - 카드 단건 조회 요청 수신, 카드 없음 응답 반복. 03:18:19 - 정상 선판단. 03:18:27 - 비정상 선판단 발생, 카드 렌더링 및 데이터 조회. 04:17:44 - 카드 단건 조회 요청 수신, 카드 없음 응답. 05:01:54 - 카드 단건 조회 요청 수신, 카드 없음 응답.
- 실패한 요청 의도: insight 카드 단건 조회 요청
- 의심되는 Read Model 부족: 카드 데이터의 존재 여부를 적절히 반영하지 못하고 있음.

## 이상 로그 맥락 (±N 윈도우)
> 빈도: 최근 1h — `insight.seed.request`(level 30) 1회, `-`(level 30) 61회, `insight.card.rendered`(level 20) 10회, `insight.seed.done`(level 30) 1회, `llm.analysis.aggregate.done`(level 30) 3회, `-`(level 20) 16회, `insight.card.request`(level 30) 5회, `insight.card.miss`(level 40) 4회, `llm.prejudge.skipped`(level 30) 1회, `llm.prejudge.triggered`(level 30) 3회.

| time | level | action | correlation_id | msg |
| --- | --- | --- | --- | --- |
| 03:11:42.084 | 30 | llm.prejudge.triggered | - | 선판단: 비정상 |
| 03:11:42.094 | 20 | - | - | 이상 로그 윈도우 조립 |
| 03:11:42.095 | 20 | - | - | 엔티티 목록 조회 |
| 03:11:42.098 | 20 | insight.card.rendered | - | insight 카드 렌더 |
| 03:11:42.098 | 20 | - | - | 카드 데이터 조회 |
| 03:11:42.102 | 20 | insight.card.rendered | - | insight 카드 렌더 |
| 03:11:42.102 | 20 | - | - | 카드 데이터 조회 |
| 03:11:42.105 | 20 | insight.card.rendered | - | insight 카드 렌더 |
| 03:11:42.105 | 20 | - | - | 카드 데이터 조회 |
| 03:12:24.598 | 30 | llm.analysis.aggregate.done | - | 분석 리포트 생성 |
| 03:18:09.765 | 30 | insight.card.request | dc023e5f-1c69-4bac-91ed-fcd8fb55b937 | insight 카드 단건 조회 요청 수신 |
| 03:18:09.771 | 20 | insight.card.rendered | dc023e5f-1c69-4bac-91ed-fcd8fb55b937 | insight 카드 렌더 |
| 03:18:09.771 | 20 | - | dc023e5f-1c69-4bac-91ed-fcd8fb55b937 | 카드 데이터 조회 |
| 03:18:09.773 | 30 | - | dc023e5f-1c69-4bac-91ed-fcd8fb55b937 | request completed |
| 03:18:12.544 | 30 | insight.seed.request | bruno-seed | insight 시드 요청 수신 |
| 03:18:12.622 | 30 | insight.seed.done | bruno-seed | InsightDB Phase 1 시드 완료 |
| 03:18:12.623 | 30 | - | bruno-seed | request completed |
| 03:18:16.868 | 30 | llm.prejudge.skipped | - | 선판단: 정상 |
| 03:18:17.103 | 30 | insight.card.request | bruno-card-miss-b | insight 카드 단건 조회 요청 수신 |
| 03:18:17.105 | 40 | insight.card.miss | bruno-card-miss-b | insight 카드 없음 ← 트립 앵커 |
| 03:18:17.106 | 30 | - | bruno-card-miss-b | request completed |
| 03:18:17.257 | 30 | insight.card.request | bruno-card-miss-b | insight 카드 단건 조회 요청 수신 |
| 03:18:17.260 | 40 | insight.card.miss | bruno-card-miss-b | insight 카드 없음 |
| 03:18:17.261 | 30 | - | bruno-card-miss-b | request completed |
| 03:18:17.407 | 30 | insight.card.request | bruno-card-miss-b | insight 카드 단건 조회 요청 수신 |
| 03:18:17.411 | 40 | insight.card.miss | bruno-card-miss-b | insight 카드 없음 |
| 03:18:17.412 | 30 | - | bruno-card-miss-b | request completed |
| 03:18:17.744 | 30 | insight.card.request | bruno-card-miss-b | insight 카드 단건 조회 요청 수신 |
| 03:18:17.747 | 40 | insight.card.miss | bruno-card-miss-b | insight 카드 없음 |
| 03:18:17.748 | 30 | - | bruno-card-miss-b | request completed |
| 03:18:19.272 | 30 | llm.prejudge.skipped | - | 선판단: 정상 |
| 03:18:27.572 | 30 | llm.prejudge.triggered | - | 선판단: 비정상 |
| 03:18:27.582 | 20 | - | - | 이상 로그 윈도우 조립 |
| 03:18:27.584 | 20 | - | - | 엔티티 목록 조회 |
| 03:18:27.586 | 20 | - | - | 카드 데이터 조회 |
| 03:18:27.587 | 20 | insight.card.rendered | - | insight 카드 렌더 |
| 03:18:27.592 | 20 | - | - | 카드 데이터 조회 |
| 03:18:27.592 | 20 | insight.card.rendered | - | insight 카드 렌더 |
| 03:18:27.596 | 20 | insight.card.rendered | - | insight 카드 렌더 |
| 03:18:27.596 | 20 | - | - | 카드 데이터 조회 |
| 04:17:44.498 | 30 | insight.card.request | bruno-card-miss-b | insight 카드 단건 조회 요청 수신 |
| 04:17:44.502 | 40 | insight.card.miss | bruno-card-miss-b | insight 카드 없음 |
| 04:17:44.508 | 30 | - | bruno-card-miss-b | request completed |
| 05:01:54.514 | 30 | insight.card.request | bruno-card-miss-b | insight 카드 단건 조회 요청 수신 |
| 05:01:54.518 | 40 | insight.card.miss | bruno-card-miss-b | insight 카드 없음 |
| 05:01:54.521 | 30 | - | bruno-card-miss-b | request completed |

## 의사결정
- 선택: newReadModel
- 근거: 기존 Read Model이 카드 데이터의 존재 여부를 적절히 반영하지 못하고 있어, 새로운 Read Model이 필요하다.

## 신규 Read Model — `read_insight_card`

- 목적: insight 카드 단건 조회 요청에 대한 응답을 적절히 반영하기 위한 Read Model

- 근거: 기존 read_grip_result 및 read_multimodal 모델은 카드 데이터의 존재 여부를 반영하지 못하고 있으며, 필요한 필드가 부족하여 신규 Read Model이 필요하다. 기존 모델의 필드로는 insight 카드의 존재 여부를 확인할 수 없기 때문에, 신규 모델을 통해 이를 해결하고자 한다.

- 키 컬럼: scene_key, attempt_num

- 원천 이벤트: GripAttemptRecorded

### 필드

| name | dataType | meaning |
| --- | --- | --- |
| scene_key | varchar | 장면 식별 키 |
| attempt_num | smallint | 파지 시도 번호 |
| object_name | varchar | 파지 대상 객체명 |
| grip_succeed | smallint | 파지 성공 여부 |
| occurred_at | timestamptz | 데이터 촬영 일자 |
| card_exists | boolean | insight 카드 존재 여부 |
| stream_id | varchar | ES 스트림 ID |
| global_seq | bigint | 투영 출처 이벤트의 ES 전역 시퀀스 |

### Drizzle 스키마

```ts
import { bigint, boolean, pgTable, primaryKey, smallint, timestamp, varchar } from 'drizzle-orm/pg-core';

export const readInsightCard = pgTable(
  "read_insight_card",
  {
    sceneKey: varchar("scene_key").notNull(),
    attemptNum: smallint("attempt_num").notNull(),

    objectName: varchar("object_name").notNull(),
    gripSucceed: smallint("grip_succeed").notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
    cardExists: boolean("card_exists").notNull(),

    streamId: varchar("stream_id").notNull(),
    globalSeq: bigint("global_seq", { mode: "number" }).notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.sceneKey, t.attemptNum] }),
  ],
);
```

### 마이그레이션 SQL

```sql
CREATE TABLE read_insight_card (
  scene_key VARCHAR NOT NULL,
  attempt_num SMALLINT NOT NULL,
  object_name VARCHAR NOT NULL,
  grip_succeed SMALLINT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL,
  card_exists BOOLEAN NOT NULL,
  stream_id VARCHAR NOT NULL,
  global_seq BIGINT NOT NULL,
  PRIMARY KEY (scene_key, attempt_num)
);
```

### Projector

```ts
import { Injectable } from '@nestjs/common';
import { type InferInsertModel } from 'drizzle-orm';
import { PinoLogger } from 'nestjs-pino';
import { type ToyDataDto, toyDataSchema } from '@/insert/dto/toy-data.dto';
import type { Projector } from '@/projection/projector/projector';
import type { EventStoreEventRow } from '@/projection/repository/event-store-reader.repository';
import { DrizzleTx } from '@/shared/database/drizzle.provider';
import { readInsightCard } from '@/shared/database/schema';
import { LogAction, LogContext } from '@/shared/logger/logging-context';

type ReadInsightCardInsert = InferInsertModel<typeof readInsightCard>;

@Injectable()
export class InsightCardProjector implements Projector<ReadInsightCardInsert> {
  readonly name: string = "insight-card-projector";

  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(InsightCardProjector.name);
  }

  map(event: EventStoreEventRow): ReadInsightCardInsert {
    let payload: ToyDataDto;
    try {
      payload = toyDataSchema.parse(event.payload);
    } catch (err) {
      this.logger.error(
        {
          action: LogAction.MAP_FAILED,
          err,
          [LogContext.EVENT_ID]: event.eventId,
          [LogContext.STREAM_ID]: event.streamId,
          [LogContext.ATTEMPT_NUM]: event.attemptNum,
          [LogContext.GLOBAL_SEQ]: event.globalSeq,
        },
        "이벤트 매핑(검증) 실패",
      );

      throw err;
    }

    this.logger.debug(
      {
        action: LogAction.EVENT_MAPPED,
        [LogContext.PROJECTOR_NAME]: this.name,
        [LogContext.SCENE_KEY]: event.streamId.replace(/^grip-attempt:/, ""),
        [LogContext.ATTEMPT_NUM]: event.attemptNum,
        [LogContext.GLOBAL_SEQ]: event.globalSeq,
      },
      "이벤트 매핑",
    );

    return {
      sceneKey: event.streamId.replace(/^grip-attempt:/, ""),
      attemptNum: event.attemptNum,
      objectName: payload.objects.length > 0 ? payload.objects[0].class_name : null,
      gripSucceed: payload.grip_succeed,
      occurredAt: event.occurredAt,
      cardExists: payload.objects.length > 0,
      streamId: event.streamId,
      globalSeq: event.globalSeq,
    };
  }

  async upsert(tx: DrizzleTx, row: ReadInsightCardInsert): Promise<void> {
    await tx
      .insert(readInsightCard)
      .values(row)
      .onConflictDoUpdate({
        target: [readInsightCard.sceneKey, readInsightCard.attemptNum],
        set: {
          objectName: row.objectName,
          gripSucceed: row.gripSucceed,
          occurredAt: row.occurredAt,
          cardExists: row.cardExists,
          streamId: row.streamId,
          globalSeq: row.globalSeq,
        },
      });
  }
}
```

### 배선(컨트롤러/서비스/모듈)

```ts
export * from './read_insight_card';
import { ProjectionService } from '@/projection/projection.service';

@Controller("projection")
export class ProjectionController {
  constructor(
    private readonly logger: PinoLogger,
    private readonly projectionService: ProjectionService,
  ) {
    this.logger.setContext(ProjectionController.name);
  }

  @Post("/insight-card")
  insightCard(): Promise<ProjectionResult> {
    this.logger.info(
      {
        action: LogAction.PROJECTION_REQUEST,
        [LogContext.ROUTE]: "POST /projection/insight-card",
      },
      "projection 요청 수신",
    );

    return this.projectionService.catchUpInsightCard();
  }
}
```
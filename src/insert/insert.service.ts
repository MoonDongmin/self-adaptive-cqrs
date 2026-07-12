import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { detectPayloadDrift } from '@/insert/drift/payload-drift.detector';
import { toyDataSchema } from '@/insert/dto/toy-data.dto';
import { ParsedFileName, parseToyDataFileName } from '@/insert/parser/toy-data-file-name.parser';
import { EVENT_STORE_REPOSITORY, type EventStoreRepository } from '@/insert/repository/event-store.repository';
import { LogAction, LogContext } from '@/shared/logger/logging-context';

// const TOY_DATA_DIR: string = path.resolve(process.cwd(), "data/toy-data");
const TOY_DATA_DIR: string = path.resolve(
  process.cwd(),
  "data/eval/layer1-detection",
);

export type InsertFailure = { file: string; reason: string };

export type InsertResult = {
  totalFiles: number;
  inserted: number;
  skipped: number;
  failed: InsertFailure[];
};

@Injectable()
export class InsertService {
  constructor(
    private readonly logger: PinoLogger,
    @Inject(EVENT_STORE_REPOSITORY)
    private readonly eventStore: EventStoreRepository,
  ) {
    this.logger.setContext(InsertService.name);
  }

  async insertToyData(): Promise<InsertResult> {
    const startedAt: number = Date.now();
    const entries: string[] = await this.listToyDataFiles();

    this.logger.info(
      {
        action: LogAction.INSERT_BATCH_START,
        [LogContext.TOTAL_FILES]: entries.length,
      },
      "Toy-Data 적재 시작",
    );

    const result: InsertResult = {
      totalFiles: entries.length,
      inserted: 0,
      skipped: 0,
      failed: [],
    };

    // key 단위 dedup: 파일 N개에 같은 신규 키가 있어도 배치 끝에 warn 1회만.
    const batchDrifts = new Map<string, string>();

    for (const file of entries) {
      await this.insertOneFile(file, result, batchDrifts);
    }

    this.reportPayloadDrift(batchDrifts);

    this.logger.info(
      {
        action: LogAction.INSERT_BATCH_DONE,
        [LogContext.TOTAL_FILES]: result.totalFiles,
        [LogContext.INSERTED]: result.inserted,
        [LogContext.SKIPPED]: result.skipped,
        [LogContext.FAILED]: result.failed.length,
        [LogContext.DURATION_MS]: Date.now() - startedAt,
      },
      "toy-data 적재 완료",
    );

    return result;
  }

  // 배치 동안 모은 payload 스키마 드리프트를 warn 1회로 발행한다(level 40 → prejudge 트립).
  // 신규 키는 toyDataSchema.parse 에서 유실되므로 재투영으로도 복구 불가 — Read Model 후보 신호다.
  private reportPayloadDrift(batchDrifts: Map<string, string>): void {
    if (batchDrifts.size === 0) {
      return;
    }
    this.logger.warn(
      {
        action: LogAction.PAYLOAD_SCHEMA_DRIFT,
        [LogContext.NEW_KEYS]: Object.fromEntries(batchDrifts),
        [LogContext.COUNT]: batchDrifts.size,
      },
      "payload 에 스키마가 모르는 신규 키 유입 — 적재 시 유실됨(Read Model 후보)",
    );
  }

  async insertSingleByIndex(index: number): Promise<InsertResult> {
    const entries: string[] = await this.listToyDataFiles();

    if (!Number.isInteger(index) || index < 1 || index > entries.length) {
      this.logger.warn(
        {
          action: LogAction.INSERT_REQUEST,
          [LogContext.INDEX]: index,
          [LogContext.TOTAL_FILES]: entries.length,
        },
        "index 범위 초과",
      );

      throw new NotFoundException(
        `index ${index} out of range (1..${entries.length})`,
      );
    }

    const result: InsertResult = {
      totalFiles: 1,
      inserted: 0,
      skipped: 0,
      failed: [],
    };

    const batchDrifts = new Map<string, string>();
    await this.insertOneFile(entries[index - 1], result, batchDrifts);
    this.reportPayloadDrift(batchDrifts);

    return result;
  }

  private async listToyDataFiles(): Promise<string[]> {
    return (await fs.readdir(TOY_DATA_DIR))
      // manifest.json 은 평가용 정답지(ground truth)라 적재 대상이 아니다.
      .filter((f): boolean => f.endsWith(".json") && f !== "manifest.json")
      .sort();
  }

  private async insertOneFile(
    file: string,
    result: InsertResult,
    batchDrifts: Map<string, string>,
  ): Promise<void> {
    try {
      const meta: ParsedFileName = parseToyDataFileName(file);

      const raw: string = await fs.readFile(
        path.join(TOY_DATA_DIR, file),
        "utf-8",
      );

      // parse 이전 raw 에서 드리프트 감지 — parse 후엔 신규 키가 이미 벗겨진다.
      const rawParsed: unknown = JSON.parse(raw);
      for (const drift of detectPayloadDrift(rawParsed)) {
        batchDrifts.set(drift.key, drift.sampleValue);
      }

      const parsed: Record<string, unknown> = toyDataSchema.parse(rawParsed);

      const streamId: string = `grip-attempt:${meta.sceneKey}`;

      const seq: number | null = await this.eventStore.append({
        streamId,
        attemptNum: meta.attemptNum,
        eventType: "GripAttemptRecorded",
        occurredAt: meta.capturedDate,
        payload: parsed,
      });

      if (seq === null) {
        result.skipped++;

        this.logger.debug(
          {
            action: LogAction.INSERT_FILE_SKIPPED,
            [LogContext.FILE]: file,
            [LogContext.STREAM_ID]: streamId,
            [LogContext.ATTEMPT_NUM]: meta.attemptNum,
          },
          "중복 적재 스킵(멱등)",
        );
      } else {
        result.inserted++;

        this.logger.debug(
          {
            action: LogAction.INSERT_FILE_OK,
            [LogContext.FILE]: file,
            [LogContext.STREAM_ID]: streamId,
            [LogContext.ATTEMPT_NUM]: meta.attemptNum,
            [LogContext.GLOBAL_SEQ]: seq,
          },
          "파일 적재 성공",
        );
      }
    } catch (e) {
      const reason: string = e instanceof Error ? e.message : String(e);

      result.failed.push({ file, reason });

      this.logger.warn(
        {
          action: LogAction.INSERT_FILE_FAILED,
          [LogContext.FILE]: file,
          [LogContext.REASON]: reason,
          err: e,
        },
        "toy-data 파일 적재 실패",
      );
    }
  }
}

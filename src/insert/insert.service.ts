import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { toyDataSchema } from '@/insert/dto/toy-data.dto';
import { ParsedFileName, parseToyDataFileName } from '@/insert/parser/toy-data-file-name.parser';
import { EVENT_STORE_REPOSITORY, type EventStoreRepository } from '@/insert/repository/event-store.repository';
import { LogAction, LogContext } from '@/shared/logger/logging-context';

const TOY_DATA_DIR: string = path.resolve(process.cwd(), "data/toy-data");

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

    for (const file of entries) {
      await this.insertOneFile(file, result);
    }

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

    await this.insertOneFile(entries[index - 1], result);

    return result;
  }

  private async listToyDataFiles(): Promise<string[]> {
    return (await fs.readdir(TOY_DATA_DIR))
      .filter((f): boolean => f.endsWith(".json"))
      .sort();
  }

  private async insertOneFile(
    file: string,
    result: InsertResult,
  ): Promise<void> {
    try {
      const meta: ParsedFileName = parseToyDataFileName(file);

      const raw: string = await fs.readFile(
        path.join(TOY_DATA_DIR, file),
        "utf-8",
      );

      const parsed: Record<string, unknown> = toyDataSchema.parse(
        JSON.parse(raw),
      );

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

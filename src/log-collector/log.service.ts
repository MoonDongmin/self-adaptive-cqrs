import * as fs from "node:fs";
import { Inject, Injectable } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino";
import { join } from "path";
import { readNewLines } from "@/log-collector/json-reader";
import { LogEventInsert, parseLogLine } from "@/log-collector/log-record";
import {
  LOG_CURSOR,
  type LogCursorRepository,
} from "@/log-collector/repository/log-cursor.repository";
import {
  LOG_EVENT_WRITER,
  type LogEventRepository,
} from "@/log-collector/repository/log-event.repository";
import { DRIZZLE, type Drizzle } from "@/shared/database/drizzle.provider";
import { LogAction, LogContext } from "@/shared/logger/logging-context";

export interface IngestionResult {
  sourceFile: string;
  ingested: number;
  skipped: number;
  fromOffset: number;
  toOffset: number;
}

@Injectable()
export class LogService {
  private static readonly LOG_FILE: string = join(
    process.cwd(),
    "src/shared/logger/logs/log.json",
  );

  constructor(
    private readonly logger: PinoLogger,
    @Inject(DRIZZLE) private readonly db: Drizzle,
    @Inject(LOG_EVENT_WRITER) private readonly events: LogEventRepository,
    @Inject(LOG_CURSOR)
    private readonly cursors: LogCursorRepository,
  ) {
    this.logger.setContext(LogService.name);
  }

  async run(): Promise<IngestionResult> {
    const file: string = LogService.LOG_FILE;
    const fromOffset: number = await this.cursors.getOrInit(file);
    const { lines, nextOffset } = await readNewLines(file, fromOffset);

    this.logger.debug(
      {
        action: LogAction.LOG_INGEST_START,
        [LogContext.SOURCE_FILE]: file,
        [LogContext.FROM_OFFSET]: fromOffset,
        [LogContext.TO_OFFSET]: nextOffset,
        [LogContext.LINE_COUNT]: lines.length,
      },
      "신규 로그 라인 읽음",
    );

    const rows: LogEventInsert[] = [];

    let skipped: number = 0;

    for (const line of lines) {
      try {
        const row: LogEventInsert | null = parseLogLine(line);

        if (row === null) {
          skipped += 1;
          this.logger.debug(
            {
              action: LogAction.LOG_LINE_SKIPPED,
              [LogContext.LINE]: line,
              [LogContext.REASON]: "schema-mismatch",
            },
            "스키마 불일치 라인 스킵",
          );
          continue;
        }

        rows.push(row);
      } catch {
        skipped += 1; // 깨진 JSON 한 줄 스킵
        this.logger.debug(
          {
            action: LogAction.LOG_LINE_SKIPPED,
            [LogContext.LINE]: line,
            [LogContext.REASON]: "json-parse-failed",
          },
          "JSON 파싱 실패 라인 스킵",
        );
      }
    }

    if (rows.length > 0 || nextOffset !== fromOffset) {
      await this.db.transaction(async (tx) => {
        await this.events.insertBatch(tx, rows);
        await this.cursors.update(tx, file, nextOffset);
      });
    }

    const result: IngestionResult = {
      sourceFile: file,
      ingested: rows.length,
      skipped,
      fromOffset,
      toOffset: nextOffset,
    };

    this.logger.info(
      {
        action: LogAction.LOG_INGEST_DONE,
        [LogContext.SOURCE_FILE]: result.sourceFile,
        [LogContext.INGESTED]: result.ingested,
        [LogContext.SKIPPED]: result.skipped,
        [LogContext.FROM_OFFSET]: result.fromOffset,
        [LogContext.TO_OFFSET]: result.toOffset,
      },
      "로그 적재 완료",
    );
    return result;
  }

  async delete(): Promise<void> {
    const file: string = LogService.LOG_FILE;

    await fs.promises.writeFile(file, "");

    await this.db.transaction(async (tx) => {
      await this.cursors.update(tx, file, 0);
    });

    this.logger.info(
      {
        action: LogAction.LOG_DELETE_DONE,
        [LogContext.SOURCE_FILE]: file,
      },
      "로그 파일 내용 비움 및 커서 초기화",
    );
  }
}

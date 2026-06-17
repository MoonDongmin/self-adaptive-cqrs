import { Injectable } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino";
import { LogEventRepository } from "@/log-collector/repository/log-event.repository";
import { DrizzleTx } from "@/shared/database/drizzle.provider";
import { logEvents } from "@/shared/database/schema";
import { LogContext } from "@/shared/logger/logging-context";
import { LogEventInsert } from "../log-record";

@Injectable()
export class LogEventRepositoryImpl implements LogEventRepository {
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(LogEventRepositoryImpl.name);
  }

  async insertBatch(tx: DrizzleTx, rows: LogEventInsert[]): Promise<void> {
    if (rows.length === 0) {
      return;
    }

    await tx.insert(logEvents).values(rows);
    this.logger.debug(
      { [LogContext.COUNT]: rows.length },
      "로그 이벤트 배치 삽입",
    );
  }
}

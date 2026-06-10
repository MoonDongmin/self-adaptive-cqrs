import { Inject, Injectable } from "@nestjs/common";
import { asc, gt } from "drizzle-orm";
import { PinoLogger } from "nestjs-pino";
import {
  EventStoreEventRow,
  EventStoreReaderRepository,
} from "@/projection/repository/event-store-reader.repository";
import { DRIZZLE, type Drizzle } from "@/shared/database/drizzle.provider";
import { eventStore } from "@/shared/database/schema";
import { LogAction, LogContext } from "@/shared/logger/logging-context";

@Injectable()
export class EventStoreReaderRepositoryImpl
  implements EventStoreReaderRepository
{
  constructor(
    private readonly logger: PinoLogger,
    @Inject(DRIZZLE)
    private readonly db: Drizzle,
  ) {
    this.logger.setContext(EventStoreReaderRepositoryImpl.name);
  }

  async fetchAfter(
    lastSeq: number,
    limit: number,
  ): Promise<EventStoreEventRow[]> {
    try {
      const rows = await this.db
        .select()
        .from(eventStore)
        .where(gt(eventStore.globalSeq, lastSeq))
        .orderBy(asc(eventStore.globalSeq))
        .limit(limit);

      this.logger.debug(
        {
          [LogContext.FROM_SEQ]: lastSeq,
          [LogContext.BATCH_FETCHED]: rows.length,
        },
        "이벤트 조회",
      );

      return rows.map(
        (row): EventStoreEventRow => ({
          globalSeq: Number(row.globalSeq),
          eventId: row.eventId,
          streamId: row.streamId,
          attemptNum: row.attemptNum,
          eventType: row.eventType,
          occurredAt: row.occurredAt,
          recordedAt: row.recordedAt,
          payload: row.payload,
        }),
      );
    } catch (err) {
      this.logger.error(
        { action: LogAction.DB_ERROR, err, [LogContext.FROM_SEQ]: lastSeq },
        "이벤트 조회 실패",
      );

      throw err;
    }
  }
}

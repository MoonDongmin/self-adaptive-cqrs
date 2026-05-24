import { Inject, Injectable } from "@nestjs/common";
import {
  EventStoreEventRow,
  EventStoreReaderRepository,
} from "@/projection/repository/event-store-reader.repository";
import { type Drizzle, DRIZZLE } from "@/shared/database/drizzle.provider";
import { eventStore } from "@/shared/database/schema";
import { asc, gt } from "drizzle-orm";

@Injectable()
export class EventStoreReaderRepositoryImpl
  implements EventStoreReaderRepository
{
  constructor(
    @Inject(DRIZZLE)
    private readonly db: Drizzle,
  ) {}

  async fetchAfter(
    lastSeq: number,
    limit: number,
  ): Promise<EventStoreEventRow[]> {
    const rows: { [x: string]: any }[] = await this.db
      .select()
      .from(eventStore)
      .where(gt(eventStore.globalSeq, lastSeq))
      .orderBy(asc(eventStore.globalSeq))
      .limit(limit);

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
  }
}

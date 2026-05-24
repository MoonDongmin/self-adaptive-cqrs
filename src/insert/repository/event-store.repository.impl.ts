import { Inject, Injectable } from "@nestjs/common";
import { DRIZZLE, type Drizzle } from "@/shared/database/drizzle.provider";
import { eventStore } from "@/shared/database/schema";
import { AppendEventInput } from "@/insert/repository/event-store.repository";

@Injectable()
export class EventStoreRepositoryImpl implements EventStoreRepositoryImpl {
  constructor(@Inject(DRIZZLE) private readonly db: Drizzle) {}

  async append(input: AppendEventInput): Promise<number | null> {
    const rows = await this.db
      .insert(eventStore)
      .values({
        streamId: input.streamId,
        attemptNum: input.attemptNum,
        eventType: input.eventType,
        occurredAt: input.occurredAt,
        payload: input.payload as object,
      })
      .onConflictDoNothing({
        target: [eventStore.streamId, eventStore.attemptNum],
      })
      .returning({ globalSeq: eventStore.globalSeq });

    return rows.length === 0 ? null : Number(rows[0].globalSeq);
  }
}

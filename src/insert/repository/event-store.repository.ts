import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE, type Drizzle } from '@/shared/database/drizzle.provider';
import { eventStore } from '@/shared/database/schema';

export type AppendEventInput = {
  streamId: string;
  attemptNum: number;
  eventType: string;
  occurredAt: Date;
  payload: unknown;
};

export interface EventStoreRepository {
  append(input: AppendEventInput): Promise<number | null>;
}

// DI 토큰 — service 는 이 토큰으로 interface 만 주입받는다.
export const EVENT_STORE_REPOSITORY: unique symbol = Symbol(
  "EVENT_STORE_REPOSITORY",
);

@Injectable()
export class DrizzleEventStoreRepository implements EventStoreRepository {
  constructor(@Inject(DRIZZLE) private readonly db: Drizzle) {}

  // (stream_id, attempt_num) 충돌 시 null. 신규 INSERT 시 globalSeq 반환.
  async append(input: AppendEventInput): Promise<number | null> {
    const rows = await this.db
      .insert(eventStore)
      .values({
        streamId: input.streamId,
        attemptNum: input.attemptNum,
        eventType: input.eventType,
        occurredAt: input.occurredAt,
        payload: input.payload as object, // jsonb 컬럼에 unknown 박을 때 한 번만 단언
      })
      .onConflictDoNothing({
        target: [eventStore.streamId, eventStore.attemptNum],
      })
      .returning({ globalSeq: eventStore.globalSeq });

    return rows.length === 0 ? null : Number(rows[0].globalSeq);
  }
}

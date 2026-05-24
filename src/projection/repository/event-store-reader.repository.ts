export type EventStoreEventRow = {
  globalSeq: number;
  eventId: string;
  streamId: string;
  attemptNum: number;
  eventType: string;
  occurredAt: Date;
  recordedAt: Date;
  payload: unknown;
};

export interface EventStoreReaderRepository {
  fetchAfter(lastSeq: number, limit: number): Promise<EventStoreEventRow[]>;
}

export const EVENT_STORE_READER: unique symbol = Symbol("EVENT_STORE_READER");

import { EventStoreEventRow } from '@/projection/repository/event-store-reader.repository';
import { DrizzleTx } from '@/shared/database/drizzle.provider';

export interface Projector<Insert> {
  readonly name: string;

  map(event: EventStoreEventRow): Insert;

  upsert(tx: DrizzleTx, row: Insert): Promise<void>;
}

export type ProjectionResult = {
  projectorName: string;
  fromSeq: number;
  toSeq: number;
  processed: number;
};

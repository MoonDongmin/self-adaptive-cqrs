import { LogEventInsert } from '@/log-collector/log-record';
import { DrizzleTx } from '@/shared/database/drizzle.provider';

export const LOG_EVENT_WRITER: unique symbol = Symbol("LOG_EVENT_WRITER");

export interface LogEventRepository {
  insertBatch(tx: DrizzleTx, rows: LogEventInsert[]): Promise<void>;
}

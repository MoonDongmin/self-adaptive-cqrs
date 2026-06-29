import { DrizzleTx } from '@/shared/database/drizzle.provider';

export const LOG_CURSOR: unique symbol = Symbol("LOG_CURSOR");

export interface LogCursorRepository {
  getOrInit(sourceFile: string): Promise<number>;

  update(tx: DrizzleTx, sourceFile: string, byteOffset: number): Promise<void>;
}

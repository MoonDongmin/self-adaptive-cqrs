import { DrizzleTx } from "@/shared/database/drizzle.provider";

export interface ProjectionCursorRepository {
  getOrInit(projectorName: string): Promise<number>;

  update(
    tx: DrizzleTx,
    projectorName: string,
    lastEventSeq: number,
  ): Promise<void>;
}

export const PROJECTION_CURSOR: unique symbol = Symbol("PROJECTION_CURSOR");

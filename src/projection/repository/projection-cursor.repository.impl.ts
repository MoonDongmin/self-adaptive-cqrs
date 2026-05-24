import { Inject, Injectable } from "@nestjs/common";
import { ProjectionCursorRepository } from "@/projection/repository/projection-cursor.repository";
import {
  DRIZZLE,
  type Drizzle,
  type DrizzleTx,
} from "@/shared/database/drizzle.provider";
import { projectionCursor } from "@/shared/database/schema";
import { eq } from "drizzle-orm";

@Injectable()
export class ProjectionCursorRepositoryImpl
  implements ProjectionCursorRepository
{
  constructor(
    @Inject(DRIZZLE)
    private readonly db: Drizzle,
  ) {}

  async getOrInit(projectorName: string): Promise<number> {
    await this.db
      .insert(projectionCursor)
      .values({ projectorName, lastEventSeq: 0 })
      .onConflictDoNothing({ target: projectionCursor.projectorName });

    const rows = await this.db
      .select({ lastEventSeq: projectionCursor.lastEventSeq })
      .from(projectionCursor)
      .where(eq(projectionCursor.projectorName, projectorName))
      .limit(1);

    return Number(rows[0].lastEventSeq);
  }

  async update(
    tx: DrizzleTx,
    projectorName: string,
    lastEventSeq: number,
  ): Promise<void> {
    await tx
      .update(projectionCursor)
      .set({ lastEventSeq, updatedAt: new Date() })
      .where(eq(projectionCursor.projectorName, projectorName));
  }
}

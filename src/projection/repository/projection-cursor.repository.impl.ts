import { Inject, Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { PinoLogger } from "nestjs-pino";
import { ProjectionCursorRepository } from "@/projection/repository/projection-cursor.repository";
import {
  DRIZZLE,
  type Drizzle,
  type DrizzleTx,
} from "@/shared/database/drizzle.provider";
import { projectionCursor } from "@/shared/database/schema";
import { LogAction, LogContext } from "@/shared/logger/logging-context";

@Injectable()
export class ProjectionCursorRepositoryImpl
  implements ProjectionCursorRepository
{
  constructor(
    private readonly logger: PinoLogger,
    @Inject(DRIZZLE)
    private readonly db: Drizzle,
  ) {
    this.logger.setContext(ProjectionCursorRepositoryImpl.name);
  }

  async getOrInit(projectorName: string): Promise<number> {
    try {
      await this.db
        .insert(projectionCursor)
        .values({ projectorName, lastEventSeq: 0 })
        .onConflictDoNothing({ target: projectionCursor.projectorName });

      const rows = await this.db
        .select({ lastEventSeq: projectionCursor.lastEventSeq })
        .from(projectionCursor)
        .where(eq(projectionCursor.projectorName, projectorName))
        .limit(1);

      const fromSeq: number = Number(rows[0].lastEventSeq);

      this.logger.debug(
        {
          [LogContext.PROJECTOR_NAME]: projectorName,
          [LogContext.FROM_SEQ]: fromSeq,
        },
        "커서 조회",
      );

      return fromSeq;
    } catch (err) {
      this.logger.error(
        {
          action: LogAction.DB_ERROR,
          err,
          [LogContext.PROJECTOR_NAME]: projectorName,
        },
        "커서 처리 실패",
      );

      throw err;
    }
  }

  async update(
    tx: DrizzleTx,
    projectorName: string,
    lastEventSeq: number,
  ): Promise<void> {
    try {
      await tx
        .update(projectionCursor)
        .set({ lastEventSeq, updatedAt: new Date() })
        .where(eq(projectionCursor.projectorName, projectorName));

      this.logger.debug(
        {
          [LogContext.PROJECTOR_NAME]: projectorName,
          [LogContext.TO_SEQ]: lastEventSeq,
        },
        "커서 갱신",
      );
    } catch (err) {
      this.logger.error(
        {
          action: LogAction.DB_ERROR,
          err,
          [LogContext.PROJECTOR_NAME]: projectorName,
        },
        "커서 처리 실패",
      );

      throw err;
    }
  }
}

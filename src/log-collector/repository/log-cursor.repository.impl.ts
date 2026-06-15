import { Inject, Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { PinoLogger } from "nestjs-pino";
import {
  DRIZZLE,
  type Drizzle,
  DrizzleTx,
} from "@/shared/database/drizzle.provider";
import { logCursor } from "@/shared/database/schema";
import { LogCursorRepository } from "./log-cursor.repository";

@Injectable()
export class LogCursorRepositoryImpl implements LogCursorRepository {
  constructor(
    @Inject(DRIZZLE) private readonly db: Drizzle,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(LogCursorRepositoryImpl.name);
  }

  async getOrInit(sourceFile: string): Promise<number> {
    const rows = await this.db
      .select({ byteOffset: logCursor.byteOffset })
      .from(logCursor)
      .where(eq(logCursor.sourceFile, sourceFile));

    if (rows.length > 0) {
      return rows[0].byteOffset;
    }

    await this.db
      .insert(logCursor)
      .values({ sourceFile, byteOffset: 0 })
      .onConflictDoNothing();

    this.logger.debug({ sourceFile }, "신규 커서 초기화 (offset=0)");
    return 0;
  }

  async update(
    tx: DrizzleTx,
    sourceFile: string,
    byteOffset: number,
  ): Promise<void> {
    await tx
      .insert(logCursor)
      .values({ sourceFile, byteOffset, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: logCursor.sourceFile,
        set: { byteOffset, updatedAt: new Date() },
      });

    this.logger.debug({ sourceFile, byteOffset }, "커서 오프셋 갱신");
  }
}

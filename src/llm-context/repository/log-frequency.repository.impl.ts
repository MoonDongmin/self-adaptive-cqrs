import { Inject, Injectable } from "@nestjs/common";
import { LogFrequencyRepository } from "@/llm-context/repository/log-frequency.repository";
import { FrequencyRow } from "../llm-context.type";
import { type Drizzle, DRIZZLE } from "@/shared/database/drizzle.provider";
import { logEvents } from "@/shared/database/schema";
import { gte, sql } from "drizzle-orm";

@Injectable()
export class LogFrequencyRepositoryImpl implements LogFrequencyRepository {
  constructor(
    @Inject(DRIZZLE)
    private readonly db: Drizzle,
  ) {}

  async countByActionLevel(windowHours: number): Promise<FrequencyRow[]> {
    const since: Date = new Date(Date.now() - windowHours * 60 * 60 * 1000);

    const rows: FrequencyRow[] = await this.db
      .select({
        action: logEvents.action,
        level: logEvents.level,
        count: sql<number>`count(*)::int`,
      })
      .from(logEvents)
      .where(gte(logEvents.time, since))
      .groupBy(logEvents.action, logEvents.level)
      .orderBy(sql`count(*)::int desc`);

    return rows;
  }
}

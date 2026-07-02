import { Inject, Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { DRIZZLE, type Drizzle } from '@/shared/database/drizzle.provider';

// public 스키마의 실존 테이블 전수를 결정론으로 얻는다.
// 인프라 제외·카드 대조는 관측기(정책)의 몫 — 여기서는 조회만 한다.
@Injectable()
export class ReadModelTableRepository {
  constructor(
    @Inject(DRIZZLE)
    private readonly db: Drizzle,
  ) {}

  async listPublicTableNames(): Promise<string[]> {
    const result = await this.db.execute<{ table_name: string }>(sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
    `);
    return result.rows.map((row) => row.table_name);
  }
}

import { Inject, Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { PinoLogger } from 'nestjs-pino';
import { CARD_DRIFT_CONFIG, INFRASTRUCTURE_TABLES } from '@/insight/observer/card-drift.config';
import { ReadModelTableRepository } from '@/insight/observer/read-model-table.repository';
import { INSIGHT_CATALOG, type InsightCatalogRepository } from '@/insight/repository/insight-catalog.repository';
import { LogAction, LogContext } from '@/shared/logger/logging-context';

// 주기적으로 (public 테이블 − 인프라 − 카드) diff 를 내고, 새로 발견된 무카드 테이블만 warn.
// warn(level 40)은 기존 prejudge 트립 경로를 타고 LLM 에 도달해 '카드 등록 권고' 문서를 만든다.
@Injectable()
export class CardDriftObserver {
  // 테이블명 → 마지막 warn 시각. 억제 창 안에서는 재발행하지 않는다(문서 폭주 방지).
  private readonly reportedAt = new Map<string, number>();

  constructor(
    private readonly logger: PinoLogger,
    private readonly tableRepository: ReadModelTableRepository,
    @Inject(INSIGHT_CATALOG)
    private readonly catalog: InsightCatalogRepository,
  ) {
    this.logger.setContext(CardDriftObserver.name);
  }

  @Interval(CARD_DRIFT_CONFIG.intervalMS)
  async observeOnce(): Promise<void> {
    try {
      const tableNames: string[] =
        await this.tableRepository.listPublicTableNames();
      const cardNames = new Set(await this.catalog.listEntityNames());
      const now: number = Date.now();

      const unreported: string[] = tableNames.filter((tableName) => {
        if (INFRASTRUCTURE_TABLES.has(tableName)) {
          return false;
        }
        if (cardNames.has(tableName)) {
          this.reportedAt.delete(tableName); // 카드가 등록되면 억제 기록도 청소
          return false;
        }
        const last = this.reportedAt.get(tableName);
        return (
          last === undefined || now - last > CARD_DRIFT_CONFIG.reportSuppressMS
        );
      });

      if (unreported.length === 0) {
        return;
      }
      for (const tableName of unreported) {
        this.reportedAt.set(tableName, now);
      }
      this.logger.warn(
        {
          action: LogAction.INSIGHT_CARD_DRIFT,
          [LogContext.MISSING_CARD_TABLES]: unreported,
          [LogContext.COUNT]: unreported.length,
        },
        "Insight 카드 없는 Read Model 테이블 발견 — 카드 등록 필요(카탈로그 드리프트)",
      );
    } catch (error: unknown) {
      this.logger.error(
        { [LogContext.REASON]: String(error) },
        "카드 드리프트 검사 실패",
      );
    }
  }
}

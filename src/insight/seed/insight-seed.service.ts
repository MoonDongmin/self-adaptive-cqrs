import { Inject, Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { INSIGHT_CATALOG, type InsightCatalogRepository } from '@/insight/repository/insight-catalog.repository';
import { PHASE1_CARDS } from '@/insight/seed/phase1-cards';
import { LogAction } from '@/shared/logger/logging-context';

@Injectable()
export class InsightSeedService {
  constructor(
    private readonly logger: PinoLogger,
    @Inject(INSIGHT_CATALOG)
    private readonly catalog: InsightCatalogRepository,
  ) {
    this.logger.setContext(InsightSeedService.name);
  }

  async seedPhase1(): Promise<{ entities: number; fields: number }> {
    let fieldCount = 0;

    for (const card of PHASE1_CARDS) {
      await this.catalog.upsertEntity(card.entity);

      for (const field of card.fields) {
        await this.catalog.upsertField(field);
        fieldCount += 1;
      }
    }

    this.logger.info(
      { action: LogAction.INSIGHT_SEED_DONE },
      "InsightDB Phase 1 시드 완료",
    );

    return { entities: PHASE1_CARDS.length, fields: fieldCount };
  }
}

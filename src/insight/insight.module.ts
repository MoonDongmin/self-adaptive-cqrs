import { Module } from '@nestjs/common';
import { InsightController } from '@/insight/insight.controller';
import { InsightService } from '@/insight/insight.service';
import { InsightCardRenderer } from '@/insight/insight-card.renderer';
import { INSIGHT_CATALOG } from '@/insight/repository/insight-catalog.repository';
import { InsightCatalogRepositoryImpl } from '@/insight/repository/insight-catalog.repository.impl';
import { InsightSeedService } from '@/insight/seed/insight-seed.service';

@Module({
  controllers: [InsightController],
  providers: [
    InsightService,
    InsightCardRenderer,
    InsightSeedService,
    { provide: INSIGHT_CATALOG, useClass: InsightCatalogRepositoryImpl },
  ],
  exports: [InsightService],
})
export class InsightModule {}

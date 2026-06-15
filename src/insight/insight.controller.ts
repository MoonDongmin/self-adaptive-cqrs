import { Controller, Get, Header, Param, Post } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino";
import { InsightService } from "@/insight/insight.service";
import { InsightSeedService } from "@/insight/seed/insight-seed.service";
import { LogAction, LogContext } from "@/shared/logger/logging-context";

@Controller("insight")
export class InsightController {
  constructor(
    private readonly logger: PinoLogger,
    private readonly insightService: InsightService,
    private readonly seedService: InsightSeedService,
  ) {
    this.logger.setContext(InsightController.name);
  }

  @Post("/seed")
  seed(): Promise<{ entities: number; fields: number }> {
    this.logger.info(
      {
        action: LogAction.INSIGHT_SEED_REQUEST,
        [LogContext.ROUTE]: "POST /insight/seed",
      },
      "insight 시드 요청 수신",
    );

    return this.seedService.seedPhase1();
  }

  @Get("/cards")
  @Header("Content-Type", "text/html; charset=utf-8")
  allCards(): Promise<string> {
    return this.insightService.renderAllCardsAsHtml();
  }

  @Get("/cards/:name")
  async card(@Param("name") name: string): Promise<string> {
    const rendered: string | null = await this.insightService.renderCard(name);

    return rendered ?? `# (없음) ${name}`;
  }
}

import { Inject, Injectable } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino";
import { InsightCardRenderer } from "@/insight/insight-card.renderer";
import { InsightCardData } from "@/insight/insight-card.type";
import {
  INSIGHT_CATALOG,
  type InsightCatalogRepository,
} from "@/insight/repository/insight-catalog.repository";
import { LogAction, LogContext } from "@/shared/logger/logging-context";

@Injectable()
export class InsightService {
  constructor(
    private readonly logger: PinoLogger,
    private readonly renderer: InsightCardRenderer,
    @Inject(INSIGHT_CATALOG)
    private readonly catalog: InsightCatalogRepository,
  ) {
    this.logger.setContext(InsightService.name);
  }

  async renderCard(entityName: string): Promise<string | null> {
    const card: InsightCardData | null =
      await this.catalog.findCardData(entityName);

    if (card === null) {
      this.logger.warn(
        {
          action: LogAction.INSIGHT_CARD_MISS,
          [LogContext.ENTITY_NAME]: entityName,
        },
        "insight 카드 없음",
      );

      return null;
    }

    this.logger.debug(
      {
        action: LogAction.INSIGHT_CARD_RENDERED,
        [LogContext.ENTITY_NAME]: entityName,
      },
      "insight 카드 렌더",
    );

    return this.renderer.render(card);
  }

  async renderAllCards(): Promise<string> {
    const names: string[] = await this.catalog.listEntityNames();
    const cards: string[] = [];

    for (const name of names) {
      const rendered: string | null = await this.renderCard(name);

      if (rendered !== null) {
        cards.push(rendered);
      }
    }

    return cards.join("\n\n");
  }

  // 브라우저 뷰잉용: 카드들을 HTML 표 페이지로 렌더한다(마크다운 renderAllCards는 LLM 주입용으로 유지).
  async renderAllCardsAsHtml(): Promise<string> {
    const names: string[] = await this.catalog.listEntityNames();
    const sections: string[] = [];

    for (const name of names) {
      const card: InsightCardData | null =
        await this.catalog.findCardData(name);

      if (card !== null) {
        sections.push(this.renderer.renderHtml(card));
      }
    }

    this.logger.info(
      {
        action: LogAction.INSIGHT_CARDS_DONE,
        [LogContext.ENTITY_COUNT]: names.length,
        [LogContext.RENDERED_COUNT]: sections.length,
      },
      "insight 카드 전체 렌더",
    );

    return [
      "<!doctype html>",
      '<html lang="ko">',
      "<head>",
      '  <meta charset="utf-8" />',
      "  <title>InsightDB Cards</title>",
      "  <style>",
      "    body { font-family: sans-serif; max-width: 1100px; margin: 24px auto; padding: 0 16px; }",
      "    table { border-collapse: collapse; width: 100%; }",
      "    th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; vertical-align: top; }",
      "    th { background: #f4f4f4; }",
      "    code { background: #f0f0f0; padding: 1px 4px; border-radius: 3px; }",
      "    section { margin-bottom: 40px; }",
      "  </style>",
      "</head>",
      "<body>",
      sections.join("\n"),
      "</body>",
      "</html>",
    ].join("\n");
  }
}

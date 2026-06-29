import * as fs from 'node:fs';
import { clearTimeout, setTimeout } from 'node:timers';
import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { join } from 'path';
import { buildAnalysisGraph } from '@/analysis/annalysis.graph';
import { InsightService } from '@/insight/insight.service';
import { LogConsumer } from '@/llm-context/kafka/log-consumer';
import { LOG_CONSUMER_CONFIG } from '@/llm-context/kafka/log-consumer.config';
import { AnomalyLogWindow, PrejudgeChecked } from '@/llm-context/llm-context.type';
import { LOG_WINDOW, type LogWindowRepository } from '@/llm-context/repository/log-window.repository';
import { prejudge } from '@/llm-context/screener/prejudge';
import { LogAction, LogContext } from '@/shared/logger/logging-context';

@Injectable()
export class LLMContextService implements OnModuleInit, OnModuleDestroy {
  private timer: NodeJS.Timeout | null = null;
  private stopped: boolean = false;
  private readonly graph = buildAnalysisGraph();

  constructor(
    private readonly logger: PinoLogger,
    private readonly consumer: LogConsumer,
    private readonly insight: InsightService,
    @Inject(LOG_WINDOW)
    private readonly logWindow: LogWindowRepository,
  ) {
    this.logger.setContext(LLMContextService.name);
  }

  onModuleInit(): void {
    void this.runLoop();
  }

  onModuleDestroy(): void {
    this.stopped = true;
    if (this.timer !== null) {
      clearTimeout(this.timer);
    }
  }

  private async runLoop(): Promise<void> {
    if (this.stopped) {
      return;
    }

    let triggeredLLM: boolean = false;
    try {
      const checked: PrejudgeChecked | null = await this.detectOnce();
      triggeredLLM = checked !== null;
    } catch (error: unknown) {
      this.logger.error(
        { [LogContext.REASON]: String(error) },
        "선판단 주기 실행 실패",
      );
    }

    if (this.stopped) {
      return;
    }

    // LLM을 호출했다면(=버퍼에 로그가 있었다면) 즉시 재확인,
    // 비어 있었다면 5초 뒤 재확인.
    const delayMS: number = triggeredLLM
      ? 0
      : LOG_CONSUMER_CONFIG.pollIntervalMS;
    this.timer = setTimeout(() => {
      void this.runLoop();
    }, delayMS);
  }

  async detectOnce() {
    const batch = this.consumer.drainOnce();

    if (batch.length === 0) {
      return null;
    }

    const checked: PrejudgeChecked = await prejudge(batch);

    this.logger.info(
      {
        action: checked.triggered
          ? LogAction.LLM_PREJUDGE_TRIGGERED
          : LogAction.LLM_PREJUDGE_SKIPPED,
        [LogContext.COUNT]: batch.length,
        [LogContext.REASON]: checked.reason,
      },
      checked.triggered ? "선판단: 비정상" : "선판단: 정상",
    );

    if (checked.triggered) {
      await this.analyze(checked);
    }

    return checked;
  }

  private async analyze(checked: PrejudgeChecked): Promise<void> {
    const window: AnomalyLogWindow = await this.logWindow.buildWindow(
      checked.tripCorrelationIds,
    );

    const insightCards: string = await this.insight.renderAllCards();

    const result = await this.graph.invoke({ window, insightCards });

    const path = await this.writeReport(result.report ?? "", checked);

    this.logger.info(
      {
        action: LogAction.LLM_ANALYSIS_AGGREGATE_DONE,
        [LogContext.REPORT_PATH]: path,
      },
      "분석 리포트 생성",
    );
  }

  private async writeReport(
    report: string,
    checked: PrejudgeChecked,
  ): Promise<string> {
    const id = checked.tripCorrelationIds[0] ?? "background";
    const dir = join(process.cwd(), "src/analysis/output");
    const path = join(dir, `analysis-${id}.md`);

    await fs.promises.mkdir(dir, { recursive: true });
    await fs.promises.writeFile(path, report);

    return path;
  }
}

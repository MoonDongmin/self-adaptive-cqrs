import * as fs from 'node:fs';
import { clearTimeout, setTimeout } from 'node:timers';
import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { join } from 'path';
import { buildAnalysisGraph } from '@/analysis/annalysis.graph';
import { buildReportFileName } from '@/analysis/report-filename';
import { DIAGNOSIS_TOOLKIT, type DiagnosisToolkit } from '@/analysis/tools/diagnosis-toolkit';
import { validateDocs } from '@/analysis/validate-docs';
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
  private readonly graph: ReturnType<typeof buildAnalysisGraph>;

  constructor(
    private readonly logger: PinoLogger,
    private readonly consumer: LogConsumer,
    private readonly insight: InsightService,
    @Inject(LOG_WINDOW)
    private readonly logWindow: LogWindowRepository,
    @Inject(DIAGNOSIS_TOOLKIT)
    diagnosisToolkit: DiagnosisToolkit,
  ) {
    this.logger.setContext(LLMContextService.name);
    // 근본원인 노드를 tool-calling 에이전트로 승격(로그 DB·Insight 카드 직접 조회).
    this.graph = buildAnalysisGraph(diagnosisToolkit);
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

    const id: string = checked.tripCorrelationIds[0] ?? "background";
    const result = await this.graph.invoke({
      window,
      insightCards,
      docId: `analysis-${id}`,
      generatedAt: new Date().toISOString(),
    });

    const report: string = result.report ?? "";
    // 에러 발생 시각 = 윈도우의 트립 앵커 행 시각(없으면 분석 시각으로 폴백).
    const occurredAt: Date =
      window.rows.find((row) => row.isAnchor)?.time ?? new Date();
    const path = await this.writeReport(
      report,
      buildReportFileName(occurredAt, id),
    );

    // Docs 계약 검증(결정론). 실패해도 산출물은 남기되 결과를 기록한다.
    // 주의: 이 서비스의 로그도 Kafka 로 재유입돼 prejudge 를 거치므로, 검증 실패를
    // warn/error(level>=40)로 찍으면 자기 로그가 이상 탐지를 재트리거한다 — info 로 남긴다.
    const validation = validateDocs(report);

    this.logger.info(
      {
        action: LogAction.LLM_ANALYSIS_AGGREGATE_DONE,
        [LogContext.REPORT_PATH]: path,
        docsValid: validation.valid,
        docsValidationErrors: validation.errors,
        docsValidationWarnings: validation.warnings,
        // 진단 에이전트 궤적(어떤 도구를 어떤 입력으로 불렀나) — 재현성·judge 평가용.
        diagnosisTrajectory: result.diagnosisTrajectory,
      },
      "분석 리포트 생성",
    );
  }

  private async writeReport(
    report: string,
    fileName: string,
  ): Promise<string> {
    const dir = join(process.cwd(), "llm-docs");
    const path = join(dir, fileName);

    await fs.promises.mkdir(dir, { recursive: true });
    await fs.promises.writeFile(path, report);

    return path;
  }
}

import * as fs from 'node:fs';
import { clearTimeout, setTimeout } from 'node:timers';
import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { join } from 'path';
import { buildAnalysisGraph } from '@/analysis/annalysis.graph';
import { readSensorBaseline } from '@/analysis/context/sensor-baseline';
import { buildReportFileName } from '@/analysis/report-filename';
import { DIAGNOSIS_TOOLKIT, type DiagnosisToolkit } from '@/analysis/tools/diagnosis-toolkit';
import { SensorAnomalyFinding } from '@/analysis/type/output.type';
import { InsightService } from '@/insight/insight.service';
import { SENSOR_OBSERVER_CONFIG } from '@/projection/kafka/sensor-observer.config';
import { SensorValueMessage } from '@/projection/kafka/sensor-value.message';
import { renderAnnotatedSensorBatch } from '@/sensor-observer/sensor-batch-annotator';
import { observeSensorBatch, SensorObserverVerdict } from '@/sensor-observer/sensor-screener';
import { SensorValueConsumer } from '@/sensor-observer/sensor-value.consumer';
import { LogAction, LogContext } from '@/shared/logger/logging-context';

// LLMContextService 의 센서 버전. 자기 재스케줄 루프로 배치를 드레인하고, 싼 관찰자가
// 이상으로 판정한 배치만 기존 분석 그래프(buildAnalysisGraph)로 승급시켜 권고 문서를 만든다.
@Injectable()
export class SensorObserverService implements OnModuleInit, OnModuleDestroy {
  private timer: NodeJS.Timeout | null = null;
  private stopped: boolean = false;
  private readonly graph: ReturnType<typeof buildAnalysisGraph>;

  constructor(
    private readonly logger: PinoLogger,
    private readonly consumer: SensorValueConsumer,
    private readonly insight: InsightService,
    @Inject(DIAGNOSIS_TOOLKIT)
    diagnosisToolkit: DiagnosisToolkit,
  ) {
    this.logger.setContext(SensorObserverService.name);
    // 근본원인 노드를 tool-calling 에이전트로 승격(로그 DB·Insight 카드·베이스라인 직접 조회).
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
      const verdict: SensorObserverVerdict | null = await this.detectOnce();
      triggeredLLM = verdict !== null;
    } catch (error: unknown) {
      this.logger.error(
        { [LogContext.REASON]: String(error) },
        "센서 관찰 주기 실행 실패",
      );
    }

    if (this.stopped) {
      return;
    }

    // 관찰했다면(=버퍼에 값이 있었다면) 즉시 재확인, 비어 있었다면 pollIntervalMS 뒤.
    const delayMS: number = triggeredLLM
      ? 0
      : SENSOR_OBSERVER_CONFIG.pollIntervalMS;
    this.timer = setTimeout(() => {
      void this.runLoop();
    }, delayMS);
  }

  // 같은 배치가 requeue 로 되돌아와 연속 실패하는 횟수. 상한 도달 시 폐기해
  // poison 배치가 관찰 루프를 영원히 점유하는 것을 막는다.
  private observeFailureStreak: number = 0;
  private static readonly MAX_OBSERVE_FAILURE_STREAK: number = 3;

  async detectOnce(): Promise<SensorObserverVerdict | null> {
    const batch: SensorValueMessage[] = this.consumer.drainOnce();

    if (batch.length === 0) {
      return null;
    }

    const baselineText: string = await readSensorBaseline();

    let verdict: SensorObserverVerdict;
    try {
      verdict = await observeSensorBatch(batch, baselineText);
    } catch (error) {
      this.observeFailureStreak++;
      if (
        this.observeFailureStreak >=
        SensorObserverService.MAX_OBSERVE_FAILURE_STREAK
      ) {
        // 반복 실패 배치는 폐기(유실을 감수) — 이 로그 자체가 이상신호로 승급된다.
        this.logger.error(
          {
            [LogContext.COUNT]: batch.length,
            [LogContext.REASON]: String(error),
          },
          "센서 관찰 재시도 상한 도달 — 배치 폐기",
        );
        this.observeFailureStreak = 0;
      } else {
        this.consumer.requeueFront(batch);
      }
      throw error;
    }
    this.observeFailureStreak = 0;

    this.logger.info(
      {
        action: verdict.triggered
          ? LogAction.SENSOR_OBSERVE_TRIGGERED
          : LogAction.SENSOR_OBSERVE_SKIPPED,
        [LogContext.COUNT]: batch.length,
        [LogContext.REASON]: verdict.reason,
      },
      verdict.triggered ? "센서 관찰: 이상" : "센서 관찰: 정상",
    );

    if (verdict.triggered) {
      await this.analyze(batch, verdict, baselineText);
    }

    return verdict;
  }

  private async analyze(
    batch: SensorValueMessage[],
    verdict: SensorObserverVerdict,
    baselineText: string,
  ): Promise<void> {
    const finding: SensorAnomalyFinding = {
      batch,
      batchText: renderAnnotatedSensorBatch(batch),
      reason: verdict.reason,
      offendingSceneKeys: verdict.offendingSceneKeys,
      baselineText,
    };

    const insightCards: string = await this.insight.renderAllCards();

    const id: string = finding.offendingSceneKeys[0] ?? "sensor";
    const result = await this.graph.invoke({
      sensorFinding: finding,
      insightCards,
      docId: `dq-${id}`,
      generatedAt: new Date().toISOString(),
    });

    // 에러 발생 시각 = 문제 scene 레코드의 occurredAt(없으면 배치 첫 레코드, 그마저 없으면 지금).
    const offendingMessage: SensorValueMessage | undefined =
      batch.find((message) => message.sceneKey === id) ?? batch[0];
    const parsedOccurredAt = new Date(
      offendingMessage?.occurredAt ?? Date.now(),
    );
    const occurredAt: Date = Number.isNaN(parsedOccurredAt.getTime())
      ? new Date()
      : parsedOccurredAt;

    const path = await this.writeReport(
      result.report ?? "",
      buildReportFileName(occurredAt, id),
    );

    this.logger.info(
      {
        action: LogAction.SENSOR_ANALYSIS_DONE,
        [LogContext.REPORT_PATH]: path,
        // 진단 에이전트 궤적 — 재현성·judge 평가용.
        diagnosisTrajectory: result.diagnosisTrajectory,
      },
      "센서 이상 권고 문서 생성",
    );
  }

  private async writeReport(report: string, fileName: string): Promise<string> {
    const dir = join(process.cwd(), "llm-docs");
    const path = join(dir, fileName);

    await fs.promises.mkdir(dir, { recursive: true });
    await fs.promises.writeFile(path, report);

    return path;
  }
}

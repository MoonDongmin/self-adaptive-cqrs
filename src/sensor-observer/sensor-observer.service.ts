import * as fs from 'node:fs';
import { clearTimeout, setTimeout } from 'node:timers';
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { join } from 'path';
import { buildAnalysisGraph } from '@/analysis/annalysis.graph';
import { readSensorBaseline } from '@/analysis/context/sensor-baseline';
import { renderSensorBatch } from '@/analysis/render-sensor';
import { SensorAnomalyFinding } from '@/analysis/type/output.type';
import { InsightService } from '@/insight/insight.service';
import { SENSOR_OBSERVER_CONFIG } from '@/projection/kafka/sensor-observer.config';
import { SensorValueMessage } from '@/projection/kafka/sensor-value.message';
import { observeSensorBatch, SensorObserverVerdict } from '@/sensor-observer/sensor-screener';
import { SensorValueConsumer } from '@/sensor-observer/sensor-value.consumer';
import { LogAction, LogContext } from '@/shared/logger/logging-context';

// LLMContextService 의 센서 버전. 자기 재스케줄 루프로 배치를 드레인하고, 싼 관찰자가
// 이상으로 판정한 배치만 기존 분석 그래프(buildAnalysisGraph)로 승급시켜 권고 문서를 만든다.
@Injectable()
export class SensorObserverService implements OnModuleInit, OnModuleDestroy {
  private timer: NodeJS.Timeout | null = null;
  private stopped: boolean = false;
  private readonly graph = buildAnalysisGraph();

  constructor(
    private readonly logger: PinoLogger,
    private readonly consumer: SensorValueConsumer,
    private readonly insight: InsightService,
  ) {
    this.logger.setContext(SensorObserverService.name);
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

  async detectOnce(): Promise<SensorObserverVerdict | null> {
    const batch: SensorValueMessage[] = this.consumer.drainOnce();

    if (batch.length === 0) {
      return null;
    }

    const baselineText: string = await readSensorBaseline();
    const verdict: SensorObserverVerdict = await observeSensorBatch(
      batch,
      baselineText,
    );

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
      batchText: renderSensorBatch(batch),
      reason: verdict.reason,
      offendingSceneKeys: verdict.offendingSceneKeys,
      baselineText,
    };

    const insightCards: string = await this.insight.renderAllCards();

    const result = await this.graph.invoke({
      sensorFinding: finding,
      insightCards,
    });

    const path = await this.writeReport(result.report ?? "", finding);

    this.logger.info(
      {
        action: LogAction.SENSOR_ANALYSIS_DONE,
        [LogContext.REPORT_PATH]: path,
      },
      "센서 이상 권고 문서 생성",
    );
  }

  private async writeReport(
    report: string,
    finding: SensorAnomalyFinding,
  ): Promise<string> {
    const id = finding.offendingSceneKeys[0] ?? "sensor";
    const dir = join(process.cwd(), "src/analysis/output");
    const path = join(dir, `dq-${id}.md`);

    await fs.promises.mkdir(dir, { recursive: true });
    await fs.promises.writeFile(path, report);

    return path;
  }
}

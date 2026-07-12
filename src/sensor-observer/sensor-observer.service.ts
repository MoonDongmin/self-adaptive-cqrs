import * as fs from "node:fs";
import { clearTimeout, setTimeout } from "node:timers";
import {
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { PinoLogger } from "nestjs-pino";
import { join } from "path";
import { buildAnalysisGraph } from "@/analysis/annalysis.graph";
import { readSensorBaseline } from "@/analysis/context/sensor-baseline";
import { buildReportFileName } from "@/analysis/report-filename";
import {
  DIAGNOSIS_TOOLKIT,
  type DiagnosisToolkit,
} from "@/analysis/tools/diagnosis-toolkit";
import { SensorAnomalyFinding } from "@/analysis/type/output.type";
import { InsightService } from "@/insight/insight.service";
import { SENSOR_OBSERVER_CONFIG } from "@/projection/kafka/sensor-observer.config";
import { SensorValueMessage } from "@/projection/kafka/sensor-value.message";
import {
  annotateSensorBatch,
  renderAnnotatedSensorBatch,
  type ScenePreviousValues,
  type SensorBatchAnnotations,
} from "@/sensor-observer/sensor-batch-annotator";
import {
  observeSensorBatch,
  SensorObserverVerdict,
} from "@/sensor-observer/sensor-screener";
import { SensorValueConsumer } from "@/sensor-observer/sensor-value.consumer";
import { LogAction, LogContext } from "@/shared/logger/logging-context";

// 연속된 이상 윈도우(8개 배치)의 누적 = 하나의 물리적 이상 사건. 관찰은 윈도우 단위로,
// 분석 그래프 승급은 에피소드가 닫힐 때 1회만 수행해 같은 사건에 대한 문서 반복 생성을 막는다.
interface SensorAnomalyEpisode {
  batch: SensorValueMessage[];
  windowReasons: string[];
  offendingSceneKeys: string[];
  baselineText: string;
  lastAppendedAtMS: number;
}

// LLMContextService 의 센서 버전. 자기 재스케줄 루프로 배치를 드레인하고, 싼 관찰자가
// 이상으로 판정한 윈도우를 에피소드로 누적하다가 에피소드가 닫힐 때 1회만 기존 분석
// 그래프(buildAnalysisGraph)로 승급시켜 권고 문서를 만든다.
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

  // 같은 배치가 requeue 로 되돌아와 연속 실패하는 횟수. 상한 도달 시 LLM 없이
  // 결정론적 주석만으로 판정(폴백)해, poison 배치가 관찰 루프를 영원히 점유하는 것과
  // LLM 장애가 탐지 유실로 번지는 것을 동시에 막는다.
  private observeFailureStreak: number = 0;
  private static readonly MAX_OBSERVE_FAILURE_STREAK: number = 3;

  // 열린 에피소드(연속 이상 윈도우 누적). null = 이상 구간 아님.
  private episode: SensorAnomalyEpisode | null = null;

  // scene별 마지막 관측값의 윈도우 간 이월 — jump 비교가 윈도우(8건) 경계에 갇히지
  // 않게 한다. 이월이 없으면 급변 쌍이 경계에 갈릴 때 구조적으로 미탐이 된다.
  private jumpCarryOverByScene: Map<string, ScenePreviousValues> = new Map();

  async detectOnce(): Promise<SensorObserverVerdict | null> {
    const batch: SensorValueMessage[] = this.consumer.drainOnce();

    if (batch.length === 0) {
      // 입력이 끊긴 채 quiet timeout 을 넘긴 에피소드는 씬 종료로 보고 닫는다.
      await this.flushEpisodeIfQuiet();
      return null;
    }

    const baselineText: string = await readSensorBaseline();

    // annotate 가 이월 Map 을 배치 내용으로 갱신하므로 사본에 적용하고, 관찰이 확정된
    // 뒤에만 커밋한다 — requeue 재시도 시 자기 자신과 비교돼 jump 가 사라지는 것을 막는다.
    const nextJumpCarryOver = new Map(this.jumpCarryOverByScene);
    const annotations: SensorBatchAnnotations = annotateSensorBatch(
      batch,
      nextJumpCarryOver,
    );

    let verdict: SensorObserverVerdict;
    try {
      verdict = await observeSensorBatch(batch, baselineText, annotations);
    } catch (error) {
      this.observeFailureStreak++;
      if (
        this.observeFailureStreak >=
        SensorObserverService.MAX_OBSERVE_FAILURE_STREAK
      ) {
        // LLM 상한 도달 — 배치를 버리는 대신 결정론적 주석만으로 판정한다(우아한 강등).
        // 탐지는 유지되고 LLM 의 사유 서술 품질만 포기한다. 이 로그 자체도 이상신호다.
        this.logger.error(
          {
            [LogContext.COUNT]: batch.length,
            [LogContext.REASON]: String(error),
          },
          "센서 관찰 LLM 재시도 상한 도달 — 결정론적 폴백 판정으로 강등",
        );
        this.observeFailureStreak = 0;
        verdict = this.buildDeterministicFallbackVerdict(annotations);
      } else {
        this.consumer.requeueFront(batch);
        throw error;
      }
    }
    this.observeFailureStreak = 0;
    this.jumpCarryOverByScene = nextJumpCarryOver;

    this.logger.info(
      {
        action: verdict.triggered
          ? LogAction.SENSOR_OBSERVE_TRIGGERED
          : LogAction.SENSOR_OBSERVE_SKIPPED,
        [LogContext.COUNT]: batch.length,
        [LogContext.REASON]: verdict.reason,
        [LogContext.OFFENDING_SCENE_KEYS]: verdict.offendingSceneKeys,
        // 윈도우 구성원(scene#attempt) — 성능평가에서 판정을 파일 단위로 귀속시키는 근거.
        [LogContext.BATCH_SCENE_KEYS]: batch.map(
          (message) => `${message.sceneKey}#${message.attemptNumber}`,
        ),
      },
      verdict.triggered ? "센서 관찰: 이상" : "센서 관찰: 정상",
    );

    if (verdict.triggered) {
      this.appendToEpisode(batch, verdict, baselineText);
      if (
        this.episode !== null &&
        this.episode.batch.length >= SENSOR_OBSERVER_CONFIG.maxEpisodeRecords
      ) {
        await this.flushEpisode("에피소드 레코드 상한 도달");
      }
    } else if (this.episode !== null) {
      // 정상 윈도우 = 이상 구간 종료. 누적 에피소드 전체를 한 번에 분석한다.
      await this.flushEpisode("정상 윈도우 관찰(이상 구간 종료)");
    }

    return verdict;
  }

  // LLM 없이 결정론적 주석만으로 만드는 폴백 verdict. physical/consistency 는 확정
  // 위반이고 jump 는 미해석 급변이지만, LLM 부재 시에는 놓치는 쪽보다 올리는 쪽이 싸다.
  private buildDeterministicFallbackVerdict(
    annotations: SensorBatchAnnotations,
  ): SensorObserverVerdict {
    const flaggedSceneKeys: string[] = [
      ...new Set([
        ...annotations.deterministicSceneKeys,
        ...annotations.jumpSceneKeys,
      ]),
    ];

    return {
      triggered: flaggedSceneKeys.length > 0,
      reason:
        flaggedSceneKeys.length > 0
          ? `LLM 관찰 불가 — 결정론적 주석 기반 폴백 판정. 위반 scene: ${flaggedSceneKeys.join(", ")}`
          : "LLM 관찰 불가 — 결정론적 주석 없음, 정상으로 판정",
      offendingSceneKeys: flaggedSceneKeys,
    };
  }

  private appendToEpisode(
    batch: SensorValueMessage[],
    verdict: SensorObserverVerdict,
    baselineText: string,
  ): void {
    if (this.episode === null) {
      this.episode = {
        batch: [],
        windowReasons: [],
        offendingSceneKeys: [],
        baselineText,
        lastAppendedAtMS: Date.now(),
      };
    }

    this.episode.batch.push(...batch);
    this.episode.windowReasons.push(verdict.reason);
    for (const sceneKey of verdict.offendingSceneKeys) {
      if (!this.episode.offendingSceneKeys.includes(sceneKey)) {
        this.episode.offendingSceneKeys.push(sceneKey);
      }
    }
    this.episode.baselineText = baselineText;
    this.episode.lastAppendedAtMS = Date.now();
  }

  private async flushEpisodeIfQuiet(): Promise<void> {
    if (this.episode === null) {
      return;
    }
    const quietMS: number = Date.now() - this.episode.lastAppendedAtMS;
    if (quietMS < SENSOR_OBSERVER_CONFIG.episodeQuietTimeoutMS) {
      return;
    }
    await this.flushEpisode(
      `무입력 ${quietMS}ms — 스트림 중단(씬 종료)으로 간주`,
    );
  }

  private async flushEpisode(closeReason: string): Promise<void> {
    const episode: SensorAnomalyEpisode | null = this.episode;
    // 분석 그래프가 실패해도 같은 에피소드를 재분석하지 않는다(기존 배치 유실 정책과 동일).
    this.episode = null;
    if (episode === null) {
      return;
    }

    episode.batch.sort(
      (left, right) => left.globalSequence - right.globalSequence,
    );

    this.logger.info(
      {
        action: LogAction.SENSOR_EPISODE_CLOSED,
        [LogContext.COUNT]: episode.batch.length,
        [LogContext.REASON]: closeReason,
        windowCount: episode.windowReasons.length,
      },
      "센서 이상 에피소드 종료 — 분석 시작",
    );

    // render-sensor 의 인용 라인(> 사유:)이 한 줄을 가정하므로 개행 없이 합친다.
    const reason: string = episode.windowReasons
      .map((windowReason, index) => `[윈도우 ${index + 1}] ${windowReason}`)
      .join(" / ");

    const finding: SensorAnomalyFinding = {
      batch: episode.batch,
      batchText: renderAnnotatedSensorBatch(episode.batch),
      reason,
      offendingSceneKeys: episode.offendingSceneKeys,
      baselineText: episode.baselineText,
    };

    // 분석(권고 문서 생성)은 수 분짜리 LLM 작업이라 여기서 await 하면 관찰 루프가
    // 멈춰 탐지 자체가 지연·정체된다(2026-07-10 실측). 탐지와 서술을 분리해 분석은
    // 백그라운드로 보낸다. 실패 시 재분석하지 않는 기존 정책은 그대로다.
    void this.analyze(finding).catch((error: unknown) => {
      this.logger.error(
        { [LogContext.REASON]: String(error) },
        "센서 이상 에피소드 분석 실패(백그라운드)",
      );
    });
  }

  private async analyze(finding: SensorAnomalyFinding): Promise<void> {
    const batch: SensorValueMessage[] = finding.batch;
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

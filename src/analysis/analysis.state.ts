import { Annotation } from '@langchain/langgraph';
import {
  AnalysisDecision,
  GeneratedOutputs,
  RootCauseAnalysis,
  SensorAnomalyFinding,
} from '@/analysis/type/output.type';
import type { AnomalyLogWindow } from '@/llm-context/llm-context.type';

export const AnalysisState = Annotation.Root({
  // 로그 라인은 window 를, 센서 라인은 sensorFinding 을 채운다(둘 중 non-null 이 소스 판별자).
  window: Annotation<AnomalyLogWindow | null>({
    default: () => null,
    reducer: (_prev, next) => next,
  }),
  sensorFinding: Annotation<SensorAnomalyFinding | null>({
    default: () => null,
    reducer: (_prev, next) => next,
  }),
  insightCards: Annotation<string>(),
  rootCause: Annotation<RootCauseAnalysis | null>({
    default: () => null,
    reducer: (_prev, next) => next,
  }),
  decision: Annotation<AnalysisDecision | null>({
    default: () => null,
    reducer: (_prev, next) => next,
  }),
  outputs: Annotation<GeneratedOutputs>({
    default: () => ({}),
    reducer: (prev, next) => ({ ...prev, ...next }), // ★ 병렬 fan-out 머지
  }),
  report: Annotation<string | null>({
    default: () => null,
    reducer: (_prev, next) => next,
  }),
});

import { Annotation } from '@langchain/langgraph';
import { AnalysisDecision, GeneratedOutputs, RootCauseAnalysis } from '@/analysis/type/output.type';
import type { AnomalyLogWindow } from '@/llm-context/llm-context.type'; // ★ 추가

export const AnalysisState = Annotation.Root({
  window: Annotation<AnomalyLogWindow>(),
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

import { AnalysisState } from '@/analysis/analysis.state';
import { renderReport } from '@/analysis/render';

// 추합 = LLM 요약이 아니라 결정론 조립. 생성물 전체를 섹션으로 verbatim 임베드해
// 코드·근거·옵션이 요약 압축되지 않도록 한다.
export function aggregateNode(state: typeof AnalysisState.State) {
  const report = renderReport({
    window: state.window,
    rootCause: state.rootCause!, // analyzeRootCause 이후라 non-null (decision.node와 동일 관례)
    decision: state.decision,
    outputs: state.outputs,
  });

  return { report };
}

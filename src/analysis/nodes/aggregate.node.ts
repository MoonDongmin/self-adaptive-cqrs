import { AnalysisState } from '@/analysis/analysis.state';
import { renderReport } from '@/analysis/render';
import { GeneratedOutputs } from '@/analysis/type/output.type';

// 무결성 게이트: 권고(§1) 근거 없이 DDL(§2)/API 변경(§3)만 남으면 자기모순 Docs 가 된다
// (decision 은 co-select 를 강제하지만 생성 노드가 런타임에 degrade 할 수 있다).
// 그 경우 산출물을 버리고 '근거 부족' 일관 문서로 렌더한다 — 소비자 LLM 은 §1 센티넬보다
// 실행 가능한 SQL 블록에 반응하므로, 모순 문서가 부분 문서보다 해롭다.
function lacksRecommendationBasis(outputs: GeneratedOutputs): boolean {
  const hasRecommendation =
    outputs.recommendationDocs !== undefined ||
    outputs.dataQualityRecommendation !== undefined;
  const buildsArtifact =
    outputs.newReadModel !== undefined || outputs.versionSwitch !== undefined;

  return buildsArtifact && !hasRecommendation;
}

// 추합 = LLM 요약이 아니라 결정론 조립. 생성물 전체를 섹션으로 verbatim 임베드해
// 코드·근거·옵션이 요약 압축되지 않도록 한다.
export function aggregateNode(state: typeof AnalysisState.State) {
  const gated: boolean = lacksRecommendationBasis(state.outputs);

  const report = renderReport({
    docId: state.docId,
    generatedAt: state.generatedAt,
    window: state.window,
    sensorFinding: state.sensorFinding,
    rootCause: state.rootCause!, // analyzeRootCause 이후라 non-null (decision.node와 동일 관례)
    decision: gated
      ? {
          selected: [],
          reasoning:
            "권고(§1) 생성 실패로 근거 부재 — 무결성 게이트가 DDL/API 산출물을 보류(재실행 필요)",
        }
      : state.decision,
    outputs: gated ? {} : state.outputs,
    insightCards: state.insightCards,
  });

  return { report };
}

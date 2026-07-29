import { AnalysisState } from "@/analysis/analysis.state";
import { isInsertRejection } from "@/analysis/nodes/decision.node";
import { synthesizeFallbackRecommendation } from "@/analysis/nodes/fallback-recommendation";
import { renderReport } from "@/analysis/render";
import { GeneratedOutputs } from "@/analysis/type/output.type";

// 무결성 게이트: 권고(§1) 근거 없이 DDL(§2)/API 변경(§3)만 남으면 자기모순 Docs 가 된다
// (decision 은 co-select 를 강제하지만 생성 노드가 런타임에 degrade 할 수 있다).
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
  let outputs = state.outputs;
  let decision = state.decision;

  // 권고 노드가 강등됐는데 산출물(§2/§3)은 살아 있는 경우: 종전에는 산출물 전체를
  // 폐기했지만(모순 문서 방지), 그 결과가 근거가 실재하는데도 전 섹션 센티넬인 거짓
  // 음성 문서였다(2026-07-29 품질 검토: A6 rep-1 — 관찰자 판정은 정확했는데 0점 산출물).
  // 결정론 폴백 권고를 합성해 §1 근거를 채우고 산출물을 보존한다. 폴백조차 불가하면
  // (인용할 근거 없음) 종전대로 폐기한다 — 모순 문서가 부분 문서보다 해롭다는 원칙 유지.
  if (lacksRecommendationBasis(state.outputs)) {
    const fallback = synthesizeFallbackRecommendation({
      window: state.window,
      sensorFinding: state.sensorFinding,
      rootCause: state.rootCause!, // analyzeRootCause 이후라 non-null (decision.node와 동일 관례)
      decision: state.decision,
      insertRejectionLane:
        state.sensorFinding === null && isInsertRejection(state.window),
    });

    if (fallback !== null) {
      console.warn(
        "[aggregateNode] 권고 강등 감지 — 결정론 폴백 권고로 §1 을 채우고 산출물 보존",
      );
      outputs = { ...state.outputs, recommendationDocs: fallback };
    } else {
      outputs = {};
      decision = {
        selected: [],
        reasoning:
          "권고(§1) 생성 실패로 근거 부재 — 무결성 게이트가 DDL/API 산출물을 보류(재실행 필요)",
      };
    }
  }

  const report = renderReport({
    docId: state.docId,
    generatedAt: state.generatedAt,
    window: state.window,
    sensorFinding: state.sensorFinding,
    rootCause: state.rootCause!,
    decision,
    outputs,
    insightCards: state.insightCards,
  });

  return { report };
}

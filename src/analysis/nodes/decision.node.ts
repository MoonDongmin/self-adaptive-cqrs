import { AnalysisState } from '@/analysis/analysis.state';
import { invokeNode } from '@/analysis/nodes/invoke';
import { DECISION_PROMPT } from '@/analysis/prompts';
import { renderRootCause } from '@/analysis/render';
import { renderSensorFinding } from '@/analysis/render-sensor';
import { AnalysisDecision, analysisDecisionSchema } from '@/analysis/type/output.type';
import type { AnomalyLogWindow } from '@/llm-context/llm-context.type';
import { WINDOW_CONFIG } from '@/llm-context/repository/log-window.config';

// 결정론 프리게이트: 트립 앵커가 카탈로그 404(insight.card.miss)뿐이고 윈도우에 다른
// 에러 신호가 없으면 LLM을 부르지 않고 '조치 불필요'로 확정한다. 프롬프트 지시만으로는
// 같은 입력에서도 확률적으로 뚫린다(analysis-bruno-card-miss-a 사례).
function isCatalogMissOnly(window: AnomalyLogWindow | null): boolean {
  if (window === null || window.rows.length === 0) {
    return false;
  }
  const anchor = window.rows.find((row) => row.isAnchor);
  if (anchor === undefined || anchor.action !== "insight.card.miss") {
    return false;
  }
  return window.rows.every(
    (row) =>
      row.level < WINDOW_CONFIG.errorLevel ||
      row.action === "insight.card.miss",
  );
}

// 정합성 불변식: newReadModel/versionSwitch(산출물 생성)를 골랐으면 권고 계열도 반드시
// 함께 골라야 한다. 아니면 §1=INSUFFICIENT_EVIDENCE 인데 §2/§3 은 충실한 자기모순 문서가 된다.
function enforceCoherentSelection(
  decision: AnalysisDecision,
): AnalysisDecision {
  const selected = new Set(decision.selected);
  const buildsArtifact =
    selected.has("newReadModel") || selected.has("versionSwitch");
  const hasRecommendation =
    selected.has("recommendationDocs") ||
    selected.has("dataQualityRecommendation");

  if (buildsArtifact && !hasRecommendation) {
    return {
      selected: [...decision.selected, "recommendationDocs"],
      reasoning: `${decision.reasoning} (정합성 불변식: 산출물 생성에는 권고 문서가 동반돼야 하므로 recommendationDocs 추가)`,
    };
  }
  return decision;
}

export async function decisionNode(state: typeof AnalysisState.State) {
  if (state.sensorFinding === null && isCatalogMissOnly(state.window)) {
    return {
      decision: {
        selected: [],
        reasoning:
          "의도 신호 없는 카탈로그 조회 실패(insight.card.miss) — 조치 불필요 (결정론 프리게이트)",
      },
    };
  }

  const sensorSection: string[] =
    state.sensorFinding !== null
      ? ["", "## 센서 무결성 발견", renderSensorFinding(state.sensorFinding)]
      : [];

  const facts: string = [
    renderRootCause(state.rootCause!), // rootCause 노드 이후라 non-null
    ...sensorSection,
    "",
    "## 1. 도메인 스키마 (Insight Read DB)",
    state.insightCards,
  ].join("\n");

  const decision = await invokeNode(
    DECISION_PROMPT,
    facts,
    analysisDecisionSchema,
  );

  return { decision: enforceCoherentSelection(decision) };
}

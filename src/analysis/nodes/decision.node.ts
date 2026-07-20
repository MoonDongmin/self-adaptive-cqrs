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
// 단, 같은 윈도우에서 카드 miss 가 반복(2회 이상)되면 '사용자가 같은 데이터를 거듭
// 요청하는 의도 신호'(prejudge ④ 반복 요청)로 보고 게이트를 열어 LLM 의사결정에 맡긴다
// — Read Model 부적합(E 계열) 시나리오의 진입 경로.
function isCatalogMissOnly(window: AnomalyLogWindow | null): boolean {
  if (window === null || window.rows.length === 0) {
    return false;
  }
  const anchor = window.rows.find((row) => row.isAnchor);
  if (anchor === undefined || anchor.action !== "insight.card.miss") {
    return false;
  }
  const missCount = window.rows.filter(
    (row) => row.action === "insight.card.miss",
  ).length;
  if (missCount >= 2) {
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
  const additions: AnalysisDecision["selected"] = [];
  const reasons: string[] = [];

  const buildsArtifact =
    selected.has("newReadModel") || selected.has("versionSwitch");
  const hasRecommendation =
    selected.has("recommendationDocs") ||
    selected.has("dataQualityRecommendation");

  if (buildsArtifact && !hasRecommendation) {
    additions.push("recommendationDocs");
    reasons.push("산출물 생성에는 권고 문서가 동반돼야 하므로 recommendationDocs 추가");
  }

  // 연구 명세: Docs 는 권고 + Read Model 생성 SQL + API Versioning 3요소를 항상 함께
  // 포함한다. 신규 Read Model 은 신규 조회 경로(API)를 수반하므로 versionSwitch 동반을
  // 결정론으로 보장한다(2026-07-14 실측: E 계열에서 LLM 이 확률적으로 누락).
  if (selected.has("newReadModel") && !selected.has("versionSwitch")) {
    additions.push("versionSwitch");
    reasons.push("신규 Read Model 은 API 버전 변경이 동반돼야 하므로 versionSwitch 추가");
  }

  if (additions.length === 0) {
    return decision;
  }
  return {
    selected: [...decision.selected, ...additions],
    reasoning: `${decision.reasoning} (정합성 불변식: ${reasons.join("; ")})`,
  };
}

// 로그 경로 가드: dataQualityRecommendation 생성기는 센서 전용이라 sensorFinding 이
// 없으면 조용히 빈 출력으로 강등된다(data-quality.node.ts). 그런데 LLM 은 로그 경로의
// 데이터 품질성 결함(필드 누락 등)에서도 이 키를 고른다(2026-07-19 A3 실측) —
// 정합성 검사는 이를 '권고 있음'으로 오인해 recommendationDocs 를 추가하지 않고,
// 결과적으로 무결성 게이트가 문서 전체를 보류한다. 로그 경로에서는 결정론으로
// recommendationDocs 로 치환한다.
function substituteSensorOnlySelection(
  decision: AnalysisDecision,
  sensorFindingPresent: boolean,
): AnalysisDecision {
  if (
    sensorFindingPresent ||
    !decision.selected.includes("dataQualityRecommendation")
  ) {
    return decision;
  }
  const selected = decision.selected
    .filter((kind) => kind !== "dataQualityRecommendation")
    .concat(
      decision.selected.includes("recommendationDocs")
        ? []
        : ["recommendationDocs" as const],
    );
  return {
    selected,
    reasoning: `${decision.reasoning} (로그 경로 가드: 센서 전용 dataQualityRecommendation → recommendationDocs 치환)`,
  };
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

  return {
    decision: enforceCoherentSelection(
      substituteSensorOnlySelection(decision, state.sensorFinding !== null),
    ),
  };
}

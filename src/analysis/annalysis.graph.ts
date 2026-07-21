import { END, START, StateGraph } from '@langchain/langgraph';
import { AnalysisState } from '@/analysis/analysis.state';
import { aggregateNode } from '@/analysis/nodes/aggregate.node';
import { dataQualityNode } from '@/analysis/nodes/data-quality.node';
import { decisionNode } from '@/analysis/nodes/decision.node';
import { newReadModelNode } from '@/analysis/nodes/new-read-model.node';
import { projectionMappingNode } from '@/analysis/nodes/projection-mapping.node';
import { recommendationDocsNode } from '@/analysis/nodes/recommendation-docs.node';
import { makeRootCauseNode } from '@/analysis/nodes/root-cause.node';
import { versionSwitchNode } from '@/analysis/nodes/version-switch.node';
import { DiagnosisToolkit } from '@/analysis/tools/diagnosis-toolkit';
import { OutputKind } from '@/analysis/type/output.type';

const ROUTE: Record<OutputKind, string> = {
  versionSwitch: "genVersionSwitch",
  recommendationDocs: "genRecommendationDocs",
  newReadModel: "genNewReadModel",
  dataQualityRecommendation: "genDataQuality",
};

// 툴킷이 주입되면 근본원인 노드가 tool-calling 에이전트로 동작한다(로그 DB·Insight 카드·
// 베이스라인 직접 조회). null 이면 기존 one-shot 판정(하위호환).
export function buildAnalysisGraph(toolkit: DiagnosisToolkit | null = null) {
  const graph = new StateGraph(AnalysisState)
    .addNode("analyzeRootCause", makeRootCauseNode(toolkit))
    .addNode("decide", decisionNode)
    .addNode("genVersionSwitch", versionSwitchNode)
    .addNode("genRecommendationDocs", recommendationDocsNode)
    .addNode("genNewReadModel", newReadModelNode)
    .addNode("genProjectionMapping", projectionMappingNode)
    .addNode("genDataQuality", dataQualityNode)
    .addNode("aggregate", aggregateNode);

  graph.addEdge(START, "analyzeRootCause");
  graph.addEdge("analyzeRootCause", "decide");

  // 의사결정 게이트: decision.selected 가 고른 생성기만 실행한다. 아무것도 필요 없으면
  // (예: 존재하지 않는 카드 이름 404 = insight.card.miss — Read Model 부족 신호 아님) 곧장
  // aggregate 로 가서 3섹션 모두 INSUFFICIENT_EVIDENCE 센티넬 + '조치 불필요' 결론으로 렌더한다.
  // '항상 3섹션'은 형태(헤딩)를 render 가 보장하고, 내용은 근거가 있는 섹션만 채운다(억지 생성 금지).
  graph.addConditionalEdges(
    "decide",
    (state) => {
      const picked = state.decision?.selected ?? [];

      if (picked.length === 0) {
        return "aggregate";
      }

      // newReadModel 이 선택되면 설계를 먼저 확정한다 — 나머지 생성기는 확정된 설계를
      // 컨텍스트로 주입받아 뒤 super-step 에서 실행된다(스키마 단일 소스). 병렬 fan-out 이
      // 생성기마다 독립적으로 스키마를 즉흥 창안해 §1/§2/§3 이 서로 다른 테이블·컬럼을
      // 가리키던 자기모순(2026-07-21 품질 감사: 전 시나리오 최다 빈도 결함)의 구조적 봉쇄.
      if (picked.includes("newReadModel")) {
        return ["genNewReadModel"];
      }

      return picked.map((kind) => ROUTE[kind]);
    },
    [
      "genVersionSwitch",
      "genRecommendationDocs",
      "genNewReadModel",
      "genDataQuality",
      "aggregate",
    ],
  );

  graph.addEdge("genVersionSwitch", "aggregate");
  graph.addEdge("genRecommendationDocs", "aggregate");
  // newReadModel 의 동반 스테이지: 매핑 명세는 방금 설계된 fields 를 봐야 하므로 fan-out 이
  // 아니라 genNewReadModel 뒤에 체인한다(decide 는 이 노드를 모른다 — OutputKind 아님).
  graph.addEdge("genNewReadModel", "genProjectionMapping");
  // 설계·매핑 확정 후 남은 선택 생성기로 fan-out. 없으면 곧장 aggregate.
  graph.addConditionalEdges(
    "genProjectionMapping",
    (state) => {
      const remaining = (state.decision?.selected ?? []).filter(
        (kind) => kind !== "newReadModel",
      );

      if (remaining.length === 0) {
        return "aggregate";
      }

      return remaining.map((kind) => ROUTE[kind]);
    },
    ["genVersionSwitch", "genRecommendationDocs", "genDataQuality", "aggregate"],
  );
  graph.addEdge("genDataQuality", "aggregate");
  graph.addEdge("aggregate", END);

  return graph.compile();
}

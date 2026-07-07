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
  // 다른 생성기보다 한 super-step 늦게 aggregate 에 도달해 aggregate 가 두 번 실행될 수
  // 있으나, aggregate 는 LLM 미호출 결정론 조립 + report 채널 last-write-wins 라 무해하다.
  graph.addEdge("genNewReadModel", "genProjectionMapping");
  graph.addEdge("genProjectionMapping", "aggregate");
  graph.addEdge("genDataQuality", "aggregate");
  graph.addEdge("aggregate", END);

  return graph.compile();
}

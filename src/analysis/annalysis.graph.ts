import { END, START, StateGraph } from '@langchain/langgraph';
import { AnalysisState } from '@/analysis/analysis.state';
import { aggregateNode } from '@/analysis/nodes/aggregate.node';
import { dataQualityNode } from '@/analysis/nodes/data-quality.node';
import { decisionNode } from '@/analysis/nodes/decision.node';
import { newReadModelNode } from '@/analysis/nodes/new-read-model.node';
import { recommendationDocsNode } from '@/analysis/nodes/recommendation-docs.node';
import { rootCauseNode } from '@/analysis/nodes/root-cause.node';
import { versionSwitchNode } from '@/analysis/nodes/version-switch.node';
import { OutputKind } from '@/analysis/type/output.type';

const ROUTE: Record<OutputKind, string> = {
  versionSwitch: "genVersionSwitch",
  recommendationDocs: "genRecommendationDocs",
  newReadModel: "genNewReadModel",
  dataQualityRecommendation: "genDataQuality",
};

export function buildAnalysisGraph() {
  const graph = new StateGraph(AnalysisState)
    .addNode("analyzeRootCause", rootCauseNode)
    .addNode("decide", decisionNode)
    .addNode("genVersionSwitch", versionSwitchNode)
    .addNode("genRecommendationDocs", recommendationDocsNode)
    .addNode("genNewReadModel", newReadModelNode)
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
  graph.addEdge("genNewReadModel", "aggregate");
  graph.addEdge("genDataQuality", "aggregate");
  graph.addEdge("aggregate", END);

  return graph.compile();
}

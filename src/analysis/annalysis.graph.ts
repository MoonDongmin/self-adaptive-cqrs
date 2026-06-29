import { END, START, StateGraph } from '@langchain/langgraph';
import { AnalysisState } from '@/analysis/analysis.state';
import { aggregateNode } from '@/analysis/nodes/aggregate.node';
import { decisionNode } from '@/analysis/nodes/decision.node';
import { newReadModelNode } from '@/analysis/nodes/new-read-model.node';
import { recommendationDocsNode } from '@/analysis/nodes/recommendation-docs.node';
import { rootCauseNode } from '@/analysis/nodes/root-cause.node';
import { versionSwitchNode } from '@/analysis/nodes/version-switch.node';

const ROUTE: Record<
  "versionSwitch" | "recommendationDocs" | "newReadModel",
  string
> = {
  versionSwitch: "genVersionSwitch",
  recommendationDocs: "genRecommendationDocs",
  newReadModel: "genNewReadModel",
};

export function buildAnalysisGraph() {
  const graph = new StateGraph(AnalysisState)
    .addNode("analyzeRootCause", rootCauseNode)
    .addNode("decide", decisionNode)
    .addNode("genVersionSwitch", versionSwitchNode)
    .addNode("genRecommendationDocs", recommendationDocsNode)
    .addNode("genNewReadModel", newReadModelNode)
    .addNode("aggregate", aggregateNode);

  graph.addEdge(START, "analyzeRootCause");
  graph.addEdge("analyzeRootCause", "decide");

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
      "aggregate",
    ],
  );

  graph.addEdge("genVersionSwitch", "aggregate");
  graph.addEdge("genRecommendationDocs", "aggregate");
  graph.addEdge("genNewReadModel", "aggregate");
  graph.addEdge("aggregate", END);

  return graph.compile();
}

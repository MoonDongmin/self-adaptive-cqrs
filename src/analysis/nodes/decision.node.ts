import { AnalysisState } from '@/analysis/analysis.state';
import { invokeNode } from '@/analysis/nodes/invoke';
import { DECISION_PROMPT } from '@/analysis/prompts';
import { renderRootCause } from '@/analysis/render';
import { analysisDecisionSchema } from '@/analysis/type/output.type';

export async function decisionNode(state: typeof AnalysisState.State) {
  const facts: string = [
    renderRootCause(state.rootCause!), // rootCause 노드 이후라 non-null
    "",
    "## 1. 도메인 스키마 (Insight Read DB)",
    state.insightCards,
  ].join("\n");

  const decision = await invokeNode(
    DECISION_PROMPT,
    facts,
    analysisDecisionSchema,
  );

  return { decision };
}

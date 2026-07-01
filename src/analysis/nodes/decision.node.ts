import { AnalysisState } from '@/analysis/analysis.state';
import { invokeNode } from '@/analysis/nodes/invoke';
import { DECISION_PROMPT } from '@/analysis/prompts';
import { renderRootCause } from '@/analysis/render';
import { renderSensorFinding } from '@/analysis/render-sensor';
import { analysisDecisionSchema } from '@/analysis/type/output.type';

export async function decisionNode(state: typeof AnalysisState.State) {
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

  return { decision };
}

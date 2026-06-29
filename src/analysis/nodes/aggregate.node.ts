import { AnalysisState } from '@/analysis/analysis.state';
import { invokeNode } from '@/analysis/nodes/invoke';
import { AGGREGATE_PROMPT } from '@/analysis/prompts';
import { renderDecision, renderOutputs, renderRootCause } from '@/analysis/render';
import { analysisReportSchema } from '@/analysis/type/output.type';

export async function aggregateNode(state: typeof AnalysisState.State) {
  const facts = [
    renderRootCause(state.rootCause!),
    state.decision ? renderDecision(state.decision) : "",
    renderOutputs(state.outputs),
  ].join("\n\n");

  const result = await invokeNode(
    AGGREGATE_PROMPT,
    facts,
    analysisReportSchema,
  );

  return { report: result.report };
}

import { AnalysisState } from '@/analysis/analysis.state';
import { invokeNode } from '@/analysis/nodes/invoke';
import { ROOT_CAUSE_PROMPT, SENSOR_ROOT_CAUSE_PROMPT } from '@/analysis/prompts';
import { renderEvidenceContext } from '@/analysis/render';
import { rootCauseAnalysisSchema } from '@/analysis/type/output.type';

export async function rootCauseNode(state: typeof AnalysisState.State) {
  const isSensor: boolean = state.sensorFinding !== null;

  const facts: string = renderEvidenceContext(
    state.window,
    state.sensorFinding,
  );
  const prompt: string = isSensor
    ? SENSOR_ROOT_CAUSE_PROMPT
    : ROOT_CAUSE_PROMPT;

  const rootCause = await invokeNode(prompt, facts, rootCauseAnalysisSchema);

  return { rootCause };
}

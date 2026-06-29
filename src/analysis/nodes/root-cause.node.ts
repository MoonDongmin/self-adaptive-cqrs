import { AnalysisState } from '@/analysis/analysis.state';
import { invokeNode } from '@/analysis/nodes/invoke';
import { ROOT_CAUSE_PROMPT } from '@/analysis/prompts';
import { renderAnomalyWindow } from '@/analysis/render';
import { rootCauseAnalysisSchema } from '@/analysis/type/output.type';

export async function rootCauseNode(state: typeof AnalysisState.State) {
  const facts: string = renderAnomalyWindow(state.window);

  const rootCause = await invokeNode(
    ROOT_CAUSE_PROMPT,
    facts,
    rootCauseAnalysisSchema,
  );

  return { rootCause };
}

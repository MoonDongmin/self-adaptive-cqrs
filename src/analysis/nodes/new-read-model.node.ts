import { AnalysisState } from '@/analysis/analysis.state';
import { invokeNode } from '@/analysis/nodes/invoke';
import { NEW_READ_MODEL_PROMPT } from '@/analysis/prompts';
import { renderRootCause } from '@/analysis/render';
import { newReadModelOutputSchema } from '@/analysis/type/output.type';

export async function newReadModelNode(state: typeof AnalysisState.State) {
  const facts = `${renderRootCause(state.rootCause!)}\n\n## 1. 도메인 스키마\n${state.insightCards}`;

  const newReadModel = await invokeNode(
    NEW_READ_MODEL_PROMPT,
    facts,
    newReadModelOutputSchema,
  );

  return { outputs: { newReadModel } };
}

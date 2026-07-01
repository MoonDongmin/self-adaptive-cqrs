import { AnalysisState } from '@/analysis/analysis.state';
import { readSourceExamples } from '@/analysis/context/source-examples';
import { invokeNode } from '@/analysis/nodes/invoke';
import { NEW_READ_MODEL_PROMPT } from '@/analysis/prompts';
import { renderEvidenceContext, renderRootCause } from '@/analysis/render';
import { newReadModelOutputSchema } from '@/analysis/type/output.type';

export async function newReadModelNode(state: typeof AnalysisState.State) {
  const facts = [
    renderRootCause(state.rootCause!),
    renderEvidenceContext(state.window, state.sensorFinding),
    `## 도메인 스키마(Insight 카드)\n${state.insightCards}`,
    await readSourceExamples(),
  ].join("\n\n");

  try {
    const newReadModel = await invokeNode(
      NEW_READ_MODEL_PROMPT,
      facts,
      newReadModelOutputSchema,
    );

    return { outputs: { newReadModel } };
  } catch {
    return { outputs: {} };
  }
}

import { AnalysisState } from '@/analysis/analysis.state';
import { readSourceExamples } from '@/analysis/context/source-examples';
import { invokeNode } from '@/analysis/nodes/invoke';
import { RECOMMENDATION_DOCS_PROMPT } from '@/analysis/prompts';
import { renderAnomalyWindow, renderRootCause } from '@/analysis/render';
import { recommendationDocsOutputSchema } from '@/analysis/type/output.type';

export async function recommendationDocsNode(
  state: typeof AnalysisState.State,
) {
  const facts = [
    renderRootCause(state.rootCause!),
    renderAnomalyWindow(state.window),
    `## 도메인 스키마(Insight 카드)\n${state.insightCards}`,
    await readSourceExamples(),
  ].join("\n\n");

  try {
    const recommendationDocs = await invokeNode(
      RECOMMENDATION_DOCS_PROMPT,
      facts,
      recommendationDocsOutputSchema,
    );

    return { outputs: { recommendationDocs } };
  } catch {
    return { outputs: {} };
  }
}

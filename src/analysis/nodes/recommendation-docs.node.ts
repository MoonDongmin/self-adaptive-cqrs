import { AnalysisState } from '@/analysis/analysis.state';
import { invokeNode } from '@/analysis/nodes/invoke';
import { RECOMMENDATION_DOCS_PROMPT } from '@/analysis/prompts';
import { renderRootCause } from '@/analysis/render';
import { recommendationDocsOutputSchema } from '@/analysis/type/output.type';

export async function recommendationDocsNode(
  state: typeof AnalysisState.State,
) {
  const facts = `${renderRootCause(state.rootCause!)}\n\n## 1. 도메인 스키마\n${state.insightCards}`;

  const recommendationDocs = await invokeNode(
    RECOMMENDATION_DOCS_PROMPT,
    facts,
    recommendationDocsOutputSchema,
  );

  return { outputs: { recommendationDocs } };
}

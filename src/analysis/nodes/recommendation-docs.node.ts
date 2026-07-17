import { AnalysisState } from '@/analysis/analysis.state';
import { readSourceExamples } from '@/analysis/context/source-examples';
import { invokeNode } from '@/analysis/nodes/invoke';
import { RECOMMENDATION_DOCS_PROMPT } from '@/analysis/prompts';
import { renderEvidenceContext, renderRootCause } from '@/analysis/render';
import { recommendationDocsOutputSchema } from '@/analysis/type/output.type';

export async function recommendationDocsNode(
  state: typeof AnalysisState.State,
) {
  const facts = [
    renderRootCause(state.rootCause!),
    renderEvidenceContext(state.window, state.sensorFinding),
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
  } catch (error) {
    // 강등이 문서 전체를 센티넬로 만들 수 있으므로 반드시 흔적을 남긴다(dataQualityNode 와 동일).
    console.warn("[recommendationDocsNode] 생성/검증 실패로 강등:", String(error));
    return { outputs: {} };
  }
}

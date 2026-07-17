import { AnalysisState } from '@/analysis/analysis.state';
import { readSourceExamples } from '@/analysis/context/source-examples';
import { invokeNode } from '@/analysis/nodes/invoke';
import { NEW_READ_MODEL_PROMPT, NEW_READ_MODEL_SENSOR_ADDENDUM } from '@/analysis/prompts';
import { renderEvidenceContext, renderRootCause } from '@/analysis/render';
import { newReadModelOutputSchema } from '@/analysis/type/output.type';

export async function newReadModelNode(state: typeof AnalysisState.State) {
  // 센서 경로 지시는 sensorFinding 이 실재할 때만 주입 — 상주 시 로그 경로에서 예시 복제(앵커링) 유발.
  const rolePrompt: string =
    state.sensorFinding !== null
      ? [NEW_READ_MODEL_PROMPT, NEW_READ_MODEL_SENSOR_ADDENDUM].join("\n\n")
      : NEW_READ_MODEL_PROMPT;

  const facts = [
    renderRootCause(state.rootCause!),
    renderEvidenceContext(state.window, state.sensorFinding),
    `## 도메인 스키마(Insight 카드)\n${state.insightCards}`,
    await readSourceExamples(),
  ].join("\n\n");

  try {
    const newReadModel = await invokeNode(
      rolePrompt,
      facts,
      newReadModelOutputSchema,
    );

    return { outputs: { newReadModel } };
  } catch (error) {
    // 강등이 문서 전체를 센티넬로 만들 수 있으므로 반드시 흔적을 남긴다(dataQualityNode 와 동일).
    console.warn("[newReadModelNode] 생성/검증 실패로 강등:", String(error));
    return { outputs: {} };
  }
}

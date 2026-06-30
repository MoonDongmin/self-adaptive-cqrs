import { AnalysisState } from '@/analysis/analysis.state';
import { readSourceExamples } from '@/analysis/context/source-examples';
import { invokeNode } from '@/analysis/nodes/invoke';
import { VERSION_SWITCH_PROMPT } from '@/analysis/prompts';
import { renderAnomalyWindow, renderRootCause } from '@/analysis/render';
import { versionSwitchOutputSchema } from '@/analysis/type/output.type';

export async function versionSwitchNode(state: typeof AnalysisState.State) {
  const facts = [
    renderRootCause(state.rootCause!),
    renderAnomalyWindow(state.window),
    `## 도메인 스키마(Insight 카드)\n${state.insightCards}`,
    await readSourceExamples(),
  ].join("\n\n");

  try {
    const versionSwitch = await invokeNode(
      VERSION_SWITCH_PROMPT,
      facts,
      versionSwitchOutputSchema,
    );

    return { outputs: { versionSwitch } }; // 부분 기록 → reducer가 머지
  } catch {
    // 코드가 담긴 큰 JSON은 파싱이 깨질 수 있다. 한 노드 실패가 전체 사이클을 죽이지 않게 degrade.
    return { outputs: {} };
  }
}

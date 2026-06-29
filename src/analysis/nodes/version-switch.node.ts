import { AnalysisState } from '@/analysis/analysis.state';
import { invokeNode } from '@/analysis/nodes/invoke';
import { VERSION_SWITCH_PROMPT } from '@/analysis/prompts';
import { renderRootCause } from '@/analysis/render';
import { versionSwitchOutputSchema } from '@/analysis/type/output.type';

export async function versionSwitchNode(state: typeof AnalysisState.State) {
  const facts = `${renderRootCause(state.rootCause!)}\n\n## 1. 도메인 스키마\n${state.insightCards}`;

  const versionSwitch = await invokeNode(
    VERSION_SWITCH_PROMPT,
    facts,
    versionSwitchOutputSchema,
  );

  return { outputs: { versionSwitch } }; // 부분 기록 → reducer가 머지
}

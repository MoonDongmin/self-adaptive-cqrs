import { AnalysisState } from '@/analysis/analysis.state';
import { invokeAgentNode } from '@/analysis/nodes/invoke-agent';
import { invokeNode } from '@/analysis/nodes/invoke';
import { DIAGNOSIS_TOOLS_GUIDE, ROOT_CAUSE_PROMPT, SENSOR_ROOT_CAUSE_PROMPT } from '@/analysis/prompts';
import { renderEvidenceContext } from '@/analysis/render';
import { buildDiagnosisTools, DiagnosisToolkit } from '@/analysis/tools/diagnosis-toolkit';
import { rootCauseAnalysisSchema } from '@/analysis/type/output.type';

// 2차 진단 노드 팩토리. 툴킷이 주입되면 tool-calling 에이전트로 스스로 증거를 조회해
// 판정하고(궤적 기록), 없으면 기존 one-shot 판정으로 동작한다(테스트/하위호환).
export function makeRootCauseNode(toolkit: DiagnosisToolkit | null) {
  return async function rootCauseNode(state: typeof AnalysisState.State) {
    const isSensor: boolean = state.sensorFinding !== null;

    const facts: string = renderEvidenceContext(
      state.window,
      state.sensorFinding,
    );
    const prompt: string = isSensor
      ? SENSOR_ROOT_CAUSE_PROMPT
      : ROOT_CAUSE_PROMPT;

    if (toolkit === null) {
      const rootCause = await invokeNode(prompt, facts, rootCauseAnalysisSchema);
      return { rootCause };
    }

    const { value, trajectory } = await invokeAgentNode(
      [prompt, DIAGNOSIS_TOOLS_GUIDE].join("\n\n"),
      facts,
      rootCauseAnalysisSchema,
      buildDiagnosisTools(toolkit),
    );

    return {
      rootCause: value,
      diagnosisTrajectory: trajectory.map(
        (step) => `${step.tool}(${step.input}) → ${step.resultPreview}`,
      ),
    };
  };
}

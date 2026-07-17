import { AnalysisState } from '@/analysis/analysis.state';
import { readSourceExamples } from '@/analysis/context/source-examples';
import { invokeNode } from '@/analysis/nodes/invoke';
import { VERSION_SWITCH_PROMPT } from '@/analysis/prompts';
import { renderEvidenceContext, renderRootCause } from '@/analysis/render';
import { versionSwitchOutputSchema } from '@/analysis/type/output.type';

export async function versionSwitchNode(state: typeof AnalysisState.State) {
  // 병렬 fan-out 이라 생성 노드끼리 산출물을 못 본다. newReadModel 이 함께 선택된 경우
  // 역할 경계를 명시해 동일 프로젝터/테이블 전체 코드가 서로 다른 명명으로 중복 생성되는 것을 막는다.
  const newReadModelCoSelected: boolean = (
    state.decision?.selected ?? []
  ).includes("newReadModel");

  const coSelectionNote: string[] = newReadModelCoSelected
    ? [
        [
          "## 역할 경계 — newReadModel 생성자가 함께 실행 중",
          "이번 결정에서 newReadModel 도 함께 선택되었다. 신규 테이블 DDL·Drizzle 스키마·프로젝터 전체 코드는",
          "newReadModel 산출물이 담당한다. 너의 codeChanges 는 그것을 중복 생성하지 말고,",
          "(1) 기존 서비스/컨트롤러/모듈에 신규 프로젝터를 배선하는 modifyFile 변경과 (2) v1→v2 전환·컷오버 절차에 집중하라.",
          "신규 테이블/프로젝터를 지칭할 때의 명명은 '테이블명 = read_<이름>_v2, 클래스 = <이름>V2Projector,",
          "프로젝터 name = <이름>-v2-projector' 관례 하나로 통일하라.",
        ].join("\n"),
      ]
    : [];

  const facts = [
    renderRootCause(state.rootCause!),
    renderEvidenceContext(state.window, state.sensorFinding),
    `## 도메인 스키마(Insight 카드)\n${state.insightCards}`,
    ...coSelectionNote,
    await readSourceExamples(),
  ].join("\n\n");

  try {
    const versionSwitch = await invokeNode(
      VERSION_SWITCH_PROMPT,
      facts,
      versionSwitchOutputSchema,
    );

    return { outputs: { versionSwitch } }; // 부분 기록 → reducer가 머지
  } catch (error) {
    // 코드가 담긴 큰 JSON은 파싱이 깨질 수 있다. 한 노드 실패가 전체 사이클을 죽이지 않게 degrade.
    // 강등이 문서 전체를 센티넬로 만들 수 있으므로 반드시 흔적을 남긴다(dataQualityNode 와 동일).
    console.warn("[versionSwitchNode] 생성/검증 실패로 강등:", String(error));
    return { outputs: {} };
  }
}

import { AnalysisState } from '@/analysis/analysis.state';
import { readSourceExamples } from '@/analysis/context/source-examples';
import { invokeNode } from '@/analysis/nodes/invoke';
import { VERSION_SWITCH_PROMPT } from '@/analysis/prompts';
import {
  INSIGHT_CARDS_CAVEAT,
  renderConfirmedDesign,
  renderEvidenceContext,
  renderRootCause,
  stripInsightCardExamples,
} from '@/analysis/render';
import { versionSwitchOutputSchema } from '@/analysis/type/output.type';

export async function versionSwitchNode(state: typeof AnalysisState.State) {
  // newReadModel 이 함께 선택된 경우 그래프가 설계를 먼저 확정한 뒤 이 노드를 실행한다.
  // 확정 설계를 주입해 동일 프로젝터/테이블이 다른 명명·컬럼으로 중복 창안되는 것을 막고,
  // 이 노드는 배선(modifyFile)·전환 절차에 집중시킨다.
  const confirmedDesign = state.outputs.newReadModel;

  const coSelectionNote: string[] =
    confirmedDesign !== undefined
      ? [
          [
            renderConfirmedDesign(confirmedDesign),
            "",
            "너의 codeChanges 는 위 설계를 중복 생성하지 말고,",
            "(1) 기존 서비스/컨트롤러/모듈에 신규 프로젝터를 배선하는 modifyFile 변경과",
            "(2) v1→v2 전환·컷오버 절차에 집중하라. 배선 코드가 호출하는 필드/클래스가",
            "실제로 위 설계의 신규 프로젝터를 가리키는지(기존 v1 프로젝터 재사용 금지) 확인하라.",
          ].join("\n"),
        ]
      : [];

  const facts = [
    renderRootCause(state.rootCause!),
    renderEvidenceContext(state.window, state.sensorFinding),
    `## 도메인 스키마(Insight 카드)\n${stripInsightCardExamples(state.insightCards)}\n${INSIGHT_CARDS_CAVEAT}`,
    ...coSelectionNote,
    await readSourceExamples(),
  ].join("\n\n");

  try {
    const versionSwitch = await invokeNode(
      VERSION_SWITCH_PROMPT,
      facts,
      versionSwitchOutputSchema,
    );

    // 스키마 단일 소스 강제: newReadModel 설계가 확정된 경우, versionSwitch 가 같은
    // 테이블/프로젝터를 addFile 로 재생성하면(프롬프트 금지 지시를 확률적으로 무시 —
    // 2026-07-21 gpt-4o-mini 실측) 문서에 서로 다른 두 사본이 실려 발산한다.
    // addFile 을 결정론으로 걸러 배선(modifyFile)·전환 절차만 남긴다.
    if (confirmedDesign !== undefined) {
      const duplicated = versionSwitch.codeChanges.filter(
        (change) => change.changeKind === "addFile",
      );
      if (duplicated.length > 0) {
        console.warn(
          "[versionSwitchNode] 확정 설계 존재 — addFile 중복 생성 제거:",
          duplicated.map((change) => change.filePath),
        );
        versionSwitch.codeChanges = versionSwitch.codeChanges.filter(
          (change) => change.changeKind !== "addFile",
        );
      }
    }

    return { outputs: { versionSwitch } }; // 부분 기록 → reducer가 머지
  } catch (error) {
    // 코드가 담긴 큰 JSON은 파싱이 깨질 수 있다. 한 노드 실패가 전체 사이클을 죽이지 않게 degrade.
    // 강등이 문서 전체를 센티넬로 만들 수 있으므로 반드시 흔적을 남긴다(dataQualityNode 와 동일).
    console.warn("[versionSwitchNode] 생성/검증 실패로 강등:", String(error));
    return { outputs: {} };
  }
}

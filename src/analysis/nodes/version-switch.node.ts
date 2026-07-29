import { AnalysisState } from "@/analysis/analysis.state";
import { readSourceExamples } from "@/analysis/context/source-examples";
import { extractEndpointsFromCode } from "@/analysis/front-matter";
import { invokeNode } from "@/analysis/nodes/invoke";
import { VERSION_SWITCH_PROMPT } from "@/analysis/prompts";
import {
  INSIGHT_CARDS_CAVEAT,
  renderConfirmedDesign,
  renderEvidenceContext,
  renderRootCause,
  stripInsightCardExamples,
} from "@/analysis/render";
import {
  NewReadModelOutput,
  VersionSwitchOutput,
  versionSwitchOutputSchema,
} from "@/analysis/type/output.type";

// LLM 생성이 끝내 실패해도(타임아웃·JSON 절단 재시도 소진) §3 를 비우지 않는 결정론 폴백.
// 신규 Read Model 이 확정된 이상 'API 버전 변경 근거 부족'은 사실과 어긋난 자기모순이다
// (2026-07-23 A4 실측: versionSwitch 타임아웃 강등 → §2 는 v2 DDL 확정인데 §3 는
// INSUFFICIENT_EVIDENCE). 모든 값은 이미 검증(tsc/실DB)된 확정 설계에서만 유도한다 — 발명 없음.
function synthesizeVersionSwitchFromConfirmedDesign(
  design: NewReadModelOutput,
): VersionSwitchOutput {
  const versionSuffixMatch = design.proposedName.match(/_v(\d+)$/);
  const toVersionNumber =
    versionSuffixMatch !== null ? Number(versionSuffixMatch[1]) : 2;

  // controllerWiring 은 '// src/...' 경로 주석으로 파일별 블록을 구분하는 관례다 —
  // 첫 경로를 대표 filePath 로 쓰고, 스니펫 전체를 한 변경으로 싣는다(라우트 추출은
  // front-matter 의 extractEndpoints 가 스니펫 본문에서 수행).
  const wiringFilePath =
    design.controllerWiring.match(/^\/\/\s*(src\/\S+\.ts)/m)?.[1] ??
    "src/projection/projection.module.ts";

  return {
    readModelName: design.proposedName,
    fromVersion: `v${toVersionNumber - 1}`,
    toVersion: `v${toVersionNumber}`,
    reason: `신규 Read Model ${design.proposedName} 도입 — ${design.purpose}`,
    triggeringEvidence: design.rationale,
    v1Compatibility:
      "기존 v1 자산(테이블·엔드포인트·프로젝터 name)은 무손상 유지 — 신규 테이블·프로젝터·조회 경로를 추가만 한다",
    codeChanges: [
      {
        filePath: wiringFilePath,
        changeKind: "modifyFile",
        language: "typescript",
        description:
          "신규 프로젝터 배선(스키마 export/서비스/컨트롤러/모듈) — 스니펫 내 파일별 경로 주석 참조",
        snippet: design.controllerWiring,
      },
    ],
    changelogEntries: [
      {
        category: "Added",
        description: `Read Model \`${design.proposedName}\` 신설 (키 ${design.keyColumns}) — ${design.purpose}`,
      },
    ],
    backwardCompatibleChanges: [
      `${design.proposedName} 테이블·프로젝터·조회 경로 추가(기존 v1 경로 불변)`,
    ],
    breakingChanges: [],
    testBeforeCutover:
      "신규 프로젝터 catch-up 완료 후 v1/v2 행 수와 키 (scene_key, attempt_num) 일치 대조",
    rollbackPlan:
      "v1 자산 무손상이므로 신규 테이블·배선 제거만으로 즉시 롤백 가능(원본 이벤트는 event_store 보존)",
  };
}

export async function versionSwitchNode(state: typeof AnalysisState.State) {
  // newReadModel 이 함께 선택된 경우 그래프가 설계를 먼저 확정한 뒤 이 노드를 실행한다.
  // 확정 설계를 주입해 동일 프로젝터/테이블이 다른 명명·컬럼으로 중복 창안되는 것을 막고,
  // 이 노드는 배선(modifyFile)·전환 절차에 집중시킨다.
  const confirmedDesign = state.outputs.newReadModel;

  // 확정 설계가 정의한 클래스명 — 배선 스니펫이 다른 변형(V2 접미 등)을 발명하면 문서 내
  // 코드가 상호 모순으로 컴파일 불가가 된다(2026-07-29 품질 검토: 전 시나리오에서 문서
  // 절반 이상 재현된 최다 빈도 결함). 프롬프트로 명시하고 아래 validator 로 강제한다.
  const declaredClassNames: string[] =
    confirmedDesign !== undefined
      ? [
          ...new Set(
            [
              confirmedDesign.projectorCode,
              confirmedDesign.controllerWiring,
            ].flatMap((source) =>
              [...source.matchAll(/class\s+([A-Z][A-Za-z0-9]*)/g)].map(
                (match) => match[1],
              ),
            ),
          ),
        ]
      : [];

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
            ...(declaredClassNames.length > 0
              ? [
                  `신규 클래스명은 정확히 ${declaredClassNames.map((name) => `\`${name}\``).join(", ")} 다 — ` +
                    "V2 접미 등 다른 변형 이름을 발명하거나 import 하지 마라(컴파일 불가).",
                ]
              : []),
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

  // 라우트 일관성 검증: 확정 설계의 controllerWiring 라우트가 versionSwitch 배선 스니펫에
  // 그대로 실려야 한다. 두 생성기가 같은 신규 라우트를 다른 경로 문자열로 창안하면
  // (2026-07-23 fix1 A4 실측: 설계 @Post("/grip-result-v2") vs §3 @Post("/v2/grip-result"))
  // 한 문서 안에서 §3 와 Optional 배선이 서로 다른 API 를 가리킨다.
  const confirmedDesignRoutes: string[] =
    confirmedDesign !== undefined
      ? extractEndpointsFromCode(confirmedDesign.controllerWiring)
      : [];
  const validateRouteConsistency =
    confirmedDesignRoutes.length === 0
      ? undefined
      : async (candidate: VersionSwitchOutput): Promise<string[]> => {
          const snippetRoutes = new Set(
            candidate.codeChanges.flatMap((change) =>
              extractEndpointsFromCode(change.snippet),
            ),
          );
          const missingRoutes = confirmedDesignRoutes.filter(
            (route) => !snippetRoutes.has(route),
          );
          if (missingRoutes.length === 0) {
            return [];
          }
          return [
            `확정 설계의 신규 라우트(${missingRoutes.join(", ")})가 codeChanges 배선 스니펫에 없다 — ` +
              "다른 경로 문자열을 발명하지 말고, 확정 설계 controllerWiring 의 라우트를 그대로 배선하라.",
          ];
        };

  // 클래스명 정합 검증: 스니펫이 확정 설계에 없는 프로젝터 클래스명(V2 접미 변형 등)을
  // 참조하면 재질의로 교정한다. 기존 v1 클래스와 Projector 인터페이스는 정당한 참조다.
  const knownProjectorClassNames = new Set<string>([
    ...declaredClassNames,
    "GripResultProjector",
    "MultiModalProjector",
    "Projector",
  ]);
  const validateClassConsistency =
    confirmedDesign === undefined || declaredClassNames.length === 0
      ? undefined
      : async (candidate: VersionSwitchOutput): Promise<string[]> => {
          const unknownNames = new Set<string>();
          for (const change of candidate.codeChanges) {
            for (const match of change.snippet.matchAll(
              /\b([A-Z][A-Za-z0-9]*Projector[A-Za-z0-9]*)\b/g,
            )) {
              if (!knownProjectorClassNames.has(match[1])) {
                unknownNames.add(match[1]);
              }
            }
          }
          if (unknownNames.size === 0) {
            return [];
          }
          return [
            `codeChanges 스니펫이 정의되지 않은 프로젝터 클래스(${[...unknownNames].join(", ")})를 참조한다 — ` +
              `확정 설계가 정의한 클래스명(${declaredClassNames.join(", ")})을 그대로 써라. ` +
              "V2 접미 등 새 이름을 발명하면 문서 내 코드가 상호 모순으로 컴파일되지 않는다.",
          ];
        };

  const validators = [
    validateRouteConsistency,
    validateClassConsistency,
  ].filter((validator) => validator !== undefined);
  const validateVersionSwitch =
    validators.length === 0
      ? undefined
      : async (candidate: VersionSwitchOutput): Promise<string[]> =>
          (
            await Promise.all(
              validators.map((validator) => validator(candidate)),
            )
          ).flat();

  try {
    const versionSwitch = await invokeNode(
      VERSION_SWITCH_PROMPT,
      facts,
      versionSwitchOutputSchema,
      validateVersionSwitch,
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

    if (confirmedDesign !== undefined) {
      console.warn(
        "[versionSwitchNode] 확정 설계 존재 — §3 를 결정론 폴백으로 합성(센티넬 방지)",
      );
      return {
        outputs: {
          versionSwitch:
            synthesizeVersionSwitchFromConfirmedDesign(confirmedDesign),
        },
      };
    }
    return { outputs: {} };
  }
}

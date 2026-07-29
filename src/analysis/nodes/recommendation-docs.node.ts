import { AnalysisState } from "@/analysis/analysis.state";
import { readSourceExamples } from "@/analysis/context/source-examples";
import { isInsertRejection } from "@/analysis/nodes/decision.node";
import {
  isPoisonEventLane,
  synthesizeFallbackRecommendation,
  synthesizeNoIngressCheckSql,
  synthesizePoisonContainmentSql,
} from "@/analysis/nodes/fallback-recommendation";
import { invokeNode } from "@/analysis/nodes/invoke";
import { RECOMMENDATION_DOCS_PROMPT } from "@/analysis/prompts";
import {
  INSIGHT_CARDS_CAVEAT,
  renderConfirmedDesign,
  renderEvidenceContext,
  renderRootCause,
  stripInsightCardExamples,
} from "@/analysis/render";
import { recommendationDocsOutputSchema } from "@/analysis/type/output.type";
import {
  looksLikeSql,
  validateSqlExecutable,
} from "@/analysis/validation/sql-validator";

// projection_cursor 직접 조작 SQL 은 lane 불문 금지다 — 배치 트랜잭션 롤백으로 미투영된
// 정상 이벤트를 영구 스킵시킨다(2026-07-29 품질 검토: B1 rep-1~4 실측, 상세는
// fallback-recommendation.ts 의 synthesizePoisonContainmentSql 주석).
const CURSOR_MANIPULATION_PATTERN = /update\s+projection_cursor/i;

export async function recommendationDocsNode(
  state: typeof AnalysisState.State,
) {
  // newReadModel 동반 선택 시 그래프가 설계를 먼저 확정한다 — 권고(§1)의 Decision Outcome 이
  // §2 에 실릴 실제 설계와 같은 테이블·컬럼을 가리키게 주입한다.
  const confirmedDesign = state.outputs.newReadModel;

  const insertRejectionLane: boolean =
    state.sensorFinding === null && isInsertRejection(state.window);

  // 의사결정 lane 을 명시 주입한다 — 특히 결정론 프리게이트(적재 거절 격리 단독)의
  // 사유가 없으면 생성기가 rootCause 의 '구조 부족' 프레이밍을 따라가 §1 을 보강/재생성
  // 문서로 쓰고 containmentSql 을 비운다(2026-07-21 gpt-4o-mini 실측).
  const decisionSection: string[] =
    state.decision !== null
      ? [
          [
            "## 의사결정 (확정된 lane)",
            `- 선택된 생성기: ${state.decision.selected.join(", ")}`,
            `- 사유: ${state.decision.reasoning}`,
            ...(insertRejectionLane
              ? [
                  "",
                  "이 문서는 **적재 거절 격리 lane** 이다. 결함 파일은 event_store 에 유입되지 않았고",
                  "Read Model 구조는 정상이다. 다음을 엄수하라:",
                  "  - 금지 옵션: 기본값/더미값 주입으로 적재를 통과시키기, 스키마 완화(optional 화),",
                  "    결함 추적용 신규 테이블. (zod 거절은 시스템이 의도한 방어 동작이다.)",
                  "  - 허용 옵션: (a) 거절 유지 + 원천 데이터 수정 요청(권장), (b) 무유입 검증 절차,",
                  "    (c) 거절 모니터링/알림 보강.",
                  "  - evidence 의 interpretation 은 'Read Model 필드 부재'가 아니라 '원천 파일의",
                  "    필수 필드 누락/타입 위반'으로 서술하라.",
                ]
              : []),
          ].join("\n"),
        ]
      : [];

  const facts = [
    renderRootCause(state.rootCause!),
    ...decisionSection,
    renderEvidenceContext(state.window, state.sensorFinding),
    `## 도메인 스키마(Insight 카드)\n${stripInsightCardExamples(state.insightCards)}\n${INSIGHT_CARDS_CAVEAT}`,
    ...(confirmedDesign !== undefined
      ? [
          [
            renderConfirmedDesign(confirmedDesign),
            "",
            "recommendedOption(Decision Outcome)은 위 확정 설계의 채택을 서술해야 하며,",
            "solutionOptions 의 채택안·suggestedFields 도 위 설계의 테이블명·컬럼명을 그대로 써라.",
          ].join("\n"),
        ]
      : []),
    await readSourceExamples(),
  ].join("\n\n");

  try {
    const recommendationDocs = await invokeNode(
      RECOMMENDATION_DOCS_PROMPT,
      facts,
      recommendationDocsOutputSchema,
      // containmentSql 과 SQL 형태의 옵션 스니펫을 실DB(BEGIN/ROLLBACK)로 검증 —
      // 실패 시 오류를 보여주며 재생성. 소진 시 아래 결정론 합성이 최종 보정한다.
      async (output) => {
        const problems: string[] = [];
        if (CURSOR_MANIPULATION_PATTERN.test(output.containmentSql)) {
          problems.push(
            "containmentSql 이 projection_cursor 를 직접 조작한다 — 배치 롤백으로 미투영된 정상 " +
              "이벤트가 영구 스킵되므로 금지. poison 이벤트 식별/검증 SELECT 로 대체하라.",
          );
        }
        if (
          output.containmentSql.trim().length > 0 &&
          looksLikeSql(output.containmentSql)
        ) {
          const sqlError = await validateSqlExecutable(output.containmentSql);
          if (sqlError !== null) {
            problems.push(
              `containmentSql 이 실제 DB 에서 실행 실패: ${sqlError}`,
            );
          }
        }
        for (const option of output.solutionOptions) {
          if (CURSOR_MANIPULATION_PATTERN.test(option.codeSnippet)) {
            problems.push(
              `solutionOptions "${option.title}" 의 코드가 projection_cursor 를 직접 조작한다 — ` +
                "미투영 정상 이벤트를 영구 스킵시키므로 금지. 프로젝터의 결함 이벤트 skip/dead-letter " +
                "처리로 대체하라.",
            );
          }
          if (!looksLikeSql(option.codeSnippet)) {
            continue;
          }
          const sqlError = await validateSqlExecutable(option.codeSnippet);
          if (sqlError !== null) {
            problems.push(
              `solutionOptions "${option.title}" 의 SQL 이 실행 실패: ${sqlError}`,
            );
          }
        }
        return problems;
      },
    );

    // 최종 위생(dataQualityNode 와 동일 원칙): 재질의(re-ask)까지 소진하고도 실행 불가한
    // SQL 은 문서에 싣지 않는다 — containmentSql 은 비워서 아래 결정론 합성이 대체하게
    // 하고, 옵션 스니펫은 코드만 미게재한다(2026-07-23 A4-fix1 실측: 검증기가 잡은 불량
    // SQL 이 재질의 타임아웃으로 그대로 문서에 실림 — 센서 lane 에서 확인된 경로).
    if (
      recommendationDocs.containmentSql.trim().length > 0 &&
      looksLikeSql(recommendationDocs.containmentSql)
    ) {
      const residualError = await validateSqlExecutable(
        recommendationDocs.containmentSql,
      );
      if (residualError !== null) {
        console.warn(
          "[recommendationDocsNode] containmentSql 이 재시도 후에도 실행 불가 — 비우고 결정론 합성에 위임:",
          residualError,
        );
        recommendationDocs.containmentSql = "";
      }
    }
    recommendationDocs.solutionOptions = await Promise.all(
      recommendationDocs.solutionOptions.map(async (option) => {
        // 재질의 소진 후에도 커서 조작 코드가 남았으면 미게재한다(위 validator 와 동일 근거).
        if (CURSOR_MANIPULATION_PATTERN.test(option.codeSnippet)) {
          console.warn(
            `[recommendationDocsNode] "${option.title}" 이 재시도 후에도 projection_cursor 를 조작 — 코드 미게재`,
          );
          return { ...option, codeSnippet: "" };
        }
        if (!looksLikeSql(option.codeSnippet)) {
          return option;
        }
        const residualError = await validateSqlExecutable(option.codeSnippet);
        if (residualError === null) {
          return option;
        }
        console.warn(
          `[recommendationDocsNode] "${option.title}" SQL 이 재시도 후에도 실행 불가 — 코드 미게재:`,
          residualError,
        );
        return { ...option, codeSnippet: "" };
      }),
    );

    // 격리 lane 의 §2 는 항상 윈도우 실측값 결정론 합성으로 확정한다(센서 lane 의
    // containmentSql 과 동일 원칙). 공백일 때만 합성하는 조건부 대체로는 부족했다 —
    // LLM SQL 이 실행은 되지만 거절 레코드 2건 중 1건만 특정하는 부분 커버리지가
    // A2·A3 전 rep 에서 반복됐다(2026-07-29 품질 검토). 대상 집합은 윈도우의
    // insert.file.failed / projection.map.failed 행 전수에서만 유도한다.
    {
      const synthesized = insertRejectionLane
        ? synthesizeNoIngressCheckSql(state.window)
        : isPoisonEventLane(state.window)
          ? synthesizePoisonContainmentSql(state.window)
          : null;
      if (synthesized !== null) {
        recommendationDocs.containmentSql = synthesized;
      }
    }

    return { outputs: { recommendationDocs } };
  } catch (error) {
    // 강등이 문서 전체를 센티넬로 만들 수 있으므로 반드시 흔적을 남긴다(dataQualityNode 와 동일).
    console.warn(
      "[recommendationDocsNode] 생성/검증 실패로 강등:",
      String(error),
    );

    // 완전 강등 대신 결정론 최소 권고로 폴백한다 — 근거(트립 앵커)가 실재하는데 전 섹션이
    // 센티넬로 보류되는 거짓 음성(2026-07-29 품질 검토: 51건 중 6건)을 근거 실린 부분
    // 문서로 대체한다. 폴백조차 불가하면(인용할 근거 행 없음) 기존 강등 경로 유지.
    const fallback = synthesizeFallbackRecommendation({
      window: state.window,
      sensorFinding: state.sensorFinding,
      rootCause: state.rootCause!,
      decision: state.decision,
      insertRejectionLane,
    });
    if (fallback !== null) {
      console.warn(
        "[recommendationDocsNode] 결정론 폴백 권고로 대체(전 섹션 센티넬 방지)",
      );
      return { outputs: { recommendationDocs: fallback } };
    }
    return { outputs: {} };
  }
}

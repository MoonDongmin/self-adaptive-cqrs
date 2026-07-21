import { AnalysisState } from '@/analysis/analysis.state';
import { readSourceExamples } from '@/analysis/context/source-examples';
import { isInsertRejection } from '@/analysis/nodes/decision.node';
import { invokeNode } from '@/analysis/nodes/invoke';
import { RECOMMENDATION_DOCS_PROMPT } from '@/analysis/prompts';
import {
  INSIGHT_CARDS_CAVEAT,
  renderConfirmedDesign,
  renderEvidenceContext,
  renderRootCause,
  stripInsightCardExamples,
} from '@/analysis/render';
import { recommendationDocsOutputSchema } from '@/analysis/type/output.type';
import { looksLikeSql, validateSqlExecutable } from '@/analysis/validation/sql-validator';
import type { AnomalyLogWindow } from '@/llm-context/llm-context.type';

// 적재 거절(zod 거절) lane 의 무유입 검증 SQL 을 윈도우의 실측값에서 결정론으로 합성한다.
// 프롬프트 지시만으로는 gpt-4o-mini 가 containmentSql 을 비우거나 기본값 주입을 권고하는
// 것을 막지 못했다(2026-07-21 실측) — 이 lane 의 격리 SQL 은 로그 파일명에서 완전히
// 유도 가능하므로 LLM 에 맡기지 않는다.
// 파일명 형식: <카테고리>_<카메라>_<객체명>_<장면번호>_<시도번호>_<날짜>.json
//   → scene_key = 마지막 두 세그먼트(시도·날짜) 앞까지, attempt_num = 뒤에서 두 번째.
function synthesizeNoIngressCheckSql(
  window: AnomalyLogWindow | null,
): string | null {
  if (window === null) {
    return null;
  }

  const targets: string[] = [];
  for (const row of window.rows) {
    if (row.action !== "insert.file.failed" || row.detail === null) {
      continue;
    }
    const fileMatch = row.detail.match(/file=(\S+)\.json/);
    if (fileMatch === null) {
      continue;
    }
    const segments = fileMatch[1].split("_");
    if (segments.length < 3) {
      continue;
    }
    const attemptNumber = Number(segments[segments.length - 2]);
    if (!Number.isInteger(attemptNumber)) {
      continue;
    }
    const sceneKey = segments.slice(0, segments.length - 2).join("_");
    targets.push(`('grip-attempt:${sceneKey}', ${attemptNumber})`);
  }

  if (targets.length === 0) {
    return null;
  }

  const unique = [...new Set(targets)];
  return [
    "-- 무유입 검증: zod 거절된 파일의 이벤트가 event_store 에 유입되지 않았음을 확인한다 (기대값 0)",
    `SELECT count(*) AS rejected_event_count FROM event_store WHERE (stream_id, attempt_num) IN (${unique.join(", ")});`,
  ].join("\n");
}

// 투영 실패(poison event) lane 의 커서 전진 SQL 을 윈도우 실측값에서 결정론으로 합성한다.
// projection.map.failed 행의 detail 에 event_id 가 실린다(프로젝터가 구조 필드로 로깅).
// 여러 poison 이 있으면 문장 하나 적용 → catch-up 재실행을 반복해야 사이의 정상
// 이벤트가 스킵되지 않는다 — 주석으로 절차를 명시한다.
function synthesizePoisonSkipSql(
  window: AnomalyLogWindow | null,
): string | null {
  if (window === null) {
    return null;
  }

  const projectorName =
    window.rows.find((row) => row.projectorName !== null)?.projectorName ??
    "grip-result-projector";

  const eventIds: string[] = [];
  for (const row of window.rows) {
    if (row.action !== "projection.map.failed" || row.detail === null) {
      continue;
    }
    const eventIdMatch = row.detail.match(/event_id=([0-9a-f-]{36})/);
    if (eventIdMatch !== null) {
      eventIds.push(eventIdMatch[1]);
    }
  }

  const unique = [...new Set(eventIds)];
  if (unique.length === 0) {
    return null;
  }

  const statements = unique.map((eventId) =>
    [
      `UPDATE projection_cursor SET last_event_seq = GREATEST(last_event_seq, (SELECT global_seq FROM event_store WHERE event_id = '${eventId}')), updated_at = now()`,
      `WHERE projector_name = '${projectorName}';`,
    ].join("\n"),
  );

  return [
    "-- poison 이벤트 건너뛰기: 결함 이벤트까지 커서를 전진시켜 투영을 재개한다.",
    "-- poison 이 여럿이면 문장 하나 실행 → catch-up 재실행을 반복한다(사이의 정상 이벤트 보존).",
    ...statements,
  ].join("\n");
}

function isPoisonEventLane(window: AnomalyLogWindow | null): boolean {
  if (window === null) {
    return false;
  }
  return window.rows.some((row) => row.action === "projection.map.failed");
}

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
        if (
          output.containmentSql.trim().length > 0 &&
          looksLikeSql(output.containmentSql)
        ) {
          const sqlError = await validateSqlExecutable(output.containmentSql);
          if (sqlError !== null) {
            problems.push(`containmentSql 이 실제 DB 에서 실행 실패: ${sqlError}`);
          }
        }
        for (const option of output.solutionOptions) {
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

    // 격리 lane 의 §2 결정론 보장: LLM 이 containmentSql 을 비웠으면 윈도우 실측값으로
    // 합성한 격리 SQL 을 채운다(연구 명세 — Docs 3요소 항상 포함).
    if (recommendationDocs.containmentSql.trim().length === 0) {
      const synthesized = insertRejectionLane
        ? synthesizeNoIngressCheckSql(state.window)
        : isPoisonEventLane(state.window)
          ? synthesizePoisonSkipSql(state.window)
          : null;
      if (synthesized !== null) {
        console.warn(
          "[recommendationDocsNode] containmentSql 공백 — 윈도우 실측값으로 결정론 합성",
        );
        recommendationDocs.containmentSql = synthesized;
      }
    }

    return { outputs: { recommendationDocs } };
  } catch (error) {
    // 강등이 문서 전체를 센티넬로 만들 수 있으므로 반드시 흔적을 남긴다(dataQualityNode 와 동일).
    console.warn("[recommendationDocsNode] 생성/검증 실패로 강등:", String(error));
    return { outputs: {} };
  }
}

import {
  AnalysisDecision,
  LogEvidence,
  RecommendationDocsOutput,
  RootCauseAnalysis,
  SensorAnomalyFinding,
} from "@/analysis/type/output.type";
import type { AnomalyLogWindow } from "@/llm-context/llm-context.type";

// 격리 lane 의 결정론 SQL 합성기 모음 + LLM 권고 생성이 완전 실패했을 때의 최소 권고 폴백.
// recommendation-docs 노드와 aggregate 무결성 게이트가 공유한다 — 근거(트립 앵커·근본원인)가
// 실재하는데도 §1~§3 전 섹션이 INSUFFICIENT_EVIDENCE 로 보류되는 거짓 음성(2026-07-29 품질
// 검토: 51건 중 6건, 12%)을 "최소 근거 문서"로 대체하기 위한 모듈이다.

// 적재 거절(zod 거절) lane 의 무유입 검증 SQL 을 윈도우의 실측값에서 결정론으로 합성한다.
// 프롬프트 지시만으로는 gpt-4o-mini 가 containmentSql 을 비우거나 기본값 주입을 권고하는
// 것을 막지 못했다(2026-07-21 실측) — 이 lane 의 격리 SQL 은 로그 파일명에서 완전히
// 유도 가능하므로 LLM 에 맡기지 않는다.
// 파일명 형식: <카테고리>_<카메라>_<객체명>_<장면번호>_<시도번호>_<날짜>.json
//   → scene_key = 마지막 두 세그먼트(시도·날짜) 앞까지, attempt_num = 뒤에서 두 번째.
export function synthesizeNoIngressCheckSql(
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

// 투영 실패(poison event) lane 의 격리 확인 SQL 을 윈도우 실측값에서 결정론으로 합성한다.
// projection.map.failed 행의 detail 에 event_id 가 실린다(프로젝터가 구조 필드로 로깅).
//
// 커서 점프(UPDATE projection_cursor)는 합성하지 않는다 — CatchUpRunner 는 배치를 단일
// 트랜잭션으로 묶으므로 poison 실패 시 그 이전 정상 이벤트의 투영도 함께 롤백된 상태다.
// 커서를 poison 위치로 전진시키면 그 정상 이벤트들이 영구 스킵된다(2026-07-29 품질 검토:
// B1 rep-1~4 — 서브쿼리 NULL 실행 실패에 더해 의미상으로도 데이터 유실 조치였다).
// 올바른 재개 순서는 §1 권고(프로젝터의 결함 이벤트 skip/dead-letter) 적용 후 catch-up
// 재실행이며, SQL 의 몫은 poison 식별과 재실행 후 검증이다.
export function synthesizePoisonContainmentSql(
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

  const idList = unique.map((eventId) => `'${eventId}'`).join(", ");
  return [
    "-- poison 이벤트 식별: 투영 실패를 유발한 결함 이벤트를 확인한다.",
    `SELECT event_id, stream_id, attempt_num, global_seq FROM event_store WHERE event_id IN (${idList});`,
    "-- 주의: projection_cursor 를 직접 전진시키지 마라 — 배치 트랜잭션 롤백으로 poison 이전의",
    "-- 정상 이벤트도 미투영 상태이므로, 커서 점프는 그 이벤트들을 영구 유실시킨다.",
    "-- 조치 순서: §1 권고(결함 이벤트 skip/dead-letter 처리)를 프로젝터에 적용 → catch-up 재실행.",
    "-- 재실행 후 검증: poison 을 제외한 미투영 이벤트가 0 이어야 한다.",
    "SELECT count(*) AS unprojected_normal_events",
    `FROM event_store WHERE global_seq > (SELECT last_event_seq FROM projection_cursor WHERE projector_name = '${projectorName}')`,
    `  AND event_id NOT IN (${idList});`,
  ].join("\n");
}

export function isPoisonEventLane(window: AnomalyLogWindow | null): boolean {
  if (window === null) {
    return false;
  }
  return window.rows.some((row) => row.action === "projection.map.failed");
}

interface FallbackRecommendationInput {
  window: AnomalyLogWindow | null;
  sensorFinding: SensorAnomalyFinding | null;
  rootCause: RootCauseAnalysis;
  decision: AnalysisDecision | null;
  insertRejectionLane: boolean;
}

// LLM 권고 생성이 재시도까지 소진하고 실패했을 때의 결정론 최소 권고.
// 발명 없음 — evidence 는 윈도우의 level>=40 행(또는 센서 관찰자 판정 사유)을 verbatim
// 인용하고, 해석은 이미 산출된 근본원인 분석에서만 가져온다. 완전한 권고가 아니라
// "근거는 실재한다 + 재실행하라"를 남기는 문서다: 전 섹션 센티넬(거짓 음성)보다
// 근거가 실린 부분 문서가 사용자에게 유용하다.
export function synthesizeFallbackRecommendation(
  input: FallbackRecommendationInput,
): RecommendationDocsOutput | null {
  const { window, sensorFinding, rootCause } = input;

  const evidence: LogEvidence[] = (window?.rows ?? [])
    .filter((row) => row.level >= 40)
    .map((row) => ({
      correlationId: row.correlationId ?? "-",
      action: row.action ?? "-",
      level: row.level,
      logQuote:
        [row.msg, row.detail].filter((value) => value !== null).join(" — ") ||
        "-",
      interpretation: rootCause.suspectedReadModelGap,
    }));

  if (evidence.length === 0 && sensorFinding !== null) {
    evidence.push({
      correlationId: "-",
      action: "sensor.observe.triggered",
      level: 40,
      logQuote: sensorFinding.reason,
      interpretation: rootCause.suspectedReadModelGap,
    });
  }

  // 인용할 근거 행이 아예 없으면 폴백도 성립하지 않는다 — 기존 센티넬 경로 유지.
  if (evidence.length === 0) {
    return null;
  }

  const containmentSql = input.insertRejectionLane
    ? synthesizeNoIngressCheckSql(window)
    : isPoisonEventLane(window)
      ? synthesizePoisonContainmentSql(window)
      : null;

  const solutionOption = input.insertRejectionLane
    ? {
        title: "거절 유지 + 원천 데이터 수정 요청",
        approach:
          "적재 단계 zod 거절은 시스템이 의도한 방어 동작이다 — 거절을 유지하고 원천 파일의 결함(필수 필드 누락/타입 위반)을 수정 요청한다.",
        suggestedFields: [],
        tradeoffs:
          "Read Model 변경 없음. 원천 수정 전까지 해당 레코드는 조회 불가(무유입 검증 SQL 로 격리 상태 확인).",
        codeSnippet: "",
      }
    : isPoisonEventLane(window)
      ? {
          title: "결함 이벤트 skip/dead-letter 처리",
          approach:
            "프로젝터 map() 의 결함 이벤트를 skip(격리 로그 동반) 또는 dead-letter 로 우회시켜 배치 트랜잭션이 정상 이벤트까지 롤백하지 않게 한다.",
          suggestedFields: [],
          tradeoffs:
            "코드 수정 후 catch-up 재실행 필요. projection_cursor 직접 조작은 미투영 정상 이벤트를 유실시키므로 금지.",
          codeSnippet: "",
        }
      : {
          title: "분석 재실행으로 상세 권고 재생성",
          approach:
            "LLM 권고 생성이 실패해 최소 근거만 수록했다 — 동일 근거로 분석 사이클을 재실행해 완전한 권고(옵션 비교·SQL·코드)를 재생성한다.",
          suggestedFields: [],
          tradeoffs: "재실행 비용 외 없음(근거 로그·이벤트는 보존됨).",
          codeSnippet: "",
        };

  const targetReadModel =
    rootCause.suspectedReadModelGap.match(/read_[a-z0-9_]+/)?.[0] ?? "unknown";

  return {
    targetReadModel,
    evidence,
    observations: [
      "자동 폴백 문서: LLM 권고 생성이 재시도까지 실패해 결정론 폴백이 최소 근거만 수록했다 — 분석 재실행으로 완전한 권고를 재생성하라.",
      rootCause.summary,
    ],
    decisionDrivers: [],
    solutionOptions: [solutionOption],
    recommendedOption: `${solutionOption.title} — LLM 생성 실패로 결정론 폴백이 lane 기본 조치를 선정`,
    consequencesPositive: [],
    consequencesNegative: [
      "본 권고는 결정론 폴백 산출물로, 옵션 비교·코드 스니펫이 없다(재실행 권장).",
    ],
    nonGoals: ["신규 스키마·코드 변경의 확정(재실행 산출물의 몫)"],
    containmentSql: containmentSql ?? "",
    apiVersionImpact:
      "API 버전 변경 없음 — 본 문서는 결정론 폴백 최소 권고로, 스키마·엔드포인트 변경을 확정하지 않는다.",
  };
}

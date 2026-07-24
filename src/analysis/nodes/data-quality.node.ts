import { AnalysisState } from "@/analysis/analysis.state";
import { readSourceExamples } from "@/analysis/context/source-examples";
import { invokeNode } from "@/analysis/nodes/invoke";
import { DATA_QUALITY_PROMPT } from "@/analysis/prompts";
import {
  INSIGHT_CARDS_CAVEAT,
  renderConfirmedDesign,
  renderRootCause,
  stripInsightCardExamples,
} from '@/analysis/render';
import { renderSensorFinding } from "@/analysis/render-sensor";
import { dataQualityRecommendationOutputSchema } from "@/analysis/type/output.type";
import { looksLikeSql, validateSqlExecutable } from '@/analysis/validation/sql-validator';

// §2 DDL 을 전제하는 §1 SQL 에 결정론으로 붙이는 실행 순서 주석. §1 이 문서에서 §2 보다
// 앞에 렌더되므로, 이 표기가 없으면 사용자가 위에서부터 복붙하다 실패한다.
const SQL_ORDER_PREREQUISITE_NOTE =
  "-- 선행 조건: §2 'Read Model 생성 SQL'(DDL)을 먼저 적용한 뒤 실행한다.";

// observedValue 그라운딩: 핵심은 '지어낸 숫자' 차단이므로 숫자 리터럴 단위로 검증한다.
// 전체 문자열 exact-substring 은 LLM 이 값은 정확히 인용하고 포맷만 재구성해도
// ("z1":0.066 → z1:0.066) 전량 탈락시킨다(2026-07-14 실측). 숫자가 없으면 기존
// 부분문자열 검사로 폴백. 경계 검사로 0.07 이 0.0711 내부에 매칭되는 것을 막는다.
function isObservedValueGrounded(observedValue: string, facts: string): boolean {
  const numberLiterals = observedValue.match(/-?\d+(?:\.\d+)?/g);
  if (numberLiterals === null || numberLiterals.length === 0) {
    return facts.includes(observedValue);
  }
  return numberLiterals.every((literal) => {
    const escaped = literal.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(?<![0-9.])${escaped}(?![0-9])`).test(facts);
  });
}

// 격리 SQL 의 대상 그라운딩: LLM 이 Insight 카드 Examples 예시값(scene 00018 등)이나
// 존재하지 않는 컬럼(grip_outlier_flag on v1)을 격리 SQL 에 넣는 것을 막지 못했다
// (2026-07-21 gpt-4o-mini A4·A5·A6 실측). 검증된(grounding 통과) sensorEvidence 의
// (sceneKey, attemptNumber) 만으로 격리 DELETE 를 결정론 합성한다 — 원본 이벤트는
// event_store 에 보존되므로 파괴적이지 않고, 재투영으로 복원 가능하다.
function synthesizeSensorContainmentSql(
  evidence: { sceneKey: string; attemptNumber: number }[],
): string {
  const targets = [
    ...new Set(
      evidence.map((item) => `('${item.sceneKey}', ${item.attemptNumber})`),
    ),
  ];
  return [
    "-- 오염 행 격리: 이상 (scene_key, attempt_num) 행을 Read Model 에서 제거한다.",
    "-- 원본 이벤트는 event_store 에 보존되므로 v2 재투영(무결성 플래그 포함)으로 복원 가능하다.",
    `DELETE FROM read_grip_result WHERE (scene_key, attempt_num) IN (${targets.join(", ")});`,
  ].join("\n");
}

export async function dataQualityNode(state: typeof AnalysisState.State) {
  // 센서 라인 전용 노드. 로그 경로(sensorFinding=null)에서 잘못 선택돼도 안전하게 건너뛴다.
  if (state.sensorFinding === null) {
    return { outputs: {} };
  }

  const finding = state.sensorFinding;

  // newReadModel 동반 선택 시 확정 설계를 주입해 hardening/nextSteps 가 §2 와 같은
  // 테이블·컬럼을 가리키게 한다(스키마 단일 소스).
  const confirmedDesign = state.outputs.newReadModel;

  const facts = [
    renderSensorFinding(finding),
    renderRootCause(state.rootCause!),
    `## 도메인 스키마 (Insight Read DB)\n${stripInsightCardExamples(state.insightCards)}\n${INSIGHT_CARDS_CAVEAT}`,
    finding.baselineText,
    ...(confirmedDesign !== undefined
      ? [renderConfirmedDesign(confirmedDesign)]
      : []),
    await readSourceExamples(),
  ].join("\n\n");

  try {
    const output = await invokeNode(
      DATA_QUALITY_PROMPT,
      facts,
      dataQualityRecommendationOutputSchema,
      // fix/harden 옵션의 SQL 을 실DB(BEGIN/ROLLBACK)로 검증 — camelCase 컬럼·따옴표
      // 누락·없는 테이블(baseline_rules) 류를 재생성으로 잡는다(2026-07-21 3축 채점 실측).
      // contain 옵션과 containmentSql 은 어차피 아래에서 결정론 합성으로 확정되므로 제외.
      // co-select 된 신규 모델의 DDL 을 선적용해, §2 CREATE 를 전제하는 fix SQL
      // (v2 재투영·INSERT)이 단독 검증 오탐으로 기각되지 않게 한다(2026-07-21 A6 실측).
      async (candidate) => {
        const problems: string[] = [];
        for (const option of candidate.solutionOptions) {
          if (option.phase === "contain") {
            continue;
          }
          if (!looksLikeSql(option.codeOrSql)) {
            // harden(베이스라인 규칙 추가)은 실행 가능한 SQL 로 강제한다. TS Drizzle 조각은
            // 단독 컴파일 검증이 불가한 파편이라 복붙 품질을 보장할 수 없고, 검증을 그냥
            // 건너뛰면 프롬프트 지시를 위반한 출력이 피드백 0 으로 문서에 실린다
            // (2026-07-23 A4 실측: sql 펜스에 Drizzle 조각 → 검증기 syntax error).
            // fix 는 프로젝터 TypeScript 패치가 정당한 형태이므로 허용한다.
            if (option.phase === "harden") {
              problems.push(
                `[harden] "${option.title}" 의 codeOrSql 이 SQL 이 아니다 — 그대로 실행 가능한 ` +
                  "SQL(예: ALTER TABLE ... ADD CONSTRAINT ... CHECK ...)만 허용된다. " +
                  "Drizzle/TypeScript 조각을 넣지 말고 SQL 로 다시 출력하라.",
              );
            }
            continue;
          }
          const sqlError = await validateSqlExecutable(
            option.codeOrSql,
            confirmedDesign?.migrationSql,
          );
          if (sqlError !== null) {
            problems.push(
              `[${option.phase}] "${option.title}" 의 SQL 이 실제 DB 에서 실행 실패: ${sqlError}`,
            );
          }
        }
        return problems;
      },
    );

    // 최종 위생: 재질의(re-ask)까지 소진하고도 실행 불가한 fix/harden SQL 은 문서에
    // 싣지 않는다 — 접근/트레이드오프 서술은 남기되 '깨진 SQL 을 아는 채로 복붙시키는'
    // 것만 차단한다(2026-07-23 A4-fix1 실측: json_extract harden SQL 을 검증기가
    // 잡았으나 재질의가 타임아웃돼 마지막 불량 출력이 그대로 문서에 실림).
    output.solutionOptions = await Promise.all(
      output.solutionOptions.map(async (option) => {
        if (option.phase === "contain" || !looksLikeSql(option.codeOrSql)) {
          return option;
        }
        const residualSqlError = await validateSqlExecutable(
          option.codeOrSql,
          confirmedDesign?.migrationSql,
        );
        if (residualSqlError === null) {
          // §2 DDL 선적용 시에만 성립하는 SQL(예: v2 테이블 대상 harden)은 실행 순서를
          // 주석으로 명시한다 — §1 이 §2 보다 앞에 렌더되므로 문서를 위에서부터 따라 하면
          // relation does not exist 로 실패한다(2026-07-23 fix1 sql-verification 실측:
          // orderDependentBlocks). 단독 실행이 이미 성공하면 주석이 불필요하다.
          if (
            confirmedDesign !== undefined &&
            !option.codeOrSql.includes(SQL_ORDER_PREREQUISITE_NOTE)
          ) {
            const standaloneSqlError = await validateSqlExecutable(
              option.codeOrSql,
            );
            if (standaloneSqlError !== null) {
              return {
                ...option,
                codeOrSql: [SQL_ORDER_PREREQUISITE_NOTE, option.codeOrSql].join(
                  "\n",
                ),
              };
            }
          }
          return option;
        }
        console.warn(
          `[dataQualityNode] [${option.phase}] "${option.title}" SQL 이 재시도 후에도 실행 불가 — 코드 미게재:`,
          residualSqlError,
        );
        return { ...option, codeOrSql: "" };
      }),
    );

    // 사후검증: observedValue 가 배치/근거 텍스트에 실제로 존재하는 근거만 남긴다(환각 값 strip).
    // 구조적으로 valid 한 JSON 도 의미 위반(지어낸 숫자)을 가질 수 있어 constrained decoding 으로는 못 잡는다.
    // sceneKey 도 센서 배치 원문에 실재해야 한다 — Insight 카드 Examples 예시값(00018)이
    // sceneKey 로 유입되면 observedValue 만으로는 못 잡는다(2026-07-21 A5 실측: 값은 실측인데
    // sceneKey 만 예시값인 근거가 grounding 을 통과해 격리 SQL 까지 오염). NFC 통일 후 대조
    // (파일명 유래 배치는 NFD, LLM 출력은 NFC 로 갈릴 수 있다).
    const batchTextNormalized = finding.batchText.normalize("NFC");

    // 배치의 실제 sceneKey 목록 — 장면번호(말미 숫자)로 조회 가능하게 색인한다.
    // LLM 출력은 한글 자모 조합이 깨질 수 있어(2026-07-21 A4 실측: "동ᅮᆯ" 류 분해 자모 —
    // NFC 정규화로도 복원 불가) 문자열 포함 검사만으로는 옳은 근거까지 버려진다.
    // 장면번호는 데이터셋 전역에서 유일하므로 번호가 일치하면 배치의 원형 키로 수리한다.
    const realSceneKeys = [
      ...new Set(
        [...finding.batchText.matchAll(/"sceneKey":"([^"]+)"/g)].map(
          (match) => match[1],
        ),
      ),
    ];
    const realSceneKeyByNumber = new Map<string, string>();
    for (const key of realSceneKeys) {
      const numberMatch = key.match(/(\d+)$/);
      if (numberMatch !== null) {
        realSceneKeyByNumber.set(numberMatch[1], key);
      }
    }

    const grounded = {
      ...output,
      sensorEvidence: output.sensorEvidence.flatMap((item) => {
        if (!isObservedValueGrounded(item.observedValue, facts)) {
          return [];
        }
        if (batchTextNormalized.includes(item.sceneKey.normalize("NFC"))) {
          return [item];
        }
        const sceneNumber = item.sceneKey.match(/(\d+)\s*$/)?.[1];
        const repaired =
          sceneNumber !== undefined
            ? realSceneKeyByNumber.get(sceneNumber)
            : undefined;
        if (repaired !== undefined) {
          console.warn(
            "[dataQualityNode] sceneKey 인코딩 붕괴 — 장면번호로 배치 원형 복원:",
            item.sceneKey,
            "→",
            repaired,
          );
          return [{ ...item, sceneKey: repaired }];
        }
        console.warn(
          "[dataQualityNode] sceneKey 가 배치에 없음(예시값 오염 의심) — 근거 제외:",
          item.sceneKey,
        );
        return [];
      }),
    };

    // 근거가 모두 환각이라 strip 되면 산출하지 않는다(co-select 된 다른 출력은 영향 없음).
    if (grounded.sensorEvidence.length === 0) {
      console.warn(
        "[dataQualityNode] sensorEvidence 전량 grounding 실패로 강등 — observedValue 들:",
        output.sensorEvidence.map((item) => item.observedValue),
      );
      return { outputs: {} };
    }

    // 격리 SQL 은 항상 검증된 근거에서 결정론 합성으로 확정한다. 조건부 교체(근거 sceneKey
    // 포함 여부)로는 부족했다 — 실제 scene 을 겨냥하면서도 따옴표 누락·오타(반려동룸)·
    // camelCase 컬럼으로 실행 불능인 LLM SQL 이 통과했다(2026-07-21 A5 실측). 대상 집합
    // (sceneKey, attemptNumber)은 grounding 을 통과한 sensorEvidence 가 유일한 신뢰 원천이다.
    grounded.containmentSql = synthesizeSensorContainmentSql(
      grounded.sensorEvidence,
    );

    // §1 의 [contain] 옵션 코드도 동일하게 확정 격리 SQL 로 통일한다(사본 발산 방지).
    grounded.solutionOptions = grounded.solutionOptions.map((option) =>
      option.phase === "contain"
        ? { ...option, codeOrSql: grounded.containmentSql }
        : option,
    );

    return { outputs: { dataQualityRecommendation: grounded } };
  } catch (error) {
    // 큰 JSON 파싱 실패가 전체 사이클/머지를 죽이지 않게 degrade(기존 생성기 노드와 동일).
    // 단 무결성 게이트가 문서 전체를 보류하는 원인이 되므로 반드시 흔적을 남긴다.
    console.warn("[dataQualityNode] 생성/검증 실패로 강등:", String(error));
    return { outputs: {} };
  }
}

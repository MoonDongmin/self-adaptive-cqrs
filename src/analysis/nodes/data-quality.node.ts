import { AnalysisState } from "@/analysis/analysis.state";
import { readSourceExamples } from "@/analysis/context/source-examples";
import { invokeNode } from "@/analysis/nodes/invoke";
import { DATA_QUALITY_PROMPT } from "@/analysis/prompts";
import { renderRootCause } from "@/analysis/render";
import { renderSensorFinding } from "@/analysis/render-sensor";
import { dataQualityRecommendationOutputSchema } from "@/analysis/type/output.type";

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

export async function dataQualityNode(state: typeof AnalysisState.State) {
  // 센서 라인 전용 노드. 로그 경로(sensorFinding=null)에서 잘못 선택돼도 안전하게 건너뛴다.
  if (state.sensorFinding === null) {
    return { outputs: {} };
  }

  const finding = state.sensorFinding;

  const facts = [
    renderSensorFinding(finding),
    renderRootCause(state.rootCause!),
    `## 도메인 스키마 (Insight Read DB)\n${state.insightCards}`,
    finding.baselineText,
    await readSourceExamples(),
  ].join("\n\n");

  try {
    const output = await invokeNode(
      DATA_QUALITY_PROMPT,
      facts,
      dataQualityRecommendationOutputSchema,
    );

    // 사후검증: observedValue 가 배치/근거 텍스트에 실제로 존재하는 근거만 남긴다(환각 값 strip).
    // 구조적으로 valid 한 JSON 도 의미 위반(지어낸 숫자)을 가질 수 있어 constrained decoding 으로는 못 잡는다.
    const grounded = {
      ...output,
      sensorEvidence: output.sensorEvidence.filter((item) =>
        isObservedValueGrounded(item.observedValue, facts),
      ),
    };

    // 근거가 모두 환각이라 strip 되면 산출하지 않는다(co-select 된 다른 출력은 영향 없음).
    if (grounded.sensorEvidence.length === 0) {
      console.warn(
        "[dataQualityNode] sensorEvidence 전량 grounding 실패로 강등 — observedValue 들:",
        output.sensorEvidence.map((item) => item.observedValue),
      );
      return { outputs: {} };
    }

    return { outputs: { dataQualityRecommendation: grounded } };
  } catch (error) {
    // 큰 JSON 파싱 실패가 전체 사이클/머지를 죽이지 않게 degrade(기존 생성기 노드와 동일).
    // 단 무결성 게이트가 문서 전체를 보류하는 원인이 되므로 반드시 흔적을 남긴다.
    console.warn("[dataQualityNode] 생성/검증 실패로 강등:", String(error));
    return { outputs: {} };
  }
}

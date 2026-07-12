import { AnalysisState } from "@/analysis/analysis.state";
import { readSourceExamples } from "@/analysis/context/source-examples";
import { invokeNode } from "@/analysis/nodes/invoke";
import { DATA_QUALITY_PROMPT } from "@/analysis/prompts";
import { renderRootCause } from "@/analysis/render";
import { renderSensorFinding } from "@/analysis/render-sensor";
import { dataQualityRecommendationOutputSchema } from "@/analysis/type/output.type";

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
        facts.includes(item.observedValue),
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

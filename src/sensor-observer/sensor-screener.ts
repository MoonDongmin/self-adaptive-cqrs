import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';
import { PREJUDGE_CONFIG } from '@/llm-context/screener/prejudge.config';
import { SensorValueMessage } from '@/projection/kafka/sensor-value.message';
import {
  annotateSensorBatch,
  SensorBatchAnnotations,
} from '@/sensor-observer/sensor-batch-annotator';
import { SENSOR_OBSERVER_PROMPT } from '@/sensor-observer/sensor-observer.prompt';
import { contentToString, extractJson } from '@/shared/llm/llm-json';

// 센서 값 관찰자 출력 = 이상 여부 + 사유 + 의심 scene. prejudge 와 동형의 싼 스키마.
export const sensorObserverVerdictSchema = z.object({
  triggered: z.boolean(),
  reason: z.string(),
  offendingSceneKeys: z.array(z.string()).default([]),
});
export type SensorObserverVerdict = z.infer<typeof sensorObserverVerdictSchema>;

// 관찰자는 레코드×차원 근거 서술이 필요해 스크리너 상한(1024)으로는 JSON 도달 전에
// 잘린다(finish_reason=length → extractJson 크래시 — 2026-07-05 재현). 프롬프트의
// '이상 차원만 서술' 규칙과 쌍으로, 출력 상한도 별도로 여유를 둔다.
// 또한 thinking 모델(Qwen3.6 등)은 reasoning 토큰이 max_tokens 에 포함되므로
// 2048로도 추론만 하다 잘린다(2026-07-07 prejudge 에서 동일 증상 재현) — 추론
// 여유분을 포함해 상한을 잡는다.
const OBSERVER_MAX_OUTPUT_TOKENS: number = Number(
  process.env.SENSOR_OBSERVER_MAX_OUTPUT_TOKENS ?? 8192,
);

// LLM 응답 상한. 로컬 LM Studio 가 행에 빠지면(응답 지연·미응답) 타임아웃이 없을 경우
// 관찰 루프 전체가 영원히 await 에 갇힌다(2026-07-10 실측 — 관찰 416/485 에서 침묵).
// 타임아웃으로 행을 '에러'로 바꿔야 재시도 상한 → 결정론적 폴백 경로가 작동한다.
const OBSERVER_LLM_TIMEOUT_MS: number = Number(
  process.env.SENSOR_OBSERVER_LLM_TIMEOUT_MS ?? 60_000,
);

// 싼 모델(PREJUDGE_CONFIG)로 배치 값 + 베이스라인을 직접 판정한다(2-pass 의 1차 게이트).
//
// 판정 권한 분할:
//  - 주석이 하나도 없는 배치 → LLM 호출 없이 정상 확정. 근거: (1) 4층 결정적 검사가
//    베이스라인 규칙을 이미 커버하고, (2) 싼 모델은 주석 없는 원시 수치에서 범위 위반을
//    지어낸다(2026-07-07 재현 — 정상 17개 윈도우 전부에 consistency/physical 환각).
//    ⚠ stat 은 단독 판정 근거가 아니므로 게이트에서 제외한다.
//  - ⚠ physical/consistency 확정 위반 scene → LLM 출력과 무관하게 verdict 에 강제 병합.
//    확정된 사실의 보존을 확률(LLM 출력)에 맡기지 않는다 — LLM 이 부정하거나 scene 을
//    빼먹어도 탐지가 소실되지 않는다.
//  - ⚠ jump → 재시도 등 정상 맥락일 수 있어 LLM 이 판정한다(LLM 의 실제 판정 영역).
// annotations 를 넘기면 재계산하지 않는다(호출 측이 jump 이월 상태로 주석을 만든 경우).
export async function observeSensorBatch(
  batch: SensorValueMessage[],
  baselineText: string,
  annotations: SensorBatchAnnotations = annotateSensorBatch(batch),
): Promise<SensorObserverVerdict> {
  const annotatedBatchText: string = annotations.text;

  if (
    annotations.deterministicSceneKeys.length === 0 &&
    annotations.jumpSceneKeys.length === 0
  ) {
    return {
      triggered: false,
      reason:
        "결정적 4층 검사에서 판정 근거(physical/consistency/jump) 주석 없음 — LLM 판정 생략",
      offendingSceneKeys: [],
    };
  }

  const model = new ChatOpenAI({
    model: PREJUDGE_CONFIG.model,
    apiKey: PREJUDGE_CONFIG.apiKey,
    temperature: PREJUDGE_CONFIG.temperature,
    maxTokens: OBSERVER_MAX_OUTPUT_TOKENS,
    timeout: OBSERVER_LLM_TIMEOUT_MS,
    // SDK 내부 재시도는 끈다 — 배치 단위 재시도(관찰 루프의 streak)와 겹치면
    // 실패 확정까지 걸리는 시간이 곱으로 늘어난다.
    maxRetries: 0,
    configuration: { baseURL: PREJUDGE_CONFIG.baseUrl },
  });

  const system: string = [SENSOR_OBSERVER_PROMPT, baselineText].join("\n\n");

  const userPrompt: string = [
    "(A) 투영된 센서 값 배치 (globalSequence 순, JSON 한 줄당 한 레코드, 걸린 레코드 아래 ⚠ 층위 주석):",
    annotatedBatchText,
  ].join("\n");

  const response = await model.invoke([
    new SystemMessage(system),
    new HumanMessage(userPrompt),
  ]);

  const rawText: string = contentToString(response.content);

  // thinking 모델은 reasoning 토큰이 max_tokens 에 포함된다. 상한에 걸려 잘리면
  // content 가 비거나 JSON 이전에 끊기므로, 파싱 전에 원인을 명시해 실패시킨다.
  const finishReason: unknown =
    response.response_metadata?.["finish_reason"] ?? null;
  if (finishReason === "length") {
    throw new Error(
      `센서 관찰자 출력이 max_tokens(${OBSERVER_MAX_OUTPUT_TOKENS})에서 잘림 — ` +
        `content 길이 ${rawText.length}. SENSOR_OBSERVER_MAX_OUTPUT_TOKENS 상향 필요.`,
    );
  }

  const llmVerdict: SensorObserverVerdict = sensorObserverVerdictSchema.parse(
    extractJson(rawText),
  );

  return mergeDeterministicFindings(llmVerdict, annotations);
}

// 확정 위반(physical/consistency) scene 을 LLM verdict 에 합집합으로 강제 병합한다.
// LLM 은 사유 서술과 jump 판정에만 기여하고, 확정 사실을 기각할 권한은 없다.
function mergeDeterministicFindings(
  llmVerdict: SensorObserverVerdict,
  annotations: SensorBatchAnnotations,
): SensorObserverVerdict {
  if (annotations.deterministicSceneKeys.length === 0) {
    return llmVerdict;
  }

  const offendingSceneKeys: string[] = [
    ...new Set([
      ...llmVerdict.offendingSceneKeys,
      ...annotations.deterministicSceneKeys,
    ]),
  ];

  const reason: string = llmVerdict.triggered
    ? llmVerdict.reason
    : `[결정론적 확정 — LLM 판정(정상) 기각] physical/consistency 위반 scene: ${annotations.deterministicSceneKeys.join(", ")} / LLM 사유: ${llmVerdict.reason}`;

  return { triggered: true, reason, offendingSceneKeys };
}

import * as fs from 'node:fs';
import { join } from 'node:path';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';
import { PREJUDGE_CONFIG } from '@/llm-context/screener/prejudge.config';
import { SensorValueMessage } from '@/projection/kafka/sensor-value.message';
import {
  annotateSensorBatch,
  SensorBatchAnnotations,
} from '@/sensor-observer/sensor-batch-annotator';
import {
  SENSOR_OBSERVER_LLM_ONLY_POINTING_PROMPT,
  SENSOR_OBSERVER_LLM_ONLY_PROMPT,
  SENSOR_OBSERVER_PROMPT,
} from '@/sensor-observer/sensor-observer.prompt';
import { contentToString, extractJson } from '@/shared/llm/llm-json';
import { runExclusive } from '@/shared/llm/llm-serial-queue';

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

  const system: string = [SENSOR_OBSERVER_PROMPT, baselineText].join("\n\n");

  const userPrompt: string = [
    "(A) 투영된 센서 값 배치 (globalSequence 순, JSON 한 줄당 한 레코드, 걸린 레코드 아래 ⚠ 층위 주석):",
    annotatedBatchText,
  ].join("\n");

  const llmVerdict: SensorObserverVerdict = await invokeForVerdict(
    system,
    userPrompt,
  );

  return mergeDeterministicFindings(
    {
      ...llmVerdict,
      offendingSceneKeys: resolveOffendingSceneKeysToBatch(
        llmVerdict.offendingSceneKeys,
        batch,
      ),
    },
    annotations,
  );
}

// LLM 이 재생성한 sceneKey 는 NFC 로 나오는 반면(토크나이저 특성 — 2026-07-13 층1
// 채점기에서 실측) 배치 레코드의 sceneKey 는 macOS 파일명 유래의 NFD 다. 원문 문자열
// 비교는 항상 불일치해 하류(에피소드 offendingSceneKeys dedupe, 분석 입력의 지목 scene
// 우선 보존 capAnalysisBatch)가 조용히 무력화된다. 지목 키를 배치에 실재하는 레코드 키
// 원형으로 복원하고, 배치에 없는 키는 버린다 — 룰북 출력 계약("레코드에서 글자 그대로
// 복사, 발명 금지")의 런타임 강제이기도 하다.
function resolveOffendingSceneKeysToBatch(
  offendingSceneKeys: string[],
  batch: SensorValueMessage[],
): string[] {
  const recordKeyByCanonical = new Map<string, string>();
  for (const message of batch) {
    recordKeyByCanonical.set(
      message.sceneKey.normalize("NFC"),
      message.sceneKey,
    );
  }

  const resolved: string[] = [];
  for (const sceneKey of offendingSceneKeys) {
    const recordKey: string | undefined = recordKeyByCanonical.get(
      sceneKey.normalize("NFC"),
    );
    if (recordKey !== undefined && !resolved.includes(recordKey)) {
      resolved.push(recordKey);
    }
  }
  return resolved;
}

// llm-only 관찰자에 주입하는 도메인 이상값 판정 룰북. 베이스라인(sensor-baseline.ts)과
// 같은 런타임 디스크 로드 패턴 — 규칙 반복 실험 시 코드 재빌드 없이 문서만 고친다.
async function readSensorObserverRulebook(): Promise<string> {
  const source: string = await fs.promises.readFile(
    join(process.cwd(), "src/sensor-observer/sensor-observer-rulebook.md"),
    "utf-8",
  );

  return ["(R) 판정 룰북 — 판정 권한의 전부다:", source].join("\n\n");
}

// llm-only 모드: 주석·게이트·강제 병합 없이 LLM 이 단독 판정한다(순수 LLM 탐지율
// 측정용 ablation). 급변 비교가 윈도우(8건) 경계에 갇혀 구조적 미탐이 되지 않도록,
// 배치에 등장하는 scene 의 직전 윈도우 마지막 레코드를 (C) 블록으로 함께 준다 —
// 원시 데이터 제공일 뿐 판정 개입이 아니다.
export async function observeSensorBatchLLMOnly(
  batch: SensorValueMessage[],
  baselineText: string,
  carriedRecordsByScene: ReadonlyMap<string, SensorValueMessage>,
): Promise<SensorObserverVerdict> {
  const rulebookText: string = await readSensorObserverRulebook();
  const system: string = [
    SENSOR_OBSERVER_LLM_ONLY_PROMPT,
    rulebookText,
    baselineText,
  ].join("\n\n");

  const sceneKeysInBatch = new Set(batch.map((message) => message.sceneKey));
  const carriedLines: string[] = [...carriedRecordsByScene.entries()]
    .filter(([sceneKey]) => sceneKeysInBatch.has(sceneKey))
    .map(([, message]) => JSON.stringify(message));

  const sections: string[] = [];
  if (carriedLines.length > 0) {
    sections.push(
      "(C) 직전 윈도우 이월 레코드 — 같은 scene 급변 비교 전용, 판정 대상 아님:",
      carriedLines.join("\n"),
      "",
    );
  }
  sections.push(
    "(A) 투영된 센서 값 배치 (globalSequence 순, JSON 한 줄당 한 레코드):",
    batch.map((message) => JSON.stringify(message)).join("\n"),
  );
  const userPrompt: string = sections.join("\n");

  const firstPass: SensorObserverVerdict = await invokeForVerdict(
    system,
    userPrompt,
  );
  const verdict: SensorObserverVerdict = {
    ...firstPass,
    offendingSceneKeys: resolveOffendingSceneKeysToBatch(
      firstPass.offendingSceneKeys,
      batch,
    ),
  };

  if (!verdict.triggered || !LLM_ONLY_TWO_PASS_POINTING) {
    return verdict;
  }
  return pointOffendingRecords(verdict, rulebookText, baselineText, userPrompt, batch);
}

// llm-only 2차 지목 스위치. 기본 켬 — 층1 룰북 v2 조건(단일 패스)의 재현이 필요한
// 실행에서만 0 으로 끈다.
const LLM_ONLY_TWO_PASS_POINTING: boolean =
  process.env.SENSOR_OBSERVER_LLM_ONLY_TWO_PASS !== "0";

// 2차 지목: 1차가 이상으로 확정한 윈도우에 한해 위반 레코드 전수 나열을 재질의한다.
// 1차의 triggered 판정은 불변이고(2차에 기각 권한 없음) 지목 목록만 합집합으로 보강한다.
// 2차 호출 실패는 윈도우 실패로 번지면 안 되므로(1차 판정은 이미 성립) 1차 verdict 로
// 조용히 강등한다.
async function pointOffendingRecords(
  firstPassVerdict: SensorObserverVerdict,
  rulebookText: string,
  baselineText: string,
  userPrompt: string,
  batch: SensorValueMessage[],
): Promise<SensorObserverVerdict> {
  try {
    const pointingSystem: string = [
      SENSOR_OBSERVER_LLM_ONLY_POINTING_PROMPT,
      rulebookText,
      baselineText,
    ].join("\n\n");
    const pointing: SensorObserverVerdict = await invokeForVerdict(
      pointingSystem,
      userPrompt,
    );
    const pointedSceneKeys: string[] = resolveOffendingSceneKeysToBatch(
      pointing.offendingSceneKeys,
      batch,
    );

    return {
      triggered: true,
      reason:
        pointedSceneKeys.length > 0 && pointing.reason.trim().length > 0
          ? `${firstPassVerdict.reason} / [2차 지목] ${pointing.reason}`
          : firstPassVerdict.reason,
      offendingSceneKeys: [
        ...new Set([...firstPassVerdict.offendingSceneKeys, ...pointedSceneKeys]),
      ],
    };
  } catch {
    return firstPassVerdict;
  }
}

function buildObserverModel(maxTokens: number): ChatOpenAI {
  return new ChatOpenAI({
    model: PREJUDGE_CONFIG.model,
    apiKey: PREJUDGE_CONFIG.apiKey,
    temperature: PREJUDGE_CONFIG.temperature,
    maxTokens,
    timeout: OBSERVER_LLM_TIMEOUT_MS,
    // SDK 내부 재시도는 끈다 — 배치 단위 재시도(관찰 루프의 streak)와 겹치면
    // 실패 확정까지 걸리는 시간이 곱으로 늘어난다.
    maxRetries: 0,
    // qwen3.5 계열은 하이브리드 thinking 모델이라 복잡한 관찰 프롬프트에서 스스로 추론을
    // 시작해 max_tokens 전체를 reasoning 으로 소진한다(2026-07-13 실측: content 0자 +
    // finish=length → 2배 재시도 → 타임아웃 연쇄). LM Studio 가 reasoning_effort 를
    // thinking 스위치로 매핑하므로 none 으로 추론을 끈다(/no_think 는 qwen3.5 에서 무효).
    modelKwargs: { reasoning_effort: "none" },
    configuration: { baseURL: PREJUDGE_CONFIG.baseUrl },
  });
}

// JSON 추출 실패 시의 복구 프롬프트 — 새 판정 생성이 아니라 기존 출력의 형식 교정만 시킨다.
const VERDICT_REPAIR_PROMPT: string = [
  "아래 텍스트는 센서 값 관찰자의 판정 출력인데 JSON 추출에 실패했다.",
  "텍스트에 담긴 결론을 그대로 옮겨 ```json 코드블록 정확히 하나만 출력해라. 새 판정을 만들지 마라.",
  '형식: { "triggered": boolean, "reason": string, "offendingSceneKeys": string[] }',
].join("\n");

// LLM 호출 → verdict 파싱. 흔한 실패 두 가지를 호출 안에서 1회씩 소화해, 배치 단위
// 재시도(관찰 루프 streak → 폴백/폐기)까지 번지기 전에 회복한다:
//  (1) finish_reason=length — thinking 모델의 reasoning 토큰이 상한을 잠식한 경우.
//      max_tokens 2배로 1회 재시도한다.
//  (2) JSON 추출·스키마 파싱 실패 — 원문을 되돌려 'JSON 만 재출력' 복구 호출 1회.
async function invokeForVerdict(
  system: string,
  userPrompt: string,
): Promise<SensorObserverVerdict> {
  const messages = [new SystemMessage(system), new HumanMessage(userPrompt)];

  let maxTokens: number = OBSERVER_MAX_OUTPUT_TOKENS;
  // 서버 전체 직렬화: 분석(35B)과 동시 요청이 겹치면 LM Studio 가 한쪽을 응답 없이
  // 유실한다(2026-07-14 실측) — 모든 LLM 호출을 한 큐로 직렬화한다.
  let response = await runExclusive(() =>
    buildObserverModel(maxTokens).invoke(messages),
  );
  // thinking 모델은 reasoning 토큰이 max_tokens 에 포함된다. 상한에 걸려 잘리면
  // content 가 비거나 JSON 이전에 끊긴다.
  if (finishReasonOf(response) === "length") {
    maxTokens *= 2;
    response = await runExclusive(() =>
      buildObserverModel(maxTokens).invoke(messages),
    );
    if (finishReasonOf(response) === "length") {
      throw new Error(
        `센서 관찰자 출력이 재시도 상한(max_tokens ${maxTokens})에서도 잘림 — ` +
          `SENSOR_OBSERVER_MAX_OUTPUT_TOKENS 상향 필요.`,
      );
    }
  }

  const rawText: string = contentToString(response.content);
  try {
    return sensorObserverVerdictSchema.parse(extractJson(rawText));
  } catch {
    const repaired = await runExclusive(() =>
      buildObserverModel(maxTokens).invoke([
        new SystemMessage(VERDICT_REPAIR_PROMPT),
        new HumanMessage(rawText),
      ]),
    );
    return sensorObserverVerdictSchema.parse(
      extractJson(contentToString(repaired.content)),
    );
  }
}

function finishReasonOf(response: { response_metadata?: Record<string, unknown> }): unknown {
  return response.response_metadata?.["finish_reason"] ?? null;
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

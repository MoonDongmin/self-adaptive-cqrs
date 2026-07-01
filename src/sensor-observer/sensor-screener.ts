import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';
import { renderSensorBatch } from '@/analysis/render-sensor';
import { PREJUDGE_CONFIG } from '@/llm-context/screener/prejudge.config';
import { SensorValueMessage } from '@/projection/kafka/sensor-value.message';
import { SENSOR_OBSERVER_PROMPT } from '@/sensor-observer/sensor-observer.prompt';
import { contentToString, extractJson } from '@/shared/llm/llm-json';

// 센서 값 관찰자 출력 = 이상 여부 + 사유 + 의심 scene. prejudge 와 동형의 싼 스키마.
export const sensorObserverVerdictSchema = z.object({
  triggered: z.boolean(),
  reason: z.string(),
  offendingSceneKeys: z.array(z.string()).default([]),
});
export type SensorObserverVerdict = z.infer<typeof sensorObserverVerdictSchema>;

// 싼 모델(PREJUDGE_CONFIG)로 배치 값 + 베이스라인을 직접 판정한다(2-pass 의 1차 게이트).
export async function observeSensorBatch(
  batch: SensorValueMessage[],
  baselineText: string,
): Promise<SensorObserverVerdict> {
  const model = new ChatOpenAI({
    model: PREJUDGE_CONFIG.model,
    apiKey: PREJUDGE_CONFIG.apiKey,
    temperature: PREJUDGE_CONFIG.temperature,
    configuration: { baseURL: PREJUDGE_CONFIG.baseUrl },
  });

  const system: string = [SENSOR_OBSERVER_PROMPT, baselineText].join("\n\n");

  const userPrompt: string = [
    "(A) 투영된 센서 값 배치 (globalSequence 순, JSON 한 줄당 한 레코드):",
    renderSensorBatch(batch),
  ].join("\n");

  const response = await model.invoke([
    new SystemMessage(system),
    new HumanMessage(userPrompt),
  ]);

  return sensorObserverVerdictSchema.parse(
    extractJson(contentToString(response.content)),
  );
}

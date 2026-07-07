import { toyDataSchema } from '@/insert/dto/toy-data.dto';

export interface PayloadDrift {
  key: string;
  sampleValue: string; // 대표값(잘라서) — LLM이 새 필드의 모양을 추론할 근거
}

// 스키마(스트리퍼)가 아는 top-level 키. 카드가 아니라 zod shape 을 진실로 쓰는 이유:
// strip 을 일으키는 주체와 비교 기준을 일치시켜야 "벗겨질 키 = 감지될 키"가 보장된다.
const KNOWN_KEYS: ReadonlySet<string> = new Set(
  Object.keys(toyDataSchema.shape),
);

const SAMPLE_MAX_LENGTH = 120;

export function detectPayloadDrift(rawPayload: unknown): PayloadDrift[] {
  if (rawPayload === null || typeof rawPayload !== "object") {
    return [];
  }
  return Object.entries(rawPayload as Record<string, unknown>)
    .filter(([key]) => !KNOWN_KEYS.has(key))
    .map(([key, value]) => ({
      key,
      sampleValue: JSON.stringify(value).slice(0, SAMPLE_MAX_LENGTH),
    }));
}

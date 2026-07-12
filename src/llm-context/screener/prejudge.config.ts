import { LLM_CONNECTION } from '@/shared/llm/llm-connection.config';

export const PREJUDGE_CONFIG = {
  ...LLM_CONNECTION,
  model: process.env.PREJUDGE_MODEL,
  temperature: 0,
  // 고빈도(폴링 주기마다) 호출이라 무한 반복 생성 1회가 로컬 자원을 크게 잠식한다.
  // 단, thinking 모델(Qwen3.6 등)은 reasoning 토큰이 max_tokens 에 포함되므로
  // 상한이 너무 타이트하면 추론만 하다 잘려 content 가 빈 문자열이 된다
  // (finish_reason=length → JSON 파싱 실패). 추론 여유분을 포함해 상한을 잡는다.
  maxOutputTokens: Number(process.env.PREJUDGE_MAX_OUTPUT_TOKENS ?? 8192),
} as const;

import { LLM_CONNECTION } from '@/shared/llm/llm-connection.config';

export const PREJUDGE_CONFIG = {
  ...LLM_CONNECTION,
  model: process.env.PREJUDGE_MODEL,
  temperature: 0,
  // 고빈도(폴링 주기마다) 호출이라 무한 반복 생성 1회가 로컬 자원을 크게 잠식한다.
  // 스크리너 출력은 triggered/reason/id 배열뿐이라 상한을 타이트하게 둔다.
  maxOutputTokens: Number(process.env.PREJUDGE_MAX_OUTPUT_TOKENS ?? 1024),
} as const;

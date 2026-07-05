import { LLM_CONNECTION } from '@/shared/llm/llm-connection.config';

export const ANALYSIS_CONFIG = {
  ...LLM_CONNECTION,
  model: process.env.ANALYSIS_MODEL,
  temperature: 0,
  // 출력 상한 미설정 시 로컬 모델의 무한 반복/미종결 생성이 사이클을 잠식한다
  // (LM Studio 공식 문서도 구조적 출력에는 maxTokens 명시를 강권).
  // 생성 노드는 코드 필드 포함 수천 토큰을 내므로 여유 있게 잡는다.
  maxOutputTokens: Number(process.env.ANALYSIS_MAX_OUTPUT_TOKENS ?? 8192),
} as const;

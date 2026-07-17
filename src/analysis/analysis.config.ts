import { LLM_CONNECTION } from '@/shared/llm/llm-connection.config';

export const ANALYSIS_CONFIG = {
  ...LLM_CONNECTION,
  model: process.env.ANALYSIS_MODEL,
  temperature: 0,
  // 출력 상한 미설정 시 로컬 모델의 무한 반복/미종결 생성이 사이클을 잠식한다
  // (LM Studio 공식 문서도 구조적 출력에는 maxTokens 명시를 강권).
  // 생성 노드는 코드 필드 포함 수천 토큰을 내므로 여유 있게 잡는다.
  maxOutputTokens: Number(process.env.ANALYSIS_MAX_OUTPUT_TOKENS ?? 8192),
  // HTTP 타임아웃 미설정 시 원격 LLM 서버로의 요청이 순단(Tailscale 플랩)에 끊기면
  // 분석 사이클이 영원히 매달린다(2026-07-14 실측: 에피소드 분석 21분 무응답 — 서버는
  // 즉시 응답 상태). 12k 토큰급 장문 생성을 덮는 여유치로 잡고, 초과 시 openai 클라이언트가
  // maxRetries 만큼 재시도한다.
  timeoutMS: Number(process.env.ANALYSIS_LLM_TIMEOUT_MS ?? 480_000),
} as const;

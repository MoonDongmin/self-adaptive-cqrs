export const LOG_CONSUMER_CONFIG = {
  topic: "log-events",
  groupId: "llm-context-builder",
  maxBatchSize: 500,
  pollIntervalMS: 5 * 1000,
  errorLevelThreshold: 40, // pino 레벨: 40=warn
  // 층1 평가처럼 탐지만 측정할 때 선판단 트리거 시의 분석(권고 문서 생성)을 끈다.
  // 분석 모델(35B)이 관찰자와 같은 LLM 서버를 점유해 관찰 호출을 타임아웃시키는 것을
  // 막는 스위치 — sensor-observer.config.ts 의 analysisDisabled 와 같은 취지다
  // (2026-07-13 실측: 404 요청 로그 1건이 트리거한 분석이 서버를 ~12분 점유, 관찰
  // 호출이 연쇄 타임아웃).
  analysisDisabled: process.env.LLM_CONTEXT_ANALYSIS_DISABLED === "1",
} as const;

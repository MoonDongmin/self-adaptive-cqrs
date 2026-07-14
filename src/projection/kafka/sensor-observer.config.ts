// 로그 라인(log-consumer.config.ts)의 센서용 미러. 단, 관찰 배치는 500이 아니라
// '한 줌'(8)으로 작게 잡아 LLM 컨텍스트와 비용을 묶는다.
// 관찰(스크리닝)은 윈도우(8개) 단위, 분석(권고 문서)은 에피소드 단위 — 연속된 이상
// 윈도우를 하나로 병합해 같은 물리적 사건에 문서가 윈도우 수만큼 반복 생성되는 것을 막는다.
export const SENSOR_OBSERVER_CONFIG = {
  topic: "sensor-values",
  groupId: "sensor-value-observer",
  // 관찰 윈도우 크기. 기본 8. 작을수록 윈도우당 지목 후보가 줄어 scene 귀속(strict)이
  // 유리해지고, LLM 호출 수는 반비례로 늘어난다 — 윈도우 크기 vs 지목 정확도 실험용
  // (2026-07-14, 층1 평가 v2@8 대비 v2@4 비교).
  maxObserverBatchSize: Number(process.env.SENSOR_OBSERVER_MAX_BATCH_SIZE ?? 8),
  pollIntervalMS: 5 * 1000,
  // 에피소드 누적 상한(레코드 수) — 분석 그래프의 LLM 컨텍스트 보호. 상한 도달 시
  // 즉시 분석하고, 이상이 계속되면 다음 에피소드로 이어진다(초장기 이상 = 문서 여러 개 허용).
  maxEpisodeRecords: 64,
  // 열린 에피소드가 새 입력 없이 이 시간을 넘기면 스트림 중단(씬 종료)으로 보고 닫는다.
  episodeQuietTimeoutMS: 15 * 1000,
  // 1차 판정 모드. hybrid = 결정론 4층 주석 + LLM 해석(기본). llm-only = 주석·게이트·
  // 강제 병합·결정론 폴백 없이 LLM 단독 판정 — 순수 LLM 탐지율 측정(ablation)용.
  judgeMode: (process.env.SENSOR_OBSERVER_JUDGE_MODE === "llm-only"
    ? "llm-only"
    : "hybrid") as "hybrid" | "llm-only",
  // 층1 평가처럼 탐지만 측정할 때 에피소드 분석(권고 문서 생성)을 끈다. 분석 모델이
  // 같은 LLM 서버 자원을 점유해 관찰 호출을 타임아웃·정체시키는 것을 막는 스위치다
  // (2026-07-13 실측: 분석 실행 구간에서 관찰 호출이 40초 → 180초 초과).
  analysisDisabled: process.env.SENSOR_OBSERVER_ANALYSIS_DISABLED === "1",
} as const;

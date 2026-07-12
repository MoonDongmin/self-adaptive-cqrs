// 로그 라인(log-consumer.config.ts)의 센서용 미러. 단, 관찰 배치는 500이 아니라
// '한 줌'(8)으로 작게 잡아 LLM 컨텍스트와 비용을 묶는다.
// 관찰(스크리닝)은 윈도우(8개) 단위, 분석(권고 문서)은 에피소드 단위 — 연속된 이상
// 윈도우를 하나로 병합해 같은 물리적 사건에 문서가 윈도우 수만큼 반복 생성되는 것을 막는다.
export const SENSOR_OBSERVER_CONFIG = {
  topic: "sensor-values",
  groupId: "sensor-value-observer",
  maxObserverBatchSize: 8,
  pollIntervalMS: 5 * 1000,
  // 에피소드 누적 상한(레코드 수) — 분석 그래프의 LLM 컨텍스트 보호. 상한 도달 시
  // 즉시 분석하고, 이상이 계속되면 다음 에피소드로 이어진다(초장기 이상 = 문서 여러 개 허용).
  maxEpisodeRecords: 64,
  // 열린 에피소드가 새 입력 없이 이 시간을 넘기면 스트림 중단(씬 종료)으로 보고 닫는다.
  episodeQuietTimeoutMS: 15 * 1000,
} as const;

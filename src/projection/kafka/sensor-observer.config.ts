// 로그 라인(log-consumer.config.ts)의 센서용 미러. 단, 관찰 배치는 500이 아니라
// '한 줌'(8)으로 작게 잡아 LLM 컨텍스트와 비용을 묶는다.
export const SENSOR_OBSERVER_CONFIG = {
  topic: "sensor-values",
  groupId: "sensor-value-observer",
  maxObserverBatchSize: 8,
  pollIntervalMS: 5 * 1000,
} as const;

export const LOG_CONSUMER_CONFIG = {
  topic: "log-events",
  groupId: "llm-context-builder",
  maxBatchSize: 500,
  pollIntervalMS: 5 * 1000,
  errorLevelThreshold: 40, // pino 레벨: 40=warn
} as const;

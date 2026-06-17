export const LOG_CONSUMER_CONFIG = {
  topic: "log-events",
  groupId: "llm-context-builder",
  maxBatchSize: 500,
  pollIntervalMS: 1 * 60 * 1000,
} as const;

export const LogContext = {
  EVENT_ID: "eventId",
  STREAM_ID: "streamId",
  ATTEMPT_NUM: "attemptNum",
  GLOBAL_SEQ: "globalSeq",
  EVENT_TYPE: "eventType",

  CORRELATION_ID: "correlationId",
  PROJECTOR_NAME: "projectorName",

  SCENE_KEY: "sceneKey",
  OBJECT_NAME: "objectName",

  ACTION: "action",
  DURATION_MS: "durationMs",
  FILE: "file",
  TOTAL_FILES: "totalFiles",
  INSERTED: "inserted",
  SKIPPED: "skipped",
  FAILED: "failed",
  BATCH_FETCHED: "batchFetched",
  FROM_SEQ: "fromSeq",
  TO_SEQ: "toSeq",
  PROCESSED: "processed",
  REASON: "reason",
  ROUTE: "route",
  INDEX: "index",

  // log-collector
  SOURCE_FILE: "sourceFile",
  BYTE_OFFSET: "byteOffset",
  FROM_OFFSET: "fromOffset",
  TO_OFFSET: "toOffset",
  LINE_COUNT: "lineCount",
  INGESTED: "ingested",
  LINE: "line",
  COUNT: "count",

  // insight read
  ENTITY_NAME: "entityName",
  ENTITY_COUNT: "entityCount",
  RENDERED_COUNT: "renderedCount",

  REPORT_PATH: "reportPath",
} as const;

export const LogAction = {
  // insert
  INSERT_REQUEST: "insert.request",
  INSERT_BATCH_START: "insert.batch.start",
  INSERT_BATCH_DONE: "insert.batch.done",
  INSERT_FILE_OK: "insert.file.ok",
  INSERT_FILE_SKIPPED: "insert.file.skipped",
  INSERT_FILE_FAILED: "insert.file.failed",
  EVENT_APPEND_FAILED: "event.append.failed",

  // projection
  PROJECTION_REQUEST: "projection.request",
  PROJECTION_START: "projection.start",
  PROJECTION_BATCH: "projection.batch",
  CURSOR_ADVANCED: "projection.cursor.advanced",
  PROJECTION_DONE: "projection.done",
  EVENT_MAPPED: "projection.event.mapped",
  MAP_FAILED: "projection.map.failed",

  // 공통
  DB_ERROR: "db.error",

  // insight
  INSIGHT_SEED_REQUEST: "insight.seed.request",
  INSIGHT_SEED_DONE: "insight.seed.done",

  // insight read
  INSIGHT_CARD_REQUEST: "insight.card.request",
  INSIGHT_CARDS_REQUEST: "insight.cards.request",
  INSIGHT_CARD_RENDERED: "insight.card.rendered",
  INSIGHT_CARD_MISS: "insight.card.miss",
  INSIGHT_CARDS_DONE: "insight.cards.done",

  // log-collector
  LOG_INGEST_REQUEST: "log.ingest.request",
  LOG_INGEST_START: "log.ingest.start",
  LOG_INGEST_DONE: "log.ingest.done",
  LOG_LINE_SKIPPED: "log.line.skipped",
  LOG_DELETE_REQUEST: "log.delete.request",
  LOG_DELETE_DONE: "log.delete.done",

  // llm-context 선판단
  LLM_PREJUDGE_TRIGGERED: "llm.prejudge.triggered",
  LLM_PREJUDGE_SKIPPED: "llm.prejudge.skipped",

  // LogAction 에 추가 (기존 llm-context 선판단 아래)
  LLM_ANALYSIS_ROOTCAUSE_DONE: "llm.analysis.rootcause.done",
  LLM_ANALYSIS_DECISION_DONE: "llm.analysis.decision.done",
  LLM_ANALYSIS_GENERATE_DONE: "llm.analysis.generate.done",
  LLM_ANALYSIS_AGGREGATE_DONE: "llm.analysis.aggregate.done",
} as const;

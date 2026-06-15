export const LogContext = {
  EVENT_ID: "event_id",
  STREAM_ID: "stream_id",
  ATTEMPT_NUM: "attempt_num",
  GLOBAL_SEQ: "global_seq",
  EVENT_TYPE: "event_type",

  CORRELATION_ID: "correlation_id",
  PROJECTOR_NAME: "projector_name",

  SCENE_KEY: "scene_key",
  OBJECT_NAME: "object_name",

  ACTION: "action",
  DURATION_MS: "duration_ms",
  FILE: "file",
  TOTAL_FILES: "total_files",
  INSERTED: "inserted",
  SKIPPED: "skipped",
  FAILED: "failed",
  BATCH_FETCHED: "batch_fetched",
  FROM_SEQ: "from_seq",
  TO_SEQ: "to_seq",
  PROCESSED: "processed",
  REASON: "reason",
  ROUTE: "route",
  INDEX: "index",
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
} as const;

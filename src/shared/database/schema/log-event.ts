import {
  bigint,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const logEvents = pgTable(
  "log_event",
  {
    time: timestamp("time", { withTimezone: true }).notNull(),
    logId: uuid("log_id").defaultRandom().notNull(),
    level: integer("level").notNull(), // pino 숫자 레벨 (30/40/50)
    action: varchar("action", { length: 64 }),
    msg: text("msg"),
    correlationId: text("correlation_id"),
    streamId: varchar("stream_id"),
    globalSeq: bigint("global_seq", { mode: "number" }),
    attemptNum: integer("attempt_num"),
    projectorName: varchar("projector_name"),
    sceneKey: varchar("scene_key"),
    objectName: varchar("object_name"),
    durationMs: integer("duration_ms"),
    reason: text("reason"),
    payload: jsonb("payload").notNull(), // 위 컬럼 외 나머지 로그 필드 원본 보존
  },
  (t) => [
    primaryKey({ columns: [t.time, t.logId] }),
    index("idx_log_level_time").on(t.level, t.time),
    index("idx_log_action_time").on(t.action, t.time),
    index("idx_log_scene_time").on(t.sceneKey, t.time),
    index("idx_log_projector_time").on(t.projectorName, t.time),
  ],
);

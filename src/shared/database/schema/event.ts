import {
  bigserial,
  integer,
  jsonb,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const eventStore = pgTable(
  "event_store",
  {
    globalSeq: bigserial("global_seq", { mode: "number" }).primaryKey(),
    eventId: uuid("event_id").defaultRandom().notNull().unique(),
    streamId: varchar("stream_id").notNull(),
    attemptNum: integer("attempt_num").notNull(),
    eventType: varchar("event_type", { length: 64 }).notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
    recordedAt: timestamp("recorded_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    payload: jsonb("payload").notNull(),
  },
  (t) => [uniqueIndex("uq_event_stream_attempt").on(t.streamId, t.attemptNum)],
);

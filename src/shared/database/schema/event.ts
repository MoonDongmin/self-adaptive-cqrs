import {
  bigserial,
  integer,
  jsonb,
  pgTable,
  PgTableWithColumns,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export const event: PgTableWithColumns<any> = pgTable(
  "event",
  {
    globalSeq: bigserial("global_seq", { mode: "number" }).primaryKey(),
    eventId: uuid("event_id").defaultRandom().notNull().unique(),
    streamId: varchar("stream_id").notNull(),
    streamVersion: integer("stream_version").notNull(),
    eventType: varchar("event_type", { length: 64 }).notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
    recordedAt: timestamp("recorded_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    payload: jsonb("payload").notNull(),
  },
  (t) => [
    uniqueIndex("uq_event_stream_version").on(t.streamId, t.streamVersion),
  ],
);

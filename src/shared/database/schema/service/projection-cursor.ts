import { bigint, pgTable, timestamp, varchar } from 'drizzle-orm/pg-core';

export const projectionCursor = pgTable("projection_cursor", {
  projectorName: varchar("projector_name").primaryKey(),
  lastEventSeq: bigint("last_event_seq", { mode: "number" })
    .notNull()
    .default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

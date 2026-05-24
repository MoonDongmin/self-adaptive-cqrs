import {
  bigint,
  pgTable,
  PgTableWithColumns,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export const projectionCursor: PgTableWithColumns<any> = pgTable(
  "projection_cursor",
  {
    projectorName: varchar("projector_name").primaryKey(),
    lastEventSeq: bigint("last_event_seq", { mode: "number" })
      .notNull()
      .default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
);

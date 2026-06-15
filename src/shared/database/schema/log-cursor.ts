import { bigint, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const logCursor = pgTable("log_cursor", {
  sourceFile: text("source_file").primaryKey(), // 파일 경로 = 커서 키
  byteOffset: bigint("byte_offset", { mode: "number" }).notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

import { bigint, pgTable, primaryKey, smallint, text, timestamp, varchar } from 'drizzle-orm/pg-core';

export const readMultimodal = pgTable(
  "read_multimodal",
  {
    sceneKey: varchar("scene_key").notNull(),
    attemptNum: smallint("attempt_num").notNull(),

    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),

    image2dFileName: varchar("image_2d_file_name"),
    image2dUri: text("image_2d_uri"),

    videoFileName: varchar("video_file_name"),
    videoUri: text("video_uri"),

    streamId: varchar("stream_id").notNull(),
    globalSeq: bigint("global_seq", { mode: "number" }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.sceneKey, t.attemptNum] })],
);

import {
  bigint,
  index,
  pgTable,
  PgTableWithColumns,
  primaryKey,
  smallint,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export const readMedia: PgTableWithColumns<any> = pgTable(
  "read_attempt_media",
  {
    sceneKey: varchar("scene_key").notNull(),
    attemptNo: smallint("attempt_no").notNull(),

    objectName: varchar("object_name").notNull(),
    gripSucceed: smallint("grip_succeed").notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),

    image2dMediaId: uuid("image_2d_media_id"),
    image2dFileName: varchar("image_2d_file_name"),
    image2dUri: text("image_2d_uri"),

    videoMediaId: uuid("video_media_id"),
    videoFileName: varchar("video_file_name"),
    videoUri: text("video_uri"),

    streamId: varchar("stream_id").notNull(),
    globalSeq: bigint("global_seq", { mode: "number" }).notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.sceneKey, t.attemptNo] }),
    index("idx_attempt_media_object").on(t.objectName, t.occurredAt),
  ],
);

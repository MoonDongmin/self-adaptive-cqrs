import {
  bigint,
  PgEnum,
  pgEnum,
  pgTable,
  PgTableWithColumns,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const mediaTypeEnum: PgEnum<["image_2d", "video"]> = pgEnum(
  "media_type",
  ["image_2d", "video"],
);

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export const mediaFile: PgTableWithColumns<any> = pgTable(
  "media_file",
  {
    mediaId: uuid("media_id").defaultRandom().primaryKey(),
    mediaType: mediaTypeEnum("media_type").notNull(),
    fileName: varchar("file_name").notNull(),
    storageUri: text("storage_uri").notNull(),
    byteSize: bigint("byte_size", { mode: "number" }),
    contentHash: varchar("content_hash", { length: 64 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [uniqueIndex("uq_media_type_name").on(t.mediaType, t.fileName)],
);

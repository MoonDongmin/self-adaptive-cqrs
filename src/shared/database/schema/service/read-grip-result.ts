import {
  bigint,
  index,
  jsonb,
  pgTable,
  primaryKey,
  smallint,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const readGripResult = pgTable(
  "read_grip_result",
  {
    sceneKey: varchar("scene_key").notNull(),
    attemptNum: smallint("attempt_num").notNull(),

    objectName: varchar("object_name").notNull(),
    gripSucceed: smallint("grip_succeed").notNull(),
    gripperType: varchar("gripper_type", { length: 16 }).notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),

    grip2dPose: jsonb("grip_2d_pose"),
    grip3dPose: jsonb("grip_3d_pose"),

    robotTf: jsonb("robot_tf"),

    humanAnnotationGrasp: jsonb("human_annotation_grasp"),

    streamId: varchar("stream_id").notNull(),
    globalSeq: bigint("global_seq", { mode: "number" }).notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.sceneKey, t.attemptNum] }),
    index("idx_grip_result_object").on(t.objectName, t.occurredAt),
    index("idx_grip_result_succeed").on(t.gripSucceed, t.occurredAt),
  ],
);

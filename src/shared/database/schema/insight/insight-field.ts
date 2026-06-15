import {
  integer,
  pgTable,
  primaryKey,
  text,
  varchar,
} from "drizzle-orm/pg-core";
import { insightEntity } from "@/shared/database/schema/insight/insight-entity";

/*
 * insight_field — 카드 필드표의 1행 = 1행 (정의의 불변부).
 *
 * 역할: 한 카드(insight_entity)에 속한 각 필드의 "정의"를 보관한다. 카드 필드표의
 *       「필드 | 타입 | 의미 | 예시」 4열에 해당하며, 거의 변하지 않는 부분이다.
 *       (시변부인 「값/분포」는 insight_field_statistic 로 분리.)
 *       (entity_name, field_name) 복합 PK 로 카드 안에서 필드를 식별하고,
 *       entity_name 은 insight_entity 를 FK 로 참조한다. display_order 로 표 순서를 고정한다.
 */
export const insightField = pgTable(
  "insight_field",
  {
    entityName: varchar("entity_name")
      .notNull()
      .references(() => insightEntity.entityName),
    fieldName: varchar("field_name").notNull(),

    // 예: "varchar", "jsonb", "object"
    dataType: varchar("data_type").notNull(),

    // 의미(한 줄)
    meaning: text("meaning").notNull(),

    // 예시 값(nullable)
    example: text("example"),
    displayOrder: integer("display_order").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.entityName, t.fieldName] })],
);

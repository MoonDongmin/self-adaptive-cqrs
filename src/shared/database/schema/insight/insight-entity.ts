import { bigint, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';

/*
 * insight_entity — InsightDB 카드 1장 = 1행 (카드의 헤더 = 정의의 뿌리).
 *
 * 역할: LLM에 주입할 "데이터 카드"의 최상위 단위를 보관한다. 한 행이 곧 카드 한 장이며,
 *       kind 로 두 종류를 구분한다.
 *         - 'read_model' : 현존 Read Model(완성품). 지금 무엇을 제공 중인지.
 *         - 'event'      : 원천 payload(재료). 아직 Read Model로 안 꺼낸 필드가 무엇인지.
 *       insight_field(필드 정의)가 entity_name 으로 이 테이블을 참조한다.
 *       row_count/refreshed_at 은 시변 메타라 nullable(event 카드 등 미집계 허용).
 */
export const insightEntity = pgTable("insight_entity", {
  entityName: varchar("entity_name").primaryKey(),

  // 'event'(원천 payload 재료) | 'read_model'(완성품). 리터럴 유니온으로 any 회피.
  kind: varchar("kind", { length: 16 })
    .$type<"event" | "read_model">()
    .notNull(),

  // 용도(한 줄)
  purpose: text("purpose").notNull(),

  // 예: "(scene_key, attempt_num)"
  keyColumns: text("key_columns").notNull(),

  // nullable: event 카드는 미집계 가능
  rowCount: bigint("row_count", { mode: "number" }),
  refreshedAt: timestamp("refreshed_at", { withTimezone: true }),
});

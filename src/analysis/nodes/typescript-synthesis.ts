import type { NewReadModelOutput } from "@/analysis/type/output.type";

// drizzleSchema/projectorCode 결정론 합성 — migrationSql 합성(new-read-model.node.ts)과
// 동형의 최종 안전망이다. 재질의 소진 후에도 생성 TS 가 컴파일 불능이면, 이미 검증된
// fields/keyColumns 에서 스키마·프로젝터를 템플릿 합성해 교체한다: LLM 은 설계 판단
// (어떤 컬럼을 왜)을 내고, 코드 렌더링은 결정론이 보장한다(2026-08-02 k5 실측:
// TS 실패 12건 중 9건이 numeric↔number 단일 유형 — 재질의가 자가 교정하지 못했다).
//
// 합성의 보장 범위는 "컴파일과 구조(키·업서트·로깅 관용구)"다. payload 경로가 자명하지
// 않은 컬럼(도메인 파생값)은 안전한 기본 매핑 + TODO 주석으로 남긴다 — 매핑 충실도의
// 대조 기준은 §2 의 투영 매핑 명세(projectionMapping)다.

function parseKeyColumnNames(keyColumns: string): string[] {
  return keyColumns
    .replace(/[()]/g, "")
    .split(",")
    .map((column) => column.trim())
    .filter((column) => column.length > 0);
}

function toCamelCase(snakeName: string): string {
  return snakeName.replace(/_([a-z0-9])/g, (_, letter: string) =>
    letter.toUpperCase(),
  );
}

function toPascalCase(snakeName: string): string {
  const camel = toCamelCase(snakeName);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}

// read_grip_sensor_v2 → { schemaVariable: readGripSensorV2, className: GripSensorV2Projector,
//   projectorName: grip-sensor-v2-projector } — 기존 프로젝터(GripResultProjector 등) 명명 관례.
export function namesForReadModel(proposedName: string): {
  schemaVariable: string;
  className: string;
  projectorName: string;
} {
  const withoutPrefix = proposedName.replace(/^read_/, "");
  return {
    schemaVariable: toCamelCase(proposedName),
    className: `${toPascalCase(withoutPrefix)}Projector`,
    projectorName: `${withoutPrefix.replace(/_/g, "-")}-projector`,
  };
}

type ColumnKind =
  | "varchar"
  | "text"
  | "smallint"
  | "integer"
  | "bigint"
  | "doublePrecision"
  | "timestamp"
  | "boolean"
  | "jsonb";

// SQL dataType(자유 서술) → drizzle 빌더 종류. 수치 실수형은 전부 doublePrecision —
// numeric() 은 insert 타입이 string 이라 프로젝터 number 대입이 컴파일 실패한다(규칙 14).
function columnKindForDataType(dataType: string): ColumnKind {
  const lowered = dataType.toLowerCase();
  if (lowered.includes("varchar") || lowered.includes("character")) {
    return "varchar";
  }
  if (lowered.includes("text")) {
    return "text";
  }
  if (lowered.includes("smallint")) {
    return "smallint";
  }
  if (lowered.includes("bigint") || lowered.includes("bigserial")) {
    return "bigint";
  }
  if (lowered.includes("int")) {
    return "integer";
  }
  if (
    /numeric|decimal|double|real|float/.test(lowered)
  ) {
    return "doublePrecision";
  }
  if (lowered.includes("timestamp") || lowered.includes("date")) {
    return "timestamp";
  }
  if (lowered.includes("bool")) {
    return "boolean";
  }
  if (lowered.includes("json")) {
    return "jsonb";
  }
  return "varchar";
}

function drizzleBuilderExpression(
  columnName: string,
  kind: ColumnKind,
  notNull: boolean,
): string {
  const base: string = {
    varchar: `varchar("${columnName}")`,
    text: `text("${columnName}")`,
    smallint: `smallint("${columnName}")`,
    integer: `integer("${columnName}")`,
    bigint: `bigint("${columnName}", { mode: "number" })`,
    doublePrecision: `doublePrecision("${columnName}")`,
    timestamp: `timestamp("${columnName}", { withTimezone: true })`,
    boolean: `boolean("${columnName}")`,
    jsonb: `jsonb("${columnName}")`,
  }[kind];
  return notNull ? `${base}.notNull()` : base;
}

export function synthesizeDrizzleSchema(output: NewReadModelOutput): string {
  const { schemaVariable } = namesForReadModel(output.proposedName);
  const keyColumnNames = parseKeyColumnNames(output.keyColumns);

  const usedBuilders = new Set<string>(["pgTable", "primaryKey"]);
  const columnLines = output.fields.map((field) => {
    const kind = columnKindForDataType(field.dataType);
    usedBuilders.add(kind);
    const notNull = keyColumnNames.includes(field.name);
    return `    ${toCamelCase(field.name)}: ${drizzleBuilderExpression(field.name, kind, notNull)},`;
  });

  const keyProperties = keyColumnNames
    .map((column) => `t.${toCamelCase(column)}`)
    .join(", ");

  return [
    `import { ${[...usedBuilders].sort().join(", ")} } from 'drizzle-orm/pg-core';`,
    "",
    `export const ${schemaVariable} = pgTable(`,
    `  "${output.proposedName}",`,
    "  {",
    ...columnLines,
    "  },",
    `  (t) => [primaryKey({ columns: [${keyProperties}] })],`,
    ");",
    "",
  ].join("\n");
}

// 표준 메타 컬럼: 이벤트 행 자체에서 결정론으로 유도 가능한 값들.
const METADATA_COLUMN_EXPRESSIONS: Record<string, string> = {
  scene_key: `event.streamId.replace(/^grip-attempt:/, "")`,
  attempt_num: "event.attemptNum",
  occurred_at: "event.occurredAt",
  stream_id: "event.streamId",
  global_seq: "event.globalSeq",
};

function mapExpressionForField(
  fieldName: string,
  kind: ColumnKind,
  isKeyColumn: boolean,
): string {
  const metadataExpression = METADATA_COLUMN_EXPRESSIONS[fieldName];
  if (metadataExpression !== undefined) {
    return metadataExpression;
  }
  const rawAccess = `payload["${fieldName}"]`;
  if (isKeyColumn) {
    // NOT NULL 키 컬럼은 null 불가 — 안전한 기본값으로 보정한다(TODO: 매핑 명세 대조).
    return kind === "varchar" || kind === "text"
      ? `String(${rawAccess} ?? "")`
      : `Number(${rawAccess} ?? 0)`;
  }
  switch (kind) {
    case "smallint":
    case "integer":
    case "bigint":
    case "doublePrecision":
      return `toNumberOrNull(${rawAccess})`;
    case "boolean":
      return `typeof ${rawAccess} === "boolean" ? ${rawAccess} : null`;
    case "timestamp":
      return `toDateOrNull(${rawAccess})`;
    case "jsonb":
      return `${rawAccess} ?? null`;
    default:
      return `toStringOrNull(${rawAccess})`;
  }
}

export function synthesizeProjectorCode(output: NewReadModelOutput): string {
  const { schemaVariable, className, projectorName } = namesForReadModel(
    output.proposedName,
  );
  const keyColumnNames = parseKeyColumnNames(output.keyColumns);

  const mapLines = output.fields.map((field) => {
    const kind = columnKindForDataType(field.dataType);
    const expression = mapExpressionForField(
      field.name,
      kind,
      keyColumnNames.includes(field.name),
    );
    return `      ${toCamelCase(field.name)}: ${expression},`;
  });

  const nonKeyFields = output.fields.filter(
    (field) => !keyColumnNames.includes(field.name),
  );
  const conflictClause =
    nonKeyFields.length === 0
      ? "      .onConflictDoNothing();"
      : [
          "      .onConflictDoUpdate({",
          `        target: [${keyColumnNames.map((column) => `${schemaVariable}.${toCamelCase(column)}`).join(", ")}],`,
          "        set: {",
          ...nonKeyFields.map(
            (field) =>
              `          ${toCamelCase(field.name)}: row.${toCamelCase(field.name)},`,
          ),
          "        },",
          "      });",
        ].join("\n");

  return [
    "import { Injectable } from '@nestjs/common';",
    "import { type InferInsertModel } from 'drizzle-orm';",
    "import { PinoLogger } from 'nestjs-pino';",
    "import type { Projector } from '@/projection/projector/projector';",
    "import type { EventStoreEventRow } from '@/projection/repository/event-store-reader.repository';",
    "import { DrizzleTx } from '@/shared/database/drizzle.provider';",
    `import { ${schemaVariable} } from '@/shared/database/schema';`,
    "import { LogAction, LogContext } from '@/shared/logger/logging-context';",
    "",
    `type ${className}Insert = InferInsertModel<typeof ${schemaVariable}>;`,
    "",
    "function toNumberOrNull(value: unknown): number | null {",
    "  if (value === undefined || value === null) {",
    "    return null;",
    "  }",
    "  const parsed = Number(value);",
    "  return Number.isNaN(parsed) ? null : parsed;",
    "}",
    "",
    "function toStringOrNull(value: unknown): string | null {",
    "  return value === undefined || value === null ? null : String(value);",
    "}",
    "",
    "function toDateOrNull(value: unknown): Date | null {",
    '  if (typeof value !== "string" && typeof value !== "number") {',
    "    return null;",
    "  }",
    "  const parsed = new Date(value);",
    "  return Number.isNaN(parsed.getTime()) ? null : parsed;",
    "}",
    "",
    "@Injectable()",
    `export class ${className} implements Projector<${className}Insert> {`,
    `  readonly name: string = "${projectorName}";`,
    "",
    "  constructor(private readonly logger: PinoLogger) {",
    `    this.logger.setContext(${className}.name);`,
    "  }",
    "",
    `  map(event: EventStoreEventRow): ${className}Insert {`,
    "    // 결정론 합성 프로젝터 — payload 경로가 자명하지 않은 컬럼은 §2 투영 매핑 명세와 대조해 보정하라.",
    "    const payload = event.payload as Record<string, unknown>;",
    "",
    "    this.logger.debug(",
    "      {",
    "        action: LogAction.EVENT_MAPPED,",
    "        [LogContext.PROJECTOR_NAME]: this.name,",
    "        [LogContext.GLOBAL_SEQ]: event.globalSeq,",
    "      },",
    '      "이벤트 매핑",',
    "    );",
    "",
    "    return {",
    ...mapLines,
    "    };",
    "  }",
    "",
    `  async upsert(tx: DrizzleTx, row: ${className}Insert): Promise<void> {`,
    "    await tx",
    `      .insert(${schemaVariable})`,
    "      .values(row)",
    conflictClause,
    "  }",
    "}",
    "",
  ].join("\n");
}

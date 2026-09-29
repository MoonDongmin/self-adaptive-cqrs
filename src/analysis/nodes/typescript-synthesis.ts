import type { NewReadModelOutput } from "@/analysis/type/output.type";

// drizzleSchema/projectorCode 결정론 합성 — migrationSql 합성(new-read-model.node.ts)과
// 동형의 최종 안전망이다. 재질의 소진 후에도 생성 TS 가 컴파일 불능이거나 payload 키가
// 실재하지 않으면, 이미 검증된 fields/keyColumns 에서 스키마·프로젝터를 템플릿 합성해
// 교체한다: LLM 은 설계 판단(어떤 컬럼을 왜)을 내고, 코드 렌더링은 결정론이 보장한다.
//
// 합성의 보장 범위(2026-08-09 확장): 컴파일·구조에 더해 "map() 의 payload 접근 경로"를
// 실제 적재 스키마(ToyDataDto, src/insert/dto/toy-data.dto.ts)에서 결정론 유도한다 —
// 이전 버전은 DB 컬럼명을 payload 평면 키로 그대로 읽어(payload["z1_raw"]) 전 컬럼이
// null 로 채워지는 조용한 실패를 만들었다(2026-08-09 100런 품질 리뷰: A4 5/5·E4 4/6 실측).
// 시간 버킷(date_key 등)·건수 집계(total_attempts 등)는 이름 패턴으로 유도하고, 집계
// 컬럼의 upsert 는 덮어쓰기 대신 증분(sql`컬럼 + row값`)으로 합성한다. 어느 경로로도
// 유도할 수 없는 컬럼(도메인 파생 플래그 등)은 값을 발명하지 않고 null + TODO 주석으로
// 남긴다 — 매핑 충실도의 대조 기준은 §2 의 투영 매핑 명세(projectionMapping)다.

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

const NUMERIC_COLUMN_KINDS: ReadonlySet<ColumnKind> = new Set([
  "smallint",
  "integer",
  "bigint",
  "doublePrecision",
]);

const TEXT_COLUMN_KINDS: ReadonlySet<ColumnKind> = new Set(["varchar", "text"]);

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

// ── payload 경로 결정론 색인 ─────────────────────────────────────────────────
// 실제 적재 스키마(ToyDataDto)의 리프 경로 사전. 합성 프로젝터는 toyDataSchema 로
// payload 를 파싱하므로 아래 접근식은 전부 타입이 보장된다. 이 색인에 없는 이름은
// "payload 에서 유도 불가"로 취급한다(발명 금지).

interface PayloadLeafAccess {
  expression: string; // payload 기준 접근식
  leafKind: "number" | "string" | "jsonb";
  optionalChain: boolean; // objects[0]?.… 처럼 undefined 가 가능한 접근인가
}

function buildPayloadLeafIndex(): Map<string, PayloadLeafAccess> {
  const index = new Map<string, PayloadLeafAccess>();
  const register = (
    name: string,
    expression: string,
    leafKind: PayloadLeafAccess["leafKind"],
    optionalChain = false,
  ): void => {
    index.set(name, { expression, leafKind, optionalChain });
  };

  register("2D_image_file_name", `payload["2D_image_file_name"]`, "string");
  register("3D_image_file_name", `payload["3D_image_file_name"]`, "string");
  register("video_file_name", "payload.video_file_name", "string");
  register("box_type", "payload.box_type", "string");
  register("data_key", "payload.data_key", "string");
  register("grip_succeed", "payload.grip_succeed", "number");
  register("camera_info", "payload.camera_info", "jsonb");
  register("grip_data", "payload.grip_data", "jsonb");
  register("robot_tf", "payload.robot_tf", "jsonb");
  register("objects", "payload.objects", "jsonb");
  register("human_annotation_grasp", "payload.human_annotation_grasp", "jsonb");
  register("grip_2d_pose", "payload.grip_data.grip_2d_pose", "jsonb");
  register("grip_3d_pose", "payload.grip_data.grip_3d_pose", "jsonb");
  register(
    "camera_intrinsic_param",
    "payload.camera_info.camera_intrinsic_param",
    "jsonb",
  );
  register("camera_name", "payload.camera_info.camera_name", "string");
  register("camera_type", "payload.camera_info.camera_type", "string");
  register("rotation_3x3", "payload.robot_tf.rotation_3x3", "jsonb");
  register("translation_3x1", "payload.robot_tf.translation_3x1", "jsonb");

  for (const grip2dKey of ["xl", "xr", "yl", "yr"]) {
    register(
      grip2dKey,
      `payload.grip_data.grip_2d_pose.${grip2dKey}`,
      "number",
    );
  }
  for (const axis of ["x", "y", "z"]) {
    for (let i = 1; i <= 8; i++) {
      register(
        `${axis}${i}`,
        `payload.grip_data.grip_3d_pose.${axis}${i}`,
        "number",
      );
    }
  }
  for (const intrinsicKey of [
    "codx",
    "cody",
    "cx",
    "cy",
    "fx",
    "fy",
    "k1",
    "k2",
    "k3",
    "k4",
    "k5",
    "k6",
    "p1",
    "p2",
  ]) {
    register(
      intrinsicKey,
      `payload.camera_info.camera_intrinsic_param.${intrinsicKey}`,
      "number",
    );
  }
  const translationAxes: ReadonlyArray<[string, number]> = [
    ["x", 0],
    ["y", 1],
    ["z", 2],
  ];
  for (const [axisName, axisIndex] of translationAxes) {
    register(
      `translation_${axisName}`,
      `payload.robot_tf.translation_3x1[${axisIndex}]`,
      "number",
    );
  }
  register("class_name", "payload.objects[0]?.class_name", "string", true);
  register(
    "annotation_type",
    "payload.objects[0]?.annotation_type",
    "string",
    true,
  );
  register("package_type", "payload.objects[0]?.package_type", "string", true);
  register("id", "payload.objects[0]?.id", "number", true);
  register(
    "object_properties",
    "payload.objects[0]?.object_properties",
    "jsonb",
    true,
  );
  register(
    "segmentation_points",
    "payload.objects[0]?.segmentation_points",
    "jsonb",
    true,
  );
  register(
    "num_keypoints",
    "payload.human_annotation_grasp[0]?.num_keypoints",
    "number",
    true,
  );
  register(
    "annotation_points",
    "payload.human_annotation_grasp[0]?.annotation_points",
    "jsonb",
    true,
  );
  return index;
}

const PAYLOAD_LEAF_INDEX = buildPayloadLeafIndex();

// 컬럼명 표기 변형 → 색인 정규 키. LLM 설계가 즐겨 쓰는 별칭만 최소로 유지한다.
const COLUMN_NAME_ALIASES: Record<string, string> = {
  object_name: "class_name",
  object_class_name: "class_name",
  object_id: "id",
  image_2d_file_name: "2D_image_file_name",
  image_2d_uri: "2D_image_file_name",
  image_3d_file_name: "3D_image_file_name",
  image_3d_uri: "3D_image_file_name",
  video_uri: "video_file_name",
  robot_tf_translation_x: "translation_x",
  robot_tf_translation_y: "translation_y",
  robot_tf_translation_z: "translation_z",
};

function lookupPayloadLeaf(fieldName: string): PayloadLeafAccess | undefined {
  const candidates: string[] = [fieldName];
  const alias = COLUMN_NAME_ALIASES[fieldName];
  if (alias !== undefined) {
    candidates.push(alias);
  }
  const suffixStripped = fieldName.replace(/_(raw|value)$/, "");
  if (suffixStripped !== fieldName) {
    candidates.push(suffixStripped);
  }
  const pose3dMatch = fieldName.match(/^grip_3d_pose_([xyz][1-8])$/);
  if (pose3dMatch !== null) {
    candidates.push(pose3dMatch[1]);
  }
  const pose2dMatch = fieldName.match(/^grip_2d_pose_(xl|xr|yl|yr)$/);
  if (pose2dMatch !== null) {
    candidates.push(pose2dMatch[1]);
  }
  for (const candidate of candidates) {
    const leaf = PAYLOAD_LEAF_INDEX.get(candidate);
    if (leaf !== undefined) {
      return leaf;
    }
  }
  return undefined;
}

// min_z/z_max/avg_y 류: 행 내부 8좌표 통계는 결정론 유도 가능하다(A6·A7 형 Read Model).
function poseStatisticExpression(fieldName: string): string | undefined {
  const match = fieldName.match(
    /^(?:(min|max|avg|mean)_([xyz])|([xyz])_(min|max|avg|mean))$/,
  );
  if (match === null) {
    return undefined;
  }
  const operation = match[1] ?? match[4];
  const axis = match[2] ?? match[3];
  const terms: string[] = [];
  for (let i = 1; i <= 8; i++) {
    terms.push(`payload.grip_data.grip_3d_pose.${axis}${i}`);
  }
  if (operation === "min" || operation === "max") {
    return `Math.${operation}(${terms.join(", ")})`;
  }
  return `(${terms.join(" + ")}) / 8`;
}

// date_key/occurred_at_hour 류 시간 버킷: 이벤트 발생 시각에서 결정론 유도한다.
// 키 컬럼으로 흔히 쓰이므로 전부 non-null 식이다(이전 버전은 timestamptz 키에
// Number(payload[...] ?? 0) 을 대입하는 타입 파괴가 있었다 — E1 rep-1 실측).
function timeBucketExpression(
  fieldName: string,
  kind: ColumnKind,
): string | undefined {
  const isDateName = /(^|_)(date|day)(_key)?$|^occurred_date$/.test(fieldName);
  const isHourName = /hour/.test(fieldName);
  if (kind === "timestamp") {
    if (isHourName) {
      return "new Date(Math.floor(event.occurredAt.getTime() / 3600000) * 3600000)";
    }
    if (isDateName) {
      return "new Date(Math.floor(event.occurredAt.getTime() / 86400000) * 86400000)";
    }
    return undefined;
  }
  if (TEXT_COLUMN_KINDS.has(kind) && (isDateName || isHourName)) {
    return isHourName
      ? "event.occurredAt.toISOString().slice(0, 13)"
      : "event.occurredAt.toISOString().slice(0, 10)";
  }
  if (NUMERIC_COLUMN_KINDS.has(kind) && isDateName) {
    return 'Number(event.occurredAt.toISOString().slice(0, 10).replace(/-/g, ""))';
  }
  return undefined;
}

// 건수/비율 집계 컬럼: map() 은 "이 행의 기여분"을 내고, upsert 가 증분 누적한다.
// 이전 버전은 upsert 가 row 값으로 덮어써 집계가 성립하지 않았다(E4 4/6 실측).
type AggregateRole =
  | "attemptCount"
  | "successCount"
  | "failureCount"
  | "successRate"
  | "failureRate";

const AGGREGATE_MAP_EXPRESSIONS: Record<AggregateRole, string> = {
  attemptCount: "1",
  successCount: "payload.grip_succeed",
  failureCount: "1 - payload.grip_succeed",
  successRate: "payload.grip_succeed",
  failureRate: "1 - payload.grip_succeed",
};

function aggregateRoleForField(
  fieldName: string,
  kind: ColumnKind,
): AggregateRole | null {
  if (!NUMERIC_COLUMN_KINDS.has(kind)) {
    return null;
  }
  if (
    /^(total_attempts?|attempts?_count|total_count|attempts|event_count|row_count|count)$/.test(
      fieldName,
    )
  ) {
    return "attemptCount";
  }
  if (/^(success_count|succeed_count|grip_success_count)$/.test(fieldName)) {
    return "successCount";
  }
  if (
    /^(failure_count|fail_count|failed_count|grip_failure_count)$/.test(
      fieldName,
    )
  ) {
    return "failureCount";
  }
  if (/^(success_rate|grip_success_rate)$/.test(fieldName)) {
    return "successRate";
  }
  if (/^(failure_rate|fail_rate|grip_failure_rate)$/.test(fieldName)) {
    return "failureRate";
  }
  return null;
}

interface FieldPlan {
  fieldName: string;
  camelName: string;
  kind: ColumnKind;
  isKeyColumn: boolean;
  mapExpression: string;
  mapComment: string | null;
  aggregateRole: AggregateRole | null;
}

// 표준 메타 컬럼: 이벤트 행 자체에서 결정론으로 유도 가능한 값들.
const METADATA_COLUMN_EXPRESSIONS: Record<string, string> = {
  scene_key: `event.streamId.replace(/^grip-attempt:/, "")`,
  attempt_num: "event.attemptNum",
  occurred_at: "event.occurredAt",
  stream_id: "event.streamId",
  global_seq: "event.globalSeq",
};

// 리프 종류 × 컬럼 종류 변환식. undefined = 타입이 어긋나 결정론 변환 불가(TODO 대상).
function leafAdaptedExpression(
  leaf: PayloadLeafAccess,
  kind: ColumnKind,
  isKeyColumn: boolean,
): string | undefined {
  const { expression, leafKind, optionalChain } = leaf;
  if (NUMERIC_COLUMN_KINDS.has(kind)) {
    if (leafKind === "number") {
      if (isKeyColumn) {
        return optionalChain ? `${expression} ?? 0` : expression;
      }
      return optionalChain ? `${expression} ?? null` : expression;
    }
    if (leafKind === "string") {
      return isKeyColumn
        ? `Number(${expression} ?? 0)`
        : `toNumberOrNull(${expression})`;
    }
    return undefined;
  }
  if (TEXT_COLUMN_KINDS.has(kind)) {
    if (leafKind === "string") {
      if (isKeyColumn) {
        return optionalChain ? `${expression} ?? ""` : expression;
      }
      return optionalChain ? `${expression} ?? null` : expression;
    }
    if (leafKind === "number") {
      return isKeyColumn
        ? `String(${expression} ?? "")`
        : `toStringOrNull(${expression})`;
    }
    return undefined;
  }
  if (kind === "timestamp") {
    if (leafKind === "string") {
      return isKeyColumn
        ? `toDateOrNull(${expression}) ?? event.occurredAt`
        : `toDateOrNull(${expression})`;
    }
    return undefined;
  }
  if (kind === "boolean") {
    if (leafKind === "number" && !optionalChain) {
      return `${expression} === 1`;
    }
    return undefined;
  }
  // jsonb 컬럼: 리프를 그대로 담는다(스칼라도 jsonb 로 유효).
  return optionalChain ? `${expression} ?? null` : expression;
}

const UNRESOLVED_TODO_TAG = "TODO(매핑 미해결)";

function unresolvedFallbackExpression(
  kind: ColumnKind,
  isKeyColumn: boolean,
): string {
  if (!isKeyColumn) {
    return "null";
  }
  if (TEXT_COLUMN_KINDS.has(kind)) {
    return `""`;
  }
  if (kind === "timestamp") {
    return "event.occurredAt";
  }
  return "0";
}

function planField(
  field: NewReadModelOutput["fields"][number],
  isKeyColumn: boolean,
  driftKeyNames: ReadonlySet<string>,
): FieldPlan {
  const kind = columnKindForDataType(field.dataType);
  const base = {
    fieldName: field.name,
    camelName: toCamelCase(field.name),
    kind,
    isKeyColumn,
    mapComment: null,
    aggregateRole: null,
  };

  const metadataExpression = METADATA_COLUMN_EXPRESSIONS[field.name];
  if (metadataExpression !== undefined) {
    return { ...base, mapExpression: metadataExpression };
  }

  const bucketExpression = timeBucketExpression(field.name, kind);
  if (bucketExpression !== undefined) {
    return { ...base, mapExpression: bucketExpression };
  }

  const aggregateRole = aggregateRoleForField(field.name, kind);
  if (aggregateRole !== null) {
    return {
      ...base,
      aggregateRole,
      mapExpression: AGGREGATE_MAP_EXPRESSIONS[aggregateRole],
    };
  }

  // payload drift 유입 키: toyDataSchema 에 없으므로 passthrough 색인 접근으로 읽는다.
  if (driftKeyNames.has(field.name)) {
    const rawAccess = `payload["${field.name}"]`;
    if (NUMERIC_COLUMN_KINDS.has(kind)) {
      return {
        ...base,
        mapExpression: isKeyColumn
          ? `Number(${rawAccess} ?? 0)`
          : `toNumberOrNull(${rawAccess})`,
      };
    }
    return {
      ...base,
      mapExpression: isKeyColumn
        ? `String(${rawAccess} ?? "")`
        : `toStringOrNull(${rawAccess})`,
    };
  }

  if (NUMERIC_COLUMN_KINDS.has(kind)) {
    const statisticExpression = poseStatisticExpression(field.name);
    if (statisticExpression !== undefined) {
      return { ...base, mapExpression: statisticExpression };
    }
  }

  const leaf = lookupPayloadLeaf(field.name);
  if (leaf !== undefined) {
    const adapted = leafAdaptedExpression(leaf, kind, isKeyColumn);
    if (adapted !== undefined) {
      return { ...base, mapExpression: adapted };
    }
  }

  return {
    ...base,
    mapExpression: unresolvedFallbackExpression(kind, isKeyColumn),
    mapComment: `// ${UNRESOLVED_TODO_TAG}: '${field.name}' 은 이벤트 payload 에서 결정론 유도 불가 — §2 투영 매핑 명세를 보고 직접 구현하라.`,
  };
}

// 합성 코드에서 매핑 미해결 컬럼 수를 세는 관측 지점(new-read-model.node 의 경고 로그용).
export function countUnresolvedMappings(projectorCode: string): number {
  return projectorCode.split(UNRESOLVED_TODO_TAG).length - 1;
}

interface UpsertSetPlan {
  expression: string;
  comment: string | null;
}

function upsertSetPlanForField(
  plan: FieldPlan,
  plans: FieldPlan[],
  schemaVariable: string,
): UpsertSetPlan {
  const overwrite: UpsertSetPlan = {
    expression: `row.${plan.camelName}`,
    comment: null,
  };
  if (plan.aggregateRole === null) {
    return overwrite;
  }

  const incrementExpression =
    "sql`${" +
    schemaVariable +
    "." +
    plan.camelName +
    "} + ${row." +
    plan.camelName +
    "}`";

  if (
    plan.aggregateRole === "attemptCount" ||
    plan.aggregateRole === "successCount" ||
    plan.aggregateRole === "failureCount"
  ) {
    return { expression: incrementExpression, comment: null };
  }

  // 비율 컬럼: 구성 건수 컬럼이 함께 설계돼 있어야 누적 비율을 계산할 수 있다.
  const totalPlan = plans.find((p) => p.aggregateRole === "attemptCount");
  const numeratorPlan = plans.find(
    (p) =>
      p.aggregateRole ===
      (plan.aggregateRole === "successRate" ? "successCount" : "failureCount"),
  );
  if (totalPlan === undefined || numeratorPlan === undefined) {
    return {
      expression: `row.${plan.camelName}`,
      comment: `// TODO(집계 미완성): 비율 누적에 필요한 건수 컬럼(총시도·${plan.aggregateRole === "successRate" ? "성공" : "실패"} 건수)이 설계에 없다 — 덮어쓰기는 최신 행 값일 뿐이니 보완하라.`,
    };
  }
  const rateExpression =
    "sql`(${" +
    schemaVariable +
    "." +
    numeratorPlan.camelName +
    "} + ${row." +
    numeratorPlan.camelName +
    "})::double precision / NULLIF(${" +
    schemaVariable +
    "." +
    totalPlan.camelName +
    "} + ${row." +
    totalPlan.camelName +
    "}, 0)`";
  return { expression: rateExpression, comment: null };
}

export function synthesizeProjectorCode(
  output: NewReadModelOutput,
  driftKeyNames: ReadonlySet<string> = new Set(),
): string {
  const { schemaVariable, className, projectorName } = namesForReadModel(
    output.proposedName,
  );
  const keyColumnNames = parseKeyColumnNames(output.keyColumns);

  const plans = output.fields.map((field) =>
    planField(field, keyColumnNames.includes(field.name), driftKeyNames),
  );

  const mapLines = plans.map((plan) => {
    const commentSuffix = plan.mapComment === null ? "" : ` ${plan.mapComment}`;
    return `      ${plan.camelName}: ${plan.mapExpression},${commentSuffix}`;
  });

  const nonKeyPlans = plans.filter((plan) => !plan.isKeyColumn);
  const upsertSetPlans = nonKeyPlans.map((plan) => ({
    plan,
    set: upsertSetPlanForField(plan, plans, schemaVariable),
  }));
  const conflictClause =
    nonKeyPlans.length === 0
      ? "      .onConflictDoNothing();"
      : [
          "      .onConflictDoUpdate({",
          `        target: [${keyColumnNames.map((column) => `${schemaVariable}.${toCamelCase(column)}`).join(", ")}],`,
          "        set: {",
          ...upsertSetPlans.map(({ plan, set }) => {
            const commentSuffix = set.comment === null ? "" : ` ${set.comment}`;
            return `          ${plan.camelName}: ${set.expression},${commentSuffix}`;
          }),
          "        },",
          "      });",
        ].join("\n");

  const generatedBody = [...mapLines, conflictClause].join("\n");
  const usesSqlTemplate = upsertSetPlans.some(({ set }) =>
    set.expression.startsWith("sql`"),
  );
  const drizzleImportLine = usesSqlTemplate
    ? "import { sql, type InferInsertModel } from 'drizzle-orm';"
    : "import { type InferInsertModel } from 'drizzle-orm';";

  const helperBlocks: string[] = [];
  if (generatedBody.includes("toNumberOrNull(")) {
    helperBlocks.push(
      [
        "function toNumberOrNull(value: unknown): number | null {",
        "  if (value === undefined || value === null) {",
        "    return null;",
        "  }",
        "  const parsed = Number(value);",
        "  return Number.isNaN(parsed) ? null : parsed;",
        "}",
        "",
      ].join("\n"),
    );
  }
  if (generatedBody.includes("toStringOrNull(")) {
    helperBlocks.push(
      [
        "function toStringOrNull(value: unknown): string | null {",
        "  return value === undefined || value === null ? null : String(value);",
        "}",
        "",
      ].join("\n"),
    );
  }
  if (generatedBody.includes("toDateOrNull(")) {
    helperBlocks.push(
      [
        "function toDateOrNull(value: unknown): Date | null {",
        '  if (typeof value !== "string" && typeof value !== "number") {',
        "    return null;",
        "  }",
        "  const parsed = new Date(value);",
        "  return Number.isNaN(parsed.getTime()) ? null : parsed;",
        "}",
        "",
      ].join("\n"),
    );
  }

  return [
    "import { Injectable } from '@nestjs/common';",
    drizzleImportLine,
    "import { PinoLogger } from 'nestjs-pino';",
    "import { toyDataSchema } from '@/insert/dto/toy-data.dto';",
    "import type { Projector } from '@/projection/projector/projector';",
    "import type { EventStoreEventRow } from '@/projection/repository/event-store-reader.repository';",
    "import { DrizzleTx } from '@/shared/database/drizzle.provider';",
    `import { ${schemaVariable} } from '@/shared/database/schema';`,
    "import { LogAction, LogContext } from '@/shared/logger/logging-context';",
    "",
    `type ${className}Insert = InferInsertModel<typeof ${schemaVariable}>;`,
    "",
    ...helperBlocks,
    "@Injectable()",
    `export class ${className} implements Projector<${className}Insert> {`,
    `  readonly name: string = "${projectorName}";`,
    "",
    "  constructor(private readonly logger: PinoLogger) {",
    `    this.logger.setContext(${className}.name);`,
    "  }",
    "",
    `  map(event: EventStoreEventRow): ${className}Insert {`,
    "    // 결정론 합성 프로젝터 — payload 접근 경로는 적재 스키마(ToyDataDto)에서 결정론",
    "    // 유도했다. 유도 불가 컬럼은 TODO 주석으로 남겼다(§2 투영 매핑 명세가 대조 계약).",
    "    const parsedPayload = toyDataSchema.passthrough().safeParse(event.payload);",
    "    if (!parsedPayload.success) {",
    "      this.logger.error(",
    "        {",
    "          action: LogAction.MAP_FAILED,",
    "          [LogContext.STREAM_ID]: event.streamId,",
    "          [LogContext.GLOBAL_SEQ]: event.globalSeq,",
    "        },",
    '        "이벤트 매핑(검증) 실패",',
    "      );",
    "      throw parsedPayload.error;",
    "    }",
    "    const payload = parsedPayload.data;",
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

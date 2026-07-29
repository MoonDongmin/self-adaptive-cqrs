import { AnalysisState } from "@/analysis/analysis.state";
import { readSourceExamples } from "@/analysis/context/source-examples";
import { invokeNode } from "@/analysis/nodes/invoke";
import {
  NEW_READ_MODEL_PROMPT,
  NEW_READ_MODEL_SENSOR_ADDENDUM,
} from "@/analysis/prompts";
import {
  INSIGHT_CARDS_CAVEAT,
  renderEvidenceContext,
  renderRootCause,
  stripInsightCardExamples,
} from "@/analysis/render";
import {
  NewReadModelOutput,
  newReadModelOutputSchema,
} from "@/analysis/type/output.type";
import { validateSqlExecutable } from "@/analysis/validation/sql-validator";
import { validateGeneratedTypeScript } from "@/analysis/validation/typescript-validator";
import type { AnomalyLogWindow } from "@/llm-context/llm-context.type";

// payload drift 로 유입된 신규 키를 로그 detail 의 newKeys 에서 읽는다.
// 형식: newKeys={"conveyor_speed": "1.2", "gripper_temperature": "36.5"}
function extractDriftKeys(
  window: AnomalyLogWindow | null,
): Map<string, string> {
  const driftKeys = new Map<string, string>();
  for (const row of window?.rows ?? []) {
    if (row.action !== "payload.schema.drift" || row.detail === null) {
      continue;
    }
    const newKeysMatch = row.detail.match(/newKeys=(\{.*\})/);
    if (newKeysMatch === null) {
      continue;
    }
    try {
      const parsed: unknown = JSON.parse(newKeysMatch[1]);
      if (typeof parsed !== "object" || parsed === null) {
        continue;
      }
      for (const [key, value] of Object.entries(parsed)) {
        driftKeys.set(key, String(value));
      }
    } catch {
      // 파싱 실패한 detail 은 무시한다 — 검증기가 없는 것과 동일하게 동작.
    }
  }
  return driftKeys;
}

// drift 키를 원천으로 삼는 신규 컬럼이 있으면, toyDataSchema 확장이 controllerWiring 에
// 반드시 실려야 한다 — 없으면 toyDataSchema.parse 가 그 키를 strip 해서 프로젝터의
// payload.<키> 가 영원히 undefined 이고 신규 컬럼이 빈 채로 남는다. 프롬프트 규칙 12 로
// 지시했으나 gpt-4o-mini 가 누락했다(2026-07-29 fix-verify: A1·E1 재현) — 결정론 검증기로 승격.
function findMissingZodExtensions(
  output: NewReadModelOutput,
  driftKeys: Map<string, string>,
): string[] {
  const fieldNames = new Set(
    output.fields.map((field) => camelToSnakeCase(field.name)),
  );
  return [...driftKeys.keys()].filter(
    (key) =>
      fieldNames.has(camelToSnakeCase(key)) &&
      !output.controllerWiring.includes(key),
  );
}

// 값이 따옴표에 싸인 수치("36.5")면 z.coerce.number() 로 받아야 parse 가 통과한다.
function zodExpressionForDriftValue(value: string): string {
  return Number.isNaN(Number(value))
    ? "z.string().optional()"
    : "z.coerce.number().optional()";
}

// 재질의 소진 후의 결정론 보정: 누락된 zod 확장을 controllerWiring 끝에 덧붙인다.
// 값은 로그 newKeys 에서만 유도한다(발명 없음).
function appendZodExtensionWiring(
  controllerWiring: string,
  missingKeys: string[],
  driftKeys: Map<string, string>,
): string {
  const lines = missingKeys.map(
    (key) =>
      `  ${key}: ${zodExpressionForDriftValue(driftKeys.get(key) ?? "")},`,
  );
  return [
    controllerWiring,
    "",
    "// src/insert/dto/toy-data.dto.ts — payload drift 유입 키를 적재 스키마에 추가한다.",
    "// 이 확장이 없으면 toyDataSchema.parse 가 키를 strip 해 신규 컬럼이 영원히 빈다.",
    "// (기존 정상 payload 를 깨뜨리지 않도록 반드시 optional 이다.)",
    "export const toyDataSchema = baseToyDataSchema.extend({",
    ...lines,
    "});",
  ].join("\n");
}

// 생성 산출물의 의미 검증: migrationSql 은 실DB(BEGIN/ROLLBACK)로, drizzleSchema/
// projectorCode 는 임시 트리 tsc 로 "그대로 실행/컴파일되는가"를 확인하고, 실패 시
// 오류를 모델에 보여주며 재생성시킨다(2026-07-21 3축 채점: 축2 전멸의 대응).
async function validateNewReadModelOutput(
  output: NewReadModelOutput,
  driftKeys: Map<string, string>,
): Promise<string[]> {
  const problems: string[] = [];

  const sqlError = await validateSqlExecutable(output.migrationSql);
  if (sqlError !== null) {
    problems.push(`migrationSql 이 실제 DB 에서 실행 실패: ${sqlError}`);
  }

  const missingZodExtensions = findMissingZodExtensions(output, driftKeys);
  if (missingZodExtensions.length > 0) {
    problems.push(
      `controllerWiring 에 toy-data.dto.ts 의 zod 스키마 확장이 없다(누락 키: ${missingZodExtensions.join(", ")}) — ` +
        "이 확장이 빠지면 toyDataSchema.parse 가 해당 키를 strip 해서 신규 컬럼이 영원히 빈다. " +
        "각 키를 `.optional()` 로 추가하는 확장 코드를 controllerWiring 에 포함하라" +
        "(문자열로 감싸인 수치는 z.coerce.number().optional()).",
    );
  }

  // 키 컬럼은 fields 에 반드시 정의돼야 한다 — 빠지면 DDL 합성 시 '정의 안 된 컬럼을
  // PK 로 지정'하는 깨진 SQL 이 된다(2026-07-21 E1 실측). 스키마 자체 결함이므로 재생성 대상.
  // 비교는 snake 정규화 후에 한다 — sceneKey 표기는 이름 결함(정규화로 수리)이지
  // 키 컬럼 누락이 아니다. 표기 문제로 re-ask 를 소진하지 않는다(2026-07-23 A4 실측).
  const keyColumnNames = parseKeyColumnNames(output.keyColumns);
  const fieldNames = new Set(
    output.fields.map((field) => camelToSnakeCase(field.name)),
  );
  const missingKeyColumns = keyColumnNames.filter(
    (column) => !fieldNames.has(camelToSnakeCase(column)),
  );
  if (missingKeyColumns.length > 0) {
    problems.push(
      `keyColumns 의 ${missingKeyColumns.join(", ")} 가 fields 목록에 정의되지 않았다 — ` +
        "모든 키 컬럼을 fields 에 (이름·타입·의미와 함께) 포함해 다시 출력하라.",
    );
  }

  const kebabName = output.proposedName.replace(/_/g, "-");
  const compileError = await validateGeneratedTypeScript(
    [
      {
        relativePath: `src/shared/database/schema/service/${kebabName}.ts`,
        content: output.drizzleSchema,
      },
      {
        relativePath: `src/projection/projector/${kebabName}.projector.ts`,
        content: output.projectorCode,
      },
    ],
    [`export * from "./service/${kebabName}";`],
  );
  if (compileError !== null) {
    problems.push(
      `drizzleSchema/projectorCode 를 실제 경로에 놓고 tsc 로 컴파일한 결과 실패:\n${compileError}`,
    );
  }

  return problems;
}

// migrationSql 결정론 보장: LLM 이 DDL 컬럼 목록을 생략(`CREATE TABLE x (...)`)하거나
// fields 와 어긋난 DDL 을 내면(2026-07-21 gpt-4o-mini 실측), 이미 검증된 fields/keyColumns
// 에서 CREATE TABLE 을 합성해 교체한다 — §2 DDL 과 mschema 필드 표가 같은 소스에서 나와
// 항상 일치하고, 그대로 실행 가능해진다.
function isMigrationSqlComplete(output: NewReadModelOutput): boolean {
  const sql = output.migrationSql;
  if (!sql.includes("CREATE TABLE") || !sql.includes(output.proposedName)) {
    return false;
  }
  // PK/UNIQUE 없는 DDL 은 실행은 되지만 projector 의 onConflictDoUpdate(upsert 키)가
  // 첫 투영에서 죽는다 — 실행 가능성 검증(BEGIN/ROLLBACK)이 못 잡는 설계 결함이다
  // (2026-07-23 A5 실측: 컬럼 완전·snake_case 정상인데 PRIMARY KEY 절만 누락).
  if (!/PRIMARY\s+KEY|UNIQUE/i.test(sql)) {
    return false;
  }
  return output.fields.every((field) => sql.includes(field.name));
}

function parseKeyColumnNames(keyColumns: string): string[] {
  return keyColumns
    .replace(/[()]/g, "")
    .split(",")
    .map((column) => column.trim())
    .filter((column) => column.length > 0);
}

// 로컬 27b-coder 는 fields.name 을 camelCase(sceneKey)로 내는 경향이 있다
// (2026-07-23 A4 실측 3회: 키 컬럼 검증이 scene_key 를 못 찾아 재시도 소진 →
// 폴백 DDL 에 sceneKey/scene_key 이중 컬럼). 컬럼명은 결정론 정규화로 확정한다.
function camelToSnakeCase(name: string): string {
  return name.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase();
}

function normalizeFieldNames(output: NewReadModelOutput): NewReadModelOutput {
  return {
    ...output,
    fields: output.fields.map((field) => ({
      ...field,
      name: camelToSnakeCase(field.name),
    })),
  };
}

function synthesizeMigrationSql(output: NewReadModelOutput): string {
  const keyColumnNames = parseKeyColumnNames(output.keyColumns);

  const columnLines = output.fields.map((field) => {
    const notNull = keyColumnNames.includes(field.name) ? " NOT NULL" : "";
    return `  ${field.name} ${field.dataType}${notNull},`;
  });

  // 키 컬럼이 fields 에 빠졌으면 보충한다 — 없으면 '정의 안 된 컬럼을 PK 로 지정'하는
  // 깨진 DDL 이 된다(2026-07-21 E1 실측: PRIMARY KEY (object_name)인데 컬럼 미정의).
  const fieldNames = new Set(output.fields.map((field) => field.name));
  for (const keyColumn of keyColumnNames) {
    if (!fieldNames.has(keyColumn)) {
      const inferredType = /(_num|_count|number)$/.test(keyColumn)
        ? "smallint"
        : "varchar";
      columnLines.push(`  ${keyColumn} ${inferredType} NOT NULL,`);
    }
  }

  return [
    `CREATE TABLE ${output.proposedName} (`,
    ...columnLines,
    `  PRIMARY KEY (${keyColumnNames.join(", ")})`,
    ");",
  ].join("\n");
}

export async function newReadModelNode(state: typeof AnalysisState.State) {
  // 센서 경로 지시는 sensorFinding 이 실재할 때만 주입 — 상주 시 로그 경로에서 예시 복제(앵커링) 유발.
  const rolePrompt: string =
    state.sensorFinding !== null
      ? [NEW_READ_MODEL_PROMPT, NEW_READ_MODEL_SENSOR_ADDENDUM].join("\n\n")
      : NEW_READ_MODEL_PROMPT;

  const facts = [
    renderRootCause(state.rootCause!),
    renderEvidenceContext(state.window, state.sensorFinding),
    `## 도메인 스키마(Insight 카드)\n${stripInsightCardExamples(state.insightCards)}\n${INSIGHT_CARDS_CAVEAT}`,
    await readSourceExamples(),
  ].join("\n\n");

  const driftKeys = extractDriftKeys(state.window);

  try {
    const newReadModel = normalizeFieldNames(
      await invokeNode(
        rolePrompt,
        facts,
        newReadModelOutputSchema,
        async (output) => validateNewReadModelOutput(output, driftKeys),
      ),
    );

    // 재질의 소진 후에도 zod 확장이 빠졌으면 결정론으로 보충한다 — 이것이 없으면
    // 신규 Read Model 이 구조만 있고 값이 영원히 안 들어오는 문서가 된다.
    const missingZodExtensions = findMissingZodExtensions(
      newReadModel,
      driftKeys,
    );
    if (missingZodExtensions.length > 0) {
      console.warn(
        "[newReadModelNode] zod 확장 누락 — controllerWiring 에 결정론 보충:",
        missingZodExtensions,
      );
      newReadModel.controllerWiring = appendZodExtensionWiring(
        newReadModel.controllerWiring,
        missingZodExtensions,
        driftKeys,
      );
    }

    if (!isMigrationSqlComplete(newReadModel)) {
      console.warn(
        "[newReadModelNode] migrationSql 불완전(컬럼 생략/누락) — fields 로부터 결정론 합성으로 교체",
      );
      newReadModel.migrationSql = synthesizeMigrationSql(newReadModel);

      // 합성 결과도 실DB 로 재검증한다 — 합성 입력(fields/keyColumns) 자체가 결함이면
      // 합성 DDL 도 깨질 수 있다(2026-07-21 E1 실측). 실패는 흔적을 남긴다.
      const synthesizedSqlError = await validateSqlExecutable(
        newReadModel.migrationSql,
      );
      if (synthesizedSqlError !== null) {
        console.warn(
          "[newReadModelNode] 합성 migrationSql 도 실행 실패:",
          synthesizedSqlError,
        );
      }
    }

    return { outputs: { newReadModel } };
  } catch (error) {
    // 강등이 문서 전체를 센티넬로 만들 수 있으므로 반드시 흔적을 남긴다(dataQualityNode 와 동일).
    console.warn("[newReadModelNode] 생성/검증 실패로 강등:", String(error));
    return { outputs: {} };
  }
}

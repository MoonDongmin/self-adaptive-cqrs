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
  countUnresolvedMappings,
  synthesizeDrizzleSchema,
  synthesizeProjectorCode,
} from "@/analysis/nodes/typescript-synthesis";
import { toyDataSchema } from "@/insert/dto/toy-data.dto";
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
      // 키 이름의 단순 존재가 아니라 `<키>: z.…` 확장 코드의 실재를 요구한다 —
      // includes(key) 는 키가 라우트·주석에만 등장해도 통과해서 확장 없는 문서가
      // 새나갔다(2026-08-02 k5 실측: A1 rep-3 — 산문에는 z.coerce 언급, 배선 코드에는 부재).
      !new RegExp(`["']?${key}["']?\\s*:\\s*z\\.`).test(
        output.controllerWiring,
      ),
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

// projectorCode 가 이벤트 payload 에 실재하지 않는 키를 읽으면 그 컬럼은 컴파일·실행
// 모두 통과하면서 영원히 null 로 채워진다(2026-08-09 100런 품질 리뷰: E4 rep-2/3 의
// payload["date_key"] 류 — 집계 테이블이 통째로 무의미해지는 조용한 실패). 접근하는
// 최상위 키가 적재 스키마(ToyDataDto) 또는 drift 유입 키에 실재하는지 결정론 검증한다.
function findUnknownPayloadKeys(
  projectorCode: string,
  driftKeys: Map<string, string>,
): string[] {
  const knownTopLevelKeys = new Set([
    ...Object.keys(toyDataSchema.shape),
    ...driftKeys.keys(),
  ]);
  // `payload.foo` / `payload?.foo` / `payload["foo"]` 의 첫 세그먼트만 본다 —
  // 중첩 경로(payload.grip_data.…)는 첫 세그먼트가 실재하면 tsc 가 나머지를 검증한다.
  const accessPattern =
    /(?<![A-Za-z0-9_$])payload(?:\??\.([A-Za-z_$][A-Za-z0-9_$]*)|\[["']([^"'\]]+)["']\])/g;
  const unknownKeys = new Set<string>();
  for (const match of projectorCode.matchAll(accessPattern)) {
    const key = match[1] ?? match[2];
    if (key !== undefined && !knownTopLevelKeys.has(key)) {
      unknownKeys.add(key);
    }
  }
  return [...unknownKeys];
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

  // DDL 테이블명과 ORM 테이블명이 어긋나면 부속 코드를 복사한 개발자가 서로 다른
  // 테이블을 만들게 된다(2026-08-09 100런 품질 리뷰: E3·E5 의 _v1/_v2 접미사 누락 4건).
  const pgTableName = output.drizzleSchema.match(
    /pgTable\(\s*["']([^"']+)["']/,
  )?.[1];
  if (pgTableName !== undefined && pgTableName !== output.proposedName) {
    problems.push(
      `drizzleSchema 의 pgTable 테이블명("${pgTableName}")이 proposedName("${output.proposedName}")과 다르다 — ` +
        "DDL 이 만드는 테이블과 ORM 이 참조하는 테이블이 어긋난다. 두 이름을 동일하게 맞춰라.",
    );
  }

  const unknownPayloadKeys = findUnknownPayloadKeys(
    output.projectorCode,
    driftKeys,
  );
  if (unknownPayloadKeys.length > 0) {
    problems.push(
      `projectorCode 가 이벤트 payload 에 존재하지 않는 키를 읽는다: ${unknownPayloadKeys.join(", ")}. ` +
        `실제 payload 최상위 키는 ${Object.keys(toyDataSchema.shape).join(", ")} 이고 ` +
        "센서 값은 grip_data.grip_3d_pose.z1 처럼 중첩 경로다. DB 컬럼명을 payload 키로 쓰지 마라 — " +
        "집계·파생 컬럼은 이벤트 값에서 계산해야 한다(예: total_attempts 는 행마다 1 을 증분).",
    );
  }

  // Postgres upsert 의 excluded 는 함수가 아니고 컬럼명은 snake_case 다 — camelCase
  // 참조는 두 번째 이벤트(충돌 시점)부터 런타임 오류를 낸다(E4 rep-5·E2 rep-4 실측).
  if (/excluded\s*\(|excluded\.[a-z_$]*[A-Z]/.test(output.projectorCode)) {
    problems.push(
      "projectorCode 의 upsert 에서 excluded 참조가 잘못됐다 — excluded 는 함수가 아니며 " +
        "컬럼명은 snake_case 다. drizzle 에선 sql 템플릿으로 `테이블.컬럼 + row 값` 증분 패턴을 쓰라.",
    );
  }

  const compileError = await validateGeneratedTypeScriptOf(output);
  if (compileError !== null) {
    problems.push(
      `drizzleSchema/projectorCode 를 실제 경로에 놓고 tsc 로 컴파일한 결과 실패:\n${compileError}`,
    );
  }

  return problems;
}

// drizzleSchema/projectorCode 를 의도된 실제 경로에 놓고 컴파일하는 공통 진입점 —
// 의미 검증(재질의 루프)과 합성 폴백 전후 검증이 같은 기준을 쓴다.
async function validateGeneratedTypeScriptOf(
  output: NewReadModelOutput,
): Promise<string | null> {
  const kebabName = output.proposedName.replace(/_/g, "-");
  return validateGeneratedTypeScript(
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
}

function firstLineOf(text: string): string {
  return text.split("\n")[0] ?? text;
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

    // TS 결정론 보장: 재질의 소진 후에도 컴파일 불능이거나 payload 키가 실재하지 않으면
    // migrationSql 합성과 동형으로 fields/keyColumns 에서 스키마·프로젝터를 템플릿 합성해
    // 교체한다(2026-08-02 k5 실측: TS 실패 12건 중 9건이 numeric↔number 단일 유형.
    // 2026-08-09 100런 품질 리뷰: 존재하지 않는 payload 키 접근은 컴파일을 통과하므로
    // 컴파일 검사만으로는 못 잡는다 — 의미 검증과 같은 기준으로 교체를 판단한다).
    const finalCompileError = await validateGeneratedTypeScriptOf(newReadModel);
    const finalUnknownPayloadKeys = findUnknownPayloadKeys(
      newReadModel.projectorCode,
      driftKeys,
    );
    if (finalCompileError !== null || finalUnknownPayloadKeys.length > 0) {
      console.warn(
        "[newReadModelNode] 생성 TS 결함 — fields 로부터 결정론 합성으로 교체:",
        finalCompileError !== null
          ? firstLineOf(finalCompileError)
          : `존재하지 않는 payload 키 접근: ${finalUnknownPayloadKeys.join(", ")}`,
      );
      newReadModel.drizzleSchema = synthesizeDrizzleSchema(newReadModel);
      newReadModel.projectorCode = synthesizeProjectorCode(
        newReadModel,
        new Set(driftKeys.keys()),
      );

      const unresolvedMappingCount = countUnresolvedMappings(
        newReadModel.projectorCode,
      );
      if (unresolvedMappingCount > 0) {
        console.warn(
          `[newReadModelNode] 합성 프로젝터에 매핑 미해결 컬럼 ${unresolvedMappingCount}개 — 문서의 TODO 주석 확인 필요`,
        );
      }

      const synthesizedCompileError =
        await validateGeneratedTypeScriptOf(newReadModel);
      if (synthesizedCompileError !== null) {
        console.warn(
          "[newReadModelNode] 합성 TS 도 컴파일 실패:",
          synthesizedCompileError,
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

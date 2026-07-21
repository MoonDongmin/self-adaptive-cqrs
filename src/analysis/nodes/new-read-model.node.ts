import { AnalysisState } from '@/analysis/analysis.state';
import { readSourceExamples } from '@/analysis/context/source-examples';
import { invokeNode } from '@/analysis/nodes/invoke';
import { NEW_READ_MODEL_PROMPT, NEW_READ_MODEL_SENSOR_ADDENDUM } from '@/analysis/prompts';
import {
  INSIGHT_CARDS_CAVEAT,
  renderEvidenceContext,
  renderRootCause,
  stripInsightCardExamples,
} from '@/analysis/render';
import { NewReadModelOutput, newReadModelOutputSchema } from '@/analysis/type/output.type';
import { validateSqlExecutable } from '@/analysis/validation/sql-validator';
import { validateGeneratedTypeScript } from '@/analysis/validation/typescript-validator';

// 생성 산출물의 의미 검증: migrationSql 은 실DB(BEGIN/ROLLBACK)로, drizzleSchema/
// projectorCode 는 임시 트리 tsc 로 "그대로 실행/컴파일되는가"를 확인하고, 실패 시
// 오류를 모델에 보여주며 재생성시킨다(2026-07-21 3축 채점: 축2 전멸의 대응).
async function validateNewReadModelOutput(
  output: NewReadModelOutput,
): Promise<string[]> {
  const problems: string[] = [];

  const sqlError = await validateSqlExecutable(output.migrationSql);
  if (sqlError !== null) {
    problems.push(`migrationSql 이 실제 DB 에서 실행 실패: ${sqlError}`);
  }

  // 키 컬럼은 fields 에 반드시 정의돼야 한다 — 빠지면 DDL 합성 시 '정의 안 된 컬럼을
  // PK 로 지정'하는 깨진 SQL 이 된다(2026-07-21 E1 실측). 스키마 자체 결함이므로 재생성 대상.
  const keyColumnNames = parseKeyColumnNames(output.keyColumns);
  const fieldNames = new Set(output.fields.map((field) => field.name));
  const missingKeyColumns = keyColumnNames.filter(
    (column) => !fieldNames.has(column),
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
  return output.fields.every((field) => sql.includes(field.name));
}

function parseKeyColumnNames(keyColumns: string): string[] {
  return keyColumns
    .replace(/[()]/g, "")
    .split(",")
    .map((column) => column.trim())
    .filter((column) => column.length > 0);
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

  try {
    const newReadModel = await invokeNode(
      rolePrompt,
      facts,
      newReadModelOutputSchema,
      validateNewReadModelOutput,
    );

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

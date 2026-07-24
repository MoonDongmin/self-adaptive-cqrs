import { Pool } from 'pg';

// 생성 SQL 의 실행 가능성 검증기. 실제 Postgres 에 BEGIN → 실행 → ROLLBACK 으로
// 흘려보내 문법 오류·없는 컬럼/테이블·타입 오류를 생성 시점에 잡는다 — 형태(zod) 검증만
// 통과한 "그럴듯하지만 깨진 SQL"(camelCase 컬럼, 따옴표 누락, 없는 테이블)이 문서에
// 실리는 것을 막는다(2026-07-21 3축 채점 실측: 실패 SQL 전원이 이 부류).
// ROLLBACK 으로 감싸므로 평가 DB 상태는 절대 변하지 않는다.

let pool: Pool | null = null;

function getPool(): Pool {
  if (pool === null) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 1,
    });
  }
  return pool;
}

// SQL 로 보이는 문자열인지 — TS 코드가 섞인 codeOrSql 필드에 오검증을 걸지 않기 위한 판별.
export function looksLikeSql(text: string): boolean {
  const head = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("--"))[0];
  if (head === undefined) {
    return false;
  }
  return /^(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|WITH)\b/i.test(head);
}

// 실행 가능하면 null, 실패하면 Postgres 에러 메시지를 반환한다.
// setupSql: 검증 대상이 전제하는 선행 DDL(예: co-select 된 신규 Read Model 의
// migrationSql). 같은 트랜잭션에서 먼저 적용해 "§2 CREATE 뒤에 실행하면 유효한"
// fix/harden SQL 이 단독 검증에서 오탐(relation does not exist)으로 기각되는 것을
// 막는다(2026-07-21 A6 실측). setupSql 자체의 실패는 대상 SQL 의 결함이 아니므로 무시.
export async function validateSqlExecutable(
  sql: string,
  setupSql?: string,
): Promise<string | null> {
  const trimmed = sql.trim();
  if (trimmed.length === 0) {
    return null;
  }

  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    if (setupSql !== undefined && setupSql.trim().length > 0) {
      try {
        await client.query(setupSql);
      } catch {
        // 선행 DDL 은 자기 노드(new-read-model)에서 이미 검증된다 — 여기서는 무시
      }
    }
    await client.query(trimmed);
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  } finally {
    try {
      await client.query("ROLLBACK");
    } catch {
      // 연결이 이미 죽은 경우 — release 가 정리한다
    }
    client.release();
  }
}

#!/usr/bin/env node
// 층2 Docs SQL 적용 가능성 검증기.
//
// 수집된 Docs(.md)의 ```sql 블록을 문서 순서대로 실제 Postgres 에 흘려보내
// "사람이 이 문서를 그대로 따라 하면 SQL 이 실행되는가"를 측정한다.
// 문서당 BEGIN 하나로 감싸고 블록마다 SAVEPOINT 를 잡아, 앞 블록이 만든 테이블에
// 뒤 블록이 INSERT 하는 의존성은 재현하되 실패 블록은 다음 블록 검증을 막지 않는다.
// 마지막에 전체 ROLLBACK — 평가 DB 상태는 절대 변하지 않는다.
//
// 사용: node scripts/eval/verify-layer2-sql.mjs --results scripts/eval/results/<dir>

import { promises as fs, readFileSync } from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const SCRIPT_DIRECTORY = path.dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = path.resolve(SCRIPT_DIRECTORY, "..", "..");

function loadEnvFile() {
  try {
    const text = readFileSync(path.join(REPOSITORY_ROOT, ".env"), "utf8");
    const entries = {};
    for (const line of text.split("\n")) {
      const match = /^([A-Z_]+)=(.*)$/.exec(line.trim());
      if (match) {
        entries[match[1]] = match[2];
      }
    }
    return entries;
  } catch {
    return {};
  }
}

const dotEnvironment = loadEnvFile();
const DATABASE_URL =
  process.env.DATABASE_URL ?? dotEnvironment.DATABASE_URL ?? "postgresql://cqrs:cqrs@localhost:65432/cqrs";

function extractSqlBlocks(markdown) {
  const blocks = [];
  const pattern = /```sql\n([\s\S]*?)```/g;
  let match;
  while ((match = pattern.exec(markdown)) !== null) {
    const sql = match[1].trim();
    if (sql.length > 0) {
      blocks.push(sql);
    }
  }
  return blocks;
}

async function verifyDocument(database, filePath) {
  const markdown = await fs.readFile(filePath, "utf8");
  const blocks = extractSqlBlocks(markdown);
  const results = [];

  await database.query("BEGIN");
  try {
    for (let i = 0; i < blocks.length; i++) {
      await database.query(`SAVEPOINT block_${i}`);
      try {
        await database.query(blocks[i]);
        results.push({ index: i, ok: true, error: null });
      } catch (error) {
        await database.query(`ROLLBACK TO SAVEPOINT block_${i}`);
        results.push({
          index: i,
          ok: false,
          error: error.message,
          sqlHead: blocks[i].split("\n").find((line) => line.trim() && !line.trim().startsWith("--"))?.slice(0, 120) ?? "",
        });
      }
    }

    // 2차 패스: §1 의 fix/재투영 SQL 이 §2 DDL(문서상 뒤 블록)을 전제하는 경우가 있다.
    // 전체 블록 적용 후 실패 블록만 재시도해 '순서 의존(뒤 DDL 전제 시 유효)'을
    // '실행 불가'와 구분한다 — 문서를 통으로 따라 하면 결국 성립하는 SQL 이다.
    for (const result of results) {
      if (result.ok) {
        continue;
      }
      await database.query(`SAVEPOINT retry_${result.index}`);
      try {
        await database.query(blocks[result.index]);
        result.ok = true;
        result.orderDependent = true;
      } catch {
        await database.query(`ROLLBACK TO SAVEPOINT retry_${result.index}`);
      }
    }
  } finally {
    await database.query("ROLLBACK");
  }
  return { blocks: blocks.length, results };
}

async function main() {
  const args = process.argv.slice(2);
  const flagIndex = args.indexOf("--results");
  if (flagIndex === -1) {
    console.error("사용: node scripts/eval/verify-layer2-sql.mjs --results <dir>");
    process.exit(1);
  }
  const resultsDirectory = path.resolve(args[flagIndex + 1]);

  const database = new pg.Client({ connectionString: DATABASE_URL });
  await database.connect();

  const rows = [];
  const scenarioDirectories = (await fs.readdir(resultsDirectory, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  for (const scenarioId of scenarioDirectories) {
    const scenarioDirectory = path.join(resultsDirectory, scenarioId);
    const repDirectories = (await fs.readdir(scenarioDirectory, { withFileTypes: true }))
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();

    for (const repName of repDirectories) {
      const repDirectory = path.join(scenarioDirectory, repName);
      const documents = (await fs.readdir(repDirectory)).filter((name) => name.endsWith(".md"));
      for (const fileName of documents) {
        const { blocks, results } = await verifyDocument(database, path.join(repDirectory, fileName));
        const failed = results.filter((result) => !result.ok);
        const orderDependent = results.filter((result) => result.orderDependent === true);
        rows.push({ scenarioId, rep: repName, file: fileName, blocks, failedBlocks: failed, orderDependentBlocks: orderDependent });
      }
    }
  }

  console.log("Docs SQL 적용 가능성 검증:");
  for (const row of rows) {
    const passed = row.blocks - row.failedBlocks.length;
    const mark = row.failedBlocks.length === 0 ? "✓" : "✗";
    const orderNote =
      row.orderDependentBlocks.length > 0
        ? ` (순서 의존 ${row.orderDependentBlocks.length}개 — 뒤 DDL 선행 시 유효)`
        : "";
    console.log(`  ${mark} ${row.scenarioId}/${row.rep} ${row.file} — SQL 블록 ${passed}/${row.blocks} 실행 가능${orderNote}`);
    for (const failure of row.failedBlocks) {
      console.log(`      블록[${failure.index}] ${failure.sqlHead}`);
      console.log(`        → ${failure.error}`);
    }
  }

  const totalBlocks = rows.reduce((sum, row) => sum + row.blocks, 0);
  const totalFailed = rows.reduce((sum, row) => sum + row.failedBlocks.length, 0);
  console.log(
    `\n합계: 문서 ${rows.length}건 / SQL 블록 ${totalBlocks}개 중 실행 가능 ${totalBlocks - totalFailed}개 (${totalBlocks === 0 ? "-" : Math.round(((totalBlocks - totalFailed) / totalBlocks) * 100)}%)`,
  );

  const reportPath = path.join(
    resultsDirectory,
    `sql-verification-${new Date().toISOString().replace(/[:.]/g, "-")}.json`,
  );
  await fs.writeFile(reportPath, JSON.stringify(rows, null, 2));
  console.log(`결과 저장: ${path.relative(REPOSITORY_ROOT, reportPath)}`);

  await database.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

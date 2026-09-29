#!/usr/bin/env node
// 층3(다운스트림 효과) 자동 채점기.
//
// run-layer3-downstream.mjs 의 산출물(answer-<조건>-<과제>.md)을 조건별로 채점한다.
//   T1 진단      : 시나리오 앵커(diagnosisAnchors) 그룹 전부 충족 → 통과
//   T2 SQL       : ```sql 블록을 실 Postgres 에 실행(BEGIN/SAVEPOINT) — 블록 1개 이상 & 전부 성공 → 통과
//   T3 파생 질의 : T2 블록 적용 후 같은 트랜잭션에서 T3 블록 실행, 마지막 블록이 결과 집합을 반환하고
//                  결과 컬럼명이 derivedColumnAnchors 를 충족 → 통과 (행 수는 참고로만 기록)
//   T4 호환성    : VERSIONING_CHECKLIST 3항목 중 2개 이상 → 통과
// 트랜잭션은 마지막에 전부 ROLLBACK — 평가 DB 상태는 변하지 않는다.
//
// 사용: node scripts/eval/verify-layer3.mjs --results scripts/eval/results/<dir>

import { promises as fs, readFileSync, existsSync } from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { SCENARIO_TASKS, TASK_IDS, VERSIONING_CHECKLIST } from "./layer3-tasks.mjs";

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

function stripThinking(text) {
  return text.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
}

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

// v1 자산 무손상 제약: 기존 테이블에 대한 ALTER/DROP/TRUNCATE 는 실행돼도 위반이다.
const V1_ASSET_TABLES = ["read_grip_result", "read_multimodal", "event_store", "projection_cursor"];
const V1_ASSET_PATTERN = new RegExp(
  `\\b(ALTER|DROP|TRUNCATE)\\s+TABLE\\s+(?:IF\\s+EXISTS\\s+)?(?:ONLY\\s+)?(?:public\\.)?(${V1_ASSET_TABLES.join("|")})\\b`,
  "gi",
);
function findV1AssetViolations(blocks) {
  const violations = [];
  blocks.forEach((sql, index) => {
    const withoutComments = sql.replace(/--[^\n]*/g, "");
    for (const match of withoutComments.matchAll(V1_ASSET_PATTERN)) {
      violations.push({ block: index, statement: match[1].toUpperCase(), table: match[2] });
    }
  });
  return violations;
}

function anchorsSatisfied(text, anchorGroups) {
  const lowered = text.toLowerCase();
  return anchorGroups.map((group) => ({
    group,
    hit: group.find((anchor) => lowered.includes(anchor.toLowerCase())) ?? null,
  }));
}

async function runBlocks(database, blocks, label) {
  const results = [];
  for (let i = 0; i < blocks.length; i++) {
    const savepoint = `${label}_${i}`;
    await database.query(`SAVEPOINT ${savepoint}`);
    try {
      const queryResult = await database.query(blocks[i]);
      const last = Array.isArray(queryResult) ? queryResult[queryResult.length - 1] : queryResult;
      results.push({
        index: i,
        ok: true,
        rowCount: last?.rowCount ?? null,
        columns: last?.fields?.map((field) => field.name) ?? [],
      });
    } catch (error) {
      await database.query(`ROLLBACK TO SAVEPOINT ${savepoint}`);
      // T3 가 T2 의 CREATE 를 다시 내면 같은 트랜잭션이라 already exists — 중복 재선언은 실패로 세지 않는다.
      const duplicateCreate = /already exists/.test(error.message) && /^\s*CREATE\s+(TABLE|INDEX|VIEW)/i.test(blocks[i]);
      results.push({
        index: i,
        ok: false,
        duplicateCreate,
        error: error.message,
        sqlHead: blocks[i].split("\n").find((line) => line.trim() && !line.trim().startsWith("--"))?.slice(0, 120) ?? "",
      });
    }
  }
  return results;
}

async function readAnswer(unitDirectory, condition, taskId) {
  const answerPath = path.join(unitDirectory, `answer-${condition}-${taskId}.md`);
  if (!existsSync(answerPath)) {
    return null;
  }
  return stripThinking(await fs.readFile(answerPath, "utf8"));
}

async function scoreUnit(database, unitDirectory, scenarioId, condition, answersMeta) {
  const scenarioTask = SCENARIO_TASKS[scenarioId];
  const score = { condition, tasks: {} };

  const diagnosis = await readAnswer(unitDirectory, condition, "T1");
  if (diagnosis !== null) {
    const anchors = anchorsSatisfied(diagnosis, scenarioTask.diagnosisAnchors);
    score.tasks.T1 = { pass: anchors.every((item) => item.hit !== null), anchors, characters: diagnosis.length };
  }

  const sqlAnswer = await readAnswer(unitDirectory, condition, "T2");
  const derivedAnswer = await readAnswer(unitDirectory, condition, "T3");
  await database.query("BEGIN");
  try {
    if (sqlAnswer !== null) {
      const blocks = extractSqlBlocks(sqlAnswer);
      const results = await runBlocks(database, blocks, "t2");
      const v1AssetViolations = findV1AssetViolations(blocks);
      score.tasks.T2 = {
        pass: blocks.length > 0 && results.every((item) => item.ok) && v1AssetViolations.length === 0,
        blocks: blocks.length,
        okBlocks: results.filter((item) => item.ok).length,
        failures: results.filter((item) => !item.ok),
        v1AssetViolations,
      };
    }
    if (derivedAnswer !== null) {
      const blocks = extractSqlBlocks(derivedAnswer);
      const results = await runBlocks(database, blocks, "t3");
      const last = results[results.length - 1] ?? null;
      const columnText = (last?.columns ?? []).join(" ");
      const anchors = last?.ok ? anchorsSatisfied(columnText, scenarioTask.derivedColumnAnchors) : [];
      const v1AssetViolations = findV1AssetViolations(blocks);
      score.tasks.T3 = {
        pass:
          Boolean(last?.ok) &&
          (last?.columns?.length ?? 0) > 0 &&
          anchors.every((item) => item.hit !== null) &&
          v1AssetViolations.length === 0,
        blocks: blocks.length,
        okBlocks: results.filter((item) => item.ok || item.duplicateCreate).length,
        lastColumns: last?.columns ?? [],
        lastRowCount: last?.rowCount ?? null,
        anchors,
        failures: results.filter((item) => !item.ok && !item.duplicateCreate),
        v1AssetViolations,
      };
    }
  } finally {
    await database.query("ROLLBACK");
  }

  const versioning = await readAnswer(unitDirectory, condition, "T4");
  if (versioning !== null) {
    const checklist = VERSIONING_CHECKLIST.map((item) => ({ id: item.id, hit: item.pattern.test(versioning) }));
    const hits = checklist.filter((item) => item.hit).length;
    score.tasks.T4 = { pass: hits >= 2, hits, checklist };
  }

  // 출력 상한에서 잘린 응답(finish_reason=length)은 내용과 무관하게 실패로 기록한다.
  for (const taskId of TASK_IDS) {
    const task = score.tasks[taskId];
    if (task && answersMeta[`${condition}-${taskId}`]?.finishReason === "length") {
      task.truncated = true;
      task.pass = false;
    }
  }
  return score;
}

function formatUnitLine(scenarioId, rep, score) {
  const cells = TASK_IDS.map((taskId) => {
    const task = score.tasks[taskId];
    if (!task) {
      return `${taskId}:—`;
    }
    const mark = task.pass ? "✓" : "✗";
    if (taskId === "T2") {
      const violation = task.v1AssetViolations?.length
        ? `, v1자산 ${task.v1AssetViolations.map((item) => `${item.statement} ${item.table}`).join("/")}`
        : "";
      return `${taskId}:${mark}(${task.okBlocks}/${task.blocks}${violation})`;
    }
    if (taskId === "T3") {
      return `${taskId}:${mark}(${task.okBlocks}/${task.blocks}, ${task.lastRowCount ?? "-"}행)`;
    }
    if (taskId === "T4") {
      return `${taskId}:${mark}(${task.hits}/3)`;
    }
    return `${taskId}:${mark}`;
  });
  return `  ${scenarioId}/rep-${rep} [${score.condition.padEnd(2)}] ${cells.join("  ")}`;
}

async function main() {
  const args = process.argv.slice(2);
  const flagIndex = args.indexOf("--results");
  if (flagIndex === -1) {
    console.error("사용: node scripts/eval/verify-layer3.mjs --results <dir>");
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

  console.log("층3 다운스트림 자동 채점:");
  for (const scenarioId of scenarioDirectories) {
    if (!SCENARIO_TASKS[scenarioId]) {
      continue;
    }
    const scenarioDirectory = path.join(resultsDirectory, scenarioId);
    const repDirectories = (await fs.readdir(scenarioDirectory, { withFileTypes: true }))
      .filter((entry) => entry.isDirectory() && entry.name.startsWith("rep-"))
      .map((entry) => entry.name)
      .sort();
    for (const repName of repDirectories) {
      const unitDirectory = path.join(scenarioDirectory, repName);
      const metaPath = path.join(unitDirectory, "run-meta.json");
      const meta = existsSync(metaPath) ? JSON.parse(await fs.readFile(metaPath, "utf8")) : { answers: {} };
      const conditions = [...new Set(Object.keys(meta.answers).map((key) => key.split("-")[0]))].sort();
      for (const condition of conditions) {
        const score = await scoreUnit(database, unitDirectory, scenarioId, condition, meta.answers);
        const usage = TASK_IDS.reduce(
          (accumulator, taskId) => {
            const answer = meta.answers[`${condition}-${taskId}`] ?? {};
            accumulator.promptTokens += answer.promptTokens ?? 0;
            accumulator.completionTokens += answer.completionTokens ?? 0;
            accumulator.latencyMs += answer.latencyMs ?? 0;
            return accumulator;
          },
          { promptTokens: 0, completionTokens: 0, latencyMs: 0 },
        );
        rows.push({ scenarioId, rep: Number(repName.replace("rep-", "")), condition, tasks: score.tasks, usage });
        console.log(formatUnitLine(scenarioId, repName.replace("rep-", ""), score));
      }
    }
  }

  // 조건별 합계
  const conditions = [...new Set(rows.map((row) => row.condition))].sort();
  console.log("\n조건별 통과율:");
  const summaryLines = [];
  for (const condition of conditions) {
    const conditionRows = rows.filter((row) => row.condition === condition);
    const cells = TASK_IDS.map((taskId) => {
      const scored = conditionRows.filter((row) => row.tasks[taskId]);
      const passed = scored.filter((row) => row.tasks[taskId].pass).length;
      return `${taskId} ${passed}/${scored.length}`;
    });
    const averagePromptTokens = Math.round(conditionRows.reduce((sum, row) => sum + row.usage.promptTokens, 0) / Math.max(conditionRows.length, 1));
    const line = `  [${condition}] ${cells.join("  ")}  (단위 ${conditionRows.length}, 평균 입력 ${averagePromptTokens} tok/단위)`;
    summaryLines.push(line);
    console.log(line);
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  await fs.writeFile(path.join(resultsDirectory, `verification-${stamp}.json`), JSON.stringify(rows, null, 2));
  await fs.writeFile(
    path.join(resultsDirectory, "verify-summary.md"),
    ["# 층3 자동 채점 요약", "", `생성: ${stamp}`, "", "```", ...rows.map((row) => formatUnitLine(row.scenarioId, row.rep, { condition: row.condition, tasks: row.tasks })), "", ...summaryLines, "```", ""].join("\n"),
  );
  console.log(`\n결과 저장: ${path.relative(REPOSITORY_ROOT, resultsDirectory)}/verification-${stamp}.json, verify-summary.md`);
  await database.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

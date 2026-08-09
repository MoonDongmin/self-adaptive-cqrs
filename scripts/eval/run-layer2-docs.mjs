#!/usr/bin/env node
// 층2(Docs 생성) E2E 러너.
//
// data/eval/layer23-scenarios/ 의 시나리오를 하나씩 "실행 중인 실제 시스템"에 흘려 넣고,
// 분석 파이프라인이 산출한 Docs(llm-docs/*.md)를 시나리오·반복(rep)별로 수집한다.
// 채점은 하지 않는다 — 산출물 수집과 실행 메타 기록까지가 이 러너의 책임이다.
//
// 시나리오 경로 → Docs 채널:
//   A1(payload-drift), A2/A3(zod-reject), B1(projection.map.failed)
//     → warn/error 로그 → prejudge → llm-context 분석 (llm.analysis.aggregate.done)
//   A4/A5/A6(physical/consistency/jump)
//     → 투영 → 센서 관찰 → 에피소드 → sensor-observer 분석 (sensor.analysis.done)
//   E1~E3(Read Model 부적합)
//     → GET /insight/cards/<질의> 반복(카드 miss = 조회 의도 신호) → prejudge → llm-context 분석
//   F2/F5(정상 대조군)
//     → Docs 미생성이 정답 (드레인 + 정지 확인만)
//
// 전제: 앱이 다음 env 로 떠 있어야 한다.
//   TOY_DATA_DIRECTORY=data/eval/layer2-staging
//   SENSOR_OBSERVER_ANALYSIS_DISABLED=0
//   LLM_CONTEXT_ANALYSIS_DISABLED=0
// 사용:
//   node scripts/eval/run-layer2-docs.mjs [--scenarios A6,E2] [--reps 5] [--start-rep 1]
//     [--results-name layer2-docs-llm-only]

import { promises as fs, readFileSync } from "node:fs";
import * as path from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import pg from "pg";

const SCRIPT_DIRECTORY = path.dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = path.resolve(SCRIPT_DIRECTORY, "..", "..");
const SCENARIO_ROOT = path.join(REPOSITORY_ROOT, "data", "eval", "layer23-scenarios");
const STAGING_DIRECTORY = path.join(REPOSITORY_ROOT, "data", "eval", "layer2-staging");
const DOCS_DIRECTORY = path.join(REPOSITORY_ROOT, "llm-docs");
const LOG_FILE_PATH = path.join(REPOSITORY_ROOT, "src", "shared", "logger", "logs", "log.json");
// 기본 layer2-docs. --results-name 으로 바꿔 다른 조건(예: llm-only)의 수집물을
// 기존 hybrid 결과와 분리 보관한다 — 같은 시나리오/rep 경로가 겹치면 덮어써진다.
let RESULTS_DIRECTORY = path.join(SCRIPT_DIRECTORY, "results", "layer2-docs");

// Docs 를 산출해야 하는 시나리오와 채널. F2/F3/F5 는 미생성이 정답.
// A7~A10/B2/E4/E5/F3 은 확장 8종(generate-additional-layer23-scenarios.mjs).
const SCENARIOS = {
  "A1-payload-drift": { expectsDocs: true, channel: "log" },
  "A2-type-mismatch": { expectsDocs: true, channel: "log" },
  "A3-missing-field": { expectsDocs: true, channel: "log" },
  "A4-physical-impossible": { expectsDocs: true, channel: "sensor" },
  "A5-consistency-violation": { expectsDocs: true, channel: "sensor" },
  "A6-depth-jump": { expectsDocs: true, channel: "sensor" },
  "A7-grip-depth-underflow": { expectsDocs: true, channel: "sensor" },
  "A8-translation-x-violation": { expectsDocs: true, channel: "sensor" },
  "A9-non-integer-id": { expectsDocs: true, channel: "log" },
  "A10-null-intrinsic-param": { expectsDocs: true, channel: "log" },
  "B1-projection-map-failed": { expectsDocs: true, channel: "log" },
  "B2-multimodal-integrity": { expectsDocs: true, channel: "log" },
  "E1-new-column-query": { expectsDocs: true, channel: "query" },
  "E2-new-aggregate-query": { expectsDocs: true, channel: "query" },
  "E3-new-join-query": { expectsDocs: true, channel: "query" },
  "E4-time-series-query": { expectsDocs: true, channel: "query" },
  "E5-failure-ranking-query": { expectsDocs: true, channel: "query" },
  "F2-normal-retry": { expectsDocs: false, channel: "none" },
  "F3-subthreshold-jump": { expectsDocs: false, channel: "none" },
  "F5-all-normal": { expectsDocs: false, channel: "none" },
};

const DOC_DONE_ACTIONS = new Set(["sensor.analysis.done", "llm.analysis.aggregate.done"]);
const DOC_TIMEOUT_MS = Number(process.env.EVAL_DOC_TIMEOUT_MS ?? 30 * 60 * 1000);
const QUIET_AFTER_DOC_MS = Number(process.env.EVAL_QUIET_AFTER_DOC_MS ?? 90 * 1000);
const QUIET_NO_DOC_MS = Number(process.env.EVAL_QUIET_NO_DOC_MS ?? 3 * 60 * 1000);
const POLL_INTERVAL_MS = 5000;

function parseArguments() {
  const args = process.argv.slice(2);
  const options = { scenarios: Object.keys(SCENARIOS), reps: 5, startRep: 1 };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--scenarios") {
      const wanted = args[++i].split(",");
      options.scenarios = Object.keys(SCENARIOS).filter((id) =>
        wanted.some((w) => id === w || id.startsWith(`${w}-`)),
      );
    } else if (args[i] === "--reps") {
      options.reps = Number(args[++i]);
    } else if (args[i] === "--start-rep") {
      options.startRep = Number(args[++i]);
    } else if (args[i] === "--results-name") {
      RESULTS_DIRECTORY = path.join(SCRIPT_DIRECTORY, "results", args[++i]);
    }
  }
  return options;
}

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
const BASE_URL = `http://localhost:${process.env.PORT ?? dotEnvironment.PORT ?? 3000}`;

async function postJson(url) {
  const response = await fetch(url, { method: "POST" });
  let body = null;
  try {
    body = await response.json();
  } catch {
    // 본문 없는 응답 허용
  }
  return { ok: response.ok, status: response.status, body };
}

// run-layer1-detection.mjs 의 LogTailer 와 동일한 오프셋 테일러.
class LogTailer {
  constructor(filePath) {
    this.filePath = filePath;
    this.offset = 0;
  }

  async initialize() {
    try {
      const stat = await fs.stat(this.filePath);
      this.offset = stat.size;
    } catch {
      this.offset = 0;
    }
  }

  async drainNewLines() {
    let handle;
    try {
      handle = await fs.open(this.filePath, "r");
    } catch {
      return [];
    }
    try {
      const stat = await handle.stat();
      if (stat.size < this.offset) {
        this.offset = 0; // 파일이 비워졌으면(DELETE /log) 처음부터
      }
      if (stat.size === this.offset) {
        return [];
      }
      const length = stat.size - this.offset;
      const buffer = Buffer.alloc(length);
      await handle.read(buffer, 0, length, this.offset);
      this.offset = stat.size;
      const parsed = [];
      for (const line of buffer.toString("utf8").split("\n")) {
        if (!line.trim()) {
          continue;
        }
        try {
          parsed.push(JSON.parse(line));
        } catch {
          this.offset -= Buffer.byteLength(`${line}\n`, "utf8");
          break;
        }
      }
      return parsed;
    } finally {
      await handle.close();
    }
  }
}

async function resetSystem(database) {
  await database.query(
    "TRUNCATE event_store, read_grip_result, read_multimodal RESTART IDENTITY CASCADE",
  );
  await database.query("DELETE FROM projection_cursor");
  await database.query("TRUNCATE log_event");
  await fetch(`${BASE_URL}/log`, { method: "DELETE" });
}

async function stageScenarioFiles(scenarioId) {
  await fs.rm(STAGING_DIRECTORY, { recursive: true, force: true });
  await fs.mkdir(STAGING_DIRECTORY, { recursive: true });
  const sourceDirectory = path.join(SCENARIO_ROOT, `scenario-${scenarioId}`);
  const entries = (await fs.readdir(sourceDirectory)).filter(
    (name) => name.endsWith(".json") && name !== "manifest.json",
  );
  for (const name of entries) {
    await fs.copyFile(path.join(sourceDirectory, name), path.join(STAGING_DIRECTORY, name));
  }
  return entries.length;
}

async function listDocsFiles() {
  try {
    return (await fs.readdir(DOCS_DIRECTORY)).filter((name) => name.endsWith(".md"));
  } catch {
    return [];
  }
}

// E 계열: 사용자 질의를 카탈로그 카드 조회로 3회 반복 주입(반복 miss = 조회 의도 신호).
async function issueUserQuery(scenarioId) {
  const manifest = JSON.parse(
    await fs.readFile(path.join(SCENARIO_ROOT, `scenario-${scenarioId}`, "manifest.json"), "utf8"),
  );
  const userQuery = manifest.userQuery;
  for (let i = 0; i < 3; i++) {
    await fetch(`${BASE_URL}/insight/cards/${encodeURIComponent(userQuery)}`);
    await sleep(300);
  }
  return userQuery;
}

async function runScenarioOnce(database, scenarioId, rep) {
  const spec = SCENARIOS[scenarioId];
  const startedAt = new Date();
  const meta = {
    scenarioId,
    rep,
    startedAt: startedAt.toISOString(),
    expectsDocs: spec.expectsDocs,
    channel: spec.channel,
  };

  await resetSystem(database);
  const stagedCount = await stageScenarioFiles(scenarioId);
  meta.stagedCount = stagedCount;

  const docsBefore = new Set(await listDocsFiles());
  const tailer = new LogTailer(LOG_FILE_PATH);
  await tailer.initialize();

  // 적재 → 투영. B1 은 grip-result 투영이 poison 에서 실패하는 것이 정답 경로다.
  const insertResult = await postJson(`${BASE_URL}/insert`);
  meta.insert = {
    inserted: insertResult.body?.inserted ?? null,
    failed: insertResult.body?.failed ?? [],
  };

  const multimodal = await postJson(`${BASE_URL}/projection/multimodal`);
  const gripResult = await postJson(`${BASE_URL}/projection/grip-result`);
  meta.projection = {
    multimodalProcessed: multimodal.body?.processed ?? null,
    gripResultOk: gripResult.ok,
    gripResultProcessed: gripResult.body?.processed ?? null,
  };

  if (spec.channel === "query") {
    meta.userQuery = await issueUserQuery(scenarioId);
  }

  // 완료 대기: Docs 완료 이벤트를 수집하고, (기대 Docs 도달 후 quiet) 또는
  // (미기대 시 관찰 드레인 후 quiet) 또는 전체 타임아웃에서 끝낸다.
  // 센서 분석은 백그라운드(void analyze)라, 닫힌 에피소드 수만큼 sensor.analysis.done
  // (또는 분석 실패)이 도착할 때까지는 절대 끝내지 않는다 — 늦게 도착한 Docs 가
  // 다음 런에 오염 수집되는 것을 막는다.
  const events = [];
  const reportPaths = [];
  let observedCount = 0;
  let episodesClosed = 0;
  let sensorAnalysesSettled = 0;
  let prejudgeTriggered = 0;
  let logAnalysesSettled = 0;
  const projectedCount = gripResult.body?.processed ?? 0;
  const waitStartedAt = Date.now();
  let lastEventAt = Date.now();

  while (true) {
    const elapsed = Date.now() - waitStartedAt;
    if (elapsed > DOC_TIMEOUT_MS) {
      meta.exitReason = "timeout";
      break;
    }

    const newLines = await tailer.drainNewLines();
    for (const line of newLines) {
      if (line.action === "sensor.observe.triggered" || line.action === "sensor.observe.skipped") {
        observedCount += line.count ?? 0;
        lastEventAt = Date.now();
      }
      if (DOC_DONE_ACTIONS.has(line.action)) {
        reportPaths.push(line.reportPath ?? null);
        if (line.action === "sensor.analysis.done") {
          sensorAnalysesSettled++;
        } else {
          logAnalysesSettled++;
        }
        events.push({
          action: line.action,
          reportPath: line.reportPath ?? null,
          docsValid: line.docsValid ?? null,
          docsValidationErrors: line.docsValidationErrors ?? [],
        });
        lastEventAt = Date.now();
      }
      if (typeof line.msg === "string" && line.msg.includes("에피소드 분석 실패")) {
        sensorAnalysesSettled++;
        events.push({ action: "sensor.analysis.failed", reason: line.reason ?? null });
        lastEventAt = Date.now();
      }
      // llm-context 의 분석 실패는 runLoop 가 info '선판단 주기 실행 실패'로 삼킨다.
      if (typeof line.msg === "string" && line.msg.includes("선판단 주기 실행 실패")) {
        logAnalysesSettled++;
        events.push({ action: "llm.analysis.failed", reason: line.reason ?? null });
        lastEventAt = Date.now();
      }
      if (line.action === "llm.prejudge.triggered" || line.action === "sensor.episode.closed") {
        if (line.action === "sensor.episode.closed") {
          episodesClosed++;
        } else {
          prejudgeTriggered++;
        }
        lastEventAt = Date.now();
        events.push({ action: line.action, reason: line.reason ?? null });
      }
    }

    const quietFor = Date.now() - lastEventAt;
    const drained = projectedCount === 0 || observedCount >= projectedCount;
    // 진행 중 분석이 하나라도 있으면(센서 에피소드·로그 prejudge 트리거) 끝내지 않는다.
    const settled =
      sensorAnalysesSettled >= episodesClosed &&
      logAnalysesSettled >= prejudgeTriggered;

    if (settled && reportPaths.length > 0 && quietFor > QUIET_AFTER_DOC_MS) {
      meta.exitReason = "docs-collected";
      break;
    }
    if (settled && reportPaths.length === 0 && drained && quietFor > QUIET_NO_DOC_MS) {
      meta.exitReason = spec.expectsDocs ? "no-docs-timeout" : "clean-no-docs";
      break;
    }

    await sleep(POLL_INTERVAL_MS);
  }

  meta.observedCount = observedCount;
  meta.projectedCount = projectedCount;
  meta.events = events;
  meta.finishedAt = new Date().toISOString();
  meta.durationSeconds = Math.round((Date.now() - startedAt.getTime()) / 1000);

  // 산출 Docs 수집: llm-docs 에 새로 생긴 파일을 rep 폴더로 이동(같은 파일명 덮어쓰기 방지).
  const outputDirectory = path.join(RESULTS_DIRECTORY, scenarioId, `rep-${rep}`);
  await fs.mkdir(outputDirectory, { recursive: true });
  const docsAfter = await listDocsFiles();
  const newDocs = docsAfter.filter((name) => !docsBefore.has(name));
  for (const name of newDocs) {
    await fs.rename(path.join(DOCS_DIRECTORY, name), path.join(outputDirectory, name));
  }
  meta.collectedDocs = newDocs;

  await fs.writeFile(
    path.join(outputDirectory, "run-meta.json"),
    JSON.stringify(meta, null, 2),
  );

  return meta;
}

async function main() {
  const options = parseArguments();
  const database = new pg.Client({ connectionString: DATABASE_URL });
  await database.connect();

  try {
    // 생존 확인은 404 가 나지 않는 경로로 — GET / 는 404 를 만들어 prejudge 를
    // 오트립시키고 엉뚱한 Docs 를 생성시킨다(2026-07-14 실측).
    await fetch(`${BASE_URL}/insight/cards`);
  } catch {
    console.error(`앱(${BASE_URL})에 연결할 수 없습니다. 앱을 먼저 띄우세요.`);
    process.exit(1);
  }

  console.log(
    `층2 Docs 러너: 시나리오 ${options.scenarios.length}개 × rep ${options.startRep}..${options.reps}`,
  );

  const summary = [];
  for (let rep = options.startRep; rep <= options.reps; rep++) {
    for (const scenarioId of options.scenarios) {
      const label = `${scenarioId} rep-${rep}`;
      console.log(`\n━━ ${label} 시작`);
      try {
        const meta = await runScenarioOnce(database, scenarioId, rep);
        console.log(
          `━━ ${label} 종료: docs=${meta.collectedDocs.length} exit=${meta.exitReason} ${meta.durationSeconds}s`,
        );
        summary.push({
          scenarioId,
          rep,
          docs: meta.collectedDocs.length,
          exitReason: meta.exitReason,
          durationSeconds: meta.durationSeconds,
        });
      } catch (error) {
        console.error(`━━ ${label} 실패:`, String(error));
        summary.push({ scenarioId, rep, docs: 0, exitReason: `error: ${String(error)}` });
      }
    }
  }

  await fs.mkdir(RESULTS_DIRECTORY, { recursive: true });
  await fs.writeFile(
    path.join(RESULTS_DIRECTORY, `run-summary-${new Date().toISOString().replace(/[:.]/g, "-")}.json`),
    JSON.stringify(summary, null, 2),
  );
  console.log("\n전체 요약:");
  for (const row of summary) {
    console.log(
      `  ${row.scenarioId.padEnd(28)} rep-${row.rep}  docs=${row.docs}  ${row.exitReason}  ${row.durationSeconds ?? "-"}s`,
    );
  }

  await database.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

#!/usr/bin/env node
// 층1(결정론적 이상 탐지) E2E 성능평가 러너.
//
// data/eval/layer1-detection/ 의 벤치마크 500건을 "실행 중인 실제 시스템"에 흘려 넣고,
// 각 탐지 지점에서 이상신호가 실제로 잡히는지를 manifest.json(정답지)과 대조해 채점한다.
//
// 탐지 지점 → 관측 채널:
//   zod-reject-*          → POST /insert/:index 응답의 failed[] (+ insert.file.failed warn 로그)
//   payload-drift         → payload.schema.drift warn 로그의 newKeys (파일별 고유 키로 귀속)
//   projection-map-failed → projection.map.failed error 로그의 streamId
//   physical/consistency/jump → sensor.observe.triggered info 로그의 offendingSceneKeys(strict)
//                               및 batchSceneKeys(loose·윈도우 단위)
//
// 실행 순서(중요):
//   poison(projection-map-failed) 5건은 grip-result 투영 트랜잭션을 통째로 실패시키고
//   커서가 그 이벤트를 영영 못 넘어가므로, (1) 나머지 495건을 먼저 적재·투영·관찰시킨 뒤
//   (2) poison 을 한 건씩 적재→투영(실패 확인)→커서 수동 전진으로 검증한다.
//
// 전제: 앱(:3000)·Postgres(:65432)·Kafka·LLM(LM Studio)이 떠 있어야 한다.
// 사용: node scripts/eval/run-layer1-detection.mjs [--skip-reset]

import { promises as fs, readFileSync } from "node:fs";
import * as path from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import pg from "pg";

const SCRIPT_DIRECTORY = path.dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = path.resolve(SCRIPT_DIRECTORY, "..", "..");
const DATASET_DIRECTORY = path.join(REPOSITORY_ROOT, "data", "eval", "layer1-detection");
const LOG_FILE_PATH = path.join(REPOSITORY_ROOT, "src", "shared", "logger", "logs", "log.json");
const RESULTS_DIRECTORY = path.join(SCRIPT_DIRECTORY, "results");

const FILE_NAME_PATTERN = /^(.+?)_(CR\d+)_(.+?)_(\d{5})_(\d{2})_(\d{8})\.json$/;

// 관찰 대기 상한. 이상 윈도우는 LLM 판정·에피소드 분석이 끼어 오래 걸릴 수 있다.
const OBSERVE_TIMEOUT_MS = Number(process.env.EVAL_OBSERVE_TIMEOUT_MS ?? 30 * 60 * 1000);
const OBSERVE_STAGNATION_MS = Number(process.env.EVAL_OBSERVE_STAGNATION_MS ?? 5 * 60 * 1000);
const POLL_INTERVAL_MS = 5000;

const skipReset = process.argv.includes("--skip-reset");

function loadEnvFile() {
  // dotenv 없이 .env 에서 필요한 키만 읽는다(앱과 같은 파일을 공유).
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

// 채점 비교 전용 정규화. macOS 파일명·DB·Kafka 메시지는 NFD(자모 분해)인데, LLM 이
// 판정에서 재생성한 offendingSceneKeys 는 NFC 로 나온다(토크나이저가 NFC 생성 —
// 2026-07-13 실측: 원문 비교 항상 false → strict/FPR 이 구조적으로 0 집계). 모든
// scene 비교는 NFC 로 통일한다. 단 DB 조회(poison 커서 전진)는 NFD 원형을 써야 한다.
function canonicalSceneKey(sceneKey) {
  return String(sceneKey).normalize("NFC");
}

function parseFileName(fileName) {
  const match = FILE_NAME_PATTERN.exec(fileName);
  if (!match) {
    return null;
  }
  const [, categoryPrefix, cameraCode, objectName, sceneNumber, attemptNumber] = match;
  return {
    sceneKey: `${categoryPrefix}_${cameraCode}_${objectName}_${sceneNumber}`,
    attemptNumber: Number(attemptNumber),
  };
}

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

// ── 로그 테일러: 러너 시작 시점 이후에 추가된 pino JSON 라인만 읽는다 ─────────────
class LogTailer {
  constructor(filePath) {
    this.filePath = filePath;
    this.offset = 0;
    this.lines = [];
  }

  async initialize() {
    try {
      const stat = await fs.stat(this.filePath);
      this.offset = stat.size;
    } catch {
      this.offset = 0; // 파일이 아직 없으면 0부터
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
      if (stat.size <= this.offset) {
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
          // 잘린 마지막 라인 등은 무시(다음 drain 에서 잡힘) — offset 롤백으로 재시도
          this.offset -= Buffer.byteLength(`${line}\n`, "utf8");
          break;
        }
      }
      this.lines.push(...parsed);
      return parsed;
    } finally {
      await handle.close();
    }
  }
}

async function main() {
  // ── 0. 준비: manifest·파일 목록·정답지 ────────────────────────────────────────
  const manifest = JSON.parse(
    await fs.readFile(path.join(DATASET_DIRECTORY, "manifest.json"), "utf8"),
  );
  const manifestByFile = new Map(manifest.files.map((entry) => [entry.fileName, entry]));

  // 서버(insert.service listToyDataFiles)와 동일한 규칙으로 정렬된 목록 — index 가 일치해야 한다.
  const sortedFiles = (await fs.readdir(DATASET_DIRECTORY))
    .filter((name) => name.endsWith(".json") && name !== "manifest.json")
    .sort();

  const poisonFiles = sortedFiles.filter(
    (name) => manifestByFile.get(name)?.anomalyType === "projection-map-failed",
  );
  const anomalousSceneToFile = new Map();
  for (const entry of manifest.files) {
    if (entry.label === "anomalous") {
      anomalousSceneToFile.set(
        canonicalSceneKey(parseFileName(entry.fileName).sceneKey),
        entry.fileName,
      );
    }
  }
  // payload-drift 파일별 고유 신규 키(from == null 인 변조) → 로그의 newKeys 귀속용
  const driftKeyToFile = new Map();
  for (const entry of manifest.files) {
    if (entry.anomalyType === "payload-drift") {
      const added = entry.mutations.find((mutation) => mutation.from === null);
      driftKeyToFile.set(added.path, entry.fileName);
    }
  }

  console.log(`데이터셋 ${manifest.totalFiles}건 / poison ${poisonFiles.length}건 / 대상 서버 ${BASE_URL}`);

  // ── 0-1. 앱 생존 확인 ────────────────────────────────────────────────────────
  try {
    await fetch(BASE_URL, { method: "GET" });
  } catch {
    console.error(`앱(${BASE_URL})에 연결할 수 없습니다. 앱·docker(스택)·LLM 서버를 먼저 띄우세요.`);
    process.exit(1);
  }

  const database = new pg.Client({ connectionString: DATABASE_URL });
  await database.connect();

  const tailer = new LogTailer(LOG_FILE_PATH);
  await tailer.initialize();

  // ── 1. 상태 리셋 ────────────────────────────────────────────────────────────
  if (skipReset) {
    console.log("[1/6] 리셋 생략(--skip-reset)");
  } else {
    await database.query(
      "TRUNCATE event_store, read_grip_result, read_multimodal RESTART IDENTITY CASCADE",
    );
    await database.query("DELETE FROM projection_cursor");
    console.log("[1/6] event_store·read model·projection_cursor 초기화 완료");
  }

  // ── 2. 적재(포이즌 제외 495건, 정렬 순서대로 단건 적재) ─────────────────────────
  const insertFailed = new Map(); // fileName → reason (zod-reject 채널)
  let insertedCount = 0;
  for (let index = 1; index <= sortedFiles.length; index++) {
    const fileName = sortedFiles[index - 1];
    if (manifestByFile.get(fileName)?.anomalyType === "projection-map-failed") {
      continue;
    }
    const { ok, status, body } = await postJson(`${BASE_URL}/insert/${index}`);
    if (!ok) {
      console.error(`  적재 호출 실패 index=${index} status=${status}`);
      continue;
    }
    insertedCount += body.inserted;
    for (const failure of body.failed ?? []) {
      insertFailed.set(failure.file, failure.reason);
    }
    if (index % 100 === 0) {
      console.log(`  … ${index}/${sortedFiles.length} 처리(적재 ${insertedCount}, 거절 ${insertFailed.size})`);
    }
  }
  console.log(`[2/6] 적재 완료: 성공 ${insertedCount}, zod 거절 ${insertFailed.size}`);

  // ── 3. 투영(정상 구간) — grip-result 가 센서 값을 Kafka 로 발행한다 ───────────────
  const multimodalRun = await postJson(`${BASE_URL}/projection/multimodal`);
  const gripResultRun = await postJson(`${BASE_URL}/projection/grip-result`);
  if (!gripResultRun.ok) {
    console.error("grip-result 투영이 실패했습니다(포이즌 제외 상태에서는 성공해야 정상):", gripResultRun.body);
    process.exit(1);
  }
  const projectedCount = gripResultRun.body.processed;
  console.log(
    `[3/6] 투영 완료: grip-result ${projectedCount}건, multimodal ${multimodalRun.body?.processed ?? "?"}건`,
  );

  // ── 4. 센서 관찰 드레인 대기 — observe 로그의 count 누적이 투영 건수에 닿을 때까지 ──
  let observedCount = 0;
  let discardedCount = 0;
  const waitStartedAt = Date.now();
  let lastProgressAt = Date.now();
  while (observedCount + discardedCount < projectedCount) {
    if (Date.now() - waitStartedAt > OBSERVE_TIMEOUT_MS) {
      console.warn(`  관찰 대기 상한(${OBSERVE_TIMEOUT_MS}ms) 도달 — ${observedCount}/${projectedCount}만 관찰됨`);
      break;
    }
    if (Date.now() - lastProgressAt > OBSERVE_STAGNATION_MS) {
      console.warn(`  관찰 정체(${OBSERVE_STAGNATION_MS}ms 동안 진행 없음) — LLM 서버 상태를 확인하세요. 진행: ${observedCount}/${projectedCount}`);
      break;
    }
    await sleep(POLL_INTERVAL_MS);
    const newLines = await tailer.drainNewLines();
    for (const line of newLines) {
      if (line.action === "sensor.observe.triggered" || line.action === "sensor.observe.skipped") {
        observedCount += line.count ?? 0;
        lastProgressAt = Date.now();
      }
      if (typeof line.msg === "string" && line.msg.includes("배치 폐기")) {
        discardedCount += line.count ?? 0;
        lastProgressAt = Date.now();
      }
    }
    process.stdout.write(`\r  관찰 진행: ${observedCount}/${projectedCount} (폐기 ${discardedCount})   `);
  }
  console.log(`\n[4/6] 센서 관찰 완료: 관찰 ${observedCount}, 폐기 ${discardedCount}`);

  // ── 5. 포이즌 주입 — 한 건씩 적재→투영 실패 확인→커서 수동 전진 ────────────────────
  const poisonOutcomes = [];
  for (const fileName of poisonFiles) {
    const index = sortedFiles.indexOf(fileName) + 1;
    const insertResponse = await postJson(`${BASE_URL}/insert/${index}`);
    const inserted = insertResponse.body?.inserted === 1;

    const projectionResponse = await postJson(`${BASE_URL}/projection/grip-result`);
    const projectionFailed = !projectionResponse.ok;

    // 커서를 이 poison 이벤트 뒤로 수동 전진(운영자 스킵) — 다음 poison 검증을 가능하게 한다.
    const { sceneKey, attemptNumber } = parseFileName(fileName);
    const seqResult = await database.query(
      "SELECT global_seq FROM event_store WHERE stream_id = $1 AND attempt_num = $2",
      [`grip-attempt:${sceneKey}`, attemptNumber],
    );
    const poisonSeq = seqResult.rows[0]?.global_seq ?? null;
    if (poisonSeq !== null) {
      await database.query(
        "UPDATE projection_cursor SET last_event_seq = $1, updated_at = now() WHERE projector_name = 'grip-result-projector'",
        [poisonSeq],
      );
    }
    poisonOutcomes.push({ fileName, inserted, projectionFailed, poisonSeq });
    console.log(`  poison ${fileName}: 적재=${inserted} 투영실패=${projectionFailed}(기대: true)`);
  }
  await postJson(`${BASE_URL}/projection/multimodal`); // multimodal 은 poison 을 정상 투영(objects 미사용)
  await sleep(3000); // map.failed 로그 플러시 여유
  await tailer.drainNewLines();
  console.log(`[5/6] 포이즌 검증 완료`);

  // ── 6. 채점 — 로그 슬라이스를 manifest 와 대조 ─────────────────────────────────
  const driftKeysSeen = new Set();
  const mapFailedScenes = new Set();
  const offendingScenes = new Set();
  const triggeredMembers = new Set(); // "sceneKey#attempt" — 이상 판정 윈도우의 구성원
  const integrityViolationScenes = new Set();

  for (const line of tailer.lines) {
    if (line.action === "payload.schema.drift" && line.newKeys) {
      for (const key of Object.keys(line.newKeys)) {
        driftKeysSeen.add(key);
      }
    }
    if (line.action === "projection.map.failed" && line.streamId) {
      mapFailedScenes.add(
        canonicalSceneKey(String(line.streamId).replace(/^grip-attempt:/, "")),
      );
    }
    if (line.action === "sensor.observe.triggered") {
      for (const sceneKey of line.offendingSceneKeys ?? []) {
        offendingScenes.add(canonicalSceneKey(sceneKey));
      }
      for (const member of line.batchSceneKeys ?? []) {
        triggeredMembers.add(canonicalSceneKey(member));
      }
    }
    if (line.action === "projection.integrity.violation" && line.sceneKey) {
      integrityViolationScenes.add(canonicalSceneKey(line.sceneKey));
    }
    if (line.action === "insert.file.failed" && line.file) {
      if (!insertFailed.has(line.file)) {
        insertFailed.set(line.file, line.reason ?? "unknown");
      }
    }
  }

  const perFile = [];
  for (const entry of manifest.files) {
    const parsedName = parseFileName(entry.fileName);
    const sceneKey = canonicalSceneKey(parsedName.sceneKey);
    const member = `${sceneKey}#${parsedName.attemptNumber}`;
    const record = {
      fileName: entry.fileName,
      label: entry.label,
      hardNegative: entry.hardNegative === true,
      anomalyType: entry.anomalyType,
      detectedStrict: false,
      detectedLoose: false,
      channel: null,
    };

    if (entry.label === "anomalous") {
      switch (entry.anomalyType) {
        case "zod-reject-type-mismatch":
        case "zod-reject-missing-field":
          record.detectedStrict = insertFailed.has(entry.fileName);
          record.detectedLoose = record.detectedStrict;
          record.channel = "insert.zod";
          break;
        case "payload-drift": {
          const addedKey = [...driftKeyToFile.entries()].find(([, file]) => file === entry.fileName)?.[0];
          record.detectedStrict = addedKey !== undefined && driftKeysSeen.has(addedKey);
          record.detectedLoose = record.detectedStrict;
          record.channel = "insert.drift";
          break;
        }
        case "projection-map-failed":
          record.detectedStrict = mapFailedScenes.has(sceneKey);
          record.detectedLoose = record.detectedStrict;
          record.channel = "projection.map";
          break;
        default:
          // physical / consistency / jump → 센서 관찰 채널
          record.detectedStrict = offendingScenes.has(sceneKey);
          record.detectedLoose = record.detectedStrict || triggeredMembers.has(member);
          record.channel = "sensor.observe";
      }
    } else {
      // 정상(하드 네거티브 포함): 어느 채널이든 걸렸으면 FP.
      // 단, jump 선행 파일처럼 이상 파일과 scene 을 공유하면 scene 단위 플래그는 이상 파일 몫이다.
      const sceneSharedWithAnomaly = anomalousSceneToFile.has(sceneKey);
      record.falsePositive =
        insertFailed.has(entry.fileName) ||
        (!sceneSharedWithAnomaly &&
          (offendingScenes.has(sceneKey) ||
            mapFailedScenes.has(sceneKey) ||
            integrityViolationScenes.has(sceneKey)));
    }
    perFile.push(record);
  }

  const anomalous = perFile.filter((record) => record.label === "anomalous");
  const normals = perFile.filter((record) => record.label !== "anomalous");
  const falsePositives = normals.filter((record) => record.falsePositive);
  const hardNegatives = normals.filter((record) => record.hardNegative);

  const truePositivesStrict = anomalous.filter((record) => record.detectedStrict).length;
  const truePositivesLoose = anomalous.filter((record) => record.detectedLoose).length;
  const recallStrict = (truePositivesStrict / anomalous.length) * 100;
  const recallLoose = (truePositivesLoose / anomalous.length) * 100;
  const falsePositiveRate = (falsePositives.length / normals.length) * 100;
  const precision =
    truePositivesStrict + falsePositives.length === 0
      ? null
      : (truePositivesStrict / (truePositivesStrict + falsePositives.length)) * 100;

  console.log("\n[6/6] ━━━ 층1 이상신호 탐지 성능 ━━━");
  console.log(`전체 탐지율(Recall):  strict ${recallStrict.toFixed(1)}% (${truePositivesStrict}/${anomalous.length})  loose ${recallLoose.toFixed(1)}% (${truePositivesLoose}/${anomalous.length})`);
  console.log(`오탐율(FPR):          ${falsePositiveRate.toFixed(2)}% (${falsePositives.length}/${normals.length})`);
  console.log(`정밀도(Precision):    ${precision === null ? "-" : `${precision.toFixed(1)}%`}`);
  console.log(`하드 네거티브 통과:   ${hardNegatives.filter((record) => !record.falsePositive).length}/${hardNegatives.length}`);
  console.log("\n유형별 탐지율(strict / loose):");
  const types = [...new Set(anomalous.map((record) => record.anomalyType))];
  for (const type of types) {
    const group = anomalous.filter((record) => record.anomalyType === type);
    const strictHits = group.filter((record) => record.detectedStrict).length;
    const looseHits = group.filter((record) => record.detectedLoose).length;
    console.log(`  ${type.padEnd(36)} ${strictHits}/${group.length}  /  ${looseHits}/${group.length}`);
  }
  if (falsePositives.length > 0) {
    console.log("\n오탐 파일:");
    for (const record of falsePositives) {
      console.log(`  ${record.fileName}${record.hardNegative ? " (하드 네거티브)" : ""}`);
    }
  }
  const missed = anomalous.filter((record) => !record.detectedLoose);
  if (missed.length > 0) {
    console.log("\n미탐 파일:");
    for (const record of missed) {
      console.log(`  ${record.fileName} (${record.anomalyType})`);
    }
  }

  await fs.mkdir(RESULTS_DIRECTORY, { recursive: true });
  const resultPath = path.join(
    RESULTS_DIRECTORY,
    `layer1-run-${new Date().toISOString().replace(/[:.]/g, "-")}.json`,
  );
  await fs.writeFile(
    resultPath,
    JSON.stringify(
      {
        finishedAt: new Date().toISOString(),
        insertedCount,
        projectedCount,
        observedCount,
        discardedCount,
        poisonOutcomes,
        metrics: { recallStrict, recallLoose, falsePositiveRate, precision },
        perFile,
      },
      null,
      2,
    ),
  );
  console.log(`\n결과 저장: ${path.relative(REPOSITORY_ROOT, resultPath)}`);

  await database.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

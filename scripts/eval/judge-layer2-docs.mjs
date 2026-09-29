#!/usr/bin/env node
// Docs 품질 평가 — 루브릭 LLM-as-Judge 채점기 (논문 4.4절 루브릭 4항목).
//
// 채점 대상: 활용 평가(층3)가 대표 문서로 고른 Docs 83건 — 각 <layer3 결과>/<시나리오>/rep-N/run-meta.json 의
// sourceDocument 를 <layer2 결과>/<시나리오>/rep-N/ 에서 읽는다. 분모를 4.7절과 맞추기 위함이다.
// judge 입력: 시나리오 정답 요지(layer3-tasks.mjs groundTruth) + Docs 가 근거로 삼은 로그 표·스키마 정보
//            (<layer3 단위>/context-B1.md) + 자동 검증 결과(문서 검사·SQL 실행·코드 컴파일)
//            + Docs 가 인용한 저장소 파일의 실재 확인·발췌 + Docs 전문.
// 루브릭(각 1~5, 논문 표와 동일):
//   groundedness       근거 충실성 — 인용된 값·필드·장면이 로그·이벤트·스키마 정보에 실재하는가
//   diagnosisAccuracy  원인 진단 정확성 — 정답 원인과 유형·위치까지 일치하는가
//   actionability      실행 가능성 — SQL 과 절차를 그대로 따르면 문제가 해결되는가
//   completeness       완결성 — 권고 문서·Read Model 생성 SQL·API 버저닝 세 요소가 유효하고 서로 일치하는가
// 출력: <출력 디렉터리>/<시나리오>/rep-N/judge.json, judge-raw.md, 그리고 judge-<stamp>.json, judge-summary.md
//
// 사용: node scripts/eval/judge-layer2-docs.mjs
//         [--layer3 scripts/eval/results/layer3-downstream-9b-17x5]
//         [--layer2 scripts/eval/results/layer2-docs-llm-only-20x5-v2]
//         [--output scripts/eval/results/layer2-docs-rubric-83]
//         [--judge-model qwen3.6-35b-a3b-ud-mlx] [--max-tokens 6144] [--timeout-ms 900000]
//         [--limit N] [--dry-run]   (dry-run: LLM 호출 없이 프롬프트만 저장)

import { promises as fs, readFileSync, existsSync } from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { SCENARIO_TASKS } from "./layer3-tasks.mjs";

const SCRIPT_DIRECTORY = path.dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = path.resolve(SCRIPT_DIRECTORY, "..", "..");
const RUBRIC_AXES = ["groundedness", "diagnosisAccuracy", "actionability", "completeness"];
const AXIS_LABELS = {
  groundedness: "근거 충실성",
  diagnosisAccuracy: "원인 진단 정확성",
  actionability: "실행 가능성",
  completeness: "완결성",
};
const CHANNEL_LABELS = { log: "로그", sensor: "센서", query: "질의" };

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

function parseArguments(argv) {
  const options = {
    layer3Directory: path.resolve(REPOSITORY_ROOT, "scripts/eval/results/layer3-downstream-9b-17x5"),
    layer2Directory: path.resolve(REPOSITORY_ROOT, "scripts/eval/results/layer2-docs-llm-only-20x5-v2"),
    outputDirectory: path.resolve(REPOSITORY_ROOT, "scripts/eval/results/layer2-docs-rubric-83"),
    judgeModel: "qwen3.6-35b-a3b-ud-mlx",
    maxTokens: 6144,
    timeoutMs: 900_000,
    limit: Number.POSITIVE_INFINITY,
    dryRun: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    const value = argv[index + 1];
    switch (key) {
      case "--layer3":
        options.layer3Directory = path.resolve(value);
        index += 1;
        break;
      case "--layer2":
        options.layer2Directory = path.resolve(value);
        index += 1;
        break;
      case "--output":
        options.outputDirectory = path.resolve(value);
        index += 1;
        break;
      case "--judge-model":
        options.judgeModel = value;
        index += 1;
        break;
      case "--max-tokens":
        options.maxTokens = Number(value);
        index += 1;
        break;
      case "--timeout-ms":
        options.timeoutMs = Number(value);
        index += 1;
        break;
      case "--limit":
        options.limit = Number(value);
        index += 1;
        break;
      case "--dry-run":
        options.dryRun = true;
        break;
      default:
        throw new Error(`알 수 없는 인자: ${key}`);
    }
  }
  return options;
}

function stripThinking(text) {
  return text.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
}

async function findLatestFile(directory, prefix) {
  const names = (await fs.readdir(directory)).filter((name) => name.startsWith(prefix) && name.endsWith(".json")).sort();
  if (names.length === 0) {
    return null;
  }
  return path.join(directory, names[names.length - 1]);
}

async function loadVerificationIndexes(layer2Directory) {
  const indexes = { document: new Map(), sql: new Map(), typescript: new Map() };
  const documentPath = await findLatestFile(layer2Directory, "verification-");
  const sqlPath = await findLatestFile(layer2Directory, "sql-verification-");
  const typescriptPath = await findLatestFile(layer2Directory, "ts-verification-");
  const keyOf = (record) => `${record.scenarioId}/${record.rep}/${record.file}`;
  if (documentPath) {
    for (const record of JSON.parse(await fs.readFile(documentPath, "utf8"))) {
      indexes.document.set(keyOf(record), record);
    }
  }
  if (sqlPath) {
    for (const record of JSON.parse(await fs.readFile(sqlPath, "utf8"))) {
      indexes.sql.set(keyOf(record), record);
    }
  }
  if (typescriptPath) {
    for (const record of JSON.parse(await fs.readFile(typescriptPath, "utf8"))) {
      indexes.typescript.set(keyOf(record), record);
    }
  }
  return indexes;
}

function describeAutomaticVerification(documentRecord, sqlRecord, typescriptRecord) {
  const lines = [];
  if (documentRecord) {
    const failed = Object.entries(documentRecord.checks)
      .filter(([, passed]) => !passed)
      .map(([name]) => name);
    lines.push(`- 문서 검사: ${failed.length === 0 ? "전 항목 통과" : `실패 항목 ${failed.join(", ")}`}`);
  } else {
    lines.push("- 문서 검사: 기록 없음");
  }
  if (sqlRecord) {
    const failedCount = sqlRecord.failedBlocks.length;
    const failedDetail = sqlRecord.failedBlocks
      .map((block) => (typeof block === "object" && block !== null ? block.error ?? JSON.stringify(block) : String(block)))
      .map((message) => String(message).slice(0, 120));
    lines.push(
      `- SQL 실행: 블록 ${sqlRecord.blocks}개 중 ${sqlRecord.blocks - failedCount}개 실행 성공` +
        (failedCount > 0 ? ` / 실패 ${failedCount}개: ${failedDetail.join(" | ")}` : ""),
    );
  } else {
    lines.push("- SQL 실행: 기록 없음");
  }
  if (typescriptRecord && Array.isArray(typescriptRecord.composedFiles) && typescriptRecord.composedFiles.length > 0) {
    const okCount = typescriptRecord.composedFiles.filter((file) => file.typeOk).length;
    const failedFiles = typescriptRecord.composedFiles
      .filter((file) => !file.typeOk)
      .map((file) => `${file.targetPath}: ${(file.errors ?? []).slice(0, 2).join("; ").slice(0, 160)}`);
    lines.push(
      `- 코드 컴파일: 파일 ${typescriptRecord.composedFiles.length}개 중 ${okCount}개 통과` +
        (failedFiles.length > 0 ? ` / 실패: ${failedFiles.join(" | ")}` : ""),
    );
  } else {
    lines.push("- 코드 컴파일: 컴파일 대상 코드 없음");
  }
  return lines.join("\n");
}

// Docs 가 인용한 저장소 파일 경로를 실제로 확인한다. 파이프라인의 진단 에이전트는 3.3.3항의 도구로 저장소 소스를
// 조회하므로, 실재하는 파일의 경로·스키마·메서드 인용은 근거 없는 주장이 아니다. 평가자가 이를 확인할 수 있도록
// 실재 여부와 앞부분 발췌를 함께 준다.
const CITED_PATH_PATTERN = /src\/[A-Za-z0-9_\-./]+\.(?:ts|md)/g;
const MAX_EXCERPT_FILES = 6;
const MAX_EXCERPT_LINES = 80;

async function describeCitedRepositoryFiles(documentText) {
  const citedPaths = [...new Set((documentText.match(CITED_PATH_PATTERN) ?? []).map((cited) => cited.replace(/[.,;:)]+$/, "")))].sort();
  if (citedPaths.length === 0) {
    return "- Docs 가 인용한 저장소 파일 경로 없음";
  }
  const existing = [];
  const missing = [];
  for (const citedPath of citedPaths) {
    if (existsSync(path.join(REPOSITORY_ROOT, citedPath))) {
      existing.push(citedPath);
    } else {
      missing.push(citedPath);
    }
  }
  const lines = [];
  lines.push(`- 저장소에 실재하는 파일 (${existing.length}건): ${existing.length === 0 ? "없음" : existing.join(", ")}`);
  lines.push(`- 저장소에 없는 파일 (${missing.length}건): ${missing.length === 0 ? "없음" : missing.join(", ")}`);
  for (const existingPath of existing.slice(0, MAX_EXCERPT_FILES)) {
    const content = await fs.readFile(path.join(REPOSITORY_ROOT, existingPath), "utf8");
    const excerpt = content.split("\n").slice(0, MAX_EXCERPT_LINES).join("\n");
    lines.push(`\n<<<${existingPath} 앞부분 ${MAX_EXCERPT_LINES}행>>>\n${excerpt}\n<<<발췌 끝>>>`);
  }
  return lines.join("\n");
}

function buildJudgeSystemPrompt() {
  return [
    "당신은 이벤트 소싱 + CQRS 기반 Physical AI 데이터 플랫폼의 시니어 아키텍트이자 엄격한 평가자다.",
    "LLM 파이프라인이 [자료](로그·이벤트·스키마 정보)를 보고 [Docs]를 생성했다. Docs 는 권고 문서, Read Model 생성 SQL, API 버저닝 세 요소를 항상 함께 담아야 하는 단일 산출물이다.",
    "당신은 [정답 요지]와 [자료], [자동 검증 결과]를 기준으로 Docs 를 네 항목의 루브릭으로 채점한다.",
    "채점은 관대하지 않게, 근거 없는 주장·지어낸 값·의도와 다른 SQL·서로 어긋나는 절에는 낮은 점수를 준다. 실행·컴파일이 통과했다는 사실만으로 실행 가능성이나 완결성에 높은 점수를 주지 않는다. SQL 과 코드 블록을 실제로 읽고 루브릭의 점검 항목을 하나씩 확인한다.",
    "반드시 JSON 객체 하나만 출력한다. 설명문·마크다운 펜스는 출력하지 않는다.",
  ].join(" ");
}

function buildJudgeUserPrompt(scenarioId, scenarioTask, context, automaticVerification, citedRepositoryFiles, documentText) {
  return [
    `[시나리오] ${scenarioId}`,
    `[상황] ${scenarioTask.situation}`,
    `[정답 요지] ${scenarioTask.groundTruth}`,
    "",
    "[자료] — Docs 생성 시 파이프라인이 받은 로그·이벤트·스키마 정보",
    "<<<자료 시작>>>",
    context,
    "<<<자료 끝>>>",
    "",
    "[자동 검증 결과] — 실제 데이터베이스 실행·컴파일 결과. 실행 가능성 판단의 실측 근거로 삼는다.",
    automaticVerification,
    "",
    "[저장소 파일 확인] — 파이프라인은 진단 도구로 저장소 소스 코드를 조회할 수 있다. Docs 가 인용한 파일 경로의 실재 여부와 앞부분 발췌이다.",
    citedRepositoryFiles,
    "",
    "[Docs] — 채점 대상 문서 전문",
    "<<<Docs 시작>>>",
    documentText,
    "<<<Docs 끝>>>",
    "",
    "[채점 루브릭] 각 항목 1~5 정수",
    "- groundedness (근거 충실성): Docs 가 인용한 값·필드·장면 번호·로그가 [자료]에 실제로 있는가. [저장소 파일 확인]에서 실재하는 파일의 경로·스키마·메서드 인용은 근거 없는 주장으로 보지 않는다. 존재하지 않는 파일이나 발췌와 다른 내용의 인용은 감점한다. 5=인용된 값·필드·장면이 모두 자료에 실재. 3=핵심 근거는 실재하나 일부 수치·부등호가 원문과 불일치. 1=근거 없는 주장이나 존재하지 않는 값의 인용이 결론을 좌우.",
    "- diagnosisAccuracy (원인 진단 정확성): Docs 의 진단이 [정답 요지]와 일치하는가. 5=정답 원인과 유형·위치(필드, 장면, 처리 단계)까지 일치. 3=유형은 맞으나 위치나 메커니즘이 부정확. 1=오진이거나 원인을 특정하지 못함.",
    "- actionability (실행 가능성): Docs 의 SQL 과 절차를 그대로 따르면 문제가 해결되는가. [자동 검증 결과]를 실측으로 반영하되, 실행·컴파일이 되더라도 의도와 다른 일을 하는 코드는 감점한다. 반드시 다음을 직접 확인한다: (1) 프로젝션 로직이 DDL 의 NOT NULL 컬럼에 null 이나 TODO 를 넣어 실제 적재 시 실패하지 않는가, (2) upsert 의 excluded. 뒤 식별자가 DDL 의 실제 컬럼명(snake_case)인가, (3) 비율·평균 계산이 정수 나눗셈으로 0/1 만 저장되지 않는가, (4) 정답이 요구한 값(성공률·실패율 등)이 실제 컬럼으로 존재하는가, (5) CHECK 제약이 플래그로 격리해야 할 바로 그 행의 적재를 막아 설계와 모순되지 않는가, (6) 기각했다고 쓴 조치(DELETE 등)를 즉시 격리 SQL 로 그대로 싣지 않았는가, (7) 기존 v1 테이블(read_grip_result, read_multimodal, event_store)의 행을 ALTER/DROP/DELETE 하지 않는가, (8) 정답 요지가 Read Model 보강을 요구하는데 검증용 SELECT 만 있지 않은가. 5=그대로 따르면 해결(실행 성공 + 요구 충족, 위 결함 없음). 4=위 결함 중 사소한 것 1개. 3=오탈자·순서·식별자 등 소폭 수정 후 해결. 2=따르면 적재·투영이 실패하거나 요구한 값을 얻지 못함. 1=따르면 기존 자산이 손상되거나 무관함.",
    "- completeness (완결성): 권고 문서, Read Model 생성 SQL, API 버저닝 세 요소가 모두 유효하고 서로 일치하는가. 반드시 다음을 직접 확인한다: (1) TL;DR·머리말의 대상 테이블과 DDL 의 테이블명이 같은가, (2) 권고(Decision Outcome, Non-Goals)와 실제 SQL·코드가 모순되지 않는가(예: '보강한다'고 쓰고 '구조 변경 없음'이라 함, '기존 확장'이라 쓰고 신규 테이블을 만듦), (3) 코드 블록 사이의 클래스명·파일명·라우트명·export 경로가 서로 같은가, (4) DDL 의 nullable 과 ORM 스키마의 notNull 이 일치하는가, (5) 권고 절이 '재실행 권장'·'최소 근거만 수록' 같은 대체 스텁이 아닌가, (6) API 버저닝 절이 비어 있거나 문장이 끊기지 않았는가. 5=세 요소가 모두 유효하고 서로 일치. 4=사소한 불일치 1개. 3=세 요소가 있으나 서로 어긋나거나 항목이 비어 있음. 2=한 요소가 실질적으로 비어 있음(예: DDL 절에 검증 SELECT 만). 1=요소 누락 또는 근거 부족 표시.",
    "",
    "다음 형식의 JSON 객체 하나만 출력하라:",
    '{"groundedness": 1-5, "diagnosisAccuracy": 1-5, "actionability": 1-5, "completeness": 1-5, "unsupportedClaims": ["자료에 없는 주장 인용 (없으면 빈 배열)"], "rationale": "각 항목 점수 근거를 항목당 1~2문장으로, 한국어로"}',
  ].join("\n");
}

function extractJson(text) {
  const cleaned = stripThinking(text).replace(/```json|```/g, "");
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("JSON 객체를 찾지 못함");
  }
  const parsed = JSON.parse(cleaned.slice(start, end + 1));
  for (const axis of RUBRIC_AXES) {
    const value = Number(parsed[axis]);
    if (!Number.isInteger(value) || value < 1 || value > 5) {
      throw new Error(`루브릭 항목 ${axis} 값이 1~5 정수가 아님: ${parsed[axis]}`);
    }
    parsed[axis] = value;
  }
  parsed.unsupportedClaims = Array.isArray(parsed.unsupportedClaims) ? parsed.unsupportedClaims.map(String) : [];
  parsed.rationale = typeof parsed.rationale === "string" ? parsed.rationale : "";
  return parsed;
}

async function callJudge(judge, messages) {
  let lastError = null;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      return await callJudgeOnce(judge, messages);
    } catch (error) {
      lastError = error;
      if (attempt < 3) {
        process.stdout.write(`(${attempt}회차 실패: ${error.message.slice(0, 60)} — 30초 후 재시도) `);
        await new Promise((resolve) => setTimeout(resolve, 30_000));
      }
    }
  }
  throw lastError;
}

async function callJudgeOnce({ baseUrl, apiKey, model, maxTokens, timeoutMs }, messages) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const startedAt = Date.now();
  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}) },
      body: JSON.stringify({ model, messages, temperature: 0, max_tokens: maxTokens, stream: false }),
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${(await response.text()).slice(0, 300)}`);
    }
    const payload = await response.json();
    const choice = payload.choices?.[0];
    return {
      content: choice?.message?.content ?? "",
      finishReason: choice?.finish_reason ?? null,
      usage: payload.usage ?? null,
      latencyMs: Date.now() - startedAt,
    };
  } finally {
    clearTimeout(timer);
  }
}

function meanAndDeviation(values) {
  if (values.length === 0) {
    return { mean: Number.NaN, deviation: Number.NaN };
  }
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const deviation = Math.sqrt(values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length);
  return { mean, deviation };
}

function formatMean(values) {
  const { mean, deviation } = meanAndDeviation(values);
  return Number.isNaN(mean) ? "—" : `${mean.toFixed(2)} ± ${deviation.toFixed(2)}`;
}

function buildSummary(rows, judgeModel, stamp) {
  const lines = [`# Docs 품질 평가 — 루브릭 LLM judge 요약`, "", `생성: ${stamp} · judge 모델: ${judgeModel} · 문서 ${rows.length}건`, ""];
  const groups = [
    ["전체", rows],
    ...Object.entries(CHANNEL_LABELS).map(([channel, label]) => [label, rows.filter((row) => row.channel === channel)]),
  ];
  lines.push("## 항목별 평균 (1~5, 평균 ± 표준편차)", "");
  lines.push("| 항목 | " + groups.map(([label, group]) => `${label} (n=${group.length})`).join(" | ") + " |");
  lines.push("|---|" + groups.map(() => "---").join("|") + "|");
  for (const axis of RUBRIC_AXES) {
    lines.push(`| ${AXIS_LABELS[axis]} | ` + groups.map(([, group]) => formatMean(group.map((row) => row[axis]))).join(" | ") + " |");
  }
  lines.push("");
  const allHigh = rows.filter((row) => RUBRIC_AXES.every((axis) => row[axis] >= 4)).length;
  const anyLow = rows.filter((row) => RUBRIC_AXES.some((axis) => row[axis] <= 2)).length;
  const claims = rows.map((row) => row.unsupportedClaims.length);
  lines.push(`- 네 항목 모두 4점 이상: ${allHigh}/${rows.length}`);
  lines.push(`- 한 항목이라도 2점 이하: ${anyLow}/${rows.length}`);
  lines.push(`- 자료에 없는 주장: 문서당 평균 ${formatMean(claims)}건, 0건인 문서 ${claims.filter((count) => count === 0).length}/${rows.length}`);
  lines.push("");
  lines.push("## 시나리오별 평균", "");
  lines.push("| 시나리오 | n | " + RUBRIC_AXES.map((axis) => AXIS_LABELS[axis]).join(" | ") + " |");
  lines.push("|---|---|" + RUBRIC_AXES.map(() => "---").join("|") + "|");
  const scenarioIds = [...new Set(rows.map((row) => row.scenarioId))].sort();
  for (const scenarioId of scenarioIds) {
    const group = rows.filter((row) => row.scenarioId === scenarioId);
    lines.push(`| ${scenarioId} | ${group.length} | ` + RUBRIC_AXES.map((axis) => formatMean(group.map((row) => row[axis]))).join(" | ") + " |");
  }
  lines.push("");
  lines.push("## 점수 분포 (항목별 1~5점 문서 수)", "");
  lines.push("| 항목 | 1 | 2 | 3 | 4 | 5 |", "|---|---|---|---|---|---|");
  for (const axis of RUBRIC_AXES) {
    const counts = [1, 2, 3, 4, 5].map((score) => rows.filter((row) => row[axis] === score).length);
    lines.push(`| ${AXIS_LABELS[axis]} | ${counts.join(" | ")} |`);
  }
  lines.push("");
  return lines.join("\n");
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const dotEnvironment = loadEnvFile();
  const judge = {
    baseUrl: process.env.LLM_BASE_URL ?? dotEnvironment.LLM_BASE_URL,
    apiKey: process.env.LLM_API_KEY ?? dotEnvironment.LLM_API_KEY ?? "",
    model: options.judgeModel,
    maxTokens: options.maxTokens,
    timeoutMs: options.timeoutMs,
  };
  if (!judge.baseUrl && !options.dryRun) {
    throw new Error("LLM_BASE_URL 이 없다(.env 또는 환경변수).");
  }
  const indexes = await loadVerificationIndexes(options.layer2Directory);
  const systemPrompt = buildJudgeSystemPrompt();
  console.log(`Docs 루브릭 judge — 모델 ${judge.model} @ ${judge.baseUrl ?? "(dry-run)"}`);
  console.log(`대상: ${path.relative(REPOSITORY_ROOT, options.layer3Directory)} 의 대표 문서 → ${path.relative(REPOSITORY_ROOT, options.layer2Directory)}`);
  console.log(`출력: ${path.relative(REPOSITORY_ROOT, options.outputDirectory)}\n`);

  const rows = [];
  let processed = 0;
  const scenarioDirectories = (await fs.readdir(options.layer3Directory, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory() && SCENARIO_TASKS[entry.name])
    .map((entry) => entry.name)
    .sort();

  for (const scenarioId of scenarioDirectories) {
    const scenarioTask = SCENARIO_TASKS[scenarioId];
    const scenarioDirectory = path.join(options.layer3Directory, scenarioId);
    const repDirectories = (await fs.readdir(scenarioDirectory, { withFileTypes: true }))
      .filter((entry) => entry.isDirectory() && entry.name.startsWith("rep-"))
      .map((entry) => entry.name)
      .sort();

    for (const repName of repDirectories) {
      if (processed >= options.limit) {
        break;
      }
      const unitDirectory = path.join(scenarioDirectory, repName);
      const metaPath = path.join(unitDirectory, "run-meta.json");
      if (!existsSync(metaPath)) {
        continue;
      }
      const meta = JSON.parse(await fs.readFile(metaPath, "utf8"));
      const rep = Number(repName.replace("rep-", ""));
      const documentPath = path.join(options.layer2Directory, scenarioId, repName, meta.sourceDocument);
      const contextPath = path.join(unitDirectory, "context-B1.md");
      if (!existsSync(documentPath) || !existsSync(contextPath)) {
        console.log(`  ${scenarioId}/${repName} Docs 또는 자료 없음 — 건너뜀`);
        continue;
      }
      const outputUnitDirectory = path.join(options.outputDirectory, scenarioId, repName);
      await fs.mkdir(outputUnitDirectory, { recursive: true });
      const judgePath = path.join(outputUnitDirectory, "judge.json");
      const baseRecord = { scenarioId, rep, channel: scenarioTask.channel, sourceDocument: meta.sourceDocument };
      if (existsSync(judgePath)) {
        const saved = JSON.parse(await fs.readFile(judgePath, "utf8"));
        if (!saved.error) {
          rows.push({ ...baseRecord, ...saved });
          console.log(`  ${scenarioId}/${repName} 저장됨 — 건너뜀`);
          processed += 1;
          continue;
        }
      }
      const verificationKey = `${scenarioId}/${repName}/${meta.sourceDocument}`;
      const automaticVerification = describeAutomaticVerification(
        indexes.document.get(verificationKey),
        indexes.sql.get(verificationKey),
        indexes.typescript.get(verificationKey),
      );
      const context = await fs.readFile(contextPath, "utf8");
      const documentText = await fs.readFile(documentPath, "utf8");
      const citedRepositoryFiles = await describeCitedRepositoryFiles(documentText);
      const userPrompt = buildJudgeUserPrompt(scenarioId, scenarioTask, context, automaticVerification, citedRepositoryFiles, documentText);
      await fs.writeFile(path.join(outputUnitDirectory, "judge-prompt.md"), `${systemPrompt}\n\n---\n\n${userPrompt}`);
      processed += 1;
      if (options.dryRun) {
        console.log(`  ${scenarioId}/${repName} 프롬프트 저장 (${(userPrompt.length / 1024).toFixed(0)} KB)`);
        continue;
      }
      process.stdout.write(`  ${scenarioId}/${repName} judge 호출 중 … `);
      try {
        const result = await callJudge(judge, [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ]);
        const scores = extractJson(result.content);
        const record = {
          ...scores,
          judgeModel: judge.model,
          finishReason: result.finishReason,
          usage: result.usage,
          latencyMs: result.latencyMs,
          judgedAt: new Date().toISOString(),
        };
        await fs.writeFile(judgePath, JSON.stringify(record, null, 2));
        await fs.writeFile(path.join(outputUnitDirectory, "judge-raw.md"), result.content);
        rows.push({ ...baseRecord, ...record });
        console.log(
          `${(result.latencyMs / 1000).toFixed(0)}s → G${scores.groundedness} D${scores.diagnosisAccuracy} A${scores.actionability} C${scores.completeness}`,
        );
      } catch (error) {
        console.log(`실패 — ${error.message}`);
        await fs.writeFile(judgePath, JSON.stringify({ error: error.message, failedAt: new Date().toISOString() }, null, 2));
      }
    }
  }

  if (rows.length === 0) {
    console.log("\n채점 결과 없음.");
    return;
  }
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const summary = buildSummary(rows, judge.model, stamp);
  console.log(`\n${summary}`);
  await fs.writeFile(path.join(options.outputDirectory, `judge-${stamp}.json`), JSON.stringify(rows, null, 2));
  await fs.writeFile(path.join(options.outputDirectory, "judge-summary.md"), summary);
  console.log(`결과 저장: ${path.relative(REPOSITORY_ROOT, options.outputDirectory)}/judge-${stamp}.json, judge-summary.md`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

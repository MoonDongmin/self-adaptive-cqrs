#!/usr/bin/env node
// 층3(다운스트림 효과) 러너.
//
// 층2 수집물(scripts/eval/results/<docs-dir>/<scenario>/rep-N/*.md)에서 평가 단위를 고르고,
// 조건별 컨텍스트를 만들어 같은 Local LLM 에 4개 과제(layer3-tasks.mjs)를 풀게 한 뒤
// 응답·토큰·지연을 전량 저장한다. 채점은 하지 않는다(verify-layer3.mjs 의 몫).
//
// 평가 단위 규칙:
//   - rep 의 Docs 가 2건 이상이면 run-meta.collectedDocs[0] 만 채택(중복 트리거 가중 방지)
//   - sufficientEvidence: false(폴백 문서)는 제외
// 조건:
//   B1 = Docs 안의 <logging_context> + <insight_read_db> 블록만 (정보량 동일, LLM 판단 없음)
//   A  = Docs 전체
//
// 사용:
//   node scripts/eval/run-layer3-downstream.mjs --scenarios A1-payload-drift,E2-new-aggregate-query
//     [--reps 1] [--conditions B1,A] [--model qwen/qwen3.5-9b] [--max-tokens 4096]
//     [--docs-dir scripts/eval/results/layer2-docs-llm-only-20x5-v2]
//     [--results-name layer3-downstream-pilot-9b]
// 이미 저장된 응답은 건너뛴다(이어하기).

import { promises as fs, readFileSync, existsSync } from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { SCENARIO_TASKS, TASK_IDS, buildSystemPrompt, buildTaskInstruction } from "./layer3-tasks.mjs";

const SCRIPT_DIRECTORY = path.dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = path.resolve(SCRIPT_DIRECTORY, "..", "..");
const SCENARIO_ROOT = path.join(REPOSITORY_ROOT, "data", "eval", "layer23-scenarios");

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
    scenarios: [],
    reps: 1,
    conditions: ["B1", "A"],
    model: "qwen/qwen3.5-9b",
    maxTokens: 4096,
    temperature: 0,
    timeoutMs: 900_000,
    docsDirectory: path.join(SCRIPT_DIRECTORY, "results", "layer2-docs-llm-only-20x5-v2"),
    resultsName: "layer3-downstream-pilot-9b",
  };
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i];
    const value = argv[i + 1];
    switch (key) {
      case "--scenarios":
        options.scenarios = value.split(",").map((item) => item.trim()).filter(Boolean);
        break;
      case "--reps":
        options.reps = Number(value);
        break;
      case "--conditions":
        options.conditions = value.split(",").map((item) => item.trim()).filter(Boolean);
        break;
      case "--model":
        options.model = value;
        break;
      case "--max-tokens":
        options.maxTokens = Number(value);
        break;
      case "--timeout-ms":
        options.timeoutMs = Number(value);
        break;
      case "--docs-dir":
        options.docsDirectory = path.resolve(value);
        break;
      case "--results-name":
        options.resultsName = value;
        break;
      default:
        throw new Error(`알 수 없는 인자: ${key}`);
    }
  }
  if (options.scenarios.length === 0) {
    options.scenarios = Object.keys(SCENARIO_TASKS);
  }
  return options;
}

function extractBlock(markdown, tagName) {
  const pattern = new RegExp(`<${tagName}>\\n?([\\s\\S]*?)\\n?</${tagName}>`);
  const match = pattern.exec(markdown);
  return match ? match[1].trim() : null;
}

function readFrontMatterFlag(markdown, key) {
  const match = new RegExp(`^${key}:\\s*(\\S+)`, "m").exec(markdown);
  return match ? match[1] : null;
}

// Docs 파일명으로 생성 채널을 판별한다. 센서 채널 문서는 장면 발생일자+장면키(UUID 없음),
// 로그·질의 채널 문서는 생성시각+correlation UUID, 폴백은 -background.
function documentKind(fileName) {
  if (/background/.test(fileName)) {
    return "background";
  }
  return /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}/.test(fileName) ? "log" : "sensor";
}

function anchorsSatisfied(text, anchorGroups) {
  const lowered = text.toLowerCase();
  return anchorGroups.every((group) => group.some((anchor) => lowered.includes(anchor.toLowerCase())));
}

// 평가 단위 선택. 한 rep 에 Docs 가 여러 건이면(같은 배치에서 센서 관찰기가 별도 문서를 낸 경우 등)
//   (1) sufficientEvidence: true 인 문서만 후보
//   (2) 시나리오 채널과 같은 종류(센서 ↔ 센서, 로그·질의 ↔ UUID 문서)의 문서를 우선
//   (3) 그중 시나리오 진단 앵커를 본문(권고 이하)에서 만족하는 첫 문서, 없으면 같은 종류의 첫 문서
async function selectUnit(docsDirectory, scenarioId, rep, scenarioTask) {
  const repDirectory = path.join(docsDirectory, scenarioId, `rep-${rep}`);
  const metaPath = path.join(repDirectory, "run-meta.json");
  if (!existsSync(metaPath)) {
    return { skipped: `run-meta 없음: ${path.relative(REPOSITORY_ROOT, metaPath)}` };
  }
  const meta = JSON.parse(await fs.readFile(metaPath, "utf8"));
  const candidateNames = meta.collectedDocs ?? [];
  if (candidateNames.length === 0) {
    return { skipped: "collectedDocs 비어 있음(대조군 또는 미생성)" };
  }
  const candidates = [];
  for (const name of candidateNames) {
    const text = await fs.readFile(path.join(repDirectory, name), "utf8");
    if (readFrontMatterFlag(text, "sufficientEvidence") === "true") {
      candidates.push({ name, text, kind: documentKind(name) });
    }
  }
  if (candidates.length === 0) {
    return { skipped: `폴백 문서만 존재(sufficientEvidence != true): ${candidateNames.join(", ")}` };
  }
  const wantedKind = scenarioTask.channel === "sensor" ? "sensor" : "log";
  const sameKind = candidates.filter((candidate) => candidate.kind === wantedKind);
  const bodyOf = (candidate) => candidate.text.split("</insight_read_db>")[1] ?? candidate.text;
  const selected =
    sameKind.find((candidate) => anchorsSatisfied(bodyOf(candidate), scenarioTask.diagnosisAnchors)) ??
    sameKind[0] ??
    candidates[0];
  const documentName = selected.name;
  const documentPath = path.join(repDirectory, documentName);
  const markdown = selected.text;
  const loggingContext = extractBlock(markdown, "logging_context");
  const insightReadDb = extractBlock(markdown, "insight_read_db");
  if (loggingContext === null || insightReadDb === null) {
    return { skipped: `컨텍스트 블록 누락: ${documentName}` };
  }
  return {
    documentName,
    documentPath,
    markdown,
    loggingContext,
    insightReadDb,
    userQuery: meta.userQuery ?? null,
    sourceMeta: { channel: meta.channel, startedAt: meta.startedAt },
    selection: { candidates: candidateNames.length, eligible: candidates.length, kind: selected.kind, wantedKind },
  };
}

async function readUserQuery(scenarioId) {
  const manifestPath = path.join(SCENARIO_ROOT, `scenario-${scenarioId}`, "manifest.json");
  if (!existsSync(manifestPath)) {
    return null;
  }
  const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
  return manifest.userQuery ?? null;
}

function buildContext(condition, unit) {
  switch (condition) {
    case "B1":
      return [
        "<logging_context>",
        unit.loggingContext,
        "</logging_context>",
        "",
        "<insight_read_db>",
        unit.insightReadDb,
        "</insight_read_db>",
      ].join("\n");
    case "A":
      return unit.markdown;
    default:
      throw new Error(`알 수 없는 조건: ${condition}`);
  }
}

function buildSituation(scenarioTask, userQuery) {
  return userQuery ? `${scenarioTask.situation}\n사용자 요청: ${userQuery}` : scenarioTask.situation;
}

function stripThinking(text) {
  return text.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
}

async function callChatCompletion({ baseUrl, apiKey, model, maxTokens, temperature, timeoutMs }, messages) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const startedAt = Date.now();
  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      // LM Studio 는 reasoning_effort 를 thinking 스위치로 매핑한다(src/shared/llm/thinking-control.ts 와 동일 원칙).
      body: JSON.stringify({ model, messages, temperature, max_tokens: maxTokens, reasoning_effort: "none", stream: false }),
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

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const dotEnvironment = loadEnvFile();
  const llm = {
    baseUrl: process.env.LLM_BASE_URL ?? dotEnvironment.LLM_BASE_URL,
    apiKey: process.env.LLM_API_KEY ?? dotEnvironment.LLM_API_KEY ?? "",
    model: options.model,
    maxTokens: options.maxTokens,
    temperature: options.temperature,
    timeoutMs: options.timeoutMs,
  };
  if (!llm.baseUrl) {
    throw new Error("LLM_BASE_URL 이 없다(.env 또는 환경변수).");
  }
  const resultsDirectory = path.join(SCRIPT_DIRECTORY, "results", options.resultsName);
  await fs.mkdir(resultsDirectory, { recursive: true });
  const systemPrompt = buildSystemPrompt();

  console.log(`층3 러너 — 모델 ${llm.model} @ ${llm.baseUrl}`);
  console.log(`Docs: ${path.relative(REPOSITORY_ROOT, options.docsDirectory)} → 결과: ${path.relative(REPOSITORY_ROOT, resultsDirectory)}`);
  console.log(`시나리오 ${options.scenarios.length}종 × rep ${options.reps} × 조건 ${options.conditions.join("/")} × 과제 ${TASK_IDS.join("/")}\n`);

  const summary = [];
  for (const scenarioId of options.scenarios) {
    const scenarioTask = SCENARIO_TASKS[scenarioId];
    if (!scenarioTask) {
      console.log(`- ${scenarioId}: layer3-tasks.mjs 에 과제 정의 없음 — 건너뜀`);
      continue;
    }
    const userQuery = await readUserQuery(scenarioId);

    for (let rep = 1; rep <= options.reps; rep++) {
      const unit = await selectUnit(options.docsDirectory, scenarioId, rep, scenarioTask);
      if (unit.skipped) {
        console.log(`- ${scenarioId}/rep-${rep}: ${unit.skipped}`);
        summary.push({ scenarioId, rep, skipped: unit.skipped });
        continue;
      }
      const unitDirectory = path.join(resultsDirectory, scenarioId, `rep-${rep}`);
      await fs.mkdir(unitDirectory, { recursive: true });
      const metaPath = path.join(unitDirectory, "run-meta.json");
      const meta = existsSync(metaPath)
        ? JSON.parse(await fs.readFile(metaPath, "utf8"))
        : { scenarioId, rep, sourceDocument: unit.documentName, sourceSelection: unit.selection, sourceDocsDirectory: path.relative(REPOSITORY_ROOT, options.docsDirectory), userQuery, model: llm.model, temperature: llm.temperature, maxTokens: llm.maxTokens, answers: {} };
      const situation = buildSituation(scenarioTask, userQuery);

      for (const condition of options.conditions) {
        const context = buildContext(condition, unit);
        await fs.writeFile(path.join(unitDirectory, `context-${condition}.md`), context);
        let previousSqlAnswer = null;

        for (const taskId of TASK_IDS) {
          const answerKey = `${condition}-${taskId}`;
          const answerPath = path.join(unitDirectory, `answer-${answerKey}.md`);
          if (existsSync(answerPath) && meta.answers[answerKey]) {
            const saved = await fs.readFile(answerPath, "utf8");
            if (taskId === "T2") {
              previousSqlAnswer = stripThinking(saved);
            }
            console.log(`  ${scenarioId}/rep-${rep} ${answerKey}: 저장됨 — 건너뜀`);
            continue;
          }
          if (taskId === "T3" && previousSqlAnswer === null) {
            console.log(`  ${scenarioId}/rep-${rep} ${answerKey}: T2 응답 없음 — 건너뜀`);
            continue;
          }
          const instruction = buildTaskInstruction(taskId, scenarioTask, previousSqlAnswer);
          const userMessage = `[상황]\n${situation}\n\n[자료]\n${context}\n\n[과제]\n${instruction}`;
          process.stdout.write(`  ${scenarioId}/rep-${rep} ${answerKey}: 호출 중 (컨텍스트 ${(context.length / 1024).toFixed(1)}KB) … `);
          try {
            const result = await callChatCompletion(llm, [
              { role: "system", content: systemPrompt },
              { role: "user", content: userMessage },
            ]);
            await fs.writeFile(answerPath, result.content);
            meta.answers[answerKey] = {
              finishReason: result.finishReason,
              promptTokens: result.usage?.prompt_tokens ?? null,
              completionTokens: result.usage?.completion_tokens ?? null,
              latencyMs: result.latencyMs,
              contextBytes: context.length,
              answeredAt: new Date().toISOString(),
            };
            await fs.writeFile(metaPath, JSON.stringify(meta, null, 2));
            if (taskId === "T2") {
              previousSqlAnswer = stripThinking(result.content);
            }
            console.log(`${(result.latencyMs / 1000).toFixed(0)}s, 출력 ${result.usage?.completion_tokens ?? "?"}tok, finish=${result.finishReason}`);
          } catch (error) {
            console.log(`실패 — ${error.message}`);
            meta.answers[answerKey] = { error: error.message, failedAt: new Date().toISOString() };
            await fs.writeFile(metaPath, JSON.stringify(meta, null, 2));
          }
        }
      }
      summary.push({ scenarioId, rep, document: unit.documentName });
    }
  }

  await fs.writeFile(
    path.join(resultsDirectory, `run-summary-${new Date().toISOString().replace(/[:.]/g, "-")}.json`),
    JSON.stringify({ options: { ...options, docsDirectory: path.relative(REPOSITORY_ROOT, options.docsDirectory) }, summary }, null, 2),
  );
  console.log("\n완료.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

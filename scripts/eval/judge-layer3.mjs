#!/usr/bin/env node
// 층3(다운스트림 효과) LLM-as-Judge 채점기.
//
// run-layer3-downstream.mjs 의 산출물을 (평가 단위 × 조건) 당 1회 judge 호출로 루브릭 채점한다.
// judge 는 답변자(9B)와 다른 모델을 쓴다. 조건(B1/A)은 judge 에게 알리지 않는다(블라인드).
// judge 입력: 시나리오 정답 요지(layer3-tasks.mjs groundTruth) + 답변자가 받은 자료(context-<조건>.md) + 4개 답변.
// 루브릭(각 1~5):
//   groundedness       근거 충실성 — 자료에 없는 사실·값·코드 경로를 지어내지 않았는가
//   diagnosisAccuracy  원인 진단 정확성 — 정답 요지와 일치하는가
//   sqlCorrectness     SQL 의미 정합성 — 실행 여부와 별개로 문제를 실제로 해결·답하는 SQL 인가, 제약(v1 무손상)을 지켰는가
//   versioningQuality  호환성 절차 품질 — v1 클라이언트를 실제로 보호하는 구체적 절차인가
// 출력: <단위>/judge-<조건>.json, 결과 폴더의 judge-<stamp>.json, judge-summary.md
//
// 사용: node scripts/eval/judge-layer3.mjs --results scripts/eval/results/<dir>
//         [--judge-model qwen3.6-35b-a3b-ud-mlx] [--max-tokens 6144] [--timeout-ms 900000]

import { promises as fs, readFileSync, existsSync } from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { SCENARIO_TASKS, TASK_IDS } from "./layer3-tasks.mjs";

const SCRIPT_DIRECTORY = path.dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = path.resolve(SCRIPT_DIRECTORY, "..", "..");
const RUBRIC_AXES = ["groundedness", "diagnosisAccuracy", "sqlCorrectness", "versioningQuality"];

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
  const options = { resultsDirectory: null, judgeModel: "qwen3.6-35b-a3b-ud-mlx", maxTokens: 6144, timeoutMs: 900_000 };
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i];
    const value = argv[i + 1];
    switch (key) {
      case "--results":
        options.resultsDirectory = path.resolve(value);
        break;
      case "--judge-model":
        options.judgeModel = value;
        break;
      case "--max-tokens":
        options.maxTokens = Number(value);
        break;
      case "--timeout-ms":
        options.timeoutMs = Number(value);
        break;
      default:
        throw new Error(`알 수 없는 인자: ${key}`);
    }
  }
  if (!options.resultsDirectory) {
    throw new Error("사용: node scripts/eval/judge-layer3.mjs --results <dir>");
  }
  return options;
}

function stripThinking(text) {
  return text.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
}

function buildJudgeSystemPrompt() {
  return [
    "당신은 이벤트 소싱 + CQRS 기반 Physical AI 데이터 플랫폼의 시니어 아키텍트이자 엄격한 평가자다.",
    "한 엔지니어가 [자료]만 보고 4개 과제에 답했다. 당신은 [정답 요지]와 [자료]를 기준으로 답변을 채점한다.",
    "채점은 관대하지 않게, 근거 없는 주장·지어낸 값·틀린 SQL 에는 낮은 점수를 준다.",
    "반드시 JSON 객체 하나만 출력한다. 설명문·마크다운 펜스는 출력하지 않는다.",
  ].join(" ");
}

function buildJudgeUserPrompt(scenarioId, scenarioTask, context, answers) {
  const answerSections = TASK_IDS.map((taskId) => {
    const label = { T1: "T1 진단", T2: "T2 해결 SQL", T3: `T3 파생 질의 — 질문: ${scenarioTask.derivedQuestion}`, T4: "T4 v1 호환 절차" }[taskId];
    return `### ${label}\n${answers[taskId] ?? "(답변 없음)"}`;
  }).join("\n\n");

  return [
    `[시나리오] ${scenarioId}`,
    `[정답 요지] ${scenarioTask.groundTruth}`,
    "",
    "[자료] — 엔지니어가 답변 시 받은 자료 전체",
    "<<<자료 시작>>>",
    context,
    "<<<자료 끝>>>",
    "",
    "[엔지니어 답변]",
    answerSections,
    "",
    "[채점 루브릭] 각 축 1~5 정수",
    "- groundedness: 답변(T1~T4 전체)이 [자료]에 실제로 있는 사실·값·식별자만 사용했는가. 자료에 없는 값을 채운 INSERT, 존재하지 않는 컬럼·파일·로그를 인용하면 감점. 5=지어낸 것 없음, 1=핵심 주장이 대부분 근거 없음.",
    "- diagnosisAccuracy: T1 이 [정답 요지]의 문제와 원인을 맞혔는가. 5=문제·원인·근거 모두 일치, 3=문제는 맞으나 원인이 모호/부분, 1=오진.",
    "- sqlCorrectness: T2·T3 SQL 이 실행 여부와 별개로 문제를 실제로 해결하고 질문에 답하는가. 기존 v1 테이블(read_grip_result, read_multimodal, event_store)을 ALTER/DROP 하면 감점, 새 테이블이 필요 없는 상황에 억지로 만들면 감점, 질문과 다른 것을 조회하면 감점. 5=정확, 1=무관하거나 해로움.",
    "- versioningQuality: T4 가 v1 클라이언트를 실제로 보호하는 구체적 절차인가(버전 경로, 병행 운영, 백필·컷오버·승인 순서). 5=바로 따라할 수 있음, 3=일반론, 1=틀리거나 없음.",
    "",
    "다음 형식의 JSON 객체 하나만 출력하라:",
    '{"groundedness": 1-5, "diagnosisAccuracy": 1-5, "sqlCorrectness": 1-5, "versioningQuality": 1-5, "unsupportedClaims": ["자료에 없는 주장 인용 (없으면 빈 배열)"], "rationale": "각 축 점수 근거를 2~4문장으로"}',
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
      throw new Error(`루브릭 축 ${axis} 값이 1~5 정수가 아님: ${parsed[axis]}`);
    }
    parsed[axis] = value;
  }
  parsed.unsupportedClaims = Array.isArray(parsed.unsupportedClaims) ? parsed.unsupportedClaims.map(String) : [];
  parsed.rationale = typeof parsed.rationale === "string" ? parsed.rationale : "";
  return parsed;
}

// 원격 LM Studio(Tailscale) 링크의 일시적 'fetch failed' 를 흡수한다 — 같은 입력을 최대 3회, 30초 간격 재시도.
async function callJudge(judge, messages) {
  let lastError = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
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
      // judge 는 thinking 을 허용한다(채점 품질). content 에서 JSON 만 뽑는다.
      body: JSON.stringify({ model, messages, temperature: 0, max_tokens: maxTokens, stream: false }),
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${(await response.text()).slice(0, 300)}`);
    }
    const payload = await response.json();
    const choice = payload.choices?.[0];
    return { content: choice?.message?.content ?? "", finishReason: choice?.finish_reason ?? null, usage: payload.usage ?? null, latencyMs: Date.now() - startedAt };
  } finally {
    clearTimeout(timer);
  }
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
  if (!judge.baseUrl) {
    throw new Error("LLM_BASE_URL 이 없다(.env 또는 환경변수).");
  }
  const systemPrompt = buildJudgeSystemPrompt();
  console.log(`층3 judge — 모델 ${judge.model} @ ${judge.baseUrl}`);
  console.log(`결과: ${path.relative(REPOSITORY_ROOT, options.resultsDirectory)}\n`);

  const rows = [];
  const scenarioDirectories = (await fs.readdir(options.resultsDirectory, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory() && SCENARIO_TASKS[entry.name])
    .map((entry) => entry.name)
    .sort();

  for (const scenarioId of scenarioDirectories) {
    const scenarioTask = SCENARIO_TASKS[scenarioId];
    const scenarioDirectory = path.join(options.resultsDirectory, scenarioId);
    const repDirectories = (await fs.readdir(scenarioDirectory, { withFileTypes: true }))
      .filter((entry) => entry.isDirectory() && entry.name.startsWith("rep-"))
      .map((entry) => entry.name)
      .sort();

    for (const repName of repDirectories) {
      const unitDirectory = path.join(scenarioDirectory, repName);
      const metaPath = path.join(unitDirectory, "run-meta.json");
      if (!existsSync(metaPath)) {
        continue;
      }
      const meta = JSON.parse(await fs.readFile(metaPath, "utf8"));
      const conditions = [...new Set(Object.keys(meta.answers).map((key) => key.split("-")[0]))].sort();

      for (const condition of conditions) {
        const judgePath = path.join(unitDirectory, `judge-${condition}.json`);
        const rep = Number(repName.replace("rep-", ""));
        if (existsSync(judgePath)) {
          const saved = JSON.parse(await fs.readFile(judgePath, "utf8"));
          if (!saved.error) {
            rows.push({ scenarioId, rep, condition, ...saved });
            console.log(`  ${scenarioId}/${repName} [${condition}] 저장됨 — 건너뜀`);
            continue;
          }
        }
        const contextPath = path.join(unitDirectory, `context-${condition}.md`);
        if (!existsSync(contextPath)) {
          console.log(`  ${scenarioId}/${repName} [${condition}] context 없음 — 건너뜀`);
          continue;
        }
        const context = await fs.readFile(contextPath, "utf8");
        const answers = {};
        for (const taskId of TASK_IDS) {
          const answerPath = path.join(unitDirectory, `answer-${condition}-${taskId}.md`);
          if (existsSync(answerPath)) {
            answers[taskId] = stripThinking(await fs.readFile(answerPath, "utf8"));
          }
        }
        process.stdout.write(`  ${scenarioId}/${repName} [${condition}] judge 호출 중 … `);
        try {
          const result = await callJudge(judge, [
            { role: "system", content: systemPrompt },
            { role: "user", content: buildJudgeUserPrompt(scenarioId, scenarioTask, context, answers) },
          ]);
          const scores = extractJson(result.content);
          const record = { ...scores, judgeModel: judge.model, finishReason: result.finishReason, usage: result.usage, latencyMs: result.latencyMs, judgedAt: new Date().toISOString() };
          await fs.writeFile(judgePath, JSON.stringify(record, null, 2));
          await fs.writeFile(path.join(unitDirectory, `judge-${condition}-raw.md`), result.content);
          rows.push({ scenarioId, rep, condition, ...record });
          console.log(`${(result.latencyMs / 1000).toFixed(0)}s → G${scores.groundedness} D${scores.diagnosisAccuracy} S${scores.sqlCorrectness} V${scores.versioningQuality}`);
        } catch (error) {
          console.log(`실패 — ${error.message}`);
          await fs.writeFile(judgePath, JSON.stringify({ error: error.message, failedAt: new Date().toISOString() }, null, 2));
        }
      }
    }
  }

  const conditions = [...new Set(rows.map((row) => row.condition))].sort();
  const summaryLines = ["| 조건 | 단위 | " + RUBRIC_AXES.join(" | ") + " |", "|---|---|" + RUBRIC_AXES.map(() => "---").join("|") + "|"];
  for (const condition of conditions) {
    const conditionRows = rows.filter((row) => row.condition === condition);
    const means = RUBRIC_AXES.map((axis) => {
      const values = conditionRows.map((row) => row[axis]);
      const mean = values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1);
      const deviation = Math.sqrt(values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / Math.max(values.length, 1));
      return `${mean.toFixed(2)} ± ${deviation.toFixed(2)}`;
    });
    summaryLines.push(`| ${condition} | ${conditionRows.length} | ${means.join(" | ")} |`);
  }
  console.log("\n조건별 루브릭 평균 (1~5):");
  console.log(summaryLines.join("\n"));

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  await fs.writeFile(path.join(options.resultsDirectory, `judge-${stamp}.json`), JSON.stringify(rows, null, 2));
  await fs.writeFile(
    path.join(options.resultsDirectory, "judge-summary.md"),
    ["# 층3 LLM judge 요약", "", `생성: ${stamp} · judge 모델: ${judge.model}`, "", ...summaryLines, ""].join("\n"),
  );
  console.log(`\n결과 저장: ${path.relative(REPOSITORY_ROOT, options.resultsDirectory)}/judge-${stamp}.json, judge-summary.md`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

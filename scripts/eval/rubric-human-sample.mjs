#!/usr/bin/env node
// Docs 품질 평가 — 사람 채점용 30% 표본 추출 + 채점표 생성.
//
// 활용 평가(층3)의 83 단위에서 시나리오별로 층화하여 30%(25건)를 뽑는다. 결정론적(고정 시드)이라 재실행해도 같은 표본이 나온다.
// 출력: <출력 디렉터리>/human-rubric-sheet.csv (채점 칸 비어 있음), docs/<시나리오>_rep-N.md (채점자가 읽을 문서 사본),
//       contexts/<시나리오>_rep-N.md (근거 자료 사본), sample.json
//
// 사용: node scripts/eval/rubric-human-sample.mjs [--layer3 <dir>] [--layer2 <dir>] [--output scripts/eval/results/layer2-docs-rubric-human] [--ratio 0.3] [--seed 20260913]

import { promises as fs, existsSync } from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { SCENARIO_TASKS } from "./layer3-tasks.mjs";

const SCRIPT_DIRECTORY = path.dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = path.resolve(SCRIPT_DIRECTORY, "..", "..");

function parseArguments(argv) {
  const options = {
    layer3Directory: path.resolve(REPOSITORY_ROOT, "scripts/eval/results/layer3-downstream-9b-17x5"),
    layer2Directory: path.resolve(REPOSITORY_ROOT, "scripts/eval/results/layer2-docs-llm-only-20x5-v2"),
    outputDirectory: path.resolve(REPOSITORY_ROOT, "scripts/eval/results/layer2-docs-rubric-human"),
    ratio: 0.3,
    seed: 20260913,
  };
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index];
    const value = argv[index + 1];
    switch (key) {
      case "--layer3":
        options.layer3Directory = path.resolve(value);
        break;
      case "--layer2":
        options.layer2Directory = path.resolve(value);
        break;
      case "--output":
        options.outputDirectory = path.resolve(value);
        break;
      case "--ratio":
        options.ratio = Number(value);
        break;
      case "--seed":
        options.seed = Number(value);
        break;
      default:
        throw new Error(`알 수 없는 인자: ${key}`);
    }
  }
  return options;
}

// 고정 시드 선형 합동 난수 — 표본 재현용
function createRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function shuffle(items, random) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

async function collectUnits(layer3Directory) {
  const units = [];
  const scenarioIds = (await fs.readdir(layer3Directory, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory() && SCENARIO_TASKS[entry.name])
    .map((entry) => entry.name)
    .sort();
  for (const scenarioId of scenarioIds) {
    const repNames = (await fs.readdir(path.join(layer3Directory, scenarioId), { withFileTypes: true }))
      .filter((entry) => entry.isDirectory() && entry.name.startsWith("rep-"))
      .map((entry) => entry.name)
      .sort();
    for (const repName of repNames) {
      const metaPath = path.join(layer3Directory, scenarioId, repName, "run-meta.json");
      if (!existsSync(metaPath)) {
        continue;
      }
      const meta = JSON.parse(await fs.readFile(metaPath, "utf8"));
      units.push({ scenarioId, repName, channel: SCENARIO_TASKS[scenarioId].channel, sourceDocument: meta.sourceDocument });
    }
  }
  return units;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const random = createRandom(options.seed);
  const units = await collectUnits(options.layer3Directory);
  const targetCount = Math.round(units.length * options.ratio);

  // 시나리오별 층화: 각 시나리오에서 최소 1건, 나머지는 시나리오를 돌아가며 추가
  const byScenario = new Map();
  for (const unit of units) {
    if (!byScenario.has(unit.scenarioId)) {
      byScenario.set(unit.scenarioId, []);
    }
    byScenario.get(unit.scenarioId).push(unit);
  }
  const queues = [...byScenario.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, list]) => shuffle(list, random));
  const selected = [];
  let round = 0;
  while (selected.length < targetCount && queues.some((queue) => queue.length > round)) {
    for (const queue of shuffle(queues, random)) {
      if (selected.length >= targetCount) {
        break;
      }
      if (queue.length > round) {
        selected.push(queue[round]);
      }
    }
    round += 1;
  }
  selected.sort((a, b) => a.scenarioId.localeCompare(b.scenarioId) || a.repName.localeCompare(b.repName));

  await fs.mkdir(path.join(options.outputDirectory, "docs"), { recursive: true });
  await fs.mkdir(path.join(options.outputDirectory, "contexts"), { recursive: true });
  const csvLines = ["번호,시나리오,반복,경로,문서,근거 충실성,원인 진단 정확성,실행 가능성,완결성,메모"];
  selected.forEach((unit, index) => {
    const documentSource = path.join(options.layer2Directory, unit.scenarioId, unit.repName, unit.sourceDocument);
    const contextSource = path.join(options.layer3Directory, unit.scenarioId, unit.repName, "context-B1.md");
    const stem = `${String(index + 1).padStart(2, "0")}_${unit.scenarioId}_${unit.repName}`;
    fs.copyFile(documentSource, path.join(options.outputDirectory, "docs", `${stem}.md`));
    fs.copyFile(contextSource, path.join(options.outputDirectory, "contexts", `${stem}.md`));
    csvLines.push([index + 1, unit.scenarioId, unit.repName, unit.channel, `docs/${stem}.md`, "", "", "", "", ""].join(","));
  });
  await fs.writeFile(path.join(options.outputDirectory, "human-rubric-sheet.csv"), `﻿${csvLines.join("\n")}\n`);
  await fs.writeFile(path.join(options.outputDirectory, "sample.json"), JSON.stringify({ seed: options.seed, ratio: options.ratio, total: units.length, selected }, null, 2));
  console.log(`전체 ${units.length}건 중 ${selected.length}건 추출 (시드 ${options.seed})`);
  for (const [scenarioId, list] of byScenario) {
    console.log(`  ${scenarioId}: ${selected.filter((unit) => unit.scenarioId === scenarioId).length}/${list.length}`);
  }
  console.log(`채점표: ${path.relative(REPOSITORY_ROOT, options.outputDirectory)}/human-rubric-sheet.csv`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

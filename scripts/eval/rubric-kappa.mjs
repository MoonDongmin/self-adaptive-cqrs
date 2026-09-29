#!/usr/bin/env node
// Docs 품질 평가 — 사람 채점과 LLM judge 채점의 일치도(Cohen's κ, 이차 가중 κ).
//
// 입력: rubric-human-sample.mjs 의 채점표(사람이 점수를 채운 CSV) + judge-layer2-docs.mjs 의 judge.json
// 출력: 항목별 무가중 κ, 이차 가중 κ, 정확 일치율, ±1점 이내 일치율. 표준 출력과 <judge 디렉터리>/kappa-summary.md
//
// 사용: node scripts/eval/rubric-kappa.mjs [--sheet <csv>] [--judge scripts/eval/results/layer2-docs-rubric-83]

import { promises as fs, existsSync } from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIRECTORY = path.dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = path.resolve(SCRIPT_DIRECTORY, "..", "..");
const AXES = [
  { key: "groundedness", label: "근거 충실성" },
  { key: "diagnosisAccuracy", label: "원인 진단 정확성" },
  { key: "actionability", label: "실행 가능성" },
  { key: "completeness", label: "완결성" },
];
const CATEGORIES = [1, 2, 3, 4, 5];

function parseArguments(argv) {
  const options = {
    sheetPath: path.resolve(REPOSITORY_ROOT, "scripts/eval/results/layer2-docs-rubric-human/human-rubric-sheet.csv"),
    judgeDirectory: path.resolve(REPOSITORY_ROOT, "scripts/eval/results/layer2-docs-rubric-83"),
  };
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index];
    const value = argv[index + 1];
    switch (key) {
      case "--sheet":
        options.sheetPath = path.resolve(value);
        break;
      case "--judge":
        options.judgeDirectory = path.resolve(value);
        break;
      default:
        throw new Error(`알 수 없는 인자: ${key}`);
    }
  }
  return options;
}

function parseCsv(text) {
  const lines = text.replace(/^﻿/, "").split(/\r?\n/).filter((line) => line.trim() !== "");
  const header = lines[0].split(",");
  return lines.slice(1).map((line) => {
    const cells = line.split(",");
    const record = {};
    header.forEach((name, index) => {
      record[name.trim()] = (cells[index] ?? "").trim();
    });
    return record;
  });
}

function cohenKappa(pairs, weightFunction) {
  const size = CATEGORIES.length;
  const observed = Array.from({ length: size }, () => Array(size).fill(0));
  for (const [a, b] of pairs) {
    observed[a - 1][b - 1] += 1;
  }
  const total = pairs.length;
  const rowSums = observed.map((row) => row.reduce((sum, value) => sum + value, 0));
  const columnSums = CATEGORIES.map((_, column) => observed.reduce((sum, row) => sum + row[column], 0));
  let weightedObserved = 0;
  let weightedExpected = 0;
  for (let i = 0; i < size; i += 1) {
    for (let j = 0; j < size; j += 1) {
      const weight = weightFunction(i, j);
      weightedObserved += weight * (observed[i][j] / total);
      weightedExpected += weight * ((rowSums[i] / total) * (columnSums[j] / total));
    }
  }
  if (weightedExpected === 0) {
    return Number.NaN;
  }
  return 1 - weightedObserved / weightedExpected;
}

const unweightedDisagreement = (i, j) => (i === j ? 0 : 1);
const quadraticDisagreement = (i, j) => ((i - j) ** 2) / ((CATEGORIES.length - 1) ** 2);

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const sheet = parseCsv(await fs.readFile(options.sheetPath, "utf8"));
  const pairsByAxis = Object.fromEntries(AXES.map((axis) => [axis.key, []]));
  let usable = 0;
  for (const row of sheet) {
    const judgePath = path.join(options.judgeDirectory, row["시나리오"], row["반복"], "judge.json");
    if (!existsSync(judgePath)) {
      continue;
    }
    const judge = JSON.parse(await fs.readFile(judgePath, "utf8"));
    if (judge.error) {
      continue;
    }
    const humanScores = AXES.map((axis) => Number(row[axis.label]));
    if (humanScores.some((score) => !Number.isInteger(score) || score < 1 || score > 5)) {
      continue;
    }
    usable += 1;
    AXES.forEach((axis, index) => {
      pairsByAxis[axis.key].push([humanScores[index], judge[axis.key]]);
    });
  }
  if (usable === 0) {
    throw new Error("사람 점수가 채워진 행이 없다. 채점표의 네 항목 열에 1~5 정수를 입력하라.");
  }
  const lines = [`# 사람–LLM judge 일치도 (문서 ${usable}건)`, "", "| 항목 | 무가중 κ | 이차 가중 κ | 정확 일치 | ±1점 이내 | 사람 평균 | judge 평균 |", "|---|---|---|---|---|---|---|"];
  for (const axis of AXES) {
    const pairs = pairsByAxis[axis.key];
    const exact = pairs.filter(([a, b]) => a === b).length / pairs.length;
    const near = pairs.filter(([a, b]) => Math.abs(a - b) <= 1).length / pairs.length;
    const humanMean = pairs.reduce((sum, [a]) => sum + a, 0) / pairs.length;
    const judgeMean = pairs.reduce((sum, [, b]) => sum + b, 0) / pairs.length;
    lines.push(
      `| ${axis.label} | ${cohenKappa(pairs, unweightedDisagreement).toFixed(3)} | ${cohenKappa(pairs, quadraticDisagreement).toFixed(3)} | ${(exact * 100).toFixed(0)}% | ${(near * 100).toFixed(0)}% | ${humanMean.toFixed(2)} | ${judgeMean.toFixed(2)} |`,
    );
  }
  const allPairs = AXES.flatMap((axis) => pairsByAxis[axis.key]);
  lines.push(`| 전체 | ${cohenKappa(allPairs, unweightedDisagreement).toFixed(3)} | ${cohenKappa(allPairs, quadraticDisagreement).toFixed(3)} | ${((allPairs.filter(([a, b]) => a === b).length / allPairs.length) * 100).toFixed(0)}% | ${((allPairs.filter(([a, b]) => Math.abs(a - b) <= 1).length / allPairs.length) * 100).toFixed(0)}% | | |`);
  const output = lines.join("\n");
  console.log(output);
  await fs.writeFile(path.join(options.judgeDirectory, "kappa-summary.md"), `${output}\n`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

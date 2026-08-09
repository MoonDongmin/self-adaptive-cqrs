#!/usr/bin/env node
// 층2 Docs 산출물 결정론 검증기.
//
// run-layer2-docs.mjs 가 수집한 scripts/eval/results/layer2-docs/<시나리오>/rep-<n>/ 을 훑어,
// 각 Docs 가 "그 시나리오의 이상값과 부합하는 문서인가"를 결정론 체크로 채점한다.
// (루브릭식 LLM 채점은 층2 본평가의 몫 — 여기서는 수집물의 사전 건전성 검증까지만.)
//
// 체크 항목:
//   [계약] front-matter 존재, sufficientEvidence, 3섹션 존재, 센티넬 정합
//   [결론] TL;DR 이 '조치 불필요'가 아닌가 (Docs 기대 시나리오 한정)
//   [근거 부합] 시나리오별 앵커 문자열(이상 장면/필드/유형)이 본문에 실재하는가
//   [산출 요소] §1 권고 비-센티넬 / §2 SQL / §3 API Versioning 채움 여부
//   [텍스트 위생] 한자 혼입 없음 — 로컬 모델의 산문 오염("무손且" 류) 검출
//
// 사용: node scripts/eval/verify-layer2-docs.mjs [--results <dir>]

import { promises as fs } from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIRECTORY = path.dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = path.resolve(SCRIPT_DIRECTORY, "..", "..");
const SCENARIO_ROOT = path.join(REPOSITORY_ROOT, "data", "eval", "layer23-scenarios");
const DEFAULT_RESULTS = path.join(SCRIPT_DIRECTORY, "results", "layer2-docs");

// 시나리오별 근거 부합 앵커: 본문에 하나 이상 나타나야 하는 문자열 그룹(그룹당 OR).
// 그룹 전부 충족 시 grounding 통과. NFC/NFD 는 비교 전에 NFC 로 통일한다.
const GROUNDING = {
  "A1-payload-drift": [["drift", "드리프트", "신규 키", "newKeys"]],
  "A2-type-mismatch": [["zod", "타입", "type"], ["grip_succeed", "gripSucceed"]],
  "A3-missing-field": [["zod", "누락", "missing"], ["object_name", "objectName"]],
  "A4-physical-impossible": [["회전행렬", "rotation", "직교", "det", "깊이", "음수", "픽셀"]],
  "A5-consistency-violation": [["consistency", "정합", "일관성", "workspace", "성공"]],
  "A6-depth-jump": [["jump", "급변", "Δ", "델타"]],
  "A7-grip-depth-underflow": [["깊이", "depth", "zmin", "minz"], ["0.01", "하한", "성공", "모순", "consistency"]],
  "A8-translation-x-violation": [["translation", "워크스페이스", "workspace", "작업 범위", "작업범위", "작업 영역", "작업영역"]],
  "A9-non-integer-id": [["zod", "타입", "type"], ["정수", "int", "1.5"]],
  "A10-null-intrinsic-param": [["cody", "fx", "intrinsic", "카메라", "camera"], ["null", "누락", "missing"]],
  "B1-projection-map-failed": [["projection.map.failed", "투영", "poison", "매핑 실패"]],
  "B2-multimodal-integrity": [["integrity", "정합", "불일치", "파일명", "file_name", "filename"], ["multimodal", "read_multimodal", "모달"]],
  "E1-new-column-query": [["gripper_temperature"]],
  "E2-new-aggregate-query": [["성공률", "집계", "aggregate", "GROUP BY", "group by"]],
  "E3-new-join-query": [["멀티모달", "multimodal", "조인", "JOIN", "join", "통합"]],
  "E4-time-series-query": [["일자별", "일별", "날짜별", "시계열", "추이", "date_trunc", "DATE"]],
  "E5-failure-ranking-query": [["실패", "fail"], ["상위", "순위", "랭킹", "rank", "ORDER BY", "order by"]],
};

function normalize(text) {
  return text.normalize("NFC");
}

function parseFrontMatter(markdown) {
  if (!markdown.startsWith("---\n")) {
    return null;
  }
  const end = markdown.indexOf("\n---", 4);
  if (end === -1) {
    return null;
  }
  const block = markdown.slice(4, end);
  const body = markdown.slice(end + 4);
  const sufficientMatch = block.match(/^sufficientEvidence:\s*(true|false)\s*$/m);
  const targetMatch = block.match(/^targetReadModel:\s*(.+)$/m);
  const docIdMatch = block.match(/^docId:\s*(.+)$/m);
  return {
    body,
    sufficientEvidence: sufficientMatch ? sufficientMatch[1] === "true" : null,
    targetReadModel: targetMatch ? targetMatch[1].trim() : null,
    docId: docIdMatch ? docIdMatch[1].trim() : null,
  };
}

function sectionSlice(body, heading, nextHeadingPrefix) {
  const start = body.indexOf(heading);
  if (start === -1) {
    return null;
  }
  const rest = body.slice(start + heading.length);
  const next = rest.indexOf(nextHeadingPrefix);
  return next === -1 ? rest : rest.slice(0, next);
}

function checkDocs(scenarioId, markdown) {
  const checks = {};
  const text = normalize(markdown);
  const parsed = parseFrontMatter(text);

  checks.frontMatterPresent = parsed !== null;
  if (parsed === null) {
    return { checks, passRate: 0 };
  }

  const { body } = parsed;
  checks.sufficientEvidence = parsed.sufficientEvidence === true;
  checks.verdictNotNoAction = !body.includes("결론(TL;DR): 조치 불필요");

  const recommendation = sectionSlice(body, "## 1. 권고 (Recommendation)", "\n## ");
  const sql = sectionSlice(body, "## 2. Read Model 생성 SQL (Read Model DDL)", "\n## ");
  const versioning = sectionSlice(body, "## 3. API Versioning", "\n## ");

  checks.recommendationFilled =
    recommendation !== null && !recommendation.includes("INSUFFICIENT_EVIDENCE");
  checks.sqlFilled = sql !== null && !sql.includes("INSUFFICIENT_EVIDENCE");
  checks.versioningFilled =
    versioning !== null && !versioning.includes("INSUFFICIENT_EVIDENCE");

  const groups = GROUNDING[scenarioId] ?? [];
  checks.grounding = groups.every((group) =>
    group.some((needle) => text.includes(normalize(needle))),
  );

  // 한자 혼입 = 산문 오염(fix1 실측: 且 접속사 남발). 이 도메인 문서의 정상 텍스트
  // (한글·코드·숫자)에는 CJK 한자 블록 문자가 등장할 일이 없다 — 오탐 없는 결정론 신호.
  checks.hanCharacterFree =
    !/[\u{3400}-\u{4DBF}\u{4E00}-\u{9FFF}\u{F900}-\u{FAFF}]/u.test(text);

  const keys = Object.keys(checks);
  const passed = keys.filter((key) => checks[key]).length;
  return { checks, passRate: passed / keys.length };
}

async function main() {
  const args = process.argv.slice(2);
  let resultsDirectory = DEFAULT_RESULTS;
  const flagIndex = args.indexOf("--results");
  if (flagIndex !== -1) {
    resultsDirectory = path.resolve(args[flagIndex + 1]);
  }

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
      let meta = null;
      try {
        meta = JSON.parse(await fs.readFile(path.join(repDirectory, "run-meta.json"), "utf8"));
      } catch {
        // 메타 없이 수집된 폴더 허용
      }
      const documents = (await fs.readdir(repDirectory)).filter((name) => name.endsWith(".md"));

      if (documents.length === 0) {
        rows.push({
          scenarioId,
          rep: repName,
          file: null,
          expectsDocs: meta?.expectsDocs ?? null,
          verdict:
            meta?.expectsDocs === false ? "정상(미생성이 정답)" : "실패(문서 미생성)",
          checks: {},
          passRate: meta?.expectsDocs === false ? 1 : 0,
        });
        continue;
      }

      for (const fileName of documents) {
        const markdown = await fs.readFile(path.join(repDirectory, fileName), "utf8");
        const { checks, passRate } = checkDocs(scenarioId, markdown);
        rows.push({
          scenarioId,
          rep: repName,
          file: fileName,
          expectsDocs: meta?.expectsDocs ?? null,
          verdict:
            meta?.expectsDocs === false
              ? "오탐(정상 시나리오에서 문서 생성)"
              : passRate === 1
                ? "통과"
                : "부분 통과",
          checks,
          passRate,
        });
      }
    }
  }

  // 시나리오별 요약
  console.log("시나리오별 결정론 검증 요약:");
  const byScenario = new Map();
  for (const row of rows) {
    if (!byScenario.has(row.scenarioId)) {
      byScenario.set(row.scenarioId, []);
    }
    byScenario.get(row.scenarioId).push(row);
  }
  for (const [scenarioId, group] of byScenario) {
    const average = group.reduce((sum, row) => sum + row.passRate, 0) / group.length;
    const full = group.filter((row) => row.passRate === 1).length;
    console.log(
      `  ${scenarioId.padEnd(28)} 런 ${String(group.length).padStart(2)}개  전항목통과 ${full}/${group.length}  평균 ${(average * 100).toFixed(0)}%`,
    );
  }

  console.log("\n체크 실패 상세:");
  for (const row of rows) {
    const failed = Object.entries(row.checks)
      .filter(([, ok]) => !ok)
      .map(([key]) => key);
    if (failed.length > 0 || row.verdict.startsWith("실패") || row.verdict.startsWith("오탐")) {
      console.log(`  ${row.scenarioId}/${row.rep} ${row.file ?? "-"} → ${row.verdict} [${failed.join(", ")}]`);
    }
  }

  const reportPath = path.join(
    resultsDirectory,
    `verification-${new Date().toISOString().replace(/[:.]/g, "-")}.json`,
  );
  await fs.writeFile(reportPath, JSON.stringify(rows, null, 2));
  console.log(`\n결과 저장: ${path.relative(REPOSITORY_ROOT, reportPath)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

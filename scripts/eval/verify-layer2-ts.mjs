#!/usr/bin/env node
// 층2 Docs TypeScript 적용 가능성 검증기.
//
// 수집된 Docs(.md)의 ```ts / ```typescript 블록을 추출해 두 단계로 채점한다:
//   [1단계 구문] 모든 블록을 TypeScript 파서로 구문 검사한다. 메서드/멤버 조각은
//     클래스 래핑을 허용해 "그 파일 안에 붙여넣으면 문법이 성립하는가"를 측정한다.
//   [2단계 조립 컴파일] 문서가 지시한 파일 경로(addFile/modifyFile)에 해당 블록들을
//     실제 소스 트리 위에 가상 배치하고 — 스키마 배럴(index.ts)에는 신규 export 를
//     문서 지시대로 합성 — 문서 단위로 하나의 프로그램을 만들어 타입 검사한다.
//     즉 "사람이 이 문서를 그대로 전부 적용하면 컴파일되는가"를 측정한다.
//
// 경로를 추정할 수 없는 블록(배선 조각·예시)은 2단계에서 제외되고 1단계만 기록된다.
//
// 사용: node scripts/eval/verify-layer2-ts.mjs --results scripts/eval/results/<dir>

import { promises as fs, readFileSync } from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const SCRIPT_DIRECTORY = path.dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = path.resolve(SCRIPT_DIRECTORY, "..", "..");
const SCHEMA_BARREL_PATH = path.join(REPOSITORY_ROOT, "src/shared/database/schema/index.ts");

function parseArguments() {
  const resultsFlagIndex = process.argv.indexOf("--results");
  if (resultsFlagIndex === -1 || !process.argv[resultsFlagIndex + 1]) {
    console.error("사용: node scripts/eval/verify-layer2-ts.mjs --results <dir>");
    process.exit(1);
  }
  return path.resolve(REPOSITORY_ROOT, process.argv[resultsFlagIndex + 1]);
}

function extractTypescriptBlocks(markdown) {
  const headingPattern = /^#{2,4}\s+(.+)$/gm;
  const headings = [];
  let headingMatch;
  while ((headingMatch = headingPattern.exec(markdown)) !== null) {
    headings.push({ index: headingMatch.index, text: headingMatch[1].trim() });
  }
  const blocks = [];
  const pattern = /```(?:typescript|ts)\n([\s\S]*?)```/g;
  let match;
  while ((match = pattern.exec(markdown)) !== null) {
    const code = match[1];
    if (code.trim().length === 0) {
      continue;
    }
    let section = "";
    for (const heading of headings) {
      if (heading.index < match.index) {
        section = heading.text;
      } else {
        break;
      }
    }
    blocks.push({ code, section });
  }
  return blocks;
}

// 문서 본문에 명시된 대상 파일 경로 목록: `src/....ts` (addFile|modifyFile)
function extractTargetPaths(markdown) {
  const targets = [];
  const pattern = /`(src\/[^`]+?\.ts)`\s*\((addFile|modifyFile)\)/g;
  let match;
  while ((match = pattern.exec(markdown)) !== null) {
    if (!targets.some((target) => target.relativePath === match[1])) {
      targets.push({ relativePath: match[1], kind: match[2] });
    }
  }
  return targets;
}

function kebabCase(name) {
  return name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

// 블록 → 대상 경로 추정. 헤딩의 명시 경로가 우선이고, 없으면 프로젝트 네이밍 관례
// (스키마: export const readXyz → schema/service/read-xyz.ts,
//  프로젝터: export class XyzProjector → projection/projector/xyz.projector.ts)로 유도한다.
function inferBlockTargetPath(block) {
  const headingPathMatch = /`(src\/[^`]+?\.ts)`/.exec(block.section);
  if (headingPathMatch) {
    return headingPathMatch[1];
  }
  const schemaMatch = /export const (\w+) = pgTable\(/.exec(block.code);
  if (schemaMatch) {
    return `src/shared/database/schema/service/${kebabCase(schemaMatch[1])}.ts`;
  }
  const projectorMatch = /export class (\w+)Projector\b/.exec(block.code);
  if (projectorMatch) {
    return `src/projection/projector/${kebabCase(projectorMatch[1])}.projector.ts`;
  }
  return null;
}

// 완결 파일로 볼 수 있는 블록: import 로 시작하고 export 선언을 가진다.
function looksLikeCompleteFile(code) {
  return /^\s*import\s/.test(code) && /\bexport\s+(class|const|abstract|function|interface|type)\b/.test(code);
}

const projectConfig = ts.parseJsonConfigFileContent(
  ts.readConfigFile(path.join(REPOSITORY_ROOT, "tsconfig.json"), ts.sys.readFile).config,
  ts.sys,
  REPOSITORY_ROOT,
);
const compilerOptions = { ...projectConfig.options, noEmit: true, incremental: false };
const realBarrelContent = readFileSync(SCHEMA_BARREL_PATH, "utf8");

function syntaxDiagnostics(code) {
  const output = ts.transpileModule(code, {
    reportDiagnostics: true,
    compilerOptions: { target: compilerOptions.target, experimentalDecorators: true },
  });
  return (output.diagnostics ?? []).filter(
    (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error,
  );
}

function checkSyntax(code) {
  if (syntaxDiagnostics(code).length === 0) {
    return { syntaxOk: true, wrapMode: "bare" };
  }
  const classWrapped = `class __EvaluationWrapper {\n${code}\n}`;
  if (syntaxDiagnostics(classWrapped).length === 0) {
    return { syntaxOk: true, wrapMode: "class" };
  }
  const firstDiagnostic = syntaxDiagnostics(code)[0];
  return {
    syntaxOk: false,
    wrapMode: null,
    firstError: ts.flattenDiagnosticMessageText(firstDiagnostic.messageText, " "),
  };
}

// 문서 하나의 조립 컴파일: 대상 경로에 블록을 겹치고, 신규 스키마는 배럴에 export 합성.
function composeAndTypeCheck(record, previousProgram) {
  const overlay = new Map();
  for (const block of record.blocks) {
    if (!block.targetPath || !looksLikeCompleteFile(block.code)) {
      continue;
    }
    const absolutePath = path.join(REPOSITORY_ROOT, block.targetPath);
    if (!overlay.has(absolutePath)) {
      overlay.set(absolutePath, { code: block.code, section: block.section });
    }
  }
  if (overlay.size === 0) {
    return { composedFiles: [], program: previousProgram };
  }
  const newSchemaExports = [...overlay.keys()]
    .map((absolutePath) => path.relative(REPOSITORY_ROOT, absolutePath))
    .filter((relativePath) => /shared\/database\/schema\/service\//.test(relativePath))
    .map((relativePath) => {
      const withoutExtension = relativePath.replace(/\.ts$/, "");
      const barrelRelative = "./" + path.relative("src/shared/database/schema", withoutExtension);
      return `export * from "${barrelRelative}";`;
    });
  if (newSchemaExports.length > 0 && !overlay.has(SCHEMA_BARREL_PATH)) {
    overlay.set(SCHEMA_BARREL_PATH, {
      code: `${realBarrelContent}\n${newSchemaExports.join("\n")}\n`,
      section: "배럴 합성",
    });
  }

  const host = ts.createCompilerHost(compilerOptions);
  const defaultReadFile = host.readFile.bind(host);
  const defaultFileExists = host.fileExists.bind(host);
  const defaultGetSourceFile = host.getSourceFile.bind(host);
  host.readFile = (fileName) =>
    overlay.has(fileName) ? overlay.get(fileName).code : defaultReadFile(fileName);
  host.fileExists = (fileName) => overlay.has(fileName) || defaultFileExists(fileName);
  host.getSourceFile = (fileName, languageVersion, onError, shouldCreate) => {
    if (overlay.has(fileName)) {
      return ts.createSourceFile(fileName, overlay.get(fileName).code, languageVersion, true);
    }
    return defaultGetSourceFile(fileName, languageVersion, onError, shouldCreate);
  };
  const program = ts.createProgram([...overlay.keys()], compilerOptions, host, previousProgram);
  const composedFiles = [];
  for (const [absolutePath, entry] of overlay.entries()) {
    if (absolutePath === SCHEMA_BARREL_PATH && entry.section === "배럴 합성") {
      continue; // 합성 배럴 자체는 채점 대상이 아니다(신규 파일 미배치 시 오류가 여기 전가되는 것 방지).
    }
    const sourceFile = program.getSourceFile(absolutePath);
    const diagnostics = [
      ...program.getSyntacticDiagnostics(sourceFile),
      ...program.getSemanticDiagnostics(sourceFile),
    ].filter((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error);
    composedFiles.push({
      targetPath: path.relative(REPOSITORY_ROOT, absolutePath),
      section: entry.section,
      typeOk: diagnostics.length === 0,
      errors: diagnostics.slice(0, 3).map((diagnostic) => ({
        code: `TS${diagnostic.code}`,
        message: ts.flattenDiagnosticMessageText(diagnostic.messageText, " ").slice(0, 200),
      })),
    });
  }
  return { composedFiles, program };
}

async function main() {
  const resultsDirectory = parseArguments();
  const documentRecords = [];
  const scenarioDirectories = (await fs.readdir(resultsDirectory, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  for (const scenarioId of scenarioDirectories) {
    const scenarioPath = path.join(resultsDirectory, scenarioId);
    const repDirectories = (await fs.readdir(scenarioPath, { withFileTypes: true }))
      .filter((entry) => entry.isDirectory() && entry.name.startsWith("rep-"))
      .map((entry) => entry.name)
      .sort();
    for (const rep of repDirectories) {
      const repPath = path.join(scenarioPath, rep);
      const markdownFiles = (await fs.readdir(repPath)).filter((name) => name.endsWith(".md")).sort();
      for (const file of markdownFiles) {
        const markdown = await fs.readFile(path.join(repPath, file), "utf8");
        const blocks = extractTypescriptBlocks(markdown);
        const targetPaths = extractTargetPaths(markdown);
        for (const block of blocks) {
          block.targetPath = inferBlockTargetPath(block);
        }
        documentRecords.push({ scenarioId, rep, file, blocks, targetPaths });
      }
    }
  }

  let totalBlocks = 0;
  let syntaxPassed = 0;
  const syntaxVerdictCache = new Map();
  for (const record of documentRecords) {
    for (const block of record.blocks) {
      if (!syntaxVerdictCache.has(block.code)) {
        syntaxVerdictCache.set(block.code, checkSyntax(block.code));
      }
      block.syntax = syntaxVerdictCache.get(block.code);
      totalBlocks += 1;
      if (block.syntax.syntaxOk) {
        syntaxPassed += 1;
      }
    }
  }

  let composableDocuments = 0;
  let composedCleanDocuments = 0;
  let totalComposedFiles = 0;
  let cleanComposedFiles = 0;
  const documentSummaries = [];
  let previousProgram = undefined;
  for (const record of documentRecords) {
    const { composedFiles, program } = composeAndTypeCheck(record, previousProgram);
    previousProgram = program;
    const syntaxFailures = record.blocks
      .filter((block) => !block.syntax.syntaxOk)
      .map((block) => ({ section: block.section, error: block.syntax.firstError }));
    const typeFailures = composedFiles.filter((file) => !file.typeOk);
    if (composedFiles.length > 0) {
      composableDocuments += 1;
      totalComposedFiles += composedFiles.length;
      cleanComposedFiles += composedFiles.length - typeFailures.length;
      if (typeFailures.length === 0) {
        composedCleanDocuments += 1;
      }
    }
    documentSummaries.push({
      scenarioId: record.scenarioId,
      rep: record.rep,
      file: record.file,
      blockCount: record.blocks.length,
      syntaxPassed: record.blocks.filter((block) => block.syntax.syntaxOk).length,
      composedFiles,
      syntaxFailures,
    });
    const marker = syntaxFailures.length === 0 && typeFailures.length === 0 ? "✓" : "✗";
    const composedLabel =
      composedFiles.length > 0
        ? `, 조립 컴파일 ${composedFiles.length - typeFailures.length}/${composedFiles.length}`
        : "";
    console.log(
      `  ${marker} ${record.scenarioId}/${record.rep} ${record.file} — 구문 ${record.blocks.filter((block) => block.syntax.syntaxOk).length}/${record.blocks.length}${composedLabel}`,
    );
    for (const failure of syntaxFailures) {
      console.log(`      구문 실패 [${failure.section}] → ${failure.error}`);
    }
    for (const failure of typeFailures) {
      console.log(
        `      조립 실패 ${failure.targetPath} → ${failure.errors[0].code} ${failure.errors[0].message}`,
      );
    }
  }

  console.log(
    `\n합계: 문서 ${documentRecords.length}건 / TS 블록 ${totalBlocks}개 중 구문 통과 ${syntaxPassed}개 (${Math.round((syntaxPassed / totalBlocks) * 100)}%)`,
  );
  console.log(
    `      조립 컴파일 대상 문서 ${composableDocuments}건 중 전파일 클린 ${composedCleanDocuments}건 (${Math.round((composedCleanDocuments / Math.max(composableDocuments, 1)) * 100)}%)`,
  );
  console.log(
    `      조립 파일 ${totalComposedFiles}개 중 타입 클린 ${cleanComposedFiles}개 (${Math.round((cleanComposedFiles / Math.max(totalComposedFiles, 1)) * 100)}%)`,
  );

  const outputPath = path.join(
    resultsDirectory,
    `ts-verification-${new Date().toISOString().replace(/[:.]/g, "-")}.json`,
  );
  await fs.writeFile(outputPath, JSON.stringify(documentSummaries, null, 2));
  console.log(`결과 저장: ${outputPath}`);
}

await main();

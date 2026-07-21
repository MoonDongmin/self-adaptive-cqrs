import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

// 생성 TypeScript 코드(신규 파일)의 실제 컴파일 검증기.
// 현재 src 전체를 임시 디렉토리에 복사하고 node_modules 를 심링크한 뒤, 생성 파일을
// 의도된 경로에 놓고 tsc --noEmit 를 돌린다 — "붙여넣으면 컴파일되는가"를 문서 생성
// 시점에 실측한다(2026-07-21 3축 채점: 없는 심볼·타입 불일치·import 누락이 축2 전멸의
// 주원인). 실제 레포는 건드리지 않는다.

export interface GeneratedFile {
  relativePath: string; // 레포 루트 기준 (예: src/projection/projector/read-x.projector.ts)
  content: string;
}

const REPOSITORY_ROOT = path.resolve(__dirname, "..", "..", "..");

// tsc 전체 검사 ~30초 × 재시도가 런타임을 잠식하지 않게 상한을 둔다.
const TSC_TIMEOUT_MS = 120_000;

// 컴파일 성공이면 null, 실패면 생성 파일에 해당하는 에러 라인들을 반환한다.
export async function validateGeneratedTypeScript(
  files: GeneratedFile[],
  schemaBarrelExportLines: string[],
): Promise<string | null> {
  if (files.length === 0) {
    return null;
  }

  const workDirectory = await fs.mkdtemp(
    path.join(os.tmpdir(), "analysis-tsc-"),
  );

  try {
    await execFileAsync("cp", [
      "-R",
      path.join(REPOSITORY_ROOT, "src"),
      path.join(workDirectory, "src"),
    ]);
    await fs.copyFile(
      path.join(REPOSITORY_ROOT, "tsconfig.json"),
      path.join(workDirectory, "tsconfig.json"),
    );
    await fs.symlink(
      path.join(REPOSITORY_ROOT, "node_modules"),
      path.join(workDirectory, "node_modules"),
    );

    for (const file of files) {
      const target = path.join(workDirectory, file.relativePath);
      await fs.mkdir(path.dirname(target), { recursive: true });
      await fs.writeFile(target, file.content);
    }

    if (schemaBarrelExportLines.length > 0) {
      const barrelPath = path.join(
        workDirectory,
        "src/shared/database/schema/index.ts",
      );
      const barrel = await fs.readFile(barrelPath, "utf8");
      await fs.writeFile(
        barrelPath,
        `${barrel}\n${schemaBarrelExportLines.join("\n")}\n`,
      );
    }

    try {
      await execFileAsync(
        "npx",
        ["tsc", "--noEmit", "-p", "tsconfig.json"],
        { cwd: workDirectory, timeout: TSC_TIMEOUT_MS },
      );
      return null;
    } catch (error) {
      const stdout =
        typeof (error as { stdout?: unknown }).stdout === "string"
          ? ((error as { stdout: string }).stdout)
          : String(error);
      // 생성 파일과 배럴에서 난 에러만 추린다(기존 소스는 검증 시점에 깨끗함이 전제).
      const generatedPaths = files.map((file) => file.relativePath);
      const relevant = stdout
        .split("\n")
        .filter(
          (line) =>
            generatedPaths.some((p) => line.includes(p)) ||
            line.includes("src/shared/database/schema/index.ts"),
        );
      const report = relevant.length > 0 ? relevant.join("\n") : stdout;
      return report.trim().length > 0 ? report.trim() : null;
    }
  } finally {
    await fs.rm(workDirectory, { recursive: true, force: true });
  }
}

import * as fs from 'node:fs';
import { join } from 'node:path';

// 생성 노드(versionSwitch/newReadModel/recommendationDocs)가 "실제 코드를 보여주며
// 고쳐라"를 하려면, LLM이 기존 v1 구현의 실제 시그니처·스타일을 봐야 한다. 인라인 스냅샷은
// 코드 변경 시 드리프트가 생기므로 런타임에 디스크에서 읽는다(process.cwd() 기준, service와 동일 패턴).
const SOURCE_FILES: ReadonlyArray<{
  label: string;
  relativePath: string;
  language: string;
}> = [
  {
    label: "이벤트 payload 스키마",
    relativePath: "src/insert/dto/toy-data.dto.ts",
    language: "ts",
  },
  {
    label: "Projector 인터페이스",
    relativePath: "src/projection/projector/projector.ts",
    language: "ts",
  },
  {
    label: "EventStoreEventRow",
    relativePath: "src/projection/repository/event-store-reader.repository.ts",
    language: "ts",
  },
  {
    label: "Drizzle 테이블 — read_grip_result",
    relativePath: "src/shared/database/schema/service/read-grip-result.ts",
    language: "ts",
  },
  {
    label: "Drizzle 테이블 — read_multimodal",
    relativePath: "src/shared/database/schema/service/read-multimodal.ts",
    language: "ts",
  },
  {
    label: "Projector 구현 — GripResultProjector",
    relativePath: "src/projection/projector/grip-result.projector.ts",
    language: "ts",
  },
  {
    label: "ProjectionService(주입/catch-up 패턴)",
    relativePath: "src/projection/projection.service.ts",
    language: "ts",
  },
  {
    label: "ProjectionController(라우트 패턴)",
    relativePath: "src/projection/projection.controller.ts",
    language: "ts",
  },
  {
    label: "schema/index.ts(export 패턴)",
    relativePath: "src/shared/database/schema/index.ts",
    language: "ts",
  },
];

export async function readSourceExamples(): Promise<string> {
  const blocks: string[] = [];

  for (const file of SOURCE_FILES) {
    const source: string = await fs.promises.readFile(
      join(process.cwd(), file.relativePath),
      "utf-8",
    );

    blocks.push(
      [
        `### ${file.label} (\`${file.relativePath}\`)`,
        "```" + file.language,
        source,
        "```",
      ].join("\n"),
    );
  }

  return [
    "## 기존 구현 소스 — 이 시그니처/스타일을 그대로 따르라",
    ...blocks,
  ].join("\n\n");
}

import { GeneratedOutputs } from '@/analysis/type/output.type';
import type { AnomalyLogWindow } from '@/llm-context/llm-context.type';

// Docs 산출물 최상단 YAML front-matter. 파서/CI 가 본문을 읽지 않고도 3요소 계약
// (권고 · Read Model SQL · API Versioning)과 API 델타를 검증할 수 있게 하는 기계검증 메타.
export interface EvidenceSource {
  origin: "developer-logging" | "insight-read-db";
  anchorId: string;
}

export interface ApiVersionDelta {
  from: string | null;
  to: string | null;
  affectedEndpoints: string[];
}

export interface AnalysisFrontMatter {
  docId: string;
  generatedAt: string;
  targetReadModel: string;
  sqlDialect: "postgres";
  sufficientEvidence: boolean;
  apiVersion: ApiVersionDelta;
  evidenceSources: EvidenceSource[];
  constraints: string[];
}

// 표준 하드 제약(하단 Guardrails 에서 재진술). 프로젝트 불변 규칙과 1:1.
export const STANDING_CONSTRAINTS: ReadonlyArray<string> = [
  "v1 자산(테이블/엔드포인트/프로젝터 name) 무손상",
  "PK (scene_key, attempt_num) 유지",
  "TypeScript any 금지",
  "식별자 전체 단어",
  "DDL 실행·API 컷오버는 인간 승인 후에만 (human-in-the-loop)",
  "Read Model 테이블명은 read_ 접두 스네이크 케이스",
];

// NestJS 컨트롤러 코드 문자열에서 라우트("POST /경로")를 뽑는다. front-matter 의
// affectedEndpoints 와 versionSwitch 라우트 일관성 검증이 같은 추출 규칙을 공유한다.
export function extractEndpointsFromCode(code: string): string[] {
  const pattern = /@(Post|Get|Put|Patch|Delete)\(\s*["'`]([^"'`]+)["'`]/g;
  const endpoints = new Set<string>();

  for (const match of code.matchAll(pattern)) {
    const method = match[1];
    const route = match[2];
    if (method !== undefined && route !== undefined) {
      endpoints.add(`${method.toUpperCase()} ${route}`);
    }
  }

  return Array.from(endpoints);
}

// versionSwitch 코드 변경 스니펫에서 실제 라우트를 뽑는다(근거 있는 값만, 발명 금지).
export function extractEndpoints(outputs: GeneratedOutputs): string[] {
  const versionSwitch = outputs.versionSwitch;
  if (versionSwitch === undefined) {
    return [];
  }

  const endpoints = new Set<string>();
  for (const change of versionSwitch.codeChanges) {
    for (const endpoint of extractEndpointsFromCode(change.snippet)) {
      endpoints.add(endpoint);
    }
  }

  return Array.from(endpoints);
}

function pickTargetReadModel(outputs: GeneratedOutputs): string {
  return (
    outputs.recommendationDocs?.targetReadModel ??
    outputs.dataQualityRecommendation?.targetReadModel ??
    outputs.versionSwitch?.readModelName ??
    outputs.newReadModel?.proposedName ??
    "unknown"
  );
}

function collectEvidenceSources(
  window: AnomalyLogWindow | null,
  outputs: GeneratedOutputs,
): EvidenceSource[] {
  const sources: EvidenceSource[] = [];
  const seen = new Set<string>();

  const push = (
    origin: EvidenceSource["origin"],
    anchorId: string | null,
  ): void => {
    if (anchorId === null || anchorId === "" || anchorId === "-") {
      return;
    }
    const key = `${origin}:${anchorId}`;
    if (!seen.has(key)) {
      seen.add(key);
      sources.push({ origin, anchorId });
    }
  };

  // 로그 근거: 권고 문서가 인용한 correlation_id, 그리고 윈도우 앵커 행.
  for (const item of outputs.recommendationDocs?.evidence ?? []) {
    push("developer-logging", item.correlationId);
  }
  if (window !== null) {
    for (const row of window.rows) {
      if (row.isAnchor) {
        push("developer-logging", row.correlationId);
      }
    }
  }
  // 센서/Insight 근거: 데이터 품질 근거의 event_store 전역 시퀀스.
  for (const item of outputs.dataQualityRecommendation?.sensorEvidence ?? []) {
    push("insight-read-db", `seq:${item.globalSequence}`);
  }

  return sources;
}

// §1~3 산출물 존재 여부로 sufficientEvidence 판정. 하나라도 없으면 그 섹션은 센티넬 → false.
function hasRecommendation(outputs: GeneratedOutputs): boolean {
  return (
    outputs.recommendationDocs !== undefined ||
    outputs.dataQualityRecommendation !== undefined
  );
}

export function buildFrontMatter(input: {
  docId: string;
  generatedAt: string;
  window: AnomalyLogWindow | null;
  outputs: GeneratedOutputs;
}): AnalysisFrontMatter {
  const { docId, generatedAt, window, outputs } = input;
  const versionSwitch = outputs.versionSwitch;

  // §2 는 신규 DDL 또는 격리 SQL, §3 는 버전 교체 또는 버전 영향 서술로 채워진다
  // (render.ts 의 섹션 렌더와 동일한 기준 — 격리 계열도 3요소가 실재하면 true).
  const sqlSectionFilled =
    outputs.newReadModel !== undefined ||
    (outputs.recommendationDocs?.containmentSql ?? "").trim().length > 0;
  const versioningSectionFilled =
    versionSwitch !== undefined ||
    (outputs.recommendationDocs?.apiVersionImpact ?? "").trim().length > 0;
  const sufficientEvidence =
    hasRecommendation(outputs) && sqlSectionFilled && versioningSectionFilled;

  return {
    docId,
    generatedAt,
    targetReadModel: pickTargetReadModel(outputs),
    sqlDialect: "postgres",
    sufficientEvidence,
    apiVersion: {
      from: versionSwitch?.fromVersion ?? null,
      to: versionSwitch?.toVersion ?? null,
      affectedEndpoints: extractEndpoints(outputs),
    },
    evidenceSources: collectEvidenceSources(window, outputs),
    constraints: Array.from(STANDING_CONSTRAINTS),
  };
}

// YAML 직렬화. 값이 특수문자를 품을 수 있는 경우만 큰따옴표로 감싸고 이스케이프한다.
function yamlQuote(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

export function renderFrontMatter(frontMatter: AnalysisFrontMatter): string {
  const lines: string[] = ["---"];

  lines.push(`docId: ${frontMatter.docId}`);
  lines.push(`generatedAt: ${frontMatter.generatedAt}`);
  lines.push(`targetReadModel: ${frontMatter.targetReadModel}`);
  lines.push(`sqlDialect: ${frontMatter.sqlDialect}`);
  lines.push(`sufficientEvidence: ${frontMatter.sufficientEvidence}`);

  lines.push("apiVersion:");
  lines.push(`  from: ${frontMatter.apiVersion.from ?? "null"}`);
  lines.push(`  to: ${frontMatter.apiVersion.to ?? "null"}`);
  if (frontMatter.apiVersion.affectedEndpoints.length === 0) {
    lines.push("  affectedEndpoints: []");
  } else {
    lines.push("  affectedEndpoints:");
    for (const endpoint of frontMatter.apiVersion.affectedEndpoints) {
      lines.push(`    - ${yamlQuote(endpoint)}`);
    }
  }

  if (frontMatter.evidenceSources.length === 0) {
    lines.push("evidenceSources: []");
  } else {
    lines.push("evidenceSources:");
    for (const source of frontMatter.evidenceSources) {
      lines.push(
        `  - { origin: ${source.origin}, anchorId: ${yamlQuote(source.anchorId)} }`,
      );
    }
  }

  lines.push("constraints:");
  for (const constraint of frontMatter.constraints) {
    lines.push(`  - ${yamlQuote(constraint)}`);
  }

  lines.push("---");
  return lines.join("\n");
}

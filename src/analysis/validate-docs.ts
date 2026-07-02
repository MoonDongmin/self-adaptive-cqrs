// Docs 산출물이 스펙(docs/analysis/docs-format-spec.md) 계약을 지키는지 검사하는 결정론 검증기.
// front-matter 는 필요한 필드만 가볍게 파싱한다(전체 YAML 파서 불필요).
export interface DocsValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

interface ParsedFrontMatter {
  sufficientEvidence: boolean | null;
  evidenceAnchorIds: string[];
}

const REQUIRED_SECTIONS: ReadonlyArray<string> = [
  "## 1. 권고 (Recommendation)",
  "## 2. Read Model 생성 SQL (Read Model DDL)",
  "## 3. API Versioning",
];

// References 는 산출물에 넣지 않는다(설계 근거는 스펙 §1·§3-a로 일원화).
// Guardrails 가 문서 마지막 섹션(U자형: 하드 제약을 컨텍스트 맨 끝에).
const REQUIRED_TAIL_SECTIONS: ReadonlyArray<string> = [
  "## Guardrails (constraints)",
];

// 코어(front-matter+결론+근거+§1~3+Guardrails) 토큰 예산 (rule 16).
// 20B급 로컬 소비자의 유효 컨텍스트(NoLiMa arXiv:2502.05167: 공칭 128K 모델도 유효 2K~8K,
// Gemma 3 TR arXiv:2503.19786: RULER 32K→128K 하락)를 감안한 상한. 결정론 검증기이므로
// 토크나이저 없이 한/영 혼합 보수치 3문자/토큰으로 근사한다.
const CORE_TOKEN_TARGET = 8_000;
const CORE_TOKEN_HARD_CAP = 20_000;

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 3);
}

// Optional(§1~3 뒤, Guardrails 앞)은 컨텍스트 예산 부족 시 잘라내는 구획이라 코어에서 제외.
function extractCore(markdown: string): string {
  const optionalStart = markdown.indexOf("\n## Optional —");
  if (optionalStart === -1) {
    return markdown;
  }
  const guardrailsStart = markdown.indexOf("\n## Guardrails", optionalStart);
  if (guardrailsStart === -1) {
    return markdown.slice(0, optionalStart);
  }
  return markdown.slice(0, optionalStart) + markdown.slice(guardrailsStart);
}

function splitFrontMatter(
  markdown: string,
): { block: string; body: string } | null {
  if (!markdown.startsWith("---\n")) {
    return null;
  }
  const end = markdown.indexOf("\n---", 4);
  if (end === -1) {
    return null;
  }
  return { block: markdown.slice(4, end), body: markdown.slice(end + 4) };
}

function parseFrontMatter(block: string): ParsedFrontMatter {
  const sufficientMatch = block.match(
    /^sufficientEvidence:\s*(true|false)\s*$/m,
  );
  const sufficientEvidence =
    sufficientMatch === null ? null : sufficientMatch[1] === "true";

  const anchorIds: string[] = [];
  for (const match of block.matchAll(/anchorId:\s*"([^"]+)"/g)) {
    if (match[1] !== undefined) {
      anchorIds.push(match[1]);
    }
  }

  return { sufficientEvidence, evidenceAnchorIds: anchorIds };
}

export function validateDocs(markdown: string): DocsValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const parsed = splitFrontMatter(markdown);
  if (parsed === null) {
    return {
      valid: false,
      errors: ["front-matter(--- 블록)가 없거나 닫히지 않음"],
      warnings: [],
    };
  }

  const frontMatter = parseFrontMatter(parsed.block);
  const { body } = parsed;

  // 1) 필수 3섹션이 고정 순서로 존재.
  let cursor = 0;
  for (const section of REQUIRED_SECTIONS) {
    const index = body.indexOf(section, cursor);
    if (index === -1) {
      errors.push(`필수 섹션 누락 또는 순서 위반: ${section}`);
    } else {
      cursor = index + section.length;
    }
  }

  // 2) 하단 고정 섹션(Guardrails·References).
  for (const section of REQUIRED_TAIL_SECTIONS) {
    if (!body.includes(section)) {
      errors.push(`필수 섹션 누락: ${section}`);
    }
  }

  // 3) 센티넬 ↔ sufficientEvidence 정합성.
  const hasSentinel = body.includes("INSUFFICIENT_EVIDENCE");
  if (frontMatter.sufficientEvidence === null) {
    errors.push("front-matter 에 sufficientEvidence 누락");
  } else if (frontMatter.sufficientEvidence && hasSentinel) {
    errors.push(
      "sufficientEvidence:true 인데 INSUFFICIENT_EVIDENCE 센티넬이 존재",
    );
  } else if (!frontMatter.sufficientEvidence && !hasSentinel) {
    errors.push("sufficientEvidence:false 인데 센티넬이 없음");
  }

  // 4) 본문 [corr:x]/[seq:n] 인용은 front-matter evidenceSources 앵커에 실재해야 함(rule 5).
  const anchors = new Set(frontMatter.evidenceAnchorIds);
  for (const match of body.matchAll(/\[(corr|seq):([^\]]+)\]/g)) {
    const kind = match[1];
    const id = match[2];
    if (kind === undefined || id === undefined) {
      continue;
    }
    const anchorId = kind === "seq" ? `seq:${id}` : id;
    if (!anchors.has(anchorId)) {
      errors.push(`근거 미매핑 인용: [${kind}:${id}] 가 evidenceSources 에 없음`);
    }
  }

  // 5) 코어 토큰 예산(rule 16): 목표 초과는 warning, 하드캡 초과는 error.
  const coreTokens = estimateTokens(extractCore(markdown));
  if (coreTokens > CORE_TOKEN_HARD_CAP) {
    errors.push(
      `코어 토큰 예산 하드캡 초과: 추정 ${coreTokens} > ${CORE_TOKEN_HARD_CAP} 토큰`,
    );
  } else if (coreTokens > CORE_TOKEN_TARGET) {
    warnings.push(
      `코어 토큰 예산 목표 초과: 추정 ${coreTokens} > ${CORE_TOKEN_TARGET} 토큰`,
    );
  }

  return { valid: errors.length === 0, errors, warnings };
}

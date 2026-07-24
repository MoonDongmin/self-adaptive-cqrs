// LLM 산문 품질 결정론 검출기. 로컬 qwen 계열이 한국어 산문에 한자를 혼입한다
// (2026-07-23 layer2-docs-local-k1-fix1 실측: "무손且"·"기존 엔드포인트 호출 경로 고장 방지且" —
// 且 가 접속사로 반복 유입돼 §1/§3 권고 산문의 신뢰도를 훼손). 본 도메인의 정상 텍스트는
// 한글·영문 식별자·숫자·단위뿐이라 CJK 한자 블록 문자는 등장할 일이 없다 — 오탐 없는 오염 신호.
// invokeNode 가 모든 생성 노드의 공통 관문에서 이 검사를 돌려 re-ask 로 재생성시킨다.

// CJK 한자 블록 3개: Extension A(U+3400-4DBF) · Unified(U+4E00-9FFF) · Compatibility(U+F900-FAFF).
// 한글 음절(U+AC00-D7A3)·자모와 겹치지 않으므로 이 범위 매치는 곧 한자 혼입이다.
const HAN_CHARACTER_PATTERN =
  /[\u{3400}-\u{4DBF}\u{4E00}-\u{9FFF}\u{F900}-\u{FAFF}]/u;

// re-ask 프롬프트가 오염 필드 나열로 비대해지지 않게 보고 건수를 제한한다(요지 전달에 충분).
const MAX_REPORTED_PROBLEMS = 5;

function collectHanCharacterProblems(
  value: unknown,
  path: string,
  problems: string[],
): void {
  if (typeof value === "string") {
    const match = value.match(HAN_CHARACTER_PATTERN);
    if (match !== null && match.index !== undefined) {
      const snippet = value.slice(
        Math.max(0, match.index - 15),
        match.index + 16,
      );
      problems.push(
        `${path} 에 한자 "${match[0]}" 혼입: "…${snippet}…" — 한자 없이 순수 한국어로 다시 써라`,
      );
    }
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      collectHanCharacterProblems(item, `${path}[${index}]`, problems);
    });
    return;
  }

  if (typeof value === "object" && value !== null) {
    for (const [key, nested] of Object.entries(value)) {
      collectHanCharacterProblems(nested, `${path}.${key}`, problems);
    }
  }
}

// 파싱된 LLM 출력의 모든 문자열 필드를 순회해 한자 혼입을 보고한다(빈 배열 = 통과).
export function findHanCharacterProblems(output: unknown): string[] {
  const problems: string[] = [];
  collectHanCharacterProblems(output, "$", problems);
  if (problems.length > MAX_REPORTED_PROBLEMS) {
    const hidden = problems.length - MAX_REPORTED_PROBLEMS;
    return [
      ...problems.slice(0, MAX_REPORTED_PROBLEMS),
      `…외 ${hidden}건 — 모든 필드에서 한자를 제거하라`,
    ];
  }
  return problems;
}

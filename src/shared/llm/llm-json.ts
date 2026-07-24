import { jsonrepair } from "jsonrepair";

export function contentToString(content: unknown): string {
  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((part) =>
        typeof part === "object" && part !== null && "text" in part
          ? String((part as { text: unknown }).text)
          : "",
      )
      .join("");
  }

  return "";
}

export function extractJson(text: string): unknown {
  // 프롬프트 계약은 "마지막에 JSON만 코드블록으로 출력"이다 — 산문 중간의 예시 JSON
  // 블록을 잡지 않도록 마지막 펜스를 취한다(첫 펜스 선택은 로컬 qwen 계열에서 오추출 실측).
  const fencedMatches = [...text.matchAll(/```json\s*([\s\S]*?)```/gi)];
  const fenced = fencedMatches.at(-1);

  const raw: string = fenced
    ? fenced[1]
    : text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);

  try {
    return JSON.parse(raw);
  } catch (strictError) {
    // 로컬 모델(qwen3.6-27b)은 문자열 값 안 리터럴 개행·미이스케이프 따옴표·절단으로
    // strict 파싱이 깨진다(2026-07-23 A4 실측: dataQuality/versionSwitch 연속 강등).
    // jsonrepair 로 구제 시도 — 절단 복구로 필수 필드가 빈 경우는 zod 가 걸러
    // invokeNode 의 re-ask 루프로 돌아가므로 오수용 위험은 없다.
    try {
      const repaired: unknown = JSON.parse(jsonrepair(raw));
      console.warn(
        "[extractJson] strict 파싱 실패 — jsonrepair 로 구제:",
        String(strictError),
      );
      return repaired;
    } catch {
      throw strictError;
    }
  }
}

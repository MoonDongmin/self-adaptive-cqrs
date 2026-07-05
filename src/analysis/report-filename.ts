function pad(value: number): string {
  return String(value).padStart(2, "0");
}

// llm-docs 산출물 파일명: {에러 발생 시각}-{id}.md
// 시각을 프리픽스로 두어 디렉터리가 항상 발생 시간순으로 정렬된다(로컬 시간 기준 —
// 콘솔 로그 표기와 일치시켜 로그↔문서 대조를 쉽게 한다).
export function buildReportFileName(occurredAt: Date, id: string): string {
  const stamp: string = [
    occurredAt.getFullYear(),
    pad(occurredAt.getMonth() + 1),
    pad(occurredAt.getDate()),
  ].join("-");
  const time: string = [
    pad(occurredAt.getHours()),
    pad(occurredAt.getMinutes()),
    pad(occurredAt.getSeconds()),
  ].join("");

  return `${stamp}-${time}-${id}.md`;
}

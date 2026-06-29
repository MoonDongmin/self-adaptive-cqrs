import { AnalysisDecision, GeneratedOutputs, RootCauseAnalysis } from '@/analysis/type/output.type';
import { AnomalyLogWindow, LogWindowRow } from '@/llm-context/llm-context.type';

function cell(value: string): string {
  return value.replace(/\s/g, " ").trim().replace(/\|/g, "\\/");
}

function time(value: Date): string {
  return value.toISOString().slice(11, 23);
}

export function renderAnomalyWindow(window: AnomalyLogWindow): string {
  const freq =
    window.frequency.length === 0
      ? "빈도 집계 없음"
      : window.frequency
          .map((f) => `\`${f.action ?? "-"}\`(level ${f.level}) ${f.count}회`)
          .join(", ");

  const header =
    "| time | level | action | correlation_id | msg |\n| --- | --- | --- | --- | --- |";

  const body: string = window.rows
    .map((r: LogWindowRow) => {
      const mark = r.isAnchor ? " ← 트립 앵커" : "";
      return `| ${time(r.time)} | ${r.level} | ${cell(r.action ?? "-")} | ${cell(r.correlationId ?? "-")} | ${cell(r.msg ?? "-")}${mark} |`;
    })
    .join("\n");

  return [
    "## 2. 이상 로그 맥락 (±N 윈도우)",
    `> 빈도: 최근 ${window.windowHours}h — ${freq}.`,
    "",
    header,
    body,
  ].join("\n");
}

export function renderRootCause(rootCause: RootCauseAnalysis): string {
  return [
    "## 근본원인 분석",
    `- 요약: ${rootCause.summary}`,
    `- 타임라인: ${rootCause.timeline}`,
    `- 실패한 요청 의도: ${rootCause.failedIntent}`,
    `- 의심되는 Read Model 부족: ${rootCause.suspectedReadModelGap}`,
  ].join("\n");
}

export function renderDecision(decision: AnalysisDecision): string {
  return [
    "## 의사결정",
    `- 선택: ${decision.selected.join(", ") || "(없음 = 조치 불필요)"}`,
    `- 근거: ${decision.reasoning}`,
  ].join("\n");
}

export function renderOutputs(outputs: GeneratedOutputs): string {
  return [
    "## 생성된 출력",
    "```json",
    JSON.stringify(outputs, null, 2),
    "```",
  ].join("\n");
}

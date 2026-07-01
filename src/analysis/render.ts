import { renderDataQualityRecommendation, renderSensorFinding } from '@/analysis/render-sensor';
import {
  AnalysisDecision,
  GeneratedOutputs,
  NewReadModelOutput,
  RecommendationDocsOutput,
  RootCauseAnalysis,
  SensorAnomalyFinding,
  VersionSwitchOutput,
} from '@/analysis/type/output.type';
import { AnomalyLogWindow, LogWindowRow } from '@/llm-context/llm-context.type';

function cell(value: string): string {
  return value.replace(/\s/g, " ").trim().replace(/\|/g, "\\/");
}

function time(value: Date): string {
  return value.toISOString().slice(11, 23);
}

// 코드 블록: cell()로 압축하면 코드가 망가지므로 원문 그대로 펜스로 감싼다.
function codeBlock(language: string, source: string): string {
  return ["```" + language, source, "```"].join("\n");
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
    "## 이상 로그 맥락 (±N 윈도우)",
    `> 빈도: 최근 ${window.windowHours}h — ${freq}.`,
    "",
    header,
    body,
  ].join("\n");
}

// 로그 라인은 window, 센서 라인은 sensorFinding 을 채운다. 있는 쪽을 근거 맥락으로 렌더.
export function renderEvidenceContext(
  window: AnomalyLogWindow | null,
  sensorFinding: SensorAnomalyFinding | null,
): string {
  if (sensorFinding !== null) {
    return renderSensorFinding(sensorFinding);
  }

  if (window !== null) {
    return renderAnomalyWindow(window);
  }

  return "";
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

export function renderVersionSwitch(output: VersionSwitchOutput): string {
  const changes = output.codeChanges
    .map((change) =>
      [
        `#### \`${change.filePath}\` (${change.changeKind})`,
        `- ${change.description}`,
        codeBlock(change.language, change.snippet),
      ].join("\n"),
    )
    .join("\n\n");

  return [
    `## 버전 교체 — \`${output.readModelName}\` (${output.fromVersion} → ${output.toVersion})`,
    `- 사유: ${output.reason}`,
    `- 트리거 근거: ${output.triggeringEvidence}`,
    `- v1 호환성: ${output.v1Compatibility}`,
    "### 코드 변경",
    changes,
    `### 롤백 계획\n${output.rollbackPlan}`,
  ].join("\n\n");
}

export function renderRecommendationDocs(
  output: RecommendationDocsOutput,
): string {
  const evidence = output.evidence
    .map(
      (item) =>
        `- (level ${item.level}, \`${item.action}\`, ${item.correlationId}) ${item.logQuote} → ${item.interpretation}`,
    )
    .join("\n");

  const observations = output.observations
    .map((line) => `- ${line}`)
    .join("\n");

  const options = output.solutionOptions
    .map((option) => {
      const lines: string[] = [
        `#### ${option.title}`,
        `- 접근: ${option.approach}`,
        `- 제안 필드: ${option.suggestedFields.join(", ") || "-"}`,
        `- 트레이드오프: ${option.tradeoffs}`,
      ];

      if (option.codeSnippet.trim().length > 0) {
        lines.push(codeBlock("typescript", option.codeSnippet));
      }

      return lines.join("\n");
    })
    .join("\n\n");

  return [
    `## 권고 문서 — \`${output.targetReadModel}\``,
    "### 근거",
    evidence,
    "### 관찰",
    observations,
    "### 해결책 옵션",
    options,
    `### 권장\n${output.recommendedOption}`,
  ].join("\n\n");
}

export function renderNewReadModel(output: NewReadModelOutput): string {
  const rows = output.fields
    .map(
      (field) =>
        `| ${cell(field.name)} | ${cell(field.dataType)} | ${cell(field.meaning)} |`,
    )
    .join("\n");

  return [
    `## 신규 Read Model — \`${output.proposedName}\``,
    `- 목적: ${output.purpose}`,
    `- 근거: ${output.rationale}`,
    `- 키 컬럼: ${output.keyColumns}`,
    `- 원천 이벤트: ${output.sourceEvents.join(", ") || "-"}`,
    "### 필드",
    `| name | dataType | meaning |\n| --- | --- | --- |\n${rows}`,
    "### Drizzle 스키마",
    codeBlock("ts", output.drizzleSchema),
    "### 마이그레이션 SQL",
    codeBlock("sql", output.migrationSql),
    "### Projector",
    codeBlock("ts", output.projectorCode),
    "### 배선(컨트롤러/서비스/모듈)",
    codeBlock("ts", output.controllerWiring),
  ].join("\n\n");
}

// 추합 = LLM 요약이 아니라 결정론 조립. 생성물 전체를 섹션으로 verbatim 임베드.
export function renderReport(input: {
  window: AnomalyLogWindow | null;
  sensorFinding: SensorAnomalyFinding | null;
  rootCause: RootCauseAnalysis;
  decision: AnalysisDecision | null;
  outputs: GeneratedOutputs;
}): string {
  const sections: string[] = [
    "# Self-Adaptive CQRS 분석 리포트",
    renderRootCause(input.rootCause),
  ];

  const evidence: string = renderEvidenceContext(
    input.window,
    input.sensorFinding,
  );
  if (evidence.length > 0) {
    sections.push(evidence);
  }

  if (input.decision) {
    sections.push(renderDecision(input.decision));
  }

  const {
    versionSwitch,
    recommendationDocs,
    newReadModel,
    dataQualityRecommendation,
  } = input.outputs;

  if (dataQualityRecommendation) {
    sections.push(renderDataQualityRecommendation(dataQualityRecommendation));
  }

  if (versionSwitch) {
    sections.push(renderVersionSwitch(versionSwitch));
  }

  if (recommendationDocs) {
    sections.push(renderRecommendationDocs(recommendationDocs));
  }

  if (newReadModel) {
    sections.push(renderNewReadModel(newReadModel));
  }

  return sections.join("\n\n");
}

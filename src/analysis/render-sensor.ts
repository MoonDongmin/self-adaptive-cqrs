import { DataQualityRecommendationOutput, SensorAnomalyFinding } from '@/analysis/type/output.type';
import { SensorValueMessage } from '@/projection/kafka/sensor-value.message';

// render.ts 의 codeBlock 과 동일하나, render.ts ↔ render-sensor.ts 순환 import 를
//피하려고 여기서 로컬로 둔다(이 파일은 render.ts 를 import 하지 않는다).
function codeBlock(language: string, source: string): string {
  return ["```" + language, source, "```"].join("\n");
}

// 배치를 원본 JSON 그대로(레코드당 한 줄). prejudge.renderBatchRaw 의 센서 버전.
// observedValue 가 verbatim substring 으로 검증되도록 값을 손실 없이 직렬화한다.
export function renderSensorBatch(batch: SensorValueMessage[]): string {
  return batch.map((message) => JSON.stringify(message)).join("\n");
}

export function renderSensorFinding(finding: SensorAnomalyFinding): string {
  return [
    "## 센서 이상 배치 (관찰자 1차 판정)",
    `> 사유: ${finding.reason}`,
    `> 의심 sceneKey: ${finding.offendingSceneKeys.join(", ") || "-"}`,
    "",
    "### 투영된 센서 값 (JSON 한 줄당 한 레코드)",
    codeBlock("json", finding.batchText),
  ].join("\n");
}

export function renderDataQualityRecommendation(
  output: DataQualityRecommendationOutput,
): string {
  const evidence = output.sensorEvidence
    .map(
      (item) =>
        `- (${item.sceneKey}#${item.attemptNumber}, \`${item.affectedColumn}\` / ${item.sensorDimension}) 관측 \`${item.observedValue}\` vs 기준 \`${item.baselineRuleName}\` ${item.baselineExpectedRange} → 델타 ${item.deviation} · ${item.interpretation}`,
    )
    .join("\n");

  const observations = output.observations
    .map((line) => `- ${line}`)
    .join("\n");
  const blastRadius = output.blastRadius.map((line) => `- ${line}`).join("\n");
  const fiveWhys = output.fiveWhysChain
    .map((line, index) => `${index + 1}. ${line}`)
    .join("\n");
  const criteria = output.decisionCriteria
    .map((line) => `- ${line}`)
    .join("\n");

  const options = output.solutionOptions
    .map((option) => {
      const lines: string[] = [
        `#### [${option.phase}] ${option.title}`,
        `- 접근: ${option.approach}`,
        `- 트레이드오프: ${option.tradeoffs}`,
      ];

      if (option.codeOrSql.trim().length > 0) {
        lines.push(codeBlock("sql", option.codeOrSql));
      }

      return lines.join("\n");
    })
    .join("\n\n");

  const rejected =
    output.recommendedOption.rejectedAlternatives.length === 0
      ? "  - -"
      : output.recommendedOption.rejectedAlternatives
          .map((line) => `  - ${line}`)
          .join("\n");

  const nextSteps = output.nextSteps
    .map(
      (step) =>
        `- ${step.action}${step.filePath ? ` (\`${step.filePath}\`)` : ""} — ${step.estimatedScope}, ${step.ownerRole}`,
    )
    .join("\n");

  return [
    `## 데이터 품질 권고 — \`${output.targetReadModel}\``,
    `> ${output.statusLine}`,
    `### 심각도 — ${output.severityTier}`,
    output.severityJustification,
    "### 기대-실측 델타 근거",
    evidence,
    "### 관찰",
    observations,
    "### 영향 범위",
    blastRadius,
    `### 근본원인 — ${output.rootCauseLane}`,
    fiveWhys,
    "### 의사결정 기준",
    criteria,
    "### 해결책 옵션 (contain → fix → harden)",
    options,
    [
      "### 권장",
      `- ${output.recommendedOption.title}`,
      `- 사유: ${output.recommendedOption.reasoning}`,
      `- 수용하는 트레이드오프: ${output.recommendedOption.acceptedTradeoff}`,
      `- 기각한 대안:\n${rejected}`,
    ].join("\n"),
    "### 즉시 격리 SQL",
    codeBlock("sql", output.containmentSql),
    "### 하드닝(베이스라인 추가 규칙)",
    output.hardeningRule,
    "### 다음 단계",
    nextSteps,
  ].join("\n\n");
}

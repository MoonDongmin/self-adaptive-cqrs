import { buildFrontMatter, extractEndpoints, renderFrontMatter } from '@/analysis/front-matter';
import { renderDataQualityRecommendation, renderSensorFinding } from '@/analysis/render-sensor';
import {
  AnalysisDecision,
  ChangelogCategory,
  GeneratedOutputs,
  NewReadModelOutput,
  ProjectionMappingOutput,
  RecommendationDocsOutput,
  RootCauseAnalysis,
  SensorAnomalyFinding,
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
    `- 이상 유형: ${rootCause.anomalyKind}`,
    `- 요약: ${rootCause.summary}`,
    `- 타임라인: ${rootCause.timeline}`,
    `- 실패한 요청 의도: ${rootCause.failedIntent}`,
    `- 의심되는 Read Model 부족: ${rootCause.suspectedReadModelGap}`,
  ].join("\n");
}

// ── Docs 골격 렌더 (스펙: docs/analysis/docs-format-spec.md) ──────────────────
// front-matter → H1+결론 → 근거(상단) → 고정 3섹션(권고/SQL/API, 미근거는 센티넬)
// → Optional → Guardrails(맨 끝, U자형). 조립은 결정론(LLM 요약 없음).
// 설계 근거(References)는 소비자 LLM에 무관한 메타 정보라 산출물에 넣지 않는다
// (스펙 §1·§3-a로 일원화 — Context Rot: 무관 토큰이 정확도를 낮춤).

interface ReportInput {
  docId: string;
  generatedAt: string;
  window: AnomalyLogWindow | null;
  sensorFinding: SensorAnomalyFinding | null;
  rootCause: RootCauseAnalysis;
  decision: AnalysisDecision | null;
  outputs: GeneratedOutputs;
  insightCards: string;
}

function sentinel(reason: string): string {
  return `INSUFFICIENT_EVIDENCE — ${reason}`;
}

// 재사용 렌더러(권고/데이터품질)는 자체 H2 를 달고 나오므로, 고정 섹션 안에 넣을 때 최상단 헤딩만 벗긴다.
function stripTopHeading(block: string): string {
  const parts = block.split("\n\n");
  if (parts.length > 0 && parts[0].startsWith("## ")) {
    return parts.slice(1).join("\n\n");
  }
  return block;
}

function severityLabel(input: ReportInput): string {
  const dataQuality = input.outputs.dataQualityRecommendation;
  if (dataQuality !== undefined) {
    return dataQuality.severityTier;
  }
  const anchorCritical = (input.window?.rows ?? []).some(
    (row) => row.isAnchor && row.level >= 50,
  );
  return anchorCritical ? "critical" : "warning";
}

function renderVerdict(input: ReportInput, targetReadModel: string): string {
  const { outputs } = input;
  const hasAnyOutput =
    outputs.recommendationDocs !== undefined ||
    outputs.dataQualityRecommendation !== undefined ||
    outputs.newReadModel !== undefined ||
    outputs.versionSwitch !== undefined;

  // 조치 불필요(예: 존재하지 않는 카드 이름 404 — Read Model 부족 신호 아님):
  // 억지 권고 대신 명시. 근거는 의사결정 사유(없으면 근본원인 요약)를 쓴다.
  if (!hasAnyOutput) {
    const reason =
      input.decision !== null && input.decision.reasoning.trim().length > 0
        ? input.decision.reasoning.trim()
        : input.rootCause.summary.trim();
    return `> 결론(TL;DR): 조치 불필요 — ${reason}`;
  }

  // 권고 계열(§1) 근거가 없으면 '재생성/보강' 단정 금지 — §1 센티넬과 결론이 모순되지 않게.
  const hasRecommendationBasis =
    outputs.recommendationDocs !== undefined ||
    outputs.dataQualityRecommendation !== undefined;
  const action = !hasRecommendationBasis
    ? "조치 검토"
    : outputs.newReadModel !== undefined
      ? "재생성"
      : "보강";

  return `> 결론(TL;DR): \`${targetReadModel}\`을(를) ${action}한다 — ${input.rootCause.summary.trim()} (이상 유형: ${input.rootCause.anomalyKind} · 심각도: ${severityLabel(input)})`;
}

// 근거(원자료)는 결론보다 먼저, 상단에. 출처 구분용 얕은 태그로만 감싼다(중첩 XML 없음).
function renderLoggingContext(
  window: AnomalyLogWindow | null,
  sensorFinding: SensorAnomalyFinding | null,
): string {
  const inner = renderEvidenceContext(window, sensorFinding);
  if (inner.length === 0) {
    return "";
  }
  return ["<logging_context>", "", inner, "", "</logging_context>"].join("\n");
}

// Insight Read DB 근거: 전체 카드 덤프가 아니라 대상 Read Model 카드만 큐레이션(rule 7·11,
// schema linking — DTS-SQL arXiv:2402.01117). 카드 헤더("## ReadModel:"/"## Event:") 경계로
// 분리 후 targetReadModel 이름을 포함한 블록만. 매칭 실패 시에도 통째로 생략하지 않고
// ReadModel 카드 전체를 최소 스키마 스냅샷으로 남긴다(소비자 LLM의 현재 스키마 파악용).
function renderInsightReadDb(
  insightCards: string,
  targetReadModel: string,
): string {
  if (insightCards.trim().length === 0) {
    return "";
  }
  const blocks = insightCards.split(/\n(?=## (?:ReadModel|Event): )/);
  const matched =
    targetReadModel === "unknown"
      ? []
      : blocks.filter((block) => block.includes(targetReadModel));

  const selected =
    matched.length > 0
      ? matched
      : blocks.filter((block) => block.trimStart().startsWith("## ReadModel:"));

  if (selected.length === 0) {
    return "";
  }
  return [
    "<insight_read_db>",
    "",
    selected.map((block) => block.trim()).join("\n\n"),
    "",
    "</insight_read_db>",
  ].join("\n");
}

function bullets(items: string[]): string {
  return items.length === 0
    ? "- -"
    : items.map((item) => `- ${item}`).join("\n");
}

// §1 권고 = ADR/MADR 스켈레톤. 근거(Context)에 [corr:id] 인용을 실어 그라운딩을 강제한다.
function renderRecommendationAdr(rec: RecommendationDocsOutput): string {
  const context = [
    ...rec.evidence.map((item) => {
      const citation =
        item.correlationId !== "" && item.correlationId !== "-"
          ? ` [corr:${item.correlationId}]`
          : "";
      return `- (level ${item.level}, \`${item.action}\`) ${item.logQuote} → ${item.interpretation}${citation}`;
    }),
    ...rec.observations.map((line) => `- ${line}`),
  ].join("\n");

  const options = rec.solutionOptions
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

  const consequences = [
    ...rec.consequencesPositive.map((line) => `- (+) ${line}`),
    ...rec.consequencesNegative.map((line) => `- (−) ${line}`),
  ];

  return [
    "### Status\nproposed",
    `### Context (근거)\n${context}`,
    `### Decision Drivers\n${bullets(rec.decisionDrivers)}`,
    `### Considered Options\n${options}`,
    `### Decision Outcome\n${rec.recommendedOption}`,
    `### Consequences\n${consequences.length === 0 ? "- -" : consequences.join("\n")}`,
    `### Non-Goals\n${bullets(rec.nonGoals)}`,
  ].join("\n\n");
}

// §1 권고: 로그 경로 → recommendationDocs(ADR), 센서 경로 → dataQualityRecommendation.
function renderRecommendationSection(outputs: GeneratedOutputs): string {
  const heading = "## 1. 권고 (Recommendation)";

  if (outputs.dataQualityRecommendation !== undefined) {
    return [
      heading,
      stripTopHeading(
        renderDataQualityRecommendation(outputs.dataQualityRecommendation),
      ),
    ].join("\n\n");
  }
  if (outputs.recommendationDocs !== undefined) {
    return [heading, renderRecommendationAdr(outputs.recommendationDocs)].join(
      "\n\n",
    );
  }

  return [heading, sentinel("권고를 뒷받침할 근거(로그/센서) 부족")].join(
    "\n\n",
  );
}

// 환경을 변경하는 섹션(§2 DDL·§3 컷오버) 앞에 고정 삽입되는 인간 확인 게이트
// (AWS incident-response ai-playbooks 패턴).
const HUMAN_GATE =
  "> 실행 게이트: 아래 변경은 인간 승인 후에만 적용한다 (human-in-the-loop).";

function sqlQuote(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

// Insight 카드 등록 SQL: newReadModel 구조적 출력이 insight_entity/insight_field 와 동형이라
// LLM 재호출 없이 결정론 변환한다. DDL 과 함께 적용해야 다음 분석부터 신규 모델이
// LLM 컨텍스트(카탈로그)에 노출된다 — 자기적응 루프의 카탈로그 폐쇄.
// 예시값(example)·행수(row_count)는 '사실' 메타라 재투영 후 introspection 으로 채운다.
function renderInsightCardRegistration(
  newReadModel: NewReadModelOutput,
): string {
  const entityInsert = [
    "INSERT INTO insight_entity (entity_name, kind, purpose, key_columns)",
    `VALUES (${sqlQuote(newReadModel.proposedName)}, 'read_model', ${sqlQuote(newReadModel.purpose)}, ${sqlQuote(newReadModel.keyColumns)})`,
    "ON CONFLICT (entity_name) DO UPDATE SET purpose = EXCLUDED.purpose, key_columns = EXCLUDED.key_columns;",
  ].join("\n");

  const fieldRows = newReadModel.fields
    .map(
      (field, index) =>
        `  (${sqlQuote(newReadModel.proposedName)}, ${sqlQuote(field.name)}, ${sqlQuote(field.dataType)}, ${sqlQuote(field.meaning)}, ${index + 1})`,
    )
    .join(",\n");
  const fieldInsert = [
    "INSERT INTO insight_field (entity_name, field_name, data_type, meaning, display_order)",
    "VALUES",
    fieldRows,
    "ON CONFLICT (entity_name, field_name) DO UPDATE SET data_type = EXCLUDED.data_type, meaning = EXCLUDED.meaning, display_order = EXCLUDED.display_order;",
  ].join("\n");

  return [
    "### Insight 카드 등록 (Insight Read DB 동기화)",
    "> DDL 적용 시 아래 카드 등록도 함께 실행한다 — 다음 분석부터 신규 Read Model 이 LLM 컨텍스트에 노출된다.",
    codeBlock("sql", [entityInsert, "", fieldInsert].join("\n")),
  ].join("\n\n");
}

// 투영 매핑 명세: 이벤트 payload 필드 → 컬럼 계약 표. projector 코드(Optional)의 대조
// 기준이므로 DDL 과 같은 §2 에 둔다(코드는 예산 부족 시 잘려도 계약은 코어에 남는다).
function renderProjectionMapping(mapping: ProjectionMappingOutput): string {
  const header =
    "| 원천 이벤트 | payload 필드 | 컬럼 | 변환 |\n| --- | --- | --- | --- |";
  const body = mapping.rows
    .map(
      (row) =>
        `| ${cell(row.sourceEvent)} | ${cell(row.sourceField)} | ${cell(row.targetColumn)} | ${cell(row.transform)} |`,
    )
    .join("\n");

  const derived =
    mapping.derivedColumns.length === 0
      ? []
      : [
          [
            "파생 컬럼(이벤트 payload 아님):",
            ...mapping.derivedColumns.map(
              (item) => `- \`${item.column}\` ← ${item.derivation}`,
            ),
          ].join("\n"),
        ];

  return [
    "### 투영 매핑 명세 (이벤트 → 컬럼)",
    `> upsert 키: ${mapping.upsertKey} · 리플레이: ${mapping.replayNote}`,
    [header, body].join("\n"),
    ...derived,
  ].join("\n\n");
}

// §2 Read Model 생성 SQL: DDL(마이그레이션) + M-Schema 필드 튜플 + 투영 매핑 명세.
// 프로젝터/배선/스키마 코드는 Optional 로.
function renderSqlSection(outputs: GeneratedOutputs): string {
  const heading = "## 2. Read Model 생성 SQL (Read Model DDL)";
  const newReadModel = outputs.newReadModel;

  if (newReadModel === undefined) {
    // 격리 계열: 신규 DDL 은 없지만 결함 데이터 격리 SQL 로 §2 를 채운다 —
    // 연구 명세(Docs 3요소 항상 포함)의 격리 lane 대응.
    const containmentSql = outputs.recommendationDocs?.containmentSql ?? "";
    if (containmentSql.trim().length > 0) {
      return [
        heading,
        HUMAN_GATE,
        "### 격리(containment) SQL — 신규 Read Model DDL 불필요, 결함 데이터 무해화가 조치다",
        codeBlock("sql", containmentSql),
      ].join("\n\n");
    }
    return [
      heading,
      sentinel("신규/변경 Read Model DDL을 뒷받침할 근거 부족"),
    ].join("\n\n");
  }

  // M-Schema(arXiv:2411.08599) 튜플: (이름:타입, 의미, PK). 신규 테이블이라 예시값 없음.
  const tuples = newReadModel.fields
    .map((field) => {
      const parts: string[] = [
        `${cell(field.name)}:${cell(field.dataType)}`,
        cell(field.meaning),
      ];
      if (newReadModel.keyColumns.includes(field.name)) {
        parts.push("Primary Key");
      }
      return `(${parts.join(", ")})`;
    })
    .join(",\n");

  return [
    heading,
    HUMAN_GATE,
    `- 대상: \`${newReadModel.proposedName}\` · 키: ${newReadModel.keyColumns} · 원천 이벤트: ${newReadModel.sourceEvents.join(", ") || "-"}`,
    codeBlock("sql", newReadModel.migrationSql),
    "### 필드",
    codeBlock(
      "mschema",
      [`# Table: ${newReadModel.proposedName}`, "[", tuples, "]"].join("\n"),
    ),
    ...(outputs.projectionMapping !== undefined
      ? [renderProjectionMapping(outputs.projectionMapping)]
      : []),
    renderInsightCardRegistration(newReadModel),
  ].join("\n\n");
}

const CHANGELOG_CATEGORIES: ReadonlyArray<ChangelogCategory> = [
  "Added",
  "Changed",
  "Deprecated",
  "Removed",
  "Fixed",
  "Security",
];

// §3 API Versioning: Keep a Changelog(Unreleased/6 카테고리) + 마이그레이션 절차 + 사유·호환성 + 변경 파일.
function renderApiVersioningSection(outputs: GeneratedOutputs): string {
  const heading = "## 3. API Versioning";
  const versionSwitch = outputs.versionSwitch;

  if (versionSwitch === undefined) {
    // 격리 계열: 버전 교체는 없지만 '버전 영향' 판단 자체가 산출물이다 —
    // 대개 '변경 없음'의 근거 서술로 §3 를 채운다.
    const apiVersionImpact = outputs.recommendationDocs?.apiVersionImpact ?? "";
    if (apiVersionImpact.trim().length > 0) {
      return [heading, "### 버전 영향", apiVersionImpact].join("\n\n");
    }
    return [heading, sentinel("API 버전 변경을 뒷받침할 근거 부족")].join(
      "\n\n",
    );
  }

  const changelogLines: string[] = [];
  for (const category of CHANGELOG_CATEGORIES) {
    const entries = versionSwitch.changelogEntries.filter(
      (entry) => entry.category === category,
    );
    if (entries.length > 0) {
      changelogLines.push(`#### ${category}`);
      for (const entry of entries) {
        changelogLines.push(`- ${entry.description}`);
      }
    }
  }
  // changelogEntries 가 비면 코드 변경 스니펫에서 추출한 라우트를 Added 로 유도(근거 있는 fallback).
  if (changelogLines.length === 0) {
    const endpoints = extractEndpoints(outputs);
    changelogLines.push("#### Added");
    if (endpoints.length === 0) {
      changelogLines.push("- (엔드포인트 변경 감지 없음)");
    } else {
      for (const endpoint of endpoints) {
        changelogLines.push(`- \`${endpoint}\``);
      }
    }
  }

  const migration = [
    `- 하위호환 변경: ${versionSwitch.backwardCompatibleChanges.join("; ") || "-"}`,
    `- 파괴적 변경: ${versionSwitch.breakingChanges.join("; ") || "없음"}`,
    `- 컷오버 전 테스트: ${versionSwitch.testBeforeCutover || "-"}`,
    `- 롤백 창/조건: ${versionSwitch.rollbackPlan}`,
    ...(outputs.newReadModel !== undefined
      ? [
          "- Insight 카드 등록: §2의 카드 등록 SQL을 DDL과 함께 적용(카탈로그 동기화)",
        ]
      : []),
  ].join("\n");

  const files = versionSwitch.codeChanges
    .map(
      (change) =>
        `- \`${change.filePath}\` (${change.changeKind}) — ${change.description}`,
    )
    .join("\n");

  return [
    heading,
    HUMAN_GATE,
    `### Unreleased (${versionSwitch.fromVersion} → ${versionSwitch.toVersion})`,
    changelogLines.join("\n"),
    "### 마이그레이션 절차",
    migration,
    "### 사유·호환성",
    [
      `- 사유: ${versionSwitch.reason}`,
      `- 트리거 근거: ${versionSwitch.triggeringEvidence}`,
      `- v1 호환성: ${versionSwitch.v1Compatibility}`,
    ].join("\n"),
    "### 변경 파일",
    files,
  ].join("\n\n");
}

function renderGuardrails(constraints: string[]): string {
  return [
    "## Guardrails (constraints)",
    constraints.map((constraint) => `- ${constraint}`).join("\n"),
  ].join("\n\n");
}

// Optional: 무거운 실제 코드(스키마/프로젝터/배선/버전교체 스니펫). §2 SQL·§3 API diff 는 여기 두지 않는다.
function renderOptional(outputs: GeneratedOutputs): string {
  const blocks: string[] = [];

  const newReadModel = outputs.newReadModel;
  if (newReadModel !== undefined) {
    blocks.push(
      "### 신규 Read Model — Drizzle 스키마",
      codeBlock("ts", newReadModel.drizzleSchema),
      "### 신규 Read Model — Projector",
      codeBlock("ts", newReadModel.projectorCode),
      "### 신규 Read Model — 배선(컨트롤러/서비스/모듈)",
      codeBlock("ts", newReadModel.controllerWiring),
    );
  }

  const versionSwitch = outputs.versionSwitch;
  if (versionSwitch !== undefined) {
    for (const change of versionSwitch.codeChanges) {
      blocks.push(
        `### 버전 교체 코드 — \`${change.filePath}\` (${change.changeKind})`,
        codeBlock(change.language, change.snippet),
      );
    }
  }

  if (blocks.length === 0) {
    return "";
  }

  return [
    "## Optional — 부속 자료(컨텍스트 축소 시 생략 가능)",
    ...blocks,
  ].join("\n\n");
}

// 추합 = LLM 요약이 아니라 결정론 조립. 스펙 골격 순서를 바이트 동일하게 유지한다.
export function renderReport(input: ReportInput): string {
  const frontMatter = buildFrontMatter({
    docId: input.docId,
    generatedAt: input.generatedAt,
    window: input.window,
    outputs: input.outputs,
  });

  const sections: string[] = [
    renderFrontMatter(frontMatter),
    `# Self-Adaptive CQRS Docs — ${frontMatter.targetReadModel}`,
    renderVerdict(input, frontMatter.targetReadModel),
    renderLoggingContext(input.window, input.sensorFinding),
    renderInsightReadDb(input.insightCards, frontMatter.targetReadModel),
    renderRecommendationSection(input.outputs),
    renderSqlSection(input.outputs),
    renderApiVersioningSection(input.outputs),
    renderOptional(input.outputs),
    renderGuardrails(frontMatter.constraints),
  ];

  return sections.filter((section) => section.length > 0).join("\n\n");
}

import { z } from 'zod';
import type { SensorValueMessage } from '@/projection/kafka/sensor-value.message';

// 의사결정자 라우팅 키 = 출력의 종류 (그래프 ROUTE 키와 1:1)
export const outputKindSchema = z.enum([
  "versionSwitch",
  "recommendationDocs",
  "newReadModel",
  "dataQualityRecommendation",
]);
export type OutputKind = z.infer<typeof outputKindSchema>;

export const rootCauseAnalysisSchema = z.object({
  summary: z.string(), // 한 문단 요약
  timeline: z.string(), // 시간순 재구성
  failedIntent: z.string(), // 무엇을 보고 싶었는데 못 봤나
  suspectedReadModelGap: z.string(), // 어떤 Read Model 부족이 원인인가
});
export type RootCauseAnalysis = z.infer<typeof rootCauseAnalysisSchema>;

export const analysisDecisionSchema = z.object({
  selected: z.array(outputKindSchema).max(3), // 0~3개. 0 = 조치 불필요
  reasoning: z.string(),
});
export type AnalysisDecision = z.infer<typeof analysisDecisionSchema>;

// ── versionSwitch: 기존 v1 무손상 + v2를 실제 코드로 추가 ──────────────────
export const versionSwitchChangeKindSchema = z.enum(["addFile", "modifyFile"]);
export type VersionSwitchChangeKind = z.infer<
  typeof versionSwitchChangeKindSchema
>;

export const versionSwitchCodeChangeSchema = z.object({
  filePath: z.string(), // 예: "src/projection/projector/grip-result-v2.projector.ts"
  changeKind: versionSwitchChangeKindSchema,
  language: z.string(), // "typescript" | "sql"
  description: z.string(), // 이 변경이 무엇을 하는지 한 줄
  snippet: z.string(), // 그대로 붙여 동작하는 코드 본문(마크다운 펜스 미포함)
});
export type VersionSwitchCodeChange = z.infer<
  typeof versionSwitchCodeChangeSchema
>;

export const versionSwitchOutputSchema = z.object({
  readModelName: z.string(),
  fromVersion: z.string(),
  toVersion: z.string(),
  reason: z.string(), // 왜 보강/신규가 아니라 버전 교체인가
  triggeringEvidence: z.string(), // 로그 윈도우 앵커 행 직접 인용 + v1 코드의 어느 부분이 문제인지
  v1Compatibility: z.string(), // 유지되는 v1 자산(테이블·엔드포인트·프로젝터 name)
  codeChanges: z.array(versionSwitchCodeChangeSchema).min(1), // 최소 1개의 실제 변경
  rollbackPlan: z.string(),
});
export type VersionSwitchOutput = z.infer<typeof versionSwitchOutputSchema>;

// ── recommendationDocs: 근거 → 관찰 → 해결책 옵션(코드 포함) → 권장 ────────
export const logEvidenceSchema = z.object({
  correlationId: z.string(), // 인용 로그의 correlation_id (없으면 "-")
  action: z.string(), // 로그 action
  level: z.number(), // 40=warn, 50=error
  logQuote: z.string(), // 윈도우 표 셀 값 그대로(msg + 핵심 필드)
  interpretation: z.string(), // 이 로그가 가리키는 결함
});
export type LogEvidence = z.infer<typeof logEvidenceSchema>;

export const solutionOptionSchema = z.object({
  title: z.string(),
  approach: z.string(), // 손댈 대상(어느 projector의 map(), 어느 컬럼/파일·라인)
  suggestedFields: z.array(z.string()).default([]),
  tradeoffs: z.string(), // 재투영 필요/비용/리스크
  codeSnippet: z.string().default(""), // 이 옵션의 핵심 수정 코드(있으면). 펜스 미포함
});
export type SolutionOption = z.infer<typeof solutionOptionSchema>;

export const recommendationDocsOutputSchema = z.object({
  targetReadModel: z.string(),
  evidence: z.array(logEvidenceSchema).min(1), // 어디서 에러가 났나(로그 인용)
  observations: z.array(z.string()).min(1), // 실제 컬럼·코드를 대조해 읽히는 상황
  solutionOptions: z.array(solutionOptionSchema).min(1), // 해결책(가능하면 복수)
  recommendedOption: z.string(), // 권장 옵션 제목 + 한 줄 사유
});
export type RecommendationDocsOutput = z.infer<
  typeof recommendationDocsOutputSchema
>;

// ── newReadModel: 실제 코드(스키마·마이그레이션·프로젝터·배선)로 신규 생성 ──
export const newReadModelOutputSchema = z.object({
  proposedName: z.string(),
  purpose: z.string(),
  rationale: z.string(), // 왜 '신규'인가: 앵커 로그 인용 + 기존 모델이 못 채우는 이유 + 왜 버전교체/보강이 아닌지
  sourceEvents: z.array(z.string()), // 어떤 이벤트에서 투영하나
  keyColumns: z.string(), // 예: "(scene_key, attempt_num)"
  fields: z.array(
    z.object({ name: z.string(), dataType: z.string(), meaning: z.string() }),
  ),
  drizzleSchema: z.string(), // 실제 Drizzle pgTable 정의 TS (import 포함)
  migrationSql: z.string(), // CREATE TABLE + 인덱스 DDL
  projectorCode: z.string(), // 실제 @Injectable Projector<Insert> 클래스 TS (map + upsert)
  controllerWiring: z.string(), // schema/index.ts export + service 주입/catch-up + controller 라우트 + module provider
});
export type NewReadModelOutput = z.infer<typeof newReadModelOutputSchema>;

// ── dataQualityRecommendation: 센서 값 이상(데이터 품질/정합성) 권고 문서 ──────────
// 로그용 logEvidence(correlationId/action/level/logQuote)는 '조용히 통과하는' 센서
// 이상엔 존재하지 않으므로(에러 로그 없음) 별도 타입을 둔다. 욱여넣으면 식별자 환각을
// 강제하기 때문이다. 섹션(필드) 순서 = LLM 좌→우 생성 순서 = 근거-우선 강제 메커니즘.
export const readGripResultColumnSchema = z.enum([
  "grip2dPose",
  "grip3dPose",
  "robotTf",
  "humanAnnotationGrasp",
  "objectName",
  "gripSucceed",
  "gripperType",
  "occurredAt",
]);
export type ReadGripResultColumn = z.infer<typeof readGripResultColumnSchema>;

export const sensorDimensionSchema = z.enum([
  "grip2dPose",
  "grip3dPose",
  "robotTfRotation",
  "robotTfTranslation",
  "objectClassName",
  "humanAnnotationGrasp",
  "gripSucceed",
  "cameraInfo",
]);
export type SensorDimension = z.infer<typeof sensorDimensionSchema>;

export const sensorEvidenceSchema = z.object({
  sceneKey: z.string(),
  attemptNumber: z.number().int(),
  streamId: z.string(),
  globalSequence: z.number().int(), // event_store 재처리/복구 앵커
  affectedColumn: readGripResultColumnSchema,
  sensorDimension: sensorDimensionSchema,
  observedValue: z.string(), // 배치 payload에서 verbatim (노드 사후 substring 검증)
  baselineRuleName: z.string(), // 베이스라인 문서에서 인용
  baselineExpectedRange: z.string(), // 예: "[-0.50, 0.90] m"
  deviation: z.string(), // 계산된 델타(막연한 표현 금지)
  interpretation: z.string(),
});
export type SensorEvidence = z.infer<typeof sensorEvidenceSchema>;

export const severityTierSchema = z.enum(["critical", "warning", "info"]);
export const rootCauseLaneSchema = z.enum([
  "upstreamSensorImplausible", // 로봇/카메라 값 자체가 비물리적
  "projectionOrPipelineFault", // 프로젝션/Kafka 경로 오라우팅
  "staleBaseline", // 베이스라인이 낡고 워크스페이스가 물리적으로 바뀜
]);
export const remediationPhaseSchema = z.enum(["contain", "fix", "harden"]);

export const integritySolutionOptionSchema = z.object({
  phase: remediationPhaseSchema,
  title: z.string(),
  approach: z.string(),
  tradeoffs: z.string(),
  codeOrSql: z.string().default(""), // 펜스(```) 미포함
});
export type IntegritySolutionOption = z.infer<
  typeof integritySolutionOptionSchema
>;

export const recommendedDecisionSchema = z.object({
  title: z.string(),
  reasoning: z.string(),
  acceptedTradeoff: z.string(), // 무엇을 받아들이는가
  rejectedAlternatives: z.array(z.string()).default([]), // 각 거부 옵션이 진 기준
});
export type RecommendedDecision = z.infer<typeof recommendedDecisionSchema>;

export const nextStepSchema = z.object({
  action: z.string(),
  filePath: z.string().default(""), // 실제 소스 경로만
  estimatedScope: z.string(),
  ownerRole: z.string(),
});
export type NextStep = z.infer<typeof nextStepSchema>;

export const dataQualityRecommendationOutputSchema = z.object({
  statusLine: z.string(), // TL;DR 단정 + 심각도
  targetReadModel: z.string(),
  severityTier: severityTierSchema,
  severityJustification: z.string(), // 3축: 오염 컬럼/영향 행수/복구가능성
  sensorEvidence: z.array(sensorEvidenceSchema).min(1), // 근거-우선
  observations: z.array(z.string()).min(1),
  blastRadius: z.array(z.string()).min(1), // 정적 프로젝션 그래프에서만
  rootCauseLane: rootCauseLaneSchema,
  fiveWhysChain: z.array(z.string()).min(1),
  decisionCriteria: z.array(z.string()).min(2).max(5), // 옵션보다 먼저
  solutionOptions: z.array(integritySolutionOptionSchema).min(1), // contain→fix→harden
  recommendedOption: recommendedDecisionSchema,
  containmentSql: z.string(), // 즉시 격리 SQL
  hardeningRule: z.string(), // 베이스라인에 추가할 새 규칙
  nextSteps: z.array(nextStepSchema).min(1),
});
export type DataQualityRecommendationOutput = z.infer<
  typeof dataQualityRecommendationOutputSchema
>;

// 센서 라인이 그래프에 넣는 입력. 로그 라인의 AnomalyLogWindow 에 대응.
export interface SensorAnomalyFinding {
  batch: SensorValueMessage[];
  batchText: string; // renderSensorBatch(batch) — observedValue substring 검증 원천
  reason: string;
  offendingSceneKeys: string[];
  baselineText: string;
}

// outputs 채널 형태: 선택된 것만 존재. 키 = OutputKind.
export interface GeneratedOutputs {
  versionSwitch?: VersionSwitchOutput;
  recommendationDocs?: RecommendationDocsOutput;
  newReadModel?: NewReadModelOutput;
  dataQualityRecommendation?: DataQualityRecommendationOutput;
}

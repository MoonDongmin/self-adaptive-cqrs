import { z } from 'zod';

// 의사결정자 라우팅 키 = 3출력의 종류 (그래프 ROUTE 키와 1:1)
export const outputKindSchema = z.enum([
  "versionSwitch",
  "recommendationDocs",
  "newReadModel",
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

export const versionSwitchOutputSchema = z.object({
  readModelName: z.string(),
  fromVersion: z.string(),
  toVersion: z.string(),
  reason: z.string(),
});
export type VersionSwitchOutput = z.infer<typeof versionSwitchOutputSchema>;

export const recommendationDocsOutputSchema = z.object({
  targetReadModel: z.string(),
  gaps: z.array(z.string()),
  suggestedFields: z.array(z.string()),
  markdownDoc: z.string(), // 권고 문서 본문(.md)
});
export type RecommendationDocsOutput = z.infer<
  typeof recommendationDocsOutputSchema
>;

export const newReadModelOutputSchema = z.object({
  proposedName: z.string(),
  purpose: z.string(),
  keyColumns: z.string(), // 예: "(scene_key, attempt_num)"
  fields: z.array(
    z.object({ name: z.string(), dataType: z.string(), meaning: z.string() }),
  ),
  sourceEvents: z.array(z.string()), // 어떤 이벤트에서 투영하나
  projectorSketch: z.string(), // map/upsert 스케치
});
export type NewReadModelOutput = z.infer<typeof newReadModelOutputSchema>;

// outputs 채널 형태: 선택된 것만 존재. 키 = OutputKind.
export interface GeneratedOutputs {
  versionSwitch?: VersionSwitchOutput;
  recommendationDocs?: RecommendationDocsOutput;
  newReadModel?: NewReadModelOutput;
}

export const analysisReportSchema = z.object({
  report: z.string(), // 추합 결과 .md
});
export type AnalysisReport = z.infer<typeof analysisReportSchema>;

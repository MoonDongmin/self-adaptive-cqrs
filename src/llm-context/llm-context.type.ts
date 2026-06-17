import { z } from "zod";

export const logBatchRecordSchema = z.object({
  time: z.number(),
  level: z.number(),
  action: z.string().nullable().optional(),
  msg: z.string().nullable().optional(),
  correlation_id: z.string().nullable().optional(),
  stream_id: z.string().nullable().optional(),
});
export type LogBatchRecord = z.infer<typeof logBatchRecordSchema>;

export const frequencyRowSchema = z.object({
  action: z.string().nullable(),
  level: z.number(),
  count: z.number(),
});
export type FrequencyRow = z.infer<typeof frequencyRowSchema>;
export type FrequencySummary = { windowHours: number; rows: FrequencyRow[] };

// 선판단 LLM 출력 = 트리거 여부 + 트립 위치.
export const prejudgeCheckedSchema = z.object({
  triggered: z.boolean(),
  reason: z.string(),
  tripCorrelationIds: z.array(z.string()).default([]), // 의심 레코드 추적용
});
export type PrejudgeChecked = z.infer<typeof prejudgeCheckedSchema>;

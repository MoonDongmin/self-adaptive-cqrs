import { z } from "zod";

export const logBatchRecordSchema = z
  .object({
    time: z.number(),
    level: z.number(),
    action: z.string().nullable().optional(),
    msg: z.string().nullable().optional(),
    correlationId: z.string().nullable().optional(),
    streamId: z.string().nullable().optional(),
  })
  // 원본 로그를 그대로 LLM에 넘기기 위해 req/res/responseTime 등 추가 필드를 보존한다.
  .passthrough();
export type LogBatchRecord = z.infer<typeof logBatchRecordSchema>;

// 선판단 LLM 출력 = 트리거 여부 + 트립 위치.
export const prejudgeCheckedSchema = z.object({
  triggered: z.boolean(),
  reason: z.string(),
  tripCorrelationIds: z.array(z.string()).default([]), // 의심 레코드 추적용
});
export type PrejudgeChecked = z.infer<typeof prejudgeCheckedSchema>;

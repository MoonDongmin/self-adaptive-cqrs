import { z } from 'zod';

export const logBatchRecordSchema = z
  .object({
    time: z.number(),
    level: z.number(),
    action: z.string().nullable().optional(),
    msg: z.string().nullable().optional(),
    correlationId: z.string().nullable().optional(),
    streamId: z.string().nullable().optional(),
    // 라우트 기반 필터(예: /insert 적재 요청 제외)를 위해 req.url 을 타입 안전하게 읽는다.
    // 나머지 req 필드(method 등)는 passthrough 로 보존해 LLM 렌더링 시 손실이 없게 한다.
    req: z
      .object({ url: z.string().optional() })
      .passthrough()
      .nullable()
      .optional(),
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

export interface LogWindowRow {
  time: Date;
  level: number;
  action: string | null;
  correlationId: string | null;
  msg: string | null;
  isAnchor: boolean;
}

export interface FrequencyRollupRow {
  action: string | null;
  level: number;
  count: number;
}

export interface AnomalyLogWindow {
  rows: LogWindowRow[];
  frequency: FrequencyRollupRow[];
  windowHours: number;
}

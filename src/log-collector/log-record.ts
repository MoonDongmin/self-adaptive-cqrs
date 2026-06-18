import z from "zod";

export const logRecordSchema = z
  .object({
    time: z.number(), // epoch ms
    level: z.number(), // 30/40/50 ...
    msg: z.string().optional(),
    action: z.string().optional(),
    correlationId: z.string().optional(),
    streamId: z.string().optional(),
    globalSeq: z.number().optional(),
    attemptNum: z.number().optional(),
    projectorName: z.string().optional(),
    sceneKey: z.string().optional(),
    objectName: z.string().optional(),
    durationMs: z.number().optional(),
    reason: z.string().optional(),
  })
  .passthrough();

export type LogRecord = z.infer<typeof logRecordSchema>;

export interface LogEventInsert {
  time: Date;
  level: number;
  action: string | null;
  msg: string | null;
  correlationId: string | null;
  streamId: string | null;
  globalSeq: number | null;
  attemptNum: number | null;
  projectorName: string | null;
  sceneKey: string | null;
  objectName: string | null;
  durationMs: number | null;
  reason: string | null;
  payload: LogRecord;
}

// NDJSON 한 줄 문자열 → 적재용 행. 파싱 실패 시 null(해당 줄 스킵).
export function parseLogLine(line: string): LogEventInsert | null {
  const trimmed: string = line.trim();
  if (trimmed.length === 0) {
    return null;
  }

  const json: unknown = JSON.parse(trimmed);
  const result = logRecordSchema.safeParse(json);
  if (!result.success) {
    return null;
  }

  const record: LogRecord = result.data;
  return {
    time: new Date(record.time),
    level: record.level,
    action: record.action ?? null,
    msg: record.msg ?? null,
    correlationId: record.correlationId ?? null,
    streamId: record.streamId ?? null,
    globalSeq: record.globalSeq ?? null,
    attemptNum: record.attemptNum ?? null,
    projectorName: record.projectorName ?? null,
    sceneKey: record.sceneKey ?? null,
    objectName: record.objectName ?? null,
    durationMs: record.durationMs ?? null,
    reason: record.reason ?? null,
    payload: record,
  };
}

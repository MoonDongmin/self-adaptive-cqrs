import z from "zod";

export const logRecordSchema = z
  .object({
    time: z.number(), // epoch ms
    level: z.number(), // 30/40/50 ...
    msg: z.string().optional(),
    action: z.string().optional(),
    correlation_id: z.string().optional(),
    stream_id: z.string().optional(),
    global_seq: z.number().optional(),
    attempt_num: z.number().optional(),
    projector_name: z.string().optional(),
    scene_key: z.string().optional(),
    object_name: z.string().optional(),
    duration_ms: z.number().optional(),
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
    correlationId: record.correlation_id ?? null,
    streamId: record.stream_id ?? null,
    globalSeq: record.global_seq ?? null,
    attemptNum: record.attempt_num ?? null,
    projectorName: record.projector_name ?? null,
    sceneKey: record.scene_key ?? null,
    objectName: record.object_name ?? null,
    durationMs: record.duration_ms ?? null,
    reason: record.reason ?? null,
    payload: record,
  };
}

import { Inject, Injectable } from '@nestjs/common';
import { and, asc, desc, gt, gte, inArray, lte, sql } from 'drizzle-orm';
import { PinoLogger } from 'nestjs-pino';
import { WINDOW_CONFIG } from '@/llm-context/repository/log-window.config';
import { LogWindowRepository } from '@/llm-context/repository/log-window.repository';
import { DRIZZLE, type Drizzle } from '@/shared/database/drizzle.provider';
import { logEvents } from '@/shared/database/schema';
import { LogAction, LogContext } from '@/shared/logger/logging-context';
import { AnomalyLogWindow, FrequencyRollupRow, LogWindowRow } from '../llm-context.type';

interface RawRow {
  time: Date;
  logId: string;
  level: number;
  action: string | null;
  correlationId: string | null;
  streamId: string | null;
  attemptNum: number | null;
  globalSeq: number | null;
  projectorName: string | null;
  reason: string | null;
  file: string | null;
  eventId: string | null;
  newKeys: string | null;
  msg: string | null;
}

// stream_id/attempt_num/global_seq/reason 은 1급 컬럼, file/eventId/newKeys 는
// payload jsonb 원본에만 있다. 이 값들이 빠지면 분석 LLM 이 격리 SQL 의 WHERE 절
// 리터럴을 지어낸다(2026-07-21 품질 감사: A1~A3·B1 전 rep 의 SQL 환각 근원).
const ROW_COLUMNS = {
  time: logEvents.time,
  logId: logEvents.logId,
  level: logEvents.level,
  action: logEvents.action,
  correlationId: logEvents.correlationId,
  streamId: logEvents.streamId,
  attemptNum: logEvents.attemptNum,
  globalSeq: logEvents.globalSeq,
  projectorName: logEvents.projectorName,
  reason: logEvents.reason,
  file: sql<string | null>`${logEvents.payload}->>'file'`,
  eventId: sql<string | null>`${logEvents.payload}->>'eventId'`,
  newKeys: sql<string | null>`${logEvents.payload}->>'newKeys'`,
  msg: logEvents.msg,
} as const;

// 격리 SQL 근거 필드를 표 한 칸으로 합친다. 값이 하나도 없으면 null.
function buildDetail(row: RawRow): string | null {
  const parts: string[] = [];
  if (row.reason !== null) {
    parts.push(`reason=${row.reason}`);
  }
  if (row.file !== null) {
    parts.push(`file=${row.file}`);
  }
  if (row.eventId !== null) {
    parts.push(`event_id=${row.eventId}`);
  }
  if (row.newKeys !== null) {
    parts.push(`newKeys=${row.newKeys}`);
  }
  if (row.projectorName !== null) {
    parts.push(`projector=${row.projectorName}`);
  }
  return parts.length > 0 ? parts.join(" · ") : null;
}

@Injectable()
export class LogWindowRepositoryImpl implements LogWindowRepository {
  constructor(
    private readonly logger: PinoLogger,
    @Inject(DRIZZLE)
    private readonly db: Drizzle,
  ) {
    this.logger.setContext(LogWindowRepositoryImpl.name);
  }

  async buildWindow(tripCorrelationIds: string[]): Promise<AnomalyLogWindow> {
    try {
      const trace: RawRow[] = await this.fetchTrace(tripCorrelationIds);

      const anchor: RawRow | null = await this.resolveAnchor(trace);

      if (anchor === null) {
        return {
          rows: [],
          frequency: [],
          windowHours: WINDOW_CONFIG.frequencyHours,
        };
      }

      const before: RawRow[] = await this.db
        .select(ROW_COLUMNS)
        .from(logEvents)
        .where(lte(logEvents.time, anchor.time))
        .orderBy(desc(logEvents.time))
        .limit(WINDOW_CONFIG.beforeCount);

      const after: RawRow[] = await this.db
        .select(ROW_COLUMNS)
        .from(logEvents)
        .where(gt(logEvents.time, anchor.time))
        .orderBy(asc(logEvents.time))
        .limit(WINDOW_CONFIG.afterCount);

      const rows: LogWindowRow[] = await this.merge(
        [...trace, ...before, ...after],
        anchor,
        tripCorrelationIds,
      );
      const frequency: FrequencyRollupRow[] = await this.fetchFrequency(
        anchor.time,
      );

      this.logger.debug(
        { [LogContext.COUNT]: rows.length },
        "이상 로그 윈도우 조립",
      );

      return { rows, frequency, windowHours: WINDOW_CONFIG.frequencyHours };
    } catch (error) {
      this.logger.error(
        { action: LogAction.DB_ERROR, error },
        "윈도우 조립 실패",
      );

      throw error;
    }
  }

  private async fetchTrace(ids: string[]) {
    if (ids.length === 0) {
      return [];
    }

    return this.db
      .select(ROW_COLUMNS)
      .from(logEvents)
      .where(inArray(logEvents.correlationId, ids))
      .orderBy(asc(logEvents.time));
  }

  private async resolveAnchor(trace: RawRow[]): Promise<RawRow | null> {
    const firstError = trace.find((r) => r.level >= WINDOW_CONFIG.errorLevel);

    if (firstError !== undefined) {
      return firstError;
    }

    if (trace.length > 0) {
      return trace[0];
    }

    const latestError = await this.db
      .select(ROW_COLUMNS)
      .from(logEvents)
      .where(gte(logEvents.level, WINDOW_CONFIG.errorLevel))
      .orderBy(desc(logEvents.time))
      .limit(1);

    return latestError[0] ?? null;
  }

  private async merge(
    rawRows: RawRow[],
    anchor: RawRow,
    tripCorrelationIds: string[],
  ) {
    const byId = new Map<string, RawRow>();

    for (const rawRow of rawRows) {
      byId.set(rawRow.logId, rawRow);
    }

    const sorted = [...byId.values()].sort(
      (a, b) => a.time.getTime() - b.time.getTime(),
    );

    const pruned = this.pruneNoise(sorted, anchor, tripCorrelationIds);

    const anchorIndex = pruned.findIndex((r) => r.logId === anchor.logId);
    const capped = this.capAroundAnchor(pruned, anchorIndex);

    return capped.map((r) => ({
      time: r.time,
      level: r.level,
      action: r.action,
      correlationId: r.correlationId,
      streamId: r.streamId,
      attemptNum: r.attemptNum,
      globalSeq: r.globalSeq,
      projectorName: r.projectorName,
      msg: r.msg,
      detail: buildDetail(r),
      isAnchor: r.logId === anchor.logId,
    }));
  }

  private async fetchFrequency(anchorTime: Date) {
    const windowStart = new Date(
      anchorTime.getTime() - WINDOW_CONFIG.frequencyHours * 3600 * 1000,
    );

    const rows = await this.db
      .select({
        action: logEvents.action,
        level: logEvents.level,
        count: sql<number>`count(*)::int`,
      })
      .from(logEvents)
      .where(
        and(gte(logEvents.time, windowStart), lte(logEvents.time, anchorTime)),
      )
      .groupBy(logEvents.action, logEvents.level);

    return rows.map((r) => ({
      action: r.action,
      level: r.level,
      count: r.count,
    }));
  }

  // LogSage(arXiv:2506.03691) 패턴: 신호 라인(에러/트립 트레이스) 주변 앞 4줄/뒤 6줄만
  // 남기고 부팅·라우트 매핑 등 배경 노이즈를 제거한다. 소형 소비자 LLM의 context rot 방지.
  private pruneNoise(
    rows: RawRow[],
    anchor: RawRow,
    tripCorrelationIds: string[],
  ): RawRow[] {
    const tripIdSet = new Set(tripCorrelationIds);

    const signalIndices: number[] = [];
    rows.forEach((row, index) => {
      const isSignal =
        row.level >= WINDOW_CONFIG.errorLevel ||
        row.logId === anchor.logId ||
        (row.correlationId !== null && tripIdSet.has(row.correlationId));
      if (isSignal) {
        signalIndices.push(index);
      }
    });

    if (signalIndices.length === 0) {
      return rows;
    }

    const kept = new Set<number>();
    for (const signalIndex of signalIndices) {
      const start = Math.max(0, signalIndex - WINDOW_CONFIG.contextBeforeLines);
      const end = Math.min(
        rows.length - 1,
        signalIndex + WINDOW_CONFIG.contextAfterLines,
      );
      for (let i = start; i <= end; i++) {
        kept.add(i);
      }
    }

    return rows.filter((_, index) => kept.has(index));
  }

  private capAroundAnchor(rows: RawRow[], anchorIndex: number) {
    if (rows.length <= WINDOW_CONFIG.maxLines) {
      return rows;
    }

    const half: number = Math.floor(WINDOW_CONFIG.maxLines / 2);
    const start: number = Math.max(0, anchorIndex - half);

    return rows.slice(start, start + WINDOW_CONFIG.maxLines);
  }
}

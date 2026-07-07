import * as fs from 'node:fs';
import { relative, resolve, sep } from 'node:path';
import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, gte, SQL } from 'drizzle-orm';
import { readSensorBaseline } from '@/analysis/context/sensor-baseline';
import { DiagnosisToolkit, LogSearchFilter, SourceCodeRange } from '@/analysis/tools/diagnosis-toolkit';
import { InsightService } from '@/insight/insight.service';
import { DRIZZLE, type Drizzle } from '@/shared/database/drizzle.provider';
import { logEvents } from '@/shared/database/schema';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 40;

// read_source_code 안전장치: 저장소 안이면서 이 접두사 아래만 허용(default-deny).
// .env·node_modules·로그 파일 등이 에이전트 컨텍스트(→ 산출 Docs)로 새는 것을 막는다.
const ALLOWED_SOURCE_PREFIXES: readonly string[] = ["src", "dist"];
const DEFAULT_SOURCE_SPAN = 80;
const MAX_SOURCE_SPAN = 120;
// 스택은 상단 프레임만 있으면 위치를 짚는다 — 전체를 실으면 토큰만 잠식한다.
const STACK_PREVIEW_LINES = 6;

// log_event.payload 에서 직렬화된 에러 스택을 꺼낸다('err' = pino 기본 키,
// 'error' = logger.module.ts 커스텀 직렬화 키). 테스트용으로 export.
export function extractStack(payload: unknown): string | null {
  if (typeof payload !== "object" || payload === null) {
    return null;
  }
  const record = payload as Record<string, unknown>;
  for (const key of ["err", "error"]) {
    const candidate = record[key];
    if (typeof candidate === "object" && candidate !== null) {
      const stack = (candidate as { stack?: unknown }).stack;
      if (typeof stack === "string" && stack.length > 0) {
        return stack;
      }
    }
  }
  return null;
}

// 진단 에이전트 도구의 실제 데이터 접근 구현. 로그는 log_event 테이블, 카탈로그는
// Insight Read DB, 베이스라인은 수기 문서 — 세 근거 소스를 모두 도구로 노출한다.
@Injectable()
export class DiagnosisToolkitImpl implements DiagnosisToolkit {
  constructor(
    @Inject(DRIZZLE)
    private readonly db: Drizzle,
    private readonly insight: InsightService,
  ) {}

  async searchLogs(filter: LogSearchFilter): Promise<string> {
    const conditions: SQL[] = [];
    if (filter.correlationId !== undefined) {
      conditions.push(eq(logEvents.correlationId, filter.correlationId));
    }
    if (filter.action !== undefined) {
      conditions.push(eq(logEvents.action, filter.action));
    }
    if (filter.sceneKey !== undefined) {
      conditions.push(eq(logEvents.sceneKey, filter.sceneKey));
    }
    if (filter.minLevel !== undefined) {
      conditions.push(gte(logEvents.level, filter.minLevel));
    }

    const limit = Math.min(filter.limit ?? DEFAULT_LIMIT, MAX_LIMIT);

    const rows = await this.db
      .select({
        time: logEvents.time,
        level: logEvents.level,
        action: logEvents.action,
        correlationId: logEvents.correlationId,
        sceneKey: logEvents.sceneKey,
        msg: logEvents.msg,
        reason: logEvents.reason,
        payload: logEvents.payload,
      })
      .from(logEvents)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(logEvents.time))
      .limit(limit);

    if (rows.length === 0) {
      return "조회 결과 없음";
    }

    // 최신순으로 뽑아 시간순으로 뒤집는다(LLM 은 시간순 서사가 읽기 쉽다).
    // payload 통째로는 싣지 않고(토큰 잠식) 에러 스택 상단 프레임만 발췌한다 —
    // read_source_code 로 이어지는 '코드 위치' 단서.
    return rows
      .reverse()
      .map((row) => {
        const { payload, ...rest } = row;
        const stack = extractStack(payload);
        return JSON.stringify({
          ...rest,
          time: row.time.toISOString(),
          ...(stack !== null
            ? {
                stack: stack
                  .split("\n")
                  .slice(0, STACK_PREVIEW_LINES)
                  .join("\n"),
              }
            : {}),
        });
      })
      .join("\n");
  }

  async listInsightCardNames(): Promise<string> {
    const names: string[] = await this.insight.listEntityNames();
    return names.length === 0 ? "카탈로그 비어 있음" : names.join("\n");
  }

  async getInsightCard(entityName: string): Promise<string> {
    const card: string | null = await this.insight.renderCard(entityName);
    return card ?? `카드 없음: ${entityName}`;
  }

  async getSensorBaseline(): Promise<string> {
    return readSensorBaseline();
  }

  async readSourceCode(range: SourceCodeRange): Promise<string> {
    const root: string = process.cwd();
    const resolved: string = resolve(root, range.filePath);
    const relativePath: string = relative(root, resolved);

    // 저장소 밖(../, 다른 절대 경로) 또는 허용 접두사 밖이면 거부.
    const isInsideRoot: boolean =
      relativePath.length > 0 &&
      !relativePath.startsWith("..") &&
      !resolved.includes(`${sep}..${sep}`);
    const topSegment: string = relativePath.split(sep)[0] ?? "";
    if (!isInsideRoot || !ALLOWED_SOURCE_PREFIXES.includes(topSegment)) {
      return `접근 거부: ${range.filePath} — 저장소의 ${ALLOWED_SOURCE_PREFIXES.join("/")} 아래만 읽을 수 있다`;
    }

    let source: string;
    try {
      source = await fs.promises.readFile(resolved, "utf-8");
    } catch {
      return `파일 없음: ${relativePath}`;
    }

    const lines: string[] = source.split("\n");
    const startLine: number = Math.max(1, range.startLine ?? 1);
    const requestedEnd: number =
      range.endLine ?? startLine + DEFAULT_SOURCE_SPAN - 1;
    const endLine: number = Math.min(
      lines.length,
      Math.min(requestedEnd, startLine + MAX_SOURCE_SPAN - 1),
    );

    if (startLine > lines.length) {
      return `라인 범위 초과: ${relativePath} 는 ${lines.length}줄이다`;
    }

    const numbered: string = lines
      .slice(startLine - 1, endLine)
      .map((line, index) => `${startLine + index} | ${line}`)
      .join("\n");

    return [
      `# ${relativePath} (${startLine}-${endLine}/${lines.length}줄)`,
      numbered,
    ].join("\n");
  }
}

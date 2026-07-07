import { tool } from '@langchain/core/tools';
import { z } from 'zod';

// 진단 에이전트가 조회할 수 있는 데이터 접근 계약. LangChain 무관 순수 인터페이스로 두어
// 서비스(Nest DI)와 노드(순수 함수) 사이를 잇고, 테스트에서 가짜 구현 주입을 쉽게 한다.
export interface LogSearchFilter {
  correlationId?: string;
  action?: string;
  sceneKey?: string;
  minLevel?: number;
  limit?: number;
}

export interface SourceCodeRange {
  filePath: string;
  startLine?: number;
  endLine?: number;
}

export interface DiagnosisToolkit {
  searchLogs(filter: LogSearchFilter): Promise<string>;
  listInsightCardNames(): Promise<string>;
  getInsightCard(entityName: string): Promise<string>;
  getSensorBaseline(): Promise<string>;
  readSourceCode(range: SourceCodeRange): Promise<string>;
}

export const DIAGNOSIS_TOOLKIT: unique symbol = Symbol("DIAGNOSIS_TOOLKIT");

// 도구당 결과 상한. 도구 결과가 컨텍스트를 잠식하면(context rot) 판정 정확도가 되레
// 떨어지므로, 조회 계층이 아니라 도구 경계에서 한 번 더 자른다.
const TOOL_RESULT_MAX_CHARS = 4000;

function truncate(text: string): string {
  if (text.length <= TOOL_RESULT_MAX_CHARS) {
    return text;
  }
  return `${text.slice(0, TOOL_RESULT_MAX_CHARS)}\n...(이하 생략 — 조건을 좁혀 다시 조회하라)`;
}

// DiagnosisToolkit 을 LangChain tool() 배열로 감싼다. description 은 모델이 도구를
// 고르는 유일한 근거이므로 '언제 쓰는가'를 명시한다.
export function buildDiagnosisTools(toolkit: DiagnosisToolkit) {
  const searchLogs = tool(
    async (input: LogSearchFilter): Promise<string> =>
      truncate(await toolkit.searchLogs(input)),
    {
      name: "search_logs",
      description:
        "로그 DB(log_event)를 조건으로 조회한다(시간순, JSON 한 줄당 한 레코드). " +
        "correlationId 로 한 요청의 전체 트레이스를 추적하거나, action/minLevel 로 " +
        "반복 패턴·에러 이력을 확인할 때 쓴다. 조건이 없으면 최신 로그를 반환한다.",
      schema: z.object({
        correlationId: z
          .string()
          .optional()
          .describe("요청 추적 id (전체 트레이스 조회)"),
        action: z
          .string()
          .optional()
          .describe("action 필드 정확 일치 (예: projection.map.failed)"),
        sceneKey: z.string().optional().describe("센서 scene 키 정확 일치"),
        minLevel: z
          .number()
          .optional()
          .describe("이 pino 레벨 이상만 (40=warn, 50=error)"),
        limit: z.number().optional().describe("최대 행 수 (기본 20, 상한 40)"),
      }),
    },
  );

  const listInsightCards = tool(
    async (): Promise<string> => truncate(await toolkit.listInsightCardNames()),
    {
      name: "list_insight_cards",
      description:
        "Insight Read DB 카탈로그의 엔티티(Read Model·Event) 이름 목록을 반환한다. " +
        "어떤 Read Model/이벤트 카드가 존재하는지 파악할 때 가장 먼저 쓴다.",
      schema: z.object({}),
    },
  );

  const getInsightCard = tool(
    async (input: { entityName: string }): Promise<string> =>
      truncate(await toolkit.getInsightCard(input.entityName)),
    {
      name: "get_insight_card",
      description:
        "Insight 카드 1장(Read Model 또는 Event 의 컬럼·의미·예시)을 반환한다. " +
        "로그가 가리키는 테이블/이벤트의 현재 스키마와 대조할 때 쓴다.",
      schema: z.object({
        entityName: z
          .string()
          .describe("카드 엔티티 이름 (예: read_grip_result)"),
      }),
    },
  );

  const getSensorBaseline = tool(
    async (): Promise<string> => truncate(await toolkit.getSensorBaseline()),
    {
      name: "get_sensor_baseline",
      description:
        "센서 값 수기 베이스라인(규칙명·기대범위)을 반환한다. 관측값이 물리적으로 " +
        "타당한지, 어떤 규칙을 얼마나 벗어났는지 판정할 때 쓴다.",
      schema: z.object({}),
    },
  );

  const readSourceCode = tool(
    async (input: SourceCodeRange): Promise<string> =>
      truncate(await toolkit.readSourceCode(input)),
    {
      name: "read_source_code",
      description:
        "이 서비스 저장소의 소스 파일을 라인 번호와 함께 읽는다(읽기 전용, src/·dist/ 만). " +
        "search_logs 로 얻은 스택 트레이스의 파일:라인을 열람해 '코드 어느 줄이 왜 실패했나'를 " +
        "확인할 때 쓴다. 절대 경로가 와도 저장소 내부면 허용된다.",
      schema: z.object({
        filePath: z
          .string()
          .describe(
            "저장소 기준 상대 경로 또는 절대 경로 (예: src/projection/projector/grip-result.projector.ts)",
          ),
        startLine: z
          .number()
          .optional()
          .describe("시작 라인(1부터). 생략 시 파일 처음"),
        endLine: z
          .number()
          .optional()
          .describe("끝 라인. 생략 시 시작+80줄 (한 번에 최대 120줄)"),
      }),
    },
  );

  return [
    searchLogs,
    listInsightCards,
    getInsightCard,
    getSensorBaseline,
    readSourceCode,
  ];
}

export type DiagnosisTools = ReturnType<typeof buildDiagnosisTools>;

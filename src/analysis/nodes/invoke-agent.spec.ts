import { AIMessage, AIMessageChunk, ToolMessage } from '@langchain/core/messages';
import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';
import { invokeAgentNode } from '@/analysis/nodes/invoke-agent';
import { buildDiagnosisTools, DiagnosisToolkit } from '@/analysis/tools/diagnosis-toolkit';

// invokeAgentNode 는 내부에서 ChatOpenAI 를 직접 생성하고 bindTools 로 감싸므로,
// 모듈 자동 목 + bindTools 스파이로 바인딩된 모델의 invoke 시나리오를 주입한다.
jest.mock('@langchain/openai');

const outputSchema = z.object({ anomalyKind: z.string(), answer: z.string() });

function fencedJson(payload: string): AIMessageChunk {
  return new AIMessageChunk({
    content: `추론 산문...\n\`\`\`json\n${payload}\n\`\`\``,
  });
}

function toolCallMessage(
  name: string,
  args: Record<string, string>,
  id: string,
): AIMessage {
  return new AIMessage({
    content: "",
    tool_calls: [{ name, args, id, type: "tool_call" }],
  });
}

// LangChain 없는 가짜 툴킷 — 에이전트 루프가 실제 도구 실행을 거치는지 검증한다.
function makeFakeToolkit(): DiagnosisToolkit & { searchCalls: string[] } {
  const searchCalls: string[] = [];
  return {
    searchCalls,
    async searchLogs(filter): Promise<string> {
      searchCalls.push(filter.correlationId ?? "");
      return '{"level":50,"msg":"카드 없음"}';
    },
    async listInsightCardNames(): Promise<string> {
      return "read_grip_result";
    },
    async getInsightCard(entityName): Promise<string> {
      return `## ReadModel: ${entityName}`;
    },
    async getSensorBaseline(): Promise<string> {
      return "## 센서 값 베이스라인";
    },
    async readSourceCode(range): Promise<string> {
      return `# ${range.filePath} (1-1/1줄)\n1 | code`;
    },
  };
}

describe('invokeAgentNode', () => {
  const boundInvoke = jest.fn();

  beforeEach(() => {
    boundInvoke.mockReset();
    jest
      .spyOn(ChatOpenAI.prototype, 'bindTools')
      .mockReturnValue({ invoke: boundInvoke } as unknown as ReturnType<
        ChatOpenAI["bindTools"]
      >);
  });

  it('도구 호출 없이 최종 JSON 을 내면 그대로 파싱하고 궤적은 빈 배열이다', async () => {
    boundInvoke.mockResolvedValueOnce(
      fencedJson('{ "anomalyKind": "요청 충족 실패", "answer": "ok" }'),
    );

    const result = await invokeAgentNode(
      "role",
      "facts",
      outputSchema,
      buildDiagnosisTools(makeFakeToolkit()),
    );

    expect(result.value).toEqual({ anomalyKind: "요청 충족 실패", answer: "ok" });
    expect(result.trajectory).toEqual([]);
    expect(boundInvoke).toHaveBeenCalledTimes(1);
  });

  it('tool_call 이 오면 도구를 실행해 ToolMessage 로 잇고 궤적을 기록한다', async () => {
    boundInvoke
      .mockResolvedValueOnce(
        toolCallMessage("search_logs", { correlationId: "corr-1" }, "call_1"),
      )
      .mockResolvedValueOnce(
        fencedJson('{ "anomalyKind": "신규 유형: 커서 정체", "answer": "done" }'),
      );

    const toolkit = makeFakeToolkit();
    const result = await invokeAgentNode(
      "role",
      "facts",
      outputSchema,
      buildDiagnosisTools(toolkit),
    );

    // 실제 도구가 실행됐고(가짜 툴킷 호출 기록), open-set 유형명이 그대로 보존된다.
    expect(toolkit.searchCalls).toEqual(["corr-1"]);
    expect(result.value.anomalyKind).toBe("신규 유형: 커서 정체");
    expect(result.trajectory).toHaveLength(1);
    expect(result.trajectory[0].tool).toBe("search_logs");
    expect(result.trajectory[0].resultPreview).toContain("카드 없음");

    // 2차 호출 대화에 도구 결과가 ToolMessage 로 포함된다.
    const secondCallMessages = boundInvoke.mock.calls[1]?.[0] as unknown[];
    const toolMessage = secondCallMessages.find(
      (message) => message instanceof ToolMessage,
    ) as ToolMessage;
    expect(toolMessage).toBeDefined();
    expect(String(toolMessage.content)).toContain("카드 없음");
  });

  it('최종 출력 검증 실패 시 에러를 대화에 누적해 재요청한다(re-ask)', async () => {
    boundInvoke
      .mockResolvedValueOnce(fencedJson('{ "wrong": 1 }'))
      .mockResolvedValueOnce(
        fencedJson('{ "anomalyKind": "미분류", "answer": "fixed" }'),
      );

    const result = await invokeAgentNode(
      "role",
      "facts",
      outputSchema,
      buildDiagnosisTools(makeFakeToolkit()),
    );

    expect(result.value.answer).toBe("fixed");
    expect(boundInvoke).toHaveBeenCalledTimes(2);
  });

  it('모든 최종 시도가 실패하면 마지막 검증 에러를 던진다', async () => {
    boundInvoke
      .mockResolvedValueOnce(fencedJson('{ "wrong": 1 }'))
      .mockResolvedValueOnce(fencedJson('{ "wrong": 2 }'));

    await expect(
      invokeAgentNode(
        "role",
        "facts",
        outputSchema,
        buildDiagnosisTools(makeFakeToolkit()),
      ),
    ).rejects.toThrow();
  });
});

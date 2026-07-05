import { AIMessageChunk } from '@langchain/core/messages';
import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';
import { invokeNode } from '@/analysis/nodes/invoke';

// invokeNode 는 내부에서 ChatOpenAI 를 직접 생성하므로 모듈 자동 목으로 대체하고,
// prototype.invoke 를 스파이해 응답 시나리오(실패→성공)를 주입한다.
jest.mock('@langchain/openai');

const outputSchema = z.object({ answer: z.string() });

function fencedJson(payload: string): AIMessageChunk {
  return new AIMessageChunk({ content: `추론 산문...\n\`\`\`json\n${payload}\n\`\`\`` });
}

// invoke 스파이 인자는 BaseMessageLike(string 포함 유니온)라 content 접근 전에 좁힌다.
function messageContent(message: unknown): string {
  if (typeof message === "object" && message !== null && "content" in message) {
    return String((message as { content: unknown }).content);
  }
  throw new Error("메시지에 content 가 없음");
}

describe('invokeNode', () => {
  const invokeSpy = jest.spyOn(ChatOpenAI.prototype, 'invoke');

  beforeEach(() => {
    invokeSpy.mockReset();
  });

  it('첫 응답이 스키마에 맞으면 그대로 파싱해 반환한다', async () => {
    invokeSpy.mockResolvedValueOnce(fencedJson('{ "answer": "ok" }'));

    const result = await invokeNode("role", "facts", outputSchema);

    expect(result).toEqual({ answer: "ok" });
    expect(invokeSpy).toHaveBeenCalledTimes(1);
  });

  it('검증 실패 시 직전 응답과 에러를 대화에 누적해 재요청한다(re-ask)', async () => {
    invokeSpy
      .mockResolvedValueOnce(fencedJson('{ "wrong": 1 }'))
      .mockResolvedValueOnce(fencedJson('{ "answer": "fixed" }'));

    const result = await invokeNode("role", "facts", outputSchema);

    expect(result).toEqual({ answer: "fixed" });
    expect(invokeSpy).toHaveBeenCalledTimes(2);

    // 2차 호출 대화 = [system, human(facts), 실패한 ai 응답, 에러 피드백 human]
    const secondCallMessages = invokeSpy.mock.calls[1]?.[0];
    if (!Array.isArray(secondCallMessages)) {
      throw new Error("2차 호출 인자가 메시지 배열이 아님");
    }
    expect(secondCallMessages).toHaveLength(4);

    expect(messageContent(secondCallMessages[2])).toContain('"wrong"');

    const feedbackContent = messageContent(secondCallMessages[3]);
    expect(feedbackContent).toContain("스키마 검증에 실패");
    expect(feedbackContent).toContain("다시 출력하라");
  });

  it('모든 시도가 실패하면 마지막 검증 에러를 던진다', async () => {
    invokeSpy
      .mockResolvedValueOnce(fencedJson('{ "wrong": 1 }'))
      .mockResolvedValueOnce(fencedJson('{ "wrong": 2 }'));

    await expect(invokeNode("role", "facts", outputSchema)).rejects.toThrow();
    expect(invokeSpy).toHaveBeenCalledTimes(2);
  });
});

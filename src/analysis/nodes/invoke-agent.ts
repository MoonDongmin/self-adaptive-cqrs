import type { BaseMessage } from '@langchain/core/messages';
import { HumanMessage, SystemMessage, ToolMessage } from '@langchain/core/messages';
import type { StructuredToolInterface } from '@langchain/core/tools';
import { ChatOpenAI } from '@langchain/openai';
import type { z } from 'zod';
import { ANALYSIS_CONFIG } from '@/analysis/analysis.config';
import type { DiagnosisTools } from '@/analysis/tools/diagnosis-toolkit';
import { contentToString, extractJson } from '@/shared/llm/llm-json';

// 도구 왕복 상한: 증거 수집은 유한해야 한다. 상한 도달 시 수집분만으로 최종 판정을 강제한다.
const MAX_TOOL_ROUNDS = 4;
// invoke.ts 와 동일한 이유의 최종 출력 re-ask 상한.
const MAX_FINAL_ATTEMPTS = 2;
// 루프 전체 안전핀: 상한 안내 후에도 모델이 도구만 반복 호출하는 폭주를 끊는다.
const MAX_TOTAL_INVOCATIONS = MAX_TOOL_ROUNDS + MAX_FINAL_ATTEMPTS + 2;

// 재현성/평가용 도구 호출 궤적(어떤 도구를 어떤 입력으로 불러 무엇을 얻었나).
export interface DiagnosisTrajectoryStep {
  tool: string;
  input: string;
  resultPreview: string;
}

export interface AgentInvokeResult<T> {
  value: T;
  trajectory: DiagnosisTrajectoryStep[];
}

// invokeNode 의 에이전트 버전: 모델이 도구로 증거를 수집(ReAct 루프)한 뒤 최종 JSON 을
// 내면 스키마 검증한다. 검증 실패 시 invoke.ts 와 같은 re-ask 로 자기 출력을 고치게 한다.
export async function invokeAgentNode<T>(
  rolePrompt: string,
  facts: string,
  schema: z.ZodType<T>,
  tools: DiagnosisTools,
): Promise<AgentInvokeResult<T>> {
  const model = new ChatOpenAI({
    model: ANALYSIS_CONFIG.model,
    apiKey: ANALYSIS_CONFIG.apiKey,
    temperature: ANALYSIS_CONFIG.temperature,
    maxTokens: ANALYSIS_CONFIG.maxOutputTokens,
    // invoke.ts 와 동일 — qwen3.6 의 thinking 이 출력 상한을 잠식해 content 가
    // 비는 것을 막는다(2026-07-14 실측).
    modelKwargs: { reasoning_effort: "none" },
    configuration: { baseURL: ANALYSIS_CONFIG.baseUrl },
  }).bindTools(tools);

  const toolsByName = new Map<string, StructuredToolInterface>(
    tools.map((entry) => [entry.name, entry]),
  );
  const messages: BaseMessage[] = [
    new SystemMessage(rolePrompt),
    new HumanMessage(facts),
  ];
  const trajectory: DiagnosisTrajectoryStep[] = [];

  let toolRounds = 0;
  let finalAttempts = 0;
  let lastError: unknown;

  for (let i = 0; i < MAX_TOTAL_INVOCATIONS; i++) {
    const response = await model.invoke(messages);
    const toolCalls = response.tool_calls ?? [];

    if (toolCalls.length > 0) {
      messages.push(response);

      // 상한 도달: 도구를 실행하지 않고, 프로토콜상 필요한 응답만 채워 최종 출력을 강제한다.
      if (toolRounds >= MAX_TOOL_ROUNDS) {
        for (const toolCall of toolCalls) {
          messages.push(
            new ToolMessage({
              content:
                "도구 호출 상한 도달 — 지금까지 수집한 증거만으로 최종 JSON 을 출력하라.",
              tool_call_id: toolCall.id ?? toolCall.name,
            }),
          );
        }
        continue;
      }

      toolRounds++;
      for (const toolCall of toolCalls) {
        const target = toolsByName.get(toolCall.name);
        let output: string;
        if (target === undefined) {
          output = `알 수 없는 도구: ${toolCall.name}`;
        } else {
          // ToolCall 입력이면 ToolMessage 가 오지만, 시그니처가 도구별 유니온이라 unknown 으로 받아 좁힌다.
          const rawResult: unknown = await target.invoke(toolCall);
          output =
            rawResult instanceof ToolMessage
              ? contentToString(rawResult.content)
              : contentToString(rawResult);
        }

        trajectory.push({
          tool: toolCall.name,
          input: JSON.stringify(toolCall.args),
          resultPreview: output.slice(0, 200),
        });
        messages.push(
          new ToolMessage({
            content: output,
            tool_call_id: toolCall.id ?? toolCall.name,
          }),
        );
      }
      continue;
    }

    try {
      const value = schema.parse(
        extractJson(contentToString(response.content)),
      );
      return { value, trajectory };
    } catch (error) {
      lastError = error;
      finalAttempts++;
      if (finalAttempts >= MAX_FINAL_ATTEMPTS) {
        throw lastError;
      }
      messages.push(
        response,
        new HumanMessage(
          [
            "직전 출력이 JSON 추출 또는 스키마 검증에 실패했다. 오류:",
            String(error),
            "위 오류를 반영해 수정하고, 동일한 스키마의 JSON만 코드블록으로 다시 출력하라.",
          ].join("\n"),
        ),
      );
    }
  }

  throw (
    lastError ?? new Error("에이전트 루프가 최종 출력 없이 호출 상한에 도달")
  );
}

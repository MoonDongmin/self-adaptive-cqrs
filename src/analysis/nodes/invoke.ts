import type { BaseMessage } from '@langchain/core/messages';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { ChatOpenAI } from '@langchain/openai';
import type { z } from 'zod';
import { ANALYSIS_CONFIG } from '@/analysis/analysis.config';
import { contentToString, extractJson } from '@/shared/llm/llm-json';

// 코드가 담긴 큰 JSON 출력은 파싱/스키마 검증이 확률적으로 깨진다. 한 번 깨졌다고
// 섹션을 통째로 비우면(§1 센티넬 + §2/§3 충실) 자기모순 Docs 가 되므로 1회 재시도한다.
// 단 temperature 0 에서 동일 프롬프트 재전송은 같은 실패를 그대로 재현하므로(블라인드 재시도 무효),
// 재시도 시에는 직전 응답 + 검증 에러를 대화에 누적해 모델이 자기 출력을 고치게 한다(re-ask).
const MAX_ATTEMPTS = 2;

export async function invokeNode<T>(
  rolePrompt: string,
  facts: string,
  schema: z.ZodType<T>,
): Promise<T> {
  const model = new ChatOpenAI({
    model: ANALYSIS_CONFIG.model,
    apiKey: ANALYSIS_CONFIG.apiKey,
    temperature: ANALYSIS_CONFIG.temperature,
    maxTokens: ANALYSIS_CONFIG.maxOutputTokens,
    // qwen3.6 계열은 하이브리드 thinking 모델 — 추론이 출력 상한을 전부 잠식해
    // content 0자(finish=length, reasoning_tokens=완전 소진)로 JSON 파싱이 죽는다
    // (2026-07-14 실측: 511/511 토큰이 전부 reasoning). sensor-screener·prejudge 와
    // 동일하게 LM Studio 의 reasoning_effort 매핑으로 thinking 을 끈다.
    modelKwargs: { reasoning_effort: "none" },
    configuration: { baseURL: ANALYSIS_CONFIG.baseUrl },
  });

  const messages: BaseMessage[] = [
    new SystemMessage(rolePrompt),
    new HumanMessage(facts),
  ];

  let lastError: unknown;

  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const response = await model.invoke(messages);

    try {
      return schema.parse(extractJson(contentToString(response.content)));
    } catch (error) {
      lastError = error;
      messages.push(
        response, // 모델이 자기가 낸 출력을 보고 고치도록 실패 응답을 대화에 남긴다
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

  throw lastError;
}

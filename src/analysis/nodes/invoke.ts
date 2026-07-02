import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { ChatOpenAI } from '@langchain/openai';
import type { z } from 'zod';
import { ANALYSIS_CONFIG } from '@/analysis/analysis.config';
import { contentToString, extractJson } from '@/shared/llm/llm-json';

// 코드가 담긴 큰 JSON 출력은 파싱/스키마 검증이 확률적으로 깨진다. 한 번 깨졌다고
// 섹션을 통째로 비우면(§1 센티넬 + §2/§3 충실) 자기모순 Docs 가 되므로 1회 재시도한다.
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
    configuration: { baseURL: ANALYSIS_CONFIG.baseUrl },
  });

  let lastError: unknown;

  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const response = await model.invoke([
      new SystemMessage(rolePrompt),
      new HumanMessage(facts),
    ]);

    try {
      return schema.parse(extractJson(contentToString(response.content)));
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}

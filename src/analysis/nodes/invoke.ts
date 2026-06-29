import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { ChatOpenAI } from '@langchain/openai';
import type { z } from 'zod';
import { ANALYSIS_CONFIG } from '@/analysis/analysis.config';
import { contentToString, extractJson } from '@/shared/llm/llm-json';

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

  const response = await model.invoke([
    new SystemMessage(rolePrompt),
    new HumanMessage(facts),
  ]);

  return schema.parse(extractJson(contentToString(response.content)));
}

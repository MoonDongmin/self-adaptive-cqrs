import { LLM_CONNECTION } from '@/shared/llm/llm-connection.config';

export const ANALYSIS_CONFIG = {
  ...LLM_CONNECTION,
  model: process.env.ANALYSIS_MODEL,
  temperature: 0,
} as const;

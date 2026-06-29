import { LLM_CONNECTION } from '@/shared/llm/llm-connection.config';

export const PREJUDGE_CONFIG = {
  ...LLM_CONNECTION,
  model: process.env.PREJUDGE_MODEL,
  temperature: 0,
} as const;

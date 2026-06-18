export const PREJUDGE_CONFIG = {
  model: process.env.PREJUDGE_MODEL,
  baseUrl: process.env.LLM_BASE_URL,
  apiKey: process.env.LLM_API_KEY,
  temperature: 0,
} as const;

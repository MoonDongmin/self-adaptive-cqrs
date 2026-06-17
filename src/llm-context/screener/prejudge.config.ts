export const PREJUDGE_CONFIG = {
  model: process.env.PREJUDGE_MODEL ?? "qwen/qwen3-14b",
  baseUrl: process.env.LLM_BASE_URL,
  apiKey: process.env.LLM_API_KEY ?? "lm-studio",
  temperature: 0,
  frequencyWindowHours: 1,
} as const;

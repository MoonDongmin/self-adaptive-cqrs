import { FrequencyRow } from "@/llm-context/llm-context.type";

export interface LogFrequencyRepository {
  // 최근 시간 동안 action/level 별 발생 횟수
  countByActionLevel(windowHours: number): Promise<FrequencyRow[]>;
}

export const LOG_FREQUENCY: unique symbol = Symbol("LOG_FREQUENCY");

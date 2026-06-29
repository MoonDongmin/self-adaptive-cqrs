import { AnomalyLogWindow } from '@/llm-context/llm-context.type';

export interface LogWindowRepository {
  buildWindow(tripCorrelationIds: string[]): Promise<AnomalyLogWindow>;
}

export const LOG_WINDOW: unique symbol = Symbol("LOG_WINDOW");

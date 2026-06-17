import {
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { LogConsumer } from "@/llm-context/kafka/log-consumer";
import { PinoLogger } from "nestjs-pino";
import {
  LOG_FREQUENCY,
  type LogFrequencyRepository,
} from "@/llm-context/repository/log-frequency.repository";
import { LogAction, LogContext } from "@/shared/logger/logging-context";
import { LOG_CONSUMER_CONFIG } from "@/llm-context/kafka/log-consumer.config";
import { clearInterval } from "node:timers";
import { PREJUDGE_CONFIG } from "@/llm-context/screener/prejudge.config";
import {
  FrequencySummary,
  PrejudgeChecked,
} from "@/llm-context/llm-context.type";
import { prejudge } from "@/llm-context/screener/prejudge";

@Injectable()
export class LLMContextService implements OnModuleInit, OnModuleDestroy {
  private timer: NodeJS.Timeout | null = null;

  constructor(
    private readonly logger: PinoLogger,
    private readonly consumer: LogConsumer,
    @Inject(LOG_FREQUENCY)
    private readonly frequency: LogFrequencyRepository,
  ) {
    this.logger.setContext(LLMContextService.name);
  }

  onModuleInit(): void {
    this.timer = setInterval(() => {
      void this.detectOnce().catch((error: unknown) => {
        this.logger.error(
          { [LogContext.REASON]: String(error) },
          "선판단 주기 실행 실패",
        );
      });
    }, LOG_CONSUMER_CONFIG.pollIntervalMS);
  }

  onModuleDestroy(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
    }
  }

  async detectOnce() {
    const batch = this.consumer.drainOnce();

    if (batch.length === 0) {
      return null;
    }

    const rows = await this.frequency.countByActionLevel(
      PREJUDGE_CONFIG.frequencyWindowHours,
    );

    const summary: FrequencySummary = {
      windowHours: PREJUDGE_CONFIG.frequencyWindowHours,
      rows,
    };

    const checked: PrejudgeChecked = await prejudge(batch, summary);

    this.logger.info(
      {
        action: checked.triggered
          ? LogAction.LLM_PREJUDGE_TRIGGERED
          : LogAction.LLM_PREJUDGE_SKIPPED,
        [LogContext.COUNT]: batch.length,
        [LogContext.REASON]: checked.reason,
      },
      checked.triggered ? "선판단: 트리거" : "선판단: 정상",
    );

    // TODO(다음 라운드): triggered면 ±N 윈도우 조립 → 컨텍스트 .md → 분석 LLM(3출력)
    return checked;
  }
}

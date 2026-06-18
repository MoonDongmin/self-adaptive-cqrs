import { clearTimeout, setTimeout } from "node:timers";
import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino";
import { LogConsumer } from "@/llm-context/kafka/log-consumer";
import { LOG_CONSUMER_CONFIG } from "@/llm-context/kafka/log-consumer.config";
import { PrejudgeChecked } from "@/llm-context/llm-context.type";
import { prejudge } from "@/llm-context/screener/prejudge";
import { LogAction, LogContext } from "@/shared/logger/logging-context";

@Injectable()
export class LLMContextService implements OnModuleInit, OnModuleDestroy {
  private timer: NodeJS.Timeout | null = null;
  private stopped: boolean = false;

  constructor(
    private readonly logger: PinoLogger,
    private readonly consumer: LogConsumer,
  ) {
    this.logger.setContext(LLMContextService.name);
  }

  onModuleInit(): void {
    void this.runLoop();
  }

  onModuleDestroy(): void {
    this.stopped = true;
    if (this.timer !== null) {
      clearTimeout(this.timer);
    }
  }

  /**
   * Kafka 버퍼를 폴링하는 자기-재스케줄 루프.
   * - 버퍼가 비어 있으면(LLM 미호출) 5초 뒤 다시 확인한다.
   * - 버퍼에 로그가 쌓여 있으면 LLM을 호출하고, 끝난 즉시 다시 확인한다.
   * setInterval과 달리 다음 틱은 현재 작업이 끝난 뒤에야 예약되므로
   * LLM 호출이 길어져도 실행이 겹치지 않는다.
   */
  private async runLoop(): Promise<void> {
    if (this.stopped) {
      return;
    }

    let triggeredLLM: boolean = false;
    try {
      const checked: PrejudgeChecked | null = await this.detectOnce();
      triggeredLLM = checked !== null;
    } catch (error: unknown) {
      this.logger.error(
        { [LogContext.REASON]: String(error) },
        "선판단 주기 실행 실패",
      );
    }

    if (this.stopped) {
      return;
    }

    // LLM을 호출했다면(=버퍼에 로그가 있었다면) 즉시 재확인,
    // 비어 있었다면 5초 뒤 재확인.
    const delayMS: number = triggeredLLM
      ? 0
      : LOG_CONSUMER_CONFIG.pollIntervalMS;
    this.timer = setTimeout(() => {
      void this.runLoop();
    }, delayMS);
  }

  async detectOnce() {
    const batch = this.consumer.drainOnce();

    if (batch.length === 0) {
      return null;
    }

    const checked: PrejudgeChecked = await prejudge(batch);

    this.logger.info(
      {
        action: checked.triggered
          ? LogAction.LLM_PREJUDGE_TRIGGERED
          : LogAction.LLM_PREJUDGE_SKIPPED,
        [LogContext.COUNT]: batch.length,
        [LogContext.REASON]: checked.reason,
      },
      checked.triggered ? "선판단: 비정상" : "선판단: 정상",
    );

    // TODO(다음 라운드): triggered면 ±N 윈도우 조립 → 컨텍스트 .md → 분석 LLM(3출력)
    return checked;
  }
}

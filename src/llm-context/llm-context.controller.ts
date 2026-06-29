import { Controller, Get } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { LLMContextService } from '@/llm-context/llm-context.service';
import { PrejudgeChecked } from '@/llm-context/llm-context.type';
import { LogContext } from '@/shared/logger/logging-context';

@Controller("llm-context")
export class LlmContextController {
  constructor(
    private readonly logger: PinoLogger,
    private readonly service: LLMContextService,
  ) {
    this.logger.setContext(LlmContextController.name);
  }

  @Get("/detect")
  async detect(): Promise<PrejudgeChecked> {
    this.logger.info(
      { [LogContext.ROUTE]: "GET /llm-context/detect" },
      "선판단 수동 트리거",
    );

    const checked: PrejudgeChecked | null = await this.service.detectOnce();

    return (
      checked ?? {
        triggered: false,
        reason: "드레인할 배치 없음(버퍼 비어있음)",
        tripCorrelationIds: [],
      }
    );
  }
}

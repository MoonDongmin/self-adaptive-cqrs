import { Module } from "@nestjs/common";
import { LogConsumer } from "@/llm-context/kafka/log-consumer";
import { LlmContextController } from "@/llm-context/llm-context.controller";
import { LOG_FREQUENCY } from "@/llm-context/repository/log-frequency.repository";
import { LogFrequencyRepositoryImpl } from "@/llm-context/repository/log-frequency.repository.impl";
import { LLMContextService } from "@/llm-context/llm-context.service";

@Module({
  controllers: [LlmContextController],
  providers: [
    LogConsumer,
    LLMContextService,
    { provide: LOG_FREQUENCY, useClass: LogFrequencyRepositoryImpl },
  ],
})
export class LlmContextModule {}

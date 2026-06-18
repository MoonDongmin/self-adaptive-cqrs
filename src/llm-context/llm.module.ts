import { Module } from "@nestjs/common";
import { LogConsumer } from "@/llm-context/kafka/log-consumer";
import { LlmContextController } from "@/llm-context/llm-context.controller";
import { LLMContextService } from "@/llm-context/llm-context.service";

@Module({
  controllers: [LlmContextController],
  providers: [LogConsumer, LLMContextService],
})
export class LlmContextModule {}

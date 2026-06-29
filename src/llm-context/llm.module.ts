import { Module } from '@nestjs/common';
import { InsightModule } from '@/insight/insight.module';
import { LogConsumer } from '@/llm-context/kafka/log-consumer';
import { LlmContextController } from '@/llm-context/llm-context.controller';
import { LLMContextService } from '@/llm-context/llm-context.service';
import { LOG_WINDOW } from '@/llm-context/repository/log-window.repository';
import { LogWindowRepositoryImpl } from '@/llm-context/repository/log-window.repository.impl';

@Module({
  imports: [InsightModule],
  controllers: [LlmContextController],
  providers: [
    LogConsumer,
    LLMContextService,
    {
      provide: LOG_WINDOW,
      useClass: LogWindowRepositoryImpl,
    },
  ],
})
export class LlmContextModule {}

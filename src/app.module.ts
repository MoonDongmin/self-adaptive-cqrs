import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { InsertModule } from "@/insert/insert.module";
import { InsightModule } from "@/insight/insight.module";
import { LogModule } from "@/log-collector/log.module";
import { ProjectionModule } from "@/projection/projection.module";
import { DrizzleModule } from "@/shared/database/drizzle.module";
import { CorrelationMiddleware } from "@/shared/logger/correlation.middleware";
import { AppLoggerModule } from "@/shared/logger/logger.module";
import { LlmContextModule } from "@/llm-context/llm.module";

@Module({
  imports: [
    AppLoggerModule,
    InsertModule,
    DrizzleModule,
    ProjectionModule,
    LogModule,
    InsightModule,
    LlmContextModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(CorrelationMiddleware).forRoutes("*");
  }
}

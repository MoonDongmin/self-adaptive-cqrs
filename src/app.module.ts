import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { InsertModule } from "@/insert/insert.module";
import { LogModule } from "@/log-collector/log.module";
import { ProjectionModule } from "@/projection/projection.module";
import { DrizzleModule } from "@/shared/database/drizzle.module";
import { CorrelationMiddleware } from "@/shared/logger/correlation.middleware";
import { AppLoggerModule } from "@/shared/logger/logger.module";

@Module({
  imports: [
    AppLoggerModule,
    InsertModule,
    DrizzleModule,
    ProjectionModule,
    LogModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(CorrelationMiddleware).forRoutes("*");
  }
}

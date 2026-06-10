import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { InsertModule } from "@/insert/insert.module";
import { ProjectionModule } from "@/projection/projection.module";
import { DrizzleModule } from "@/shared/database/drizzle.module";
import { CorrelationMiddleware } from "@/shared/logger/correlation.middleware";
import { AppLoggerModule } from "@/shared/logger/logger.module";

@Module({
  imports: [AppLoggerModule, InsertModule, DrizzleModule, ProjectionModule],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(CorrelationMiddleware).forRoutes("*");
  }
}

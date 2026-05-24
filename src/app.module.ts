import { Module } from "@nestjs/common";
import { AppLoggerModule } from "@/shared/logger/logger.module";
import { InsertModule } from "@/insert/insert.module";
import { DrizzleModule } from "@/shared/database/drizzle.module";
import { ProjectionModule } from "@/projection/projection.module";

@Module({
  imports: [AppLoggerModule, InsertModule, DrizzleModule, ProjectionModule],
  controllers: [],
  providers: [],
})
export class AppModule {}

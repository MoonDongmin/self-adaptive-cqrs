import { Module } from "@nestjs/common";
import { AppLoggerModule } from "@/shared/logger/logger.module";
import { InsertModule } from "@/insert/insert.module";
import { DrizzleModule } from "@/shared/database/drizzle.module";

@Module({
  imports: [AppLoggerModule, InsertModule, DrizzleModule],
  controllers: [],
  providers: [],
})
export class AppModule {}

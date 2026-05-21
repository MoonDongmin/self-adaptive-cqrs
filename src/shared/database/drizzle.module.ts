import { Global, Module } from "@nestjs/common";
import { DRIZZLE, drizzleProvider } from "@/shared/database/drizzle.provider";

@Global()
@Module({
  providers: [drizzleProvider],
  exports: [DRIZZLE],
})
export class DrizzleModule {}

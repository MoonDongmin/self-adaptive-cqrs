import "dotenv/config";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "@/app.module";
import { INestApplication } from "@nestjs/common";
import { Logger } from "nestjs-pino";

async function bootstrap(): Promise<void> {
  const app: INestApplication<unknown> = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  app.useLogger(app.get(Logger));

  await app.listen(process.env.PORT ?? 3000, () => {
    console.info(`App listening on port ${process.env.PORT}`);
  });
}

bootstrap();

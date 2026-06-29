import 'dotenv/config';
import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { AppModule } from '@/app.module';

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

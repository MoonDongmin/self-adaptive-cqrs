import { Module } from '@nestjs/common';
import { LogController } from '@/log-collector/log.controller';
import { LogService } from '@/log-collector/log.service';
import { LOG_CURSOR } from '@/log-collector/repository/log-cursor.repository';
import { LogCursorRepositoryImpl } from '@/log-collector/repository/log-cursor.repository.impl';
import { LOG_EVENT_WRITER } from '@/log-collector/repository/log-event.repository';
import { LogEventRepositoryImpl } from '@/log-collector/repository/log-event.repository.impl';

@Module({
  controllers: [LogController],
  providers: [
    LogService,
    {
      provide: LOG_EVENT_WRITER,
      useClass: LogEventRepositoryImpl,
    },
    {
      provide: LOG_CURSOR,
      useClass: LogCursorRepositoryImpl,
    },
  ],
})
export class LogModule {}

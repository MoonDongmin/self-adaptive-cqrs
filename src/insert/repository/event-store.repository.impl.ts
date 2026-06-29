import { Inject, Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { AppendEventInput } from '@/insert/repository/event-store.repository';
import { DRIZZLE, type Drizzle } from '@/shared/database/drizzle.provider';
import { eventStore } from '@/shared/database/schema';
import { LogAction, LogContext } from '@/shared/logger/logging-context';

@Injectable()
export class EventStoreRepositoryImpl implements EventStoreRepositoryImpl {
  constructor(
    private readonly logger: PinoLogger,
    @Inject(DRIZZLE) private readonly db: Drizzle,
  ) {
    this.logger.setContext(EventStoreRepositoryImpl.name);
  }

  async append(input: AppendEventInput): Promise<number | null> {
    try {
      const rows = await this.db
        .insert(eventStore)
        .values({
          streamId: input.streamId,
          attemptNum: input.attemptNum,
          eventType: input.eventType,
          occurredAt: input.occurredAt,
          payload: input.payload as object,
        })
        .onConflictDoNothing({
          target: [eventStore.streamId, eventStore.attemptNum],
        })
        .returning({ globalSeq: eventStore.globalSeq });

      const seq: number | null =
        rows.length === 0 ? null : Number(rows[0].globalSeq);

      this.logger.debug(
        {
          action: LogAction.INSERT_FILE_OK,
          [LogContext.STREAM_ID]: input.streamId,
          [LogContext.ATTEMPT_NUM]: input.attemptNum,
          [LogContext.GLOBAL_SEQ]: seq,
        },
        seq === null ? "이벤트 중복(멱등 스킵)" : "이벤트 append",
      );

      return seq;
    } catch (err) {
      this.logger.error(
        {
          action: LogAction.EVENT_APPEND_FAILED,
          err,
          [LogContext.STREAM_ID]: input.streamId,
          [LogContext.ATTEMPT_NUM]: input.attemptNum,
        },
        "이벤트 append 실패",
      );

      throw err;
    }
  }
}

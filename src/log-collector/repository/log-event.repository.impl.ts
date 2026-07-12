import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { LogEventRepository } from '@/log-collector/repository/log-event.repository';
import { DrizzleTx } from '@/shared/database/drizzle.provider';
import { logEvents } from '@/shared/database/schema';
import { LogEventInsert } from '../log-record';

@Injectable()
export class LogEventRepositoryImpl implements LogEventRepository {
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(LogEventRepositoryImpl.name);
  }

  // 한 INSERT 에 담는 행 수 상한. 커서가 뒤처져 백로그가 수만 행이 되면 drizzle 의
  // 쿼리 조립(mergeQueries)이 재귀로 스택을 터뜨린다(2026-07-10 재현 — 로그 20,867행
  // 단일 INSERT 에서 RangeError). 실패하면 커서가 전진하지 못해 매 주기 같은 실패를
  // 반복하므로, 반드시 청크로 나눠 넣는다.
  private static readonly INSERT_CHUNK_SIZE: number = 1000;

  async insertBatch(tx: DrizzleTx, rows: LogEventInsert[]): Promise<void> {
    if (rows.length === 0) {
      return;
    }

    for (
      let offset = 0;
      offset < rows.length;
      offset += LogEventRepositoryImpl.INSERT_CHUNK_SIZE
    ) {
      await tx
        .insert(logEvents)
        .values(
          rows.slice(offset, offset + LogEventRepositoryImpl.INSERT_CHUNK_SIZE),
        );
    }
  }
}

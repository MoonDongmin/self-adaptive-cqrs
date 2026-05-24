import { Inject, Injectable } from "@nestjs/common";
import { type Drizzle, DRIZZLE } from "@/shared/database/drizzle.provider";
import {
  EVENT_STORE_READER,
  EventStoreEventRow,
  type EventStoreReaderRepository,
} from "@/projection/repository/event-store-reader.repository";
import {
  PROJECTION_CURSOR,
  type ProjectionCursorRepository,
} from "@/projection/repository/projection-cursor.repository";
import { ProjectionResult, Projector } from "@/projection/projector/projector";

@Injectable()
export class CatchUpRunner {
  private static readonly BATCH_SIZE: number = 500;

  constructor(
    @Inject(DRIZZLE)
    private readonly db: Drizzle,
    @Inject(EVENT_STORE_READER)
    private readonly reader: EventStoreReaderRepository,
    @Inject(PROJECTION_CURSOR)
    private readonly cursors: ProjectionCursorRepository,
  ) {}

  async run<Insert>(projector: Projector<Insert>): Promise<ProjectionResult> {
    const fromSeq: number = await this.cursors.getOrInit(projector.name);

    let lastProcessed: number = fromSeq;
    let processed: number = 0;

    for (;;) {
      const events: EventStoreEventRow[] = await this.reader.fetchAfter(
        lastProcessed,
        CatchUpRunner.BATCH_SIZE,
      );

      if (events.length === 0) {
        break;
      }

      await this.db.transaction(async (tx) => {
        for (const event of events) {
          const row: Insert = projector.map(event);

          await projector.upsert(tx, row);
        }

        await this.cursors.update(
          tx,
          projector.name,
          events[events.length - 1].globalSeq,
        );
      });

      lastProcessed = events[events.length - 1].globalSeq;
      processed += events.length;

      if (events.length < CatchUpRunner.BATCH_SIZE) {
        break;
      }
    }

    return {
      projectorName: projector.name,
      fromSeq,
      toSeq: lastProcessed,
      processed,
    };
  }
}

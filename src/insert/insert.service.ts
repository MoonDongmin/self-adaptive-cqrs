import { Inject, Injectable, Logger } from "@nestjs/common";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import {
  EVENT_STORE_REPOSITORY,
  type EventStoreRepository,
} from "@/insert/repository/event-store.repository";
import {
  ParsedFileName,
  parseToyDataFileName,
} from "@/insert/parser/toy-data-file-name.parser";
import { toyDataSchema } from "@/insert/dto/toy-data.dto";

const TOY_DATA_DIR: string = path.resolve(process.cwd(), "data/toy-data");

export type IngestFailure = { file: string; reason: string };

export type IngestResult = {
  totalFiles: number;
  inserted: number;
  skipped: number;
  failed: IngestFailure[];
};

@Injectable()
export class InsertService {
  private readonly logger: Logger = new Logger(InsertService.name);

  constructor(
    @Inject(EVENT_STORE_REPOSITORY)
    private readonly eventStore: EventStoreRepository,
  ) {}

  async ingestToyData(): Promise<IngestResult> {
    const entries: string[] = (await fs.readdir(TOY_DATA_DIR))
      .filter((f): boolean => f.endsWith(".json"))
      .sort();

    const result: IngestResult = {
      totalFiles: entries.length,
      inserted: 0,
      skipped: 0,
      failed: [],
    };

    for (const file of entries) {
      try {
        const meta: ParsedFileName = parseToyDataFileName(file);

        const raw: string = await fs.readFile(
          path.join(TOY_DATA_DIR, file),
          "utf-8",
        );

        const parsed: Record<string, unknown> = toyDataSchema.parse(
          JSON.parse(raw),
        );

        const seq: number | null = await this.eventStore.append({
          streamId: `grip-attempt:${meta.sceneKey}`,
          attemptNum: meta.attemptNum,
          eventType: "GripAttemptRecorded",
          occurredAt: meta.capturedDate,
          payload: parsed,
        });

        if (seq === null) {
          result.skipped++;
        } else {
          result.inserted++;
        }
      } catch (e) {
        const reason: string = e instanceof Error ? e.message : String(e);

        result.failed.push({ file, reason });

        this.logger.warn(`ingest failed: ${file} — ${reason}`);
      }
    }

    return result;
  }
}

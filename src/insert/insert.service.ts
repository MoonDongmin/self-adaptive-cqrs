import { Inject, Injectable, Logger, NotFoundException } from "@nestjs/common";
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

export type InsertFailure = { file: string; reason: string };

export type InsertResult = {
  totalFiles: number;
  inserted: number;
  skipped: number;
  failed: InsertFailure[];
};

@Injectable()
export class InsertService {
  private readonly logger: Logger = new Logger(InsertService.name);

  constructor(
    @Inject(EVENT_STORE_REPOSITORY)
    private readonly eventStore: EventStoreRepository,
  ) {}

  async insertToyData(): Promise<InsertResult> {
    const entries: string[] = await this.listToyDataFiles();

    const result: InsertResult = {
      totalFiles: entries.length,
      inserted: 0,
      skipped: 0,
      failed: [],
    };

    for (const file of entries) {
      await this.insertOneFile(file, result);
    }

    return result;
  }

  async insertSingleByIndex(index: number): Promise<InsertResult> {
    const entries: string[] = await this.listToyDataFiles();

    if (!Number.isInteger(index) || index < 1 || index > entries.length) {
      throw new NotFoundException(
        `index ${index} out of range (1..${entries.length})`,
      );
    }

    const result: InsertResult = {
      totalFiles: 1,
      inserted: 0,
      skipped: 0,
      failed: [],
    };

    await this.insertOneFile(entries[index - 1], result);

    return result;
  }

  private async listToyDataFiles(): Promise<string[]> {
    return (await fs.readdir(TOY_DATA_DIR))
      .filter((f): boolean => f.endsWith(".json"))
      .sort();
  }

  private async insertOneFile(
    file: string,
    result: InsertResult,
  ): Promise<void> {
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
}

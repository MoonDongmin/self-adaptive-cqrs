import { Injectable } from "@nestjs/common";
import { InferInsertModel } from "drizzle-orm";
import { readMultimodal } from "@/shared/database/schema";
import { Projector } from "@/projection/projector/projector";
import { DrizzleTx } from "@/shared/database/drizzle.provider";
import { EventStoreEventRow } from "../repository/event-store-reader.repository";
import { ToyDataDto, toyDataSchema } from "@/insert/dto/toy-data.dto";

type ReadMultimodalInsert = InferInsertModel<typeof readMultimodal>;

@Injectable()
export class MultiModalProjector implements Projector<ReadMultimodalInsert> {
  readonly name: string = "multimodal-projector";

  map(event: EventStoreEventRow): ReadMultimodalInsert {
    const payload: ToyDataDto = toyDataSchema.parse(event.payload);

    return {
      sceneKey: event.streamId.replace(/^grip-attempt:/, ""),
      attemptNum: event.attemptNum,
      occurredAt: event.occurredAt,
      image2dFileName: payload["2D_image_file_name"],
      image2dUri: null,
      videoFileName: payload.video_file_name,
      videoUri: null,
      streamId: event.streamId,
      globalSeq: event.globalSeq,
    };
  }

  async upsert(tx: DrizzleTx, row: ReadMultimodalInsert): Promise<void> {
    await tx
      .insert(readMultimodal)
      .values(row)
      .onConflictDoUpdate({
        target: [readMultimodal.sceneKey, readMultimodal.attemptNum],
        set: {
          occurredAt: row.occurredAt,
          image2dFileName: row.image2dFileName,
          image2dUri: row.image2dUri,
          videoFileName: row.videoFileName,
          videoUri: row.videoUri,
          streamId: row.streamId,
          globalSeq: row.globalSeq,
        },
      });
  }
}

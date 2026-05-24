import { Injectable } from "@nestjs/common";
import { type InferInsertModel } from "drizzle-orm";
import { DrizzleTx } from "@/shared/database/drizzle.provider";
import { readGripResult } from "@/shared/database/schema";
import { type ToyDataDto, toyDataSchema } from "@/insert/dto/toy-data.dto";
import type { EventStoreEventRow } from "@/projection/repository/event-store-reader.repository";
import type { Projector } from "@/projection/projector/projector";

type ReadGripResultInsert = InferInsertModel<typeof readGripResult>;

@Injectable()
export class GripResultProjector implements Projector<ReadGripResultInsert> {
  readonly name: string = "grip-result-projector";

  map(event: EventStoreEventRow): ReadGripResultInsert {
    const payload: ToyDataDto = toyDataSchema.parse(event.payload);

    if (payload.objects.length === 0) {
      throw new Error(
        `grip-result map: empty objects in event ${event.eventId}`,
      );
    }

    return {
      sceneKey: event.streamId.replace(/^grip-attempt:/, ""),
      attemptNum: event.attemptNum,
      objectName: payload.objects[0].class_name,
      gripSucceed: payload.grip_succeed,
      gripperType: "finger",
      occurredAt: event.occurredAt,
      grip2dPose: payload.grip_data.grip_2d_pose,
      grip3dPose: payload.grip_data.grip_3d_pose,
      robotTf: payload.robot_tf,
      humanAnnotationGrasp: payload.human_annotation_grasp,
      streamId: event.streamId,
      globalSeq: event.globalSeq,
    };
  }

  async upsert(tx: DrizzleTx, row: ReadGripResultInsert): Promise<void> {
    await tx
      .insert(readGripResult)
      .values(row)
      .onConflictDoUpdate({
        target: [readGripResult.sceneKey, readGripResult.attemptNum],
        set: {
          objectName: row.objectName,
          gripSucceed: row.gripSucceed,
          gripperType: row.gripperType,
          occurredAt: row.occurredAt,
          grip2dPose: row.grip2dPose,
          grip3dPose: row.grip3dPose,
          robotTf: row.robotTf,
          humanAnnotationGrasp: row.humanAnnotationGrasp,
          streamId: row.streamId,
          globalSeq: row.globalSeq,
        },
      });
  }
}

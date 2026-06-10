import { Module } from "@nestjs/common";
import { InsertModule } from "@/insert/insert.module";
import { ProjectionController } from "@/projection/projection.controller";
import { ProjectionService } from "@/projection/projection.service";
import { GripResultProjector } from "@/projection/projector/grip-result.projector";
import { MultiModalProjector } from "@/projection/projector/multimodal.projector";
import { EVENT_STORE_READER } from "@/projection/repository/event-store-reader.repository";
import { EventStoreReaderRepositoryImpl } from "@/projection/repository/event-store-reader.repository.impl";
import { PROJECTION_CURSOR } from "@/projection/repository/projection-cursor.repository";
import { ProjectionCursorRepositoryImpl } from "@/projection/repository/projection-cursor.repository.impl";
import { CatchUpRunner } from "@/projection/runner/catch-up.runner";

@Module({
  imports: [InsertModule],
  controllers: [ProjectionController],
  providers: [
    ProjectionService,
    CatchUpRunner,
    MultiModalProjector,
    GripResultProjector,
    {
      provide: EVENT_STORE_READER,
      useClass: EventStoreReaderRepositoryImpl,
    },
    {
      provide: PROJECTION_CURSOR,
      useClass: ProjectionCursorRepositoryImpl,
    },
  ],
  exports: [ProjectionService],
})
export class ProjectionModule {}

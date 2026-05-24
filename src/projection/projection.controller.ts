import { Controller, Post } from "@nestjs/common";
import {
  InsertAndProjectionAllResult,
  ProjectionService,
} from "@/projection/projection.service";
import { ProjectionResult } from "@/projection/projector/projector";

@Controller("projection")
export class ProjectionController {
  constructor(private readonly projectionService: ProjectionService) {}

  @Post("/multimodal")
  multimodal(): Promise<ProjectionResult> {
    return this.projectionService.catchUpMultimodal();
  }

  @Post("/grip-result")
  gripResult(): Promise<ProjectionResult> {
    return this.projectionService.catchUpGripResult();
  }

  @Post("/insert-all")
  insertAll(): Promise<InsertAndProjectionAllResult> {
    return this.projectionService.insertAllAndProjectAll();
  }
}

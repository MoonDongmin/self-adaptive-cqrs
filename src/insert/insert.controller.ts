import { Controller, Post } from "@nestjs/common";
import { IngestResult, InsertService } from "@/insert/insert.service";

@Controller("/insert")
export class InsertController {
  constructor(private readonly insertService: InsertService) {}

  @Post()
  async insert(): Promise<IngestResult> {
    return this.insertService.ingestToyData();
  }
}

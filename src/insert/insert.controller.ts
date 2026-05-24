import { Controller, Param, ParseIntPipe, Post } from "@nestjs/common";
import { InsertResult, InsertService } from "@/insert/insert.service";

@Controller("insert")
export class InsertController {
  constructor(private readonly insertService: InsertService) {}

  @Post()
  insert(): Promise<InsertResult> {
    return this.insertService.insertToyData();
  }

  @Post(":index")
  single(@Param("index", ParseIntPipe) index: number): Promise<InsertResult> {
    return this.insertService.insertSingleByIndex(index);
  }
}

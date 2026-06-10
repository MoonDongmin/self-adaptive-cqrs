import { Controller, Param, ParseIntPipe, Post } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino";
import { InsertResult, InsertService } from "@/insert/insert.service";
import { LogAction, LogContext } from "@/shared/logger/logging-context";

@Controller("insert")
export class InsertController {
  constructor(
    private readonly logger: PinoLogger,
    private readonly insertService: InsertService,
  ) {
    this.logger.setContext(InsertController.name);
  }

  @Post()
  insert(): Promise<InsertResult> {
    this.logger.info(
      { action: LogAction.INSERT_REQUEST, [LogContext.ROUTE]: "POST /insert" },
      "Insert Event Store 요청 수신",
    );

    return this.insertService.insertToyData();
  }

  @Post(":index")
  single(@Param("index", ParseIntPipe) index: number): Promise<InsertResult> {
    this.logger.info(
      {
        action: LogAction.INSERT_REQUEST,
        [LogContext.ROUTE]: "POST /insert/:index",
        [LogContext.INDEX]: index,
      },
      "단건 Insert Event Store 요청 수신",
    );

    return this.insertService.insertSingleByIndex(index);
  }
}

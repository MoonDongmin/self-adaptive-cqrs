import { Controller, Delete, Post } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino";
import { IngestionResult, LogService } from "@/log-collector/log.service";
import { LogAction, LogContext } from "@/shared/logger/logging-context";
import { Interval } from "@nestjs/schedule";

@Controller("log")
export class LogController {
  constructor(
    private readonly logService: LogService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(LogController.name);
  }

  @Interval(1000)
  async run(): Promise<IngestionResult> {
    return this.logService.run();
  }

  @Delete()
  async delete(): Promise<void> {
    this.logger.info(
      {
        action: LogAction.LOG_DELETE_REQUEST,
        [LogContext.ROUTE]: "DELETE /log",
      },
      "로그 삭제 요청 수신",
    );

    await this.logService.delete();
  }
}

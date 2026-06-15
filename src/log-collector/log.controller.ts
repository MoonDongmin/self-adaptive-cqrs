import { Controller, Delete, Post } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino";
import { IngestionResult, LogService } from "@/log-collector/log.service";

@Controller("log")
export class LogController {
  constructor(
    private readonly logService: LogService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(LogController.name);
  }

  @Post()
  async run(): Promise<IngestionResult> {
    this.logger.debug("로그 적재 요청 수신");
    return this.logService.run();
  }

  @Delete()
  async delete(): Promise<void> {
    this.logger.debug("로그 삭제 요청 수신");

    await this.logService.delete();
  }
}

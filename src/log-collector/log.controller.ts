import { Controller, Post } from "@nestjs/common";
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

  @Post("run")
  async run(): Promise<IngestionResult> {
    this.logger.debug("로그 적재 요청 수신");
    return this.logService.run();
  }
}

import { Injectable, NestMiddleware } from "@nestjs/common";
import type { NextFunction, Request, Response } from "express";
import { PinoLogger } from "nestjs-pino";
import { LogContext } from "@/shared/logger/logging-context";

@Injectable()
export class CorrelationMiddleware implements NestMiddleware {
  constructor(private readonly logger: PinoLogger) {}

  use(req: Request, res: Response, next: NextFunction) {
    this.logger.assign({
      [LogContext.CORRELATION_ID]: (req as { id?: string }).id,
    });

    next();
  }
}

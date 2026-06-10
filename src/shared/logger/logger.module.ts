import { Global, Module } from "@nestjs/common";
import { randomUUID } from "crypto";
import { LoggerModule } from "nestjs-pino";
import type { Options } from "pino-http";
import pretty from "pino-pretty";

const basePinoHttpOptions: Options = {
  level: process.env.LOG_LEVEL ?? "info",
  customProps: (req) => ({ correlationId: req.id }),
  genReqId: (req) =>
    (req.headers["x-correlation-id"] as string) ?? randomUUID(),
  serializers: {
    req: (req) => ({ method: req.method, url: req.url }),
    res: (res) => ({ statusCode: res.statusCode }),
  },
  redact: {
    paths: [
      "req.headers.authorization",
      'res.headers["set-cookie"]',
      "*.payload.raw.objects[*].segmentation_points",
      "*.payload.raw.grip_data.grip_3d_pose",
    ],
    censor: "[REDACTED]",
  },
};

@Global()
@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp:
        process.env.LOG_PRETTY === "true"
          ? [
              basePinoHttpOptions,
              pretty({
                colorize: true,
                colorizeObjects: false,
                singleLine: true,
                translateTime: "SYS:yyyy-mm-dd HH:MM:ss.l",
                ignore: "pid,hostname,context",
                // context가 있는 로그만 [Context] 접두사를 붙인다 (HTTP 자동 로그에는 context가 없음).
                messageFormat: "{if context}[{context}] {end}{msg}",
              }),
            ]
          : basePinoHttpOptions,
    }),
  ],
  exports: [LoggerModule],
})
export class AppLoggerModule {}

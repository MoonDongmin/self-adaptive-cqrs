import { Module } from "@nestjs/common";
import { LoggerModule } from "nestjs-pino";
import { randomUUID } from "crypto";

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL ?? "info",
        genReqId: (req) =>
          (req.headers["x-request-id"] as string) ?? randomUUID(),
        customProps: (req) => ({ correlation_id: req.id }),
        redact: {
          paths: [
            "req.headers.authorization",
            'res.headers["set-cookie"]',
            "*.payload.raw.objects[*].segmentation_points",
            "*.payload.raw.grip_data.grip_3d_pose",
          ],
          censor: "[REDACTED]",
        },
        transport:
          process.env.LOG_PRETTY === "true"
            ? {
                target: "pino-pretty",
                options: {
                  colorize: true,
                  singleLine: true,
                },
              }
            : undefined,
      },
    }),
  ],
})
export class AppLoggerModule {}

import { Global, Module } from "@nestjs/common";
import { randomUUID } from "crypto";
import { LoggerModule } from "nestjs-pino";
import { join } from "path";
import type { Options } from "pino-http";

const LOG_FILE_PATH: string = join(
  process.cwd(),
  "src/shared/logger/logs/log.json",
);

const isPretty: boolean = process.env.LOG_PRETTY === "true";
const level: string = process.env.LOG_LEVEL ?? "info";

const consoleTarget = isPretty
  ? {
      target: "pino-pretty",
      level,
      options: {
        colorize: true,
        colorizeObjects: false,
        singleLine: true,
        translateTime: "SYS:yyyy-mm-dd HH:MM:ss.l",
        ignore: "pid,hostname,context",
        messageFormat: "{if context}[{context}] {end}{msg}",
      },
    }
  : {
      // LOG_PRETTY=false: 콘솔에도 raw JSON (stdout = fd 1)
      target: "pino/file",
      level,
      options: { destination: 1 },
    };

const fileTarget = {
  target: "pino/file",
  level,
  options: { destination: LOG_FILE_PATH, mkdir: true }, // mkdir:true → logs 폴더 자동 생성
};

const logTcpHost: string | undefined = process.env.LOG_TCP_HOST;
const logTcpPort: number = Number(process.env.LOG_TCP_PORT);

// LLM 선판단 파이프라인(TCP socket → Kafka)으로는 '의도적 신호'(INFO+)만 보낸다.
// per-file DEBUG 같은 기계적 로그는 console·file 채널엔 남기되 LLM 컨텍스트에선
// 제외해, 대량 적재가 LLM 입력을 폭주시키는 일을 원천 차단한다.
const llmPipelineLevel: string = process.env.LOG_LLM_LEVEL ?? "info";

const socketTarget = {
  target: "pino-socket",
  level: llmPipelineLevel,
  options: {
    address: logTcpHost,
    port: logTcpPort,
    mode: "tcp",
    reconnect: true,
  },
};

const basePinoHttpOptions: Options = {
  level,
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
  transport: {
    targets: [consoleTarget, fileTarget, socketTarget],
  },
};

@Global()
@Module({
  imports: [LoggerModule.forRoot({ pinoHttp: basePinoHttpOptions })],
  exports: [LoggerModule],
})
export class AppLoggerModule {}

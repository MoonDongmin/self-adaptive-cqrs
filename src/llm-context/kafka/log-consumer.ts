import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { Consumer, EachBatchPayload, Kafka } from "kafkajs";
import { PinoLogger } from "nestjs-pino";
import { LOG_CONSUMER_CONFIG } from "@/llm-context/kafka/log-consumer.config";
import {
  LogBatchRecord,
  logBatchRecordSchema,
} from "@/llm-context/llm-context.type";

@Injectable()
export class LogConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly kafka: Kafka;
  private readonly consumer: Consumer;
  private readonly buffer: LogBatchRecord[] = [];

  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(LogConsumer.name);

    const brokers: string[] = (process.env.KAFKA_BROKERS ?? "")
      .split(",")
      .map((broker) => broker.trim())
      .filter((broker) => broker.length > 0);

    this.kafka = new Kafka({ clientId: "llm-context", brokers });
    this.consumer = this.kafka.consumer({
      groupId: LOG_CONSUMER_CONFIG.groupId,
    });
  }

  async onModuleInit(): Promise<void> {
    await this.consumer.connect();
    await this.consumer.subscribe({
      topic: LOG_CONSUMER_CONFIG.topic,
      fromBeginning: false,
    });

    await this.consumer.run({
      eachBatch: (payload: EachBatchPayload) => this.onBatch(payload),
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.consumer.disconnect();
  }

  private async onBatch({ batch, resolveOffset, heartbeat }: EachBatchPayload) {
    let skipped: number = 0;
    let filtered: number = 0;

    for (const message of batch.messages) {
      resolveOffset(message.offset);

      const value: string | undefined = message.value?.toString();

      if (value === undefined) {
        skipped += 1;
        continue;
      }

      let json: unknown;
      try {
        json = JSON.parse(value);
      } catch {
        skipped += 1;
        continue;
      }

      const parsed = logBatchRecordSchema.safeParse(json);
      if (!parsed.success) {
        skipped += 1;
        continue;
      }

      // 선판단 대상: (1) API 요청 기인 로그(correlationId 보유) 또는
      // (2) 에러 이상 레벨 로그(요청 스코프 밖 백그라운드 장애 포착용).
      // 둘 다 아니면 앱 시작/프레임워크 부트 로그 등으로 보고 버퍼에서 제외한다.
      const correlationId: string | null | undefined =
        parsed.data.correlationId;
      const hasCorrelationId: boolean =
        correlationId !== null &&
        correlationId !== undefined &&
        correlationId.length > 0;
      const isErrorLevel: boolean =
        parsed.data.level >= LOG_CONSUMER_CONFIG.errorLevelThreshold;

      if (!hasCorrelationId && !isErrorLevel) {
        filtered += 1;
        continue;
      }

      this.buffer.push(parsed.data);
    }

    await heartbeat();
  }

  drainOnce(): LogBatchRecord[] {
    const drained: LogBatchRecord[] = this.buffer.splice(
      0,
      LOG_CONSUMER_CONFIG.maxBatchSize,
    );

    return drained.sort((left, right) => left.time - right.time);
  }
}

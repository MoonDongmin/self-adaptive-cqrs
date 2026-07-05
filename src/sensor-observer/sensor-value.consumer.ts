import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Consumer, EachBatchPayload, Kafka } from 'kafkajs';
import { PinoLogger } from 'nestjs-pino';
import { SENSOR_OBSERVER_CONFIG } from '@/projection/kafka/sensor-observer.config';
import { SensorValueMessage, sensorValueMessageSchema } from '@/projection/kafka/sensor-value.message';

// LogConsumer 의 센서 버전. 'sensor-values' 토픽을 구독해 버퍼에 쌓고,
// drainOnce() 가 한 줌(maxObserverBatchSize)씩 꺼낸다.
@Injectable()
export class SensorValueConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly kafka: Kafka;
  private readonly consumer: Consumer;
  private readonly buffer: SensorValueMessage[] = [];

  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(SensorValueConsumer.name);

    const brokers: string[] = (process.env.KAFKA_BROKERS ?? "")
      .split(",")
      .map((broker) => broker.trim())
      .filter((broker) => broker.length > 0);

    this.kafka = new Kafka({ clientId: "sensor-value", brokers });
    this.consumer = this.kafka.consumer({
      groupId: SENSOR_OBSERVER_CONFIG.groupId,
    });
  }

  async onModuleInit(): Promise<void> {
    await this.ensureTopic();

    await this.consumer.connect();
    await this.consumer.subscribe({
      topic: SENSOR_OBSERVER_CONFIG.topic,
      fromBeginning: false,
    });

    await this.consumer.run({
      eachBatch: (payload: EachBatchPayload) => this.onBatch(payload),
    });
  }

  // log-events 와 달리 sensor-values 는 fluent-bit 가 만들어 주지 않는다. 토픽이 없으면
  // subscribe 가 UNKNOWN_TOPIC_OR_PARTITION 으로 크래시하므로 부팅 시 멱등 생성한다.
  // (RF=3 = KAFKA_DEFAULT_REPLICATION_FACTOR, min ISR=2 충족.)
  private async ensureTopic(): Promise<void> {
    const admin = this.kafka.admin();
    await admin.connect();

    try {
      await admin.createTopics({
        topics: [
          {
            topic: SENSOR_OBSERVER_CONFIG.topic,
            numPartitions: 3,
            replicationFactor: 3,
          },
        ],
        waitForLeaders: true,
      });
    } finally {
      await admin.disconnect();
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.consumer.disconnect();
  }

  private async onBatch({ batch, resolveOffset, heartbeat }: EachBatchPayload) {
    for (const message of batch.messages) {
      resolveOffset(message.offset);

      const value: string | undefined = message.value?.toString();

      if (value === undefined) {
        continue;
      }

      let json: unknown;
      try {
        json = JSON.parse(value);
      } catch {
        continue;
      }

      const parsed = sensorValueMessageSchema.safeParse(json);
      if (!parsed.success) {
        continue;
      }

      // 로그 라인과 달리 필드 필터를 두지 않는다 — 모든 투영 행이 후보이고,
      // 이상 여부 게이트는 싼 LLM 관찰자(observeSensorBatch)가 맡는다.
      this.buffer.push(parsed.data);
    }

    await heartbeat();
  }

  drainOnce(): SensorValueMessage[] {
    const drained: SensorValueMessage[] = this.buffer.splice(
      0,
      SENSOR_OBSERVER_CONFIG.maxObserverBatchSize,
    );

    return drained.sort(
      (left, right) => left.globalSequence - right.globalSequence,
    );
  }

  // 관찰(LLM 판정) 실패 시 드레인한 배치를 버퍼 앞에 되돌린다. Kafka 오프셋은 수신
  // 즉시 resolve 되므로, 여기서 되돌리지 않으면 판정 실패 = 메시지 영구 유실이 된다.
  requeueFront(messages: SensorValueMessage[]): void {
    this.buffer.unshift(...messages);
  }
}

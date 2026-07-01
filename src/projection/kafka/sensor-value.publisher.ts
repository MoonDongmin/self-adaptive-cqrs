import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Kafka, Producer } from 'kafkajs';
import { SENSOR_OBSERVER_CONFIG } from '@/projection/kafka/sensor-observer.config';
import { SensorValueMessage } from '@/projection/kafka/sensor-value.message';

export const SENSOR_VALUE_PUBLISHER: unique symbol = Symbol(
  "SENSOR_VALUE_PUBLISHER",
);

export interface SensorValuePublisher {
  publish(messages: SensorValueMessage[]): Promise<void>;
}

// 프로젝션이 커밋 후 투영된 센서 값을 'sensor-values' 토픽으로 흘려보내는 발행기.
// brokers 파싱은 log-consumer.ts 와 동일 규약(KAFKA_BROKERS, 콤마 구분).
@Injectable()
export class KafkaSensorValuePublisher
  implements SensorValuePublisher, OnModuleInit, OnModuleDestroy
{
  private readonly kafka: Kafka;
  private readonly producer: Producer;

  constructor() {
    const brokers: string[] = (process.env.KAFKA_BROKERS ?? "")
      .split(",")
      .map((broker) => broker.trim())
      .filter((broker) => broker.length > 0);

    this.kafka = new Kafka({ clientId: "sensor-value", brokers });
    this.producer = this.kafka.producer();
  }

  async onModuleInit(): Promise<void> {
    await this.producer.connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.producer.disconnect();
  }

  async publish(messages: SensorValueMessage[]): Promise<void> {
    if (messages.length === 0) {
      return;
    }

    // key = streamId → 한 scene 의 attempt 들이 같은 파티션에서 순서 보존.
    await this.producer.send({
      topic: SENSOR_OBSERVER_CONFIG.topic,
      messages: messages.map((message) => ({
        key: message.streamId,
        value: JSON.stringify(message),
      })),
    });
  }
}

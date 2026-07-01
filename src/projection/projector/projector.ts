import { SensorValueMessage } from '@/projection/kafka/sensor-value.message';
import { EventStoreEventRow } from '@/projection/repository/event-store-reader.repository';
import { DrizzleTx } from '@/shared/database/drizzle.provider';

export interface Projector<Insert> {
  readonly name: string;

  map(event: EventStoreEventRow): Insert;

  upsert(tx: DrizzleTx, row: Insert): Promise<void>;

  // 선택: 커밋 후 센서 값 관찰용 메시지로 변환한다. 미구현 프로젝터(예: multimodal)는
  // 발행하지 않으므로 CatchUpRunner 는 프로젝터-불문으로 유지된다.
  toSensorValueMessages?(
    rows: Insert[],
    events: EventStoreEventRow[],
  ): SensorValueMessage[];
}

export type ProjectionResult = {
  projectorName: string;
  fromSeq: number;
  toSeq: number;
  processed: number;
};

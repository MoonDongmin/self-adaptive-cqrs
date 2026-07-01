import { z } from 'zod';

// 프로젝션이 read_grip_result 로 투영한 한 행을 그대로 실어 보내는 Kafka 메시지.
// observedValue 근거가 verbatim 이려면 원시 수치(jsonb 원형)를 손실 없이 담아야 하므로
// pose/robot_tf 등은 unknown 으로 보존한다(any 금지). 소비 측은 JSON.stringify 로
// 근거 텍스트를 만들고, 형태 미상 값을 무타입 인덱싱하지 않는다.
export const sensorValueMessageSchema = z.object({
  sceneKey: z.string(),
  attemptNumber: z.number().int(), // read_grip_result.attemptNum
  streamId: z.string(),
  globalSequence: z.number().int(), // event_store.globalSeq (재투영/복구 앵커)
  occurredAt: z.string(), // ISO 직렬화
  objectName: z.string(),
  gripSucceed: z.number().int(),
  grip2dPose: z.unknown(),
  grip3dPose: z.unknown(),
  robotTf: z.unknown(),
  humanAnnotationGrasp: z.unknown(),
});

export type SensorValueMessage = z.infer<typeof sensorValueMessageSchema>;

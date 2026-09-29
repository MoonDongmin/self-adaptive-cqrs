제시된 자료에 따르면, 스키마 드리프트(`payload.schema.drift`)로 인해 `conveyor_speed`와 `gripper_temperature` 필드가 Event Store 에는 적재되지만 기존 Read Model(`read_grip_result`, `read_multimodal`) 에는 매핑되지 않아 데이터가 유실될 위험이 있습니다.

해결책은 **새로운 Read Model 테이블 `read_sensor_drift_v2` 를 생성**하여 드리프트된 센서 데이터를 격리된 스키마로 영구히 보존하는 것입니다. 기존 v1 자산 (`read_grip_result`, `read_multimodal`) 은 무손상 상태로 유지됩니다.

요청하신 제약 조건 (Postgres 문법, `read_` 접두어, 스네이크 케이스, PK 유지, v1 무손상) 을 모두 만족하는 SQL 입니다.

```sql
-- 새 Read Model 테이블 생성 (read_sensor_drift_v2)
-- 목적: 스키마 드리프트로 인해 유실될 예정인 센서 데이터 (conveyor_speed, gripper_temperature) 를 격리된 Read Model 로 영구히 보존
CREATE TABLE read_sensor_drift_v2 (
  scene_key varchar NOT NULL,
  attempt_num smallint NOT NULL,
  conveyor_speed double precision,
  gripper_temperature double precision,
  occurred_at timestamptz,
  stream_id varchar,
  global_seq bigint,
  PRIMARY KEY (scene_key, attempt_num)
);
```
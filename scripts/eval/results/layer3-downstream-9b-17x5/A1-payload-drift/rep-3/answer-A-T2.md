제시된 자료에 따르면, `payload.schema.drift` 로그 (level 40) 를 통해 `conveyor_speed` 와 `gripper_temperature` 라는 신규 키가 발견되었으며, 기존 Read Model (`read_grip_result`, `read_multimodal`) 에는 이 필드가 포함되지 않아 투영 시 데이터 유실 경고가 발생했습니다.

해결 방안으로 **새로운 Read Model (`read_sensor_drift_v1`)** 을 생성하는 것이 결정되었습니다. 기존 Read Model (`read_grip_result`, `read_multimodal`) 은 무손상해야 하므로, 새 테이블만 생성하는 DDL SQL 을 작성합니다.

```sql
CREATE TABLE read_sensor_drift_v1 (
  scene_key varchar NOT NULL,
  attempt_num smallint NOT NULL,
  occurred_at timestamptz,
  conveyor_speed double precision,
  gripper_temperature double precision,
  stream_id varchar,
  global_seq bigint,
  PRIMARY KEY (scene_key, attempt_num)
);
```
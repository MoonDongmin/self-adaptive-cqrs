현재 Read Model (`read_grip_result`, `read_multimodal`) 에는 `gripper_temperature` 필드가 정의되어 있지 않으며, 기존 스키마를 수정하면 단일 책임 원칙 위반과 호환성 문제가 발생합니다. 따라서 새로운 Read Model 테이블 `read_grip_environmental_data` 를 생성해야 합니다.

```sql
CREATE TABLE read_grip_environmental_data (
  scene_key VARCHAR NOT NULL,
  attempt_num SMALLINT NOT NULL,
  occurred_at TIMESTAMPTZ,
  conveyor_speed DOUBLE PRECISION,
  gripper_temperature DOUBLE PRECISION,
  stream_id VARCHAR,
  global_seq BIGINT,
  PRIMARY KEY (scene_key, attempt_num)
);
```
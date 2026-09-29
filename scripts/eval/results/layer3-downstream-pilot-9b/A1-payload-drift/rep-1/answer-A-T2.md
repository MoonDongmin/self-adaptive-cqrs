제시된 자료에 따르면, `payload` 에 `conveyor_speed` 와 `gripper_temperature` 라는 신규 키가 유입되었으나, 기존 Read Model (`read_grip_result`, `read_multimodal`) 은 이를 처리하지 못해 데이터 유실이 발생할 가능성이 있습니다.

권고된 대안인 **`newReadModel`** 전략에 따라, 기존 테이블을 건드리지 않고 새로운 Read Model 테이블인 `read_grip_sensor_drift` 를 생성하는 SQL 을 작성합니다.

```sql
CREATE TABLE read_grip_sensor_drift (
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
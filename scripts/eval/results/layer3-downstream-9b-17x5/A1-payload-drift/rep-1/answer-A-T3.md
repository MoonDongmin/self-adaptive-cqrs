제시된 자료에 따르면, `payload` 에 `conveyor_speed` 와 `gripper_temperature` 라는 신규 키가 유입되었으나, 기존 Read Model (`read_grip_result`, `read_multimodal`) 은 이를 처리하지 못해 데이터 유실이 발생했습니다.

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

이제 다음 질문에 답하는 SELECT 문을 작성하라: 적재 시 유실된 신규 키(gripper_temperature, conveyor_speed)의 값을 장면(scene_key)·시도(attempt_num)별로 조회하라.
필요하면 기존 데이터(read_grip_result, read_multimodal, event_store)로 새 테이블을 채우는 백필 SQL 을 먼저 작성하고,
질문에 답하는 SELECT 문은 반드시 마지막 ```sql 블록에 단독으로 작성하라.

```sql
SELECT 
  rds.scene_key,
  rds.attempt_num,
  rds.conveyor_speed,
  rds.gripper_temperature
FROM read_grip_sensor_drift rds
WHERE rds.conveyor_speed IS NOT NULL 
  OR rds.gripper_temperature IS NOT NULL
ORDER BY rds.scene_key, rds.attempt_num;
```
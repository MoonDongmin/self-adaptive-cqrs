제시된 자료에 따르면, `payload` 에 `conveyor_speed` 와 `gripper_temperature` 라는 신규 키가 유입되어 기존 Read Model(`read_grip_result`) 에는 없는 필드가 투영 과정에서 유실되고 있습니다. 이를 해결하기 위해 새로운 Read Model(`read_environmental_context_v2`) 을 생성해야 하며, 기존 v1 자산은 무손상 유지해야 합니다.

따라서 실행해야 할 SQL 은 새 Read Model 테이블을 생성하는 DDL 입니다.

```sql
CREATE TABLE read_environmental_context_v2 (
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
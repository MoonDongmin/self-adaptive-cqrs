사용자의 요청인 "최근 적재 데이터에 gripper_temperature 필드가 들어오기 시작했다. 이 값을 시간대별로 조회하고 싶다"는 기존 `read_grip_result` Read Model 의 스키마에 `gripper_temperature` 필드가 존재하지 않으므로 **실행할 수 없습니다**.

자료에 따르면 `payload.schema.drift` 로 인해 `gripper_temperature` 필드가 유실되었으며, 이를 해결하기 위해 **새로운 Read Model 테이블 `read_grip_result_v2` 를 생성**해야 합니다.

다음은 `read_grip_result_v2` 테이블을 생성하는 SQL 입니다.

```sql
CREATE TABLE read_grip_result_v2 (
  scene_key varchar NOT NULL,
  attempt_num smallint NOT NULL,
  object_name varchar,
  grip_succeed smallint,
  gripper_type varchar(16),
  occurred_at timestamptz,
  grip_2d_pose jsonb,
  grip_3d_pose jsonb,
  robot_tf jsonb,
  human_annotation_grasp jsonb,
  stream_id varchar,
  global_seq bigint,
  conveyor_speed double precision,
  gripper_temperature double precision,
  PRIMARY KEY (scene_key, attempt_num)
);
```
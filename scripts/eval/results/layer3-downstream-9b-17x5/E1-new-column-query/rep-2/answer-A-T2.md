사용자의 요청인 '최근 적재 데이터에 gripper_temperature 필드가 들어오기 시작했다. 이 값을 시간대별로 조회하고 싶다'는 기존 Read Model (`read_grip_result`, `read_multimodal`) 에는 포함되지 않은 필드이므로, 현재 상태로 조회가 불가능합니다.

제공된 자료에 따르면, 신규 필드 `gripper_temperature` 와 `conveyor_speed` 는 스키마 드리프트 (`payload.schema.drift`) 로 인해 기존 DTO 에 등록되지 않아 적재 시 유실되고 있습니다. 이를 해결하기 위해 **새로운 Read Model (`read_sensor_drift`)** 을 생성하여 센서 드리프트 데이터를 격리하고, 이를 통해 시간대별 조회를 가능하게 해야 합니다.

기존 Read Model (`read_grip_result`, `read_multimodal`) 은 변경하지 않고, 새로운 테이블 `read_sensor_drift` 만 생성하는 SQL 입니다.

```sql
CREATE TABLE read_sensor_drift (
  scene_key varchar NOT NULL,
  attempt_num smallint NOT NULL,
  occurred_at timestamptz,
  gripper_temperature double precision,
  conveyor_speed double precision,
  PRIMARY KEY (scene_key, attempt_num)
);
```
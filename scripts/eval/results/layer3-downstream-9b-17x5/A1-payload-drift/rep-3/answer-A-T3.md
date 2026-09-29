제시된 자료에 따르면, `read_sensor_drift_v1` 테이블은 아직 생성되지 않은 상태이며, 기존 Read Model (`read_grip_result`, `read_multimodal`) 에는 `conveyor_speed` 와 `gripper_temperature` 필드가 포함되어 있지 않습니다. 따라서 기존 테이블에서 값을 조회하여 새 테이블을 채우는 백필 (backfill) SQL 은 작성할 수 없으며, 질문의 전제 조건인 "적재 시 유실된 신규 키의 값을 장면·시도별로 조회"하는 SELECT 문은 실행할 수 없습니다.

자료에 명시된 해결 방안은 **새로운 Read Model (`read_sensor_drift_v1`) 을 생성**하는 것이며, 해당 테이블이 생성된 후만 `conveyor_speed` 와 `gripper_temperature` 값을 조회할 수 있습니다.

만약 `read_sensor_drift_v1` 테이블이 생성된 후, 해당 테이블에 저장된 데이터를 조회하는 SQL 은 다음과 같습니다.

```sql
SELECT 
  scene_key, 
  attempt_num, 
  occurred_at, 
  conveyor_speed, 
  gripper_temperature, 
  stream_id, 
  global_seq
FROM 
  read_sensor_drift_v1
WHERE 
  1=1;
```

**주의:** 현재 시점에서는 `read_sensor_drift_v1` 테이블이 존재하지 않으므로 위 SQL 을 실행하면 `relation "read_sensor_drift_v1" does not exist` 오류가 발생합니다.
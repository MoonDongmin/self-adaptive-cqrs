제시된 자료에 따르면, `read_sensor_drift_v2` 테이블은 아직 생성되지 않은 상태이며, `conveyor_speed`와 `gripper_temperature` 필드는 기존 Read Model(`read_grip_result`, `read_multimodal`) 에 존재하지 않아 데이터가 유실될 위험이 있습니다.

따라서 먼저 Event Store 에서 적재된 원본 데이터 (Toy-Data) 를 기반으로 새 테이블 `read_sensor_drift_v2` 를 백필 (백업 채우기) 하는 SQL 을 작성한 후, 요청하신 대로 해당 필드 값을 조회하는 SELECT 문을 작성합니다.

### 1. 백필 SQL (백업 채우기)

Event Store 의 `GripAttemptRecorded` 이벤트에서 `conveyor_speed` 와 `gripper_temperature` 필드를 추출하여 새 테이블 `read_sensor_drift_v2` 에 삽입합니다. 기존 Read Model 테이블은 건드리지 않습니다.

```sql
-- Event Store 에서의 원본 데이터 (payload) 를 기반으로 새 Read Model 테이블 백필
-- 참고: 실제 운영 환경에서는 Projection Service 로 자동 매핑되나, 백업 시나리오로 직접 쿼리
INSERT INTO read_sensor_drift_v2 (
  scene_key, 
  attempt_num, 
  conveyor_speed, 
  gripper_temperature, 
  occurred_at, 
  stream_id, 
  global_seq
)
SELECT 
  -- stream_id 에서 'grip-attempt:' 접두사를 제거하여 scene_key 도출
  SUBSTRING(stream_id, LENGTH('grip-attempt:') + 1) AS scene_key,
  -- 파일명 또는 stream_id 에서 시도 번호 추출 (예: _01_, _02_ 등)
  -- 자료의 stream_id 예시: 'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00001'
  -- 시도 번호는 stream_id 의 마지막 숫자 부분에서 추출 (정규식 사용 권장)
  CAST(SUBSTRING(stream_id, LENGTH('grip-attempt:') + LENGTH('반려동물용품_CR01_강아지공룡알장난감_') + 1) AS smallint) AS attempt_num,
  -- payload 의 conveyor_speed 필드 직접 추출
  payload_data.conveyor_speed AS conveyor_speed,
  -- payload 의 gripper_temperature 필드 직접 추출
  payload_data.gripper_temperature AS gripper_temperature,
  -- occurred_at 은 이미 Event Store 에 저장된 필드 그대로 사용
  occurred_at AS occurred_at,
  -- stream_id 는 원본 그대로 유지
  stream_id AS stream_id,
  -- global_seq 는 원본 그대로 유지
  global_seq AS global_seq
FROM event_store.grip_attempt_recorded
WHERE payload_data.conveyor_speed IS NOT NULL 
  OR payload_data.gripper_temperature IS NOT NULL;
```

*참고: 위 SQL 은 `event_store` 테이블이 존재한다고 가정하고 작성되었습니다. 만약 `event_store` 가 아닌 별도의 JSONB 컬럼이나 별도 테이블에 저장되어 있다면, 해당 경로로 `payload_data` 를 추출하는 쿼리가 필요합니다. 자료의 `payload.schema.drift` 로그에 `newKeys={"conveyor_speed": "1.2", "gripper_temperature": "36.5"}` 가 명시되어 있으므로, 해당 필드가 있는 이벤트만 필터링하여 삽입하는 것이 안전합니다.

### 2. 조회 SQL (질문 답변)

적재 시 유실된 신규 키 (`gripper_temperature`, `conveyor_speed`) 의 값을 장면 (`scene_key`) 과 시도 (`attempt_num`) 별로 조회합니다.

```sql
SELECT 
  scene_key,
  attempt_num,
  conveyor_speed,
  gripper_temperature
FROM read_sensor_drift_v2
ORDER BY 
  scene_key ASC,
  attempt_num ASC;
```
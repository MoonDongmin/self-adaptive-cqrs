제공된 로그와 스키마 정보를 분석한 결과, `payload.schema.drift` 로그는 이벤트 스토어에 새로운 키 (`conveyor_speed`, `gripper_temperature`) 가 포함되었음을 나타냅니다. 그러나 현재 `read_grip_result` 테이블에는 해당 필드가 정의되어 있지 않으므로, 이 데이터는 Read Model 로 복원되지 않습니다.

이 문제를 해결하기 위해 먼저 백필 (Backfill) SQL 을 작성하여 이벤트 스토어에 저장된 새 필드를 임시 테이블에 로드한 후, 이를 `read_grip_result` 테이블에 병합하고, 마지막으로 질문의 요구사항에 따라 해당 필드를 조회하는 SELECT 문을 작성합니다.

### 1. 백필 SQL (임시 테이블 생성 및 데이터 로드)

이 SQL 은 이벤트 스토어 (ES) 에 저장된 이벤트에서 `conveyor_speed` 와 `gripper_temperature` 필드를 추출하여 임시 테이블 `temp_drift_data` 에 로드합니다. 이후 이 데이터를 `read_grip_result` 테이블에 병합하는 UPDATE 문이 실행되어야 합니다.

```sql
-- 1. 임시 테이블 생성: 이벤트 스토어에서 schema drift 관련 필드 추출
CREATE TEMPORARY TABLE temp_drift_data (
    stream_id varchar,
    global_seq bigint,
    conveyor_speed numeric(10, 3),
    gripper_temperature numeric(10, 2)
);

-- 2. 이벤트 스토어에서 해당 필드를 가진 이벤트 조회 및 임시 테이블에 로드
-- 가정: event_store 테이블에 events(stream_id, global_seq, payload_json) 가 존재한다고 가정
-- 실제 구현 시는 ES 에서 JSON 을 파싱하거나 별도 테이블 구조에 따라 쿼리가 달라질 수 있으나,
-- 주어진 로그와 스키마 맥락에서 필요한 데이터 추출 로직을 SQL 로 표현합니다.
-- payload_json 에서 'conveyor_speed' 와 'gripper_temperature' 키를 추출합니다.
INSERT INTO temp_drift_data (stream_id, global_seq, conveyor_speed, gripper_temperature)
SELECT 
    e.stream_id,
    e.global_seq,
    CASE 
        WHEN e.payload_json::jsonb ? 'conveyor_speed' THEN e.payload_json->>'conveyor_speed'::numeric
        ELSE NULL 
    END as conveyor_speed,
    CASE 
        WHEN e.payload_json::jsonb ? 'gripper_temperature' THEN e.payload_json->>'gripper_temperature'::numeric
        ELSE NULL 
    END as gripper_temperature
FROM event_store e
WHERE e.action = 'insert'
  AND e.payload_json::jsonb ? 'conveyor_speed'
  AND e.payload_json::jsonb ? 'gripper_temperature'
  AND e.global_seq > 0; -- global_seq 가 정의된 이벤트만 처리

-- 3. 임시 테이블 데이터를 read_grip_result 에 병합 (UPDATE)
-- join 조건: stream_id 와 global_seq 를 통해 매핑
UPDATE read_grip_result r
SET 
    conveyor_speed = COALESCE(t.conveyor_speed, r.conveyor_speed),
    gripper_temperature = COALESCE(t.gripper_temperature, r.gripper_temperature)
FROM temp_drift_data t
WHERE r.stream_id = t.stream_id
  AND r.global_seq = t.global_seq;

-- 4. 임시 테이블 정리
DROP TABLE temp_drift_data;
```

### 2. 질문 답변 SELECT 문

적재 시 유실된 신규 키 (`gripper_temperature`, `conveyor_speed`) 의 값을 장면 (`scene_key`) 과 시도 (`attempt_num`) 별로 조회하는 SQL 입니다.

```sql
SELECT 
    r.scene_key,
    r.attempt_num,
    r.conveyor_speed,
    r.gripper_temperature
FROM read_grip_result r
WHERE r.conveyor_speed IS NOT NULL 
   OR r.gripper_temperature IS NOT NULL;
```
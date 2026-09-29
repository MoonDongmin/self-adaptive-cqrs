제공된 로그와 스키마 정보를 분석한 결과, `payload.schema.drift` 로그는 이벤트 스토어에 `conveyor_speed` 및 `gripper_temperature` 키가 포함되었음을 나타냅니다. 그러나 제공된 `read_grip_result` 및 `read_multimodal` 스키마에는 해당 필드가 정의되어 있지 않아, 기존 Read Model 테이블에는 이 데이터가 저장되지 않았습니다.

따라서 먼저 이벤트 스토어 (event_store) 에서 해당 필드를 추출하여 임시 테이블에 로드한 후, `read_grip_result` 테이블에 해당 필드를 추가하고, 기존 Read Model 데이터와 합쳐서 최종 결과를 조회하는 SQL 을 작성합니다.

```sql
-- 1. 이벤트 스토어에서 schema drift 필드 추출 및 임시 테이블 생성
CREATE TEMPORARY TABLE temp_schema_drift_data AS
SELECT
    stream_id,
    global_seq,
    attempt,
    -- stream_id 에서 'grip-attempt:' 접두사를 제거하여 scene_key 추출
    SUBSTRING(stream_id FROM POSITION('grip-attempt:') + 11) AS scene_key,
    -- attempt 컬럼 그대로 사용
    attempt AS attempt_num,
    -- detail 컬럼에서 newKeys 추출 (JSONB 로 변환 필요 시 처리, 여기서는 텍스트로 가정)
    -- 실제 구현 시는 JSONB_TO_RECORDS 또는 JSONB_PATH_GET 등을 사용하여 값 추출
    -- 예시: newKeys={"conveyor_speed": "1.2", "gripper_temperature": "36.5"}
    -- detail 문자열에서 "conveyor_speed" 값 추출
    CASE 
        WHEN detail LIKE '%"conveyor_speed": "%' THEN 
            SUBSTRING(detail FROM POSITION('"conveyor_speed": "') + 18)
        ELSE NULL 
    END AS conveyor_speed,
    CASE 
        WHEN detail LIKE '%"gripper_temperature": "%' THEN 
            SUBSTRING(detail FROM POSITION('"gripper_temperature": "') + 23)
        ELSE NULL 
    END AS gripper_temperature
FROM event_store
WHERE action = 'insert.file.ok'
  AND detail LIKE '%newKeys=%'
  AND detail LIKE '%conveyor_speed%'
  AND detail LIKE '%gripper_temperature%';

-- 2. read_grip_result 테이블에 누락된 필드 추가 (DDL)
ALTER TABLE read_grip_result 
ADD COLUMN conveyor_speed text,
ADD COLUMN gripper_temperature text;

-- 3. 백필: 임시 테이블의 데이터를 read_grip_result 에 병합
-- read_grip_result 의 (scene_key, attempt_num) 키로 합치되, 
-- 임시 테이블의 값이 NULL 이 아니면 덮어쓰거나 업데이트하는 로직 필요
-- 여기서는 INSERT ... ON CONFLICT DO UPDATE 를 사용하여 최신 데이터로 업데이트
INSERT INTO read_grip_result (scene_key, attempt_num, conveyor_speed, gripper_temperature)
SELECT 
    scene_key, 
    attempt_num, 
    conveyor_speed, 
    gripper_temperature
FROM temp_schema_drift_data
ON CONFLICT (scene_key, attempt_num) DO UPDATE SET
    conveyor_speed = EXCLUDED.conveyor_speed,
    gripper_temperature = EXCLUDED.gripper_temperature;

-- 4. 질문 답변: 적재 시 유실된 신규 키의 값을 장면·시도별로 조회
SELECT 
    r.scene_key,
    r.attempt_num,
    r.conveyor_speed,
    r.gripper_temperature
FROM read_grip_result r
WHERE r.conveyor_speed IS NOT NULL 
   OR r.gripper_temperature IS NOT NULL
ORDER BY r.scene_key, r.attempt_num;
```
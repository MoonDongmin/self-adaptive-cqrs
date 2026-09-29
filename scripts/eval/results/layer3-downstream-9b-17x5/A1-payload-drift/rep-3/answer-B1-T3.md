제공된 로그와 스키마 정보를 분석한 결과, `payload.schema.drift` 로그는 이벤트 스토어에 `conveyor_speed` 와 `gripper_temperature` 키가 포함되었음을 나타냅니다. 그러나 Read Model (`read_grip_result`, `read_multimodal`) 에는 해당 필드가 정의되어 있지 않으며, CQRS 패턴 하에서 이벤트가 적재될 때 스키마 불일치로 인해 해당 필드가 Read Model 에는 저장되지 않았을 가능성이 높습니다.

따라서 먼저 Event Store 에는 존재하지만 Read Model 에는 없는 필드 값을 추출하기 위해, Event Store 에서 해당 필드를 필터링하여 임시 뷰를 생성하고, 이를 `read_grip_result` 와 `read_multimodal` 테이블의 `scene_key` 와 `attempt_num` 과 조인하여 유실된 값을 조회하는 SQL 을 작성합니다.

```sql
-- 1. 백필: Event Store 에서 schema drift 로 인해 Read Model 에 유실될 가능성이 있는 필드 (conveyor_speed, gripper_temperature) 를 추출
--    이 쿼리는 Event Store 의 최신 이벤트 (global_seq=1) 에서 해당 필드가 존재하는지 확인하고, 
--    만약 존재한다면 해당 필드의 값을 추출하여 임시 결과로 사용합니다.
WITH event_drift_data AS (
    SELECT 
        stream_id,
        global_seq,
        payload::jsonb AS event_payload
    FROM "events"
    WHERE stream_id = 'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00001'
      AND global_seq = 1
      AND (payload ? 'conveyor_speed' OR payload ? 'gripper_temperature')
),
--    유실된 필드 값을 scene_key 와 attempt_num 으로 매핑합니다.
--    stream_id 에서 'grip-attempt:' 를 제거하여 scene_key 를 추출하고, payload 의 key 가 attempt_num 입니다.
extracted_drift AS (
    SELECT 
        SUBSTRING(e.stream_id, 12) AS scene_key, -- 'grip-attempt:' (12 자) 를 제거
        (e.payload ? 'conveyor_speed')::boolean AS has_conveyor_speed,
        (e.payload ? 'gripper_temperature')::boolean AS has_gripper_temperature,
        e.payload::jsonb AS full_payload
    FROM event_drift_data e
)
SELECT 
    scene_key,
    attempt_num,
    -- 유실된 필드의 실제 값 (Event Store 에서)
    COALESCE(
        (full_payload->'conveyor_speed')::text,
        (full_payload->'gripper_temperature')::text
    ) AS lost_value
FROM extracted_drift;

-- 2. 질문 답변: 유실된 신규 키의 값을 장면·시도별로 조회
--    위 백필 결과와 Read Model 을 조인하여, Event Store 에는 있지만 Read Model 에 없는 필드의 값을 조회합니다.
SELECT 
    COALESCE(e.scene_key, r.scene_key) AS scene_key,
    COALESCE(e.attempt_num, r.attempt_num) AS attempt_num,
    -- conveyor_speed 값 조회 (Event Store 에서, Read Model 에 없으면 NULL)
    COALESCE(
        (e.event_payload->'conveyor_speed')::text,
        (r.payload->'conveyor_speed')::text
    ) AS conveyor_speed,
    -- gripper_temperature 값 조회 (Event Store 에서, Read Model 에 없으면 NULL)
    COALESCE(
        (e.event_payload->'gripper_temperature')::text,
        (r.payload->'gripper_temperature')::text
    ) AS gripper_temperature
FROM 
    (SELECT scene_key, attempt_num, payload::jsonb AS event_payload FROM "events" WHERE stream_id = 'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00001' ORDER BY global_seq DESC LIMIT 1) e
FULL OUTER JOIN 
    read_grip_result r
    ON e.scene_key = r.scene_key 
    AND e.attempt_num = r.attempt_num
WHERE 
    -- Event Store 에는 필드가 존재하고, Read Model 에는 존재하지 않는 경우 (유실된 경우)
    (
        (e.event_payload ? 'conveyor_speed' AND NOT r.payload ? 'conveyor_speed')
        OR
        (e.event_payload ? 'gripper_temperature' AND NOT r.payload ? 'gripper_temperature')
    )
ORDER BY 
    scene_key, attempt_num;
```
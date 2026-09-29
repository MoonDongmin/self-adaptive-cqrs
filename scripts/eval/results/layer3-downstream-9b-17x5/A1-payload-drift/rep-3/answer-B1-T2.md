제공된 로그와 스키마 정보를 분석한 결과, `payload.schema.drift` 로그가 발생하여 이벤트 스토어에는 새로운 키 (`conveyor_speed`, `gripper_temperature`) 가 포함되었으나, Read Model (`read_grip_result`, `read_multimodal`) 에는 해당 필드가 정의되어 있지 않습니다.

이로 인해 CQRS 패턴 하에서 **Event Store 와 Read Model 간의 상태 불일치 (Data Inconsistency)** 가 발생했습니다. 이미 적재된 이벤트 (예: `global_seq: 1`) 에는 새 키가 포함되었을 가능성이 높으므로, 해당 시퀀스를 기준으로 Read Model 을 조회하여 불일치를 확인하는 SQL 을 작성합니다.

새 Read Model 테이블 생성은 기존 테이블 변경 금지 규칙에 위배되므로 수행하지 않습니다.

```sql
-- Read Model 과 Event Store 의 상태 불일치 확인 (Schema Drift 검증)
-- 조건: Event Store 에는 'conveyor_speed' 또는 'gripper_temperature' 키가 존재하는 이벤트가 있으나, 
--      Read Model 에는 해당 키가 존재하지 않는 경우 (또는 필드 값이 null 이며, schema drift 로 인해 유실된 경우)
-- 참고: 로그에 따르면 global_seq=1 의 이벤트에 schema drift 가 발생했으므로 해당 시퀀스를 기준으로 조회합니다.

SELECT 
    r.scene_key,
    r.attempt_num,
    r.global_seq,
    r.grip_succeed,
    r.occurred_at,
    e.payload::jsonb AS event_payload,
    CASE 
        WHEN e.payload ? 'conveyor_speed' THEN 'conveyor_speed'
        WHEN e.payload ? 'gripper_temperature' THEN 'gripper_temperature'
        ELSE 'none'
    END AS drift_key_detected,
    CASE 
        WHEN e.payload ? 'conveyor_speed' AND NOT r.payload ? 'conveyor_speed' THEN 'missing_in_read_model'
        WHEN e.payload ? 'gripper_temperature' AND NOT r.payload ? 'gripper_temperature' THEN 'missing_in_read_model'
        ELSE 'consistent'
    END AS consistency_status
FROM 
    read_grip_result r
JOIN 
    (SELECT global_seq, payload FROM "events" WHERE stream_id = 'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00001' ORDER BY global_seq DESC LIMIT 1) e
ON 
    r.global_seq = e.global_seq
WHERE 
    r.global_seq = 1
    AND (
        (e.payload ? 'conveyor_speed' AND NOT r.payload ? 'conveyor_speed')
        OR (e.payload ? 'gripper_temperature' AND NOT r.payload ? 'gripper_temperature')
    );
```
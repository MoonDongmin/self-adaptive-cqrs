제공된 로그와 스키마 정보를 분석한 결과, **새로운 Read Model 테이블이 필요하지 않습니다.**

**이유:**
1.  **로그 분석:** `payload.schema.drift` 로그가 발생했습니다. 이는 이벤트 스토어에 `conveyor_speed`와 `gripper_temperature`라는 **새로운 키 (New Keys)** 가 포함된 이벤트가 들어왔음을 의미합니다.
2.  **영향도 분석:**
    *   **`read_grip_result` 테이블:** 스키마 정의에 따르면, 이 테이블은 `payload.objects[0].class_name` (객체명) 과 파지 관련 데이터 (Pose, Gripper 등) 를 저장합니다. 새로 유입된 키는 `conveyor_speed` 와 `gripper_temperature` 로, 객체 정보나 파지 결과와 직접적인 연관이 없으며, 스키마 드리프트로 인해 적재 시 유실될 가능성이 높습니다. 따라서 `read_grip_result` 테이블의 구조나 데이터 무결성에 직접적인 영향을 주지 않습니다.
    *   **`read_multimodal` 테이블:** 이 테이블은 2D 이미지 및 비디오 파일명/URI 를 저장합니다. 새로 유입된 키는 파일 경로 정보와 무관합니다.
3.  **결론:** 기존 Read Model 테이블 (`read_grip_result`, `read_multimodal`) 은 새로운 스키마 키를 저장할 필드를 가지고 있지 않으며, 해당 키는 현재 비즈니스 로직 (파지 결과, 미디어 링크) 과 무관하므로 별도의 테이블 생성이나 기존 테이블 수정은 불필요합니다.

따라서, **검증용 SQL**을 작성하여 현재 시스템이 예상대로 동작하고 있는지 (새로운 키가 Read Model 에 반영되지 않았는지 확인) 확인하는 쿼리를 제공합니다.

```sql
-- [검증 SQL] schema drift 발생 시, 해당 키가 Read Model 에 저장되었는지 확인
-- 예상 결과: 0 행 (새로운 키가 아직 Read Model 에 저장되지 않았음을 의미)
SELECT 
    COUNT(*) as new_key_count,
    array_agg(key_name) as missing_keys
FROM (
    SELECT 'conveyor_speed' as key_name
    UNION ALL
    SELECT 'gripper_temperature' as key_name
) as expected_keys
LEFT JOIN (
    -- read_grip_result 에서 존재하는 키 확인 (payload.objects 관련 키만 해당)
    SELECT DISTINCT 
        CASE 
            WHEN column_name IN ('object_name', 'gripper_type', 'occurred_at', 'stream_id', 'global_seq') THEN column_name
            ELSE NULL 
        END as key_name
    FROM information_schema.columns 
    WHERE table_name = 'read_grip_result'
    UNION
    -- read_multimodal 에서 존재하는 키 확인 (파일명/URI 관련 키만 해당)
    SELECT DISTINCT 
        CASE 
            WHEN column_name IN ('image_2d_file_name', 'image_2d_uri', 'video_file_name', 'video_uri', 'occurred_at', 'stream_id', 'global_seq') THEN column_name
            ELSE NULL 
        END as key_name
    FROM information_schema.columns 
    WHERE table_name = 'read_multimodal'
) as existing_keys
ON TRUE
WHERE expected_keys.key_name IS NOT NULL
  AND existing_keys.key_name IS NULL;
```

**추가 조치 사항 (SQL 실행 후):**
1.  **Schema Drift 처리:** `payload.schema.drift` 로그에 따르면, 새로운 키 (`conveyor_speed`, `gripper_temperature`) 가 유입되었으나 Read Model 에 저장되지 않았습니다. 이는 Event Store 에는 들어왔으나, Projection 로직 (Projector) 이 이 새로운 키를 처리하는 필드를 가진 Read Model 을 찾지 못했거나, 스키마 검증 로직에서 이를 무시하고 필터링했을 가능성이 높습니다.
2.  **Action:**
    *   **단기:** Projection 로직 (Projector 코드) 을 수정하여, 이벤트 스토어에서 읽은 이벤트의 `payload` 에 존재하는 모든 키를 확인하고, 기존 Read Model 스키마에 없는 키는 **무시 (Ignore)** 하거나, **새로운 Read Model 을 생성**하도록 로직을 변경해야 합니다.
    *   **장기:** Read Model 스키마를 `conveyor_speed` 와 `gripper_temperature` 필드를 포함하도록 확장하고, Projection 을 재시작하여 데이터를 동기화해야 합니다.

**만약 새로운 Read Model 이 필요하다면 (DDL 예시):**
만약 `conveyor_speed` 와 `gripper_temperature` 를 영구적으로 저장해야 한다면, `read_sensor_status` 또는 `read_environment` 같은 새 테이블을 생성해야 합니다. 하지만 현재 상황 (파지/미디어 관련 로그) 에서는 필수가 아닙니다.

```sql
-- [선택 사항] 만약 conveyor_speed 와 gripper_temperature 를 영구적으로 저장해야 한다면
-- 테이블명: read_environment_status (접두사 read_ 사용, snake_case)
CREATE TABLE IF NOT EXISTS read_environment_status (
    scene_key VARCHAR PRIMARY KEY,
    attempt_num SMALLINT,
    occurred_at TIMESTAMPTZ,
    conveyor_speed NUMERIC,
    gripper_temperature NUMERIC,
    stream_id VARCHAR,
    global_seq BIGINT
);
```

**주의:** 위 CREATE TABLE 쿼리는 **필수 실행 사항이 아닙니다**. 현재 시스템의 정상적인 동작 (기존 Read Model 만 사용) 을 가정하고 검증 SQL 을 우선적으로 제공했습니다.
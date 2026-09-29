제공된 자료와 CQRS 아키텍처 원칙에 따라, 먼저 `read_gripper_temperature` 테이블을 백필 (백업 데이터로 초기화) 하는 SQL 을 작성하고, 그 다음에 요청된 조회 쿼리를 작성합니다.

### 1. 백필 SQL (백업 데이터로 새 Read Model 채우기)

기존 Read Model (`read_grip_result`) 에는 `gripper_temperature` 필드가 없으므로, 이벤트 스토어 (Event Store) 에 저장된 원본 데이터에서 해당 필드를 추출하여 새 테이블 `read_gripper_temperature` 에 삽입해야 합니다.

*   **추출 로직**: `stream_id` 는 `grip-attempt:scene_key` 형식입니다. `occurred_at` 은 `stream_id` 에서 `scene_key` 를 추출한 후, 파일명 (`stream_id` 에 포함된 파일명 부분) 에서 날짜를 파싱하거나, `read_grip_result` 테이블의 `occurred_at` 을 참조하여 매핑합니다. `gripper_temperature` 는 이벤트 페이로드의 `payload.gripper_temperature` 값을 추출합니다.
*   **주의**: 제공된 로그에는 실제 `gripper_temperature` 값을 가진 이벤트 (예: `{"gripper_temperature": "36.5"}`) 가 명시적으로 나와있지는 않지만, `payload.schema.drift` 로그에서 `newKeys` 에 `gripper_temperature` 가 포함되어 있고, `insert.file.ok` 로그에서 파일명이 `..._01_20230923.json` 형식임을 알 수 있습니다. 따라서 실제 데이터가 있다면 `payload` 객체에서 값을 가져와야 합니다. 여기서는 `read_grip_result` 테이블의 `occurred_at` 을 기준으로 시간대를 매핑하고, `stream_id` 를 기준으로 `gripper_temperature` 값을 가져오는 가상의 INSERT 문법을 보여줍니다. (실제 구현 시에는 이벤트 스토어에서 `gripper_temperature` 필드가 있는 이벤트만 필터링하여 INSERT 합니다.)

```sql
-- 백필 SQL: 이벤트 스토어에서 gripper_temperature 필드가 포함된 이벤트를 추출하여 새 Read Model 채우기
-- 가정: 이벤트 스토어에 'grip-attempt' 스트림이 존재하며, 해당 스트림의 이벤트 중 payload.gripper_temperature 가 있는 것만 추출
-- 참고: occurred_at 은 stream_id 에서 파생된 scene_key 를 기반으로 read_grip_result 테이블의 occurred_at 을 참조하거나, stream_id 에 포함된 파일명 날짜를 파싱하여 계산
INSERT INTO read_gripper_temperature (stream_id, occurred_at, gripper_temperature)
SELECT 
    e.stream_id,
    -- stream_id 가 'grip-attempt:scene_key' 형식이므로, scene_key 를 추출하여 read_grip_result 에서 occurred_at 을 가져옴
    -- 만약 read_grip_result 가 해당 stream_id 에 존재하지 않는다면, stream_id 에서 파생된 날짜를 직접 계산해야 함 (예: substring 파싱)
    -- 여기서는 read_grip_result 가 존재한다고 가정하고 JOIN 을 사용하거나, stream_id 에서 직접 파싱하는 로직을 적용
    -- 단순화를 위해 stream_id 에서 날짜를 직접 파싱하는 예시 (실제 구현 시에는 read_grip_result JOIN 이 더 안전함)
    -- 예: stream_id 가 'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00018' 이고, 파일명이 '반려동물용품_CR01_강아지공룡알장난감_00018_01_20230923.json' 이라면
    -- occurred_at 은 '2023-09-23T00:00:00Z' 로 설정
    -- SQL 은 이벤트 스토어에 직접 접근하므로, payload.gripper_temperature 가 있는 이벤트만 필터링
    -- occurred_at 계산은 stream_id 의 파일명 부분에서 추출 (예: regexp_split_to_table 또는 substring)
    -- 여기서는 가상의 파싱 로직을 포함하여 INSERT 합니다.
    -- 실제 운영 시에는 read_grip_result 테이블과 JOIN 하여 occurred_at 을 가져오는 것이 좋습니다.
    COALESCE(
        (SELECT occurred_at FROM read_grip_result WHERE read_grip_result.stream_id = e.stream_id LIMIT 1),
        -- fallback: stream_id 에서 파싱 (예시: 'grip-attempt:scene_key' -> scene_key -> 파일명 -> 날짜)
        -- 실제 구현 시에는 파일명 파싱 로직이 필요함. 여기서는 read_grip_result JOIN 을 우선시하거나, stream_id 에서 직접 파싱하는 SQL 을 작성합니다.
        -- stream_id 에서 날짜 파싱 예시:
        -- EXTRACT(EPOCH FROM ('2023-09-23'::date)) + ... (복잡함)
        -- 간단히: stream_id 에서 '20230923' 부분을 추출하여 timestamptz 로 변환
        -- 예: '20230923' -> '2023-09-23T00:00:00Z'
        -- 여기서는 read_grip_result 와 JOIN 을 사용하여 occurred_at 을 가져오는 안전한 방식을 가정합니다.
        -- 만약 read_grip_result 에 해당 stream_id 가 없다면, stream_id 에서 파싱된 값을 사용해야 합니다.
        -- 이 SQL 은 이벤트 스토어 (e) 와 read_grip_result 를 JOIN 하여 INSERT 합니다.
        (SELECT occurred_at FROM read_grip_result WHERE read_grip_result.stream_id = e.stream_id)
    ),
    -- payload.gripper_temperature 추출 (문자열 또는 숫자 타입에 따라 변환 필요)
    -- 자료에서 newKeys 는 "gripper_temperature": "36.5" 형식 (문자열) 이므로, 숫자로 변환
    CASE 
        WHEN e.payload::jsonb ? 'gripper_temperature' THEN 
            CASE 
                WHEN e.payload::jsonb->>'gripper_temperature' ~ '^\d+$' THEN 
                    e.payload::jsonb->>'gripper_temperature'::numeric
                ELSE 
                    e.payload::jsonb->>'gripper_temperature'::numeric
            END
        ELSE NULL
    END as gripper_temperature
FROM event_store.grip_attempt e
WHERE e.payload::jsonb ? 'gripper_temperature'
  AND e.stream_id NOT IN (SELECT stream_id FROM read_gripper_temperature);
```

### 2. 조회 SQL (시간대별 평균값 조회)

`read_gripper_temperature` 테이블에 데이터가 채워진 후, `occurred_at` 을 시 단위 (hour) 로 그룹화하여 평균을 내는 SELECT 문입니다.

```sql
SELECT 
    DATE_TRUNC('hour', occurred_at) AS time_bucket,
    AVG(gripper_temperature) AS avg_gripper_temperature,
    COUNT(*) AS record_count
FROM read_gripper_temperature
WHERE occurred_at >= NOW() - INTERVAL '1 hour' -- 최근 1 시간 데이터 조회 (상황에 따라 조건 수정 가능)
GROUP BY time_bucket
ORDER BY time_bucket ASC;
```
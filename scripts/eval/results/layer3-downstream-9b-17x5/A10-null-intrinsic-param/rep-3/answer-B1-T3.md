제공된 로그와 Read Model 스키마를 분석한 결과, `insert.file.failed` 로 인해 적재 실패된 이벤트에 대한 상태를 영구적으로 저장하기 위해 `read_event_load_status` 테이블을 생성하고 데이터를 삽입해야 합니다.

먼저, 실패 로그에서 추출된 `stream_id` 와 `reason` 을 기반으로 `read_event_load_status` 테이블을 생성하고, 해당 실패 데이터를 삽입하는 SQL 을 작성합니다.

```sql
CREATE TABLE IF NOT EXISTS read_event_load_status (
    stream_id VARCHAR PRIMARY KEY,
    load_succeed SMALLINT NOT NULL DEFAULT 0,
    load_failed_reason JSONB,
    occurred_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO read_event_load_status (stream_id, load_succeed, load_failed_reason, occurred_at)
VALUES 
    ('grip-attempt:반려동물용품_CR01_강아지공룡알장난감_002024_01_20230923', 0, '{"expected": "number", "code": "invalid_type", "path": ["camera_info", "camera_intrinsic_param", "cody"], "message": "Invalid input: expected number, received null"}', '2023-09-23T02:52:50.989Z'),
    ('grip-attempt:반려동물용품_CR01_강아지공룡알장난감_002025_01_20230923', 0, '{"expected": "number", "code": "invalid_type", "path": ["camera_info", "camera_intrinsic_param", "fx"], "message": "Invalid input: expected number, received null"}', '2023-09-23T02:52:50.991Z');
```

이제 `read_event_load_status` 테이블에 저장된 실패 데이터 중, 카메라 내부 파라미터 (`cody`, `fx`) 가 `null` 이어서 거부된 건을 필드명별 (`cody`, `fx`) 건수로 집계하는 SELECT 문을 작성합니다.

```sql
SELECT 
    CASE 
        WHEN (load_failed_reason->'path'->>'3') = 'cody' THEN 'cody'
        WHEN (load_failed_reason->'path'->>'3') = 'fx' THEN 'fx'
        ELSE NULL 
    END AS failed_field,
    COUNT(*) AS count
FROM read_event_load_status
WHERE load_succeed = 0
GROUP BY failed_field
ORDER BY failed_field;
```
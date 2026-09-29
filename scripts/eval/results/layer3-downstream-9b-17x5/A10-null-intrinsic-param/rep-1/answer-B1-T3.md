제공된 로그와 스키마 정보를 바탕으로, `read_grip_result` 테이블에 `camera_intrinsic_param` 필드가 정의되어 있지 않으므로, 해당 필드가 `null` 인 레코드가 존재할 수 없습니다. 따라서 **필드명별 건수 집계 쿼리는 실행할 수 없습니다.**

하지만, **실패 원인 분석**을 위해 `read_file_failure` 테이블 (위 SQL 에서 제안된 새 테이블) 에 저장된 데이터만으로도, Zod 에러 로그에서 추출한 `path` 정보를 기준으로 `camera_intrinsic_param` 하위 필드 (`cody`, `fx`) 가 `null` 이 되어 실패한 건수를 집계할 수 있습니다.

따라서, 새 테이블 `read_file_failure` 를 먼저 생성하고 채운 후, 해당 테이블을 기준으로 집계하는 SQL 을 다음과 같이 작성합니다.

```sql
-- 1. 새 Read Model 테이블 생성 (필수 필드 검증용)
CREATE TABLE IF NOT EXISTS read_file_failure (
    file_name VARCHAR(255) NOT NULL,
    failure_reason JSONB NOT NULL,
    occurred_at TIMESTAMPTZ NOT NULL,
    stream_id VARCHAR(255),
    global_seq BIGINT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (file_name, occurred_at)
);

-- 2. 실패한 파일 정보 저장 (제공된 로그 기반)
INSERT INTO read_file_failure (file_name, failure_reason, occurred_at, stream_id, global_seq)
VALUES 
    ('반려동물용품_CR01_강아지공룡알장난감_02024_01_20230923.json',
     '{"expected": "number", "code": "invalid_type", "path": ["camera_info", "camera_intrinsic_param", "cody"], "message": "Invalid input: expected number, received null"}',
     '2023-09-23T20:20:02.315Z',
     'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02024',
     2024),
    ('반려동물용품_CR01_강아지공룡알장난감_02025_01_20230923.json',
     '{"expected": "number", "code": "invalid_type", "path": ["camera_info", "camera_intrinsic_param", "fx"], "message": "Invalid input: expected number, received null"}',
     '2023-09-23T20:20:02.316Z',
     'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02025',
     2025);

-- 3. 질문에 답하는 SELECT 문 (필드명별 실패 건수 집계)
SELECT 
    path_value AS field_name,
    COUNT(*) AS failure_count
FROM (
    SELECT 
        failure_reason::jsonb->'path' AS path_arr
    FROM read_file_failure
    WHERE failure_reason::jsonb->'code' = 'invalid_type'
      AND failure_reason::jsonb->'message' ILIKE '%received null%'
) AS t
CROSS JOIN LATERAL (
    SELECT unnest(path_arr) AS path_value
) AS unnest_path
WHERE path_value IS NOT NULL
  AND path_value LIKE '%camera_intrinsic_param%'
  AND (
      path_value = 'cody' 
      OR path_value = 'fx'
  )
GROUP BY path_value
ORDER BY path_value;
```
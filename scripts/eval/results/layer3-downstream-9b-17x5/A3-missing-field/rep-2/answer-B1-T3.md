제공된 로그와 스키마 정보를 바탕으로, `insert.file.failed` 로 인해 Zod 검증에 실패하여 Read Model 에 반영되지 않은 데이터 (누락 건) 를 필드별 누락 건수로 집계하는 SQL 쿼리를 작성합니다.

### 분석 과정

1.  **실패 원인 식별**: 로그의 `insert.file.failed` 행의 `detail` 필드에 포함된 `reason` 배열을 파싱하여 실패한 필드명을 추출해야 합니다.
    *   `02004` 파일: `reason` 에 `path: ["grip_data"]` 가 포함되어 있어, **`grip_data`** 필드가 누락됨 (undefined) 을 의미합니다.
    *   `02005` 파일: `reason` 에 `path: ["robot_tf"]` 가 포함되어 있어, **`robot_tf`** 필드가 누락됨 (undefined) 을 의미합니다.
    *   `02006` 파일: 로그에는 `insert.file.failed` 로 기록되지 않았습니다. 따라서 이 파일은 적재가 성공했거나, 실패하더라도 다른 필드 (예: `grip_data`) 에 문제가 있을 수 있으나, 현재 제공된 로그에서는 `robot_tf` 누락 건으로만 집계해야 합니다. (로그에 `02006` 실패 로그가 없으므로 `robot_tf` 누락 건수는 0 입니다.)

2.  **Read Model 구조 활용**:
    *   `read_grip_result` 테이블은 `robot_tf` 컬럼을 가지고 있습니다.
    *   `read_multimodal` 테이블은 `robot_tf` 컬럼을 **가지고 있지 않습니다**.
    *   따라서 `robot_tf` 필드의 누락은 `read_grip_result` 테이블에서만 감지할 수 있습니다. `read_multimodal` 테이블에서는 해당 필드가 존재하지 않으므로 누락으로 간주할 수 없습니다.

3.  **SQL 전략**:
    *   **Step 1 (필수 필드 정의)**: 로그의 `reason` 필드에서 `path` 배열의 첫 번째 요소 (예: `["grip_data"]`) 를 추출하여 필드명을 파싱합니다.
    *   **Step 2 (누락 데이터 식별)**:
        *   실패한 파일들의 `stream_id` 를 생성합니다.
        *   해당 `stream_id` 가 `read_grip_result` 테이블에 존재하는지 확인합니다.
        *   만약 존재한다면, 해당 `stream_id` 의 `robot_tf` (또는 파싱된 필드명) 가 `NULL` 인지 확인합니다. (Zod 에러 `received undefined` 는 DB 에 `NULL` 이 저장됨을 의미하므로).
        *   만약 `read_grip_result` 에 해당 `stream_id` 가 아예 없다면, 이미 누락된 것입니다.
    *   **Step 3 (집계)**: 파싱된 필드명별로 누락된 건수를 카운트합니다.

4.  **구체적인 SQL 로직**:
    *   로그에서 `reason` 필드의 `path` 배열을 추출하여 JSONB 경로로 변환합니다.
    *   실패한 파일 목록 (`02004`, `02005`) 에 대해 `stream_id` 를 생성합니다.
    *   `read_grip_result` 테이블을 조회하여, 해당 `stream_id` 가 있고, 파싱된 필드명이 `NULL` 인 행을 찾습니다.
    *   `read_multimodal` 테이블은 `robot_tf` 필드가 없으므로, `robot_tf` 누락 건수는 `read_grip_result` 에서만 계산됩니다.
    *   만약 `grip_data` 필드가 누락되었다면, `read_grip_result` 에 해당 `stream_id` 가 있을지라도 `grip_data` 가 `NULL` 일 것입니다.

### SQL 코드

```sql
-- 1. 실패한 파일 목록에서 예상 stream_id 와 누락된 필드명 추출
-- 로그의 detail 필드에서 reason 배열을 추출하고, path 배열의 첫 번째 요소를 필드명으로 파싱
WITH failed_files AS (
    SELECT 
        -- 파일명에서 'grip-attempt:' 접두사를 제거하여 scene_key 추출
        -- 파일명: 반려동물용품_CR01_강아지공룡알장난감_02004_01_20230923.json
        -- scene_key: 반려동물용품_CR01_강아지공룡알장난감_02004
        -- attempt_num: 01
        -- stream_id: grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02004
        CASE 
            WHEN file LIKE '반려동물용품_CR01_강아지공룡알장난감_%' THEN 
                SUBSTRING(file FROM POSITION('반려동물용품_CR01_강아지공룡알장난감_') + LENGTH('반려동물용품_CR01_강아지공룡알장난감_'))
            ELSE file
        END AS scene_key,
        -- 시도 번호 추출 (_01_, _02_ 등)
        CAST(SUBSTRING(file FROM POSITION('_') + 1 FOR POSITION('_' IN file) - 1) AS SMALLINT) AS attempt_num,
        -- 예상 stream_id 생성
        'grip-attempt:' || 
        CASE 
            WHEN file LIKE '반려동물용품_CR01_강아지공룡알장난감_%' THEN 
                SUBSTRING(file FROM POSITION('반려동물용품_CR01_강아지공룡알장난감_') + LENGTH('반려동물용품_CR01_강아지공룡알장난감_'))
            ELSE file
        END AS expected_stream_id,
        -- 필드명 추출 (reason.path[0])
        -- 예: ["grip_data"] -> 'grip_data', ["robot_tf"] -> 'robot_tf'
        (SELECT jsonb_array_elements_text((reason::jsonb)->'path') 
         FROM UNNEST(ARRAY[reason]) AS t(reason)
        LIMIT 1) AS failed_field_name
    FROM (
        SELECT '반려동물용품_CR01_강아지공룡알장난감_02004_01_20230923.json' AS file, 
               '[{"expected": "object", "code": "invalid_type", "path": ["grip_data"], "message": "Invalid input: expected object, received undefined"}]'::jsonb AS reason
        UNION ALL
        SELECT '반려동물용품_CR01_강아지공룡알장난감_02005_01_20230923.json' AS file,
               '[{"expected": "object", "code": "invalid_type", "path": ["robot_tf"], "message": "Invalid input: expected object, received undefined"}]'::jsonb AS reason
    ) AS failed_logs
),
-- 2. Read Model 에서 해당 stream_id 가 존재하는지, 그리고 해당 필드가 NULL 인지 확인
-- read_grip_result 는 robot_tf 컬럼을 가지며, read_multimodal 은 robot_tf 컬럼을 가지지 않음
-- 따라서 robot_tf 누락은 read_grip_result 에서만 확인 가능
-- grip_data 누락은 read_grip_result 에서 확인 가능 (grip_data 가 NULL 인지)
missing_records AS (
    SELECT 
        ff.expected_stream_id AS stream_id,
        ff.failed_field_name,
        CASE 
            WHEN gr.scene_key IS NOT NULL THEN 1 
            ELSE 0 
        END AS is_missing_stream,
        CASE 
            WHEN gr.scene_key IS NOT NULL AND gr.robot_tf IS NULL THEN 1 
            WHEN gr.scene_key IS NOT NULL AND ff.failed_field_name = 'robot_tf' THEN 1
            WHEN gr.scene_key IS NOT NULL AND gr.grip_data IS NULL THEN 1
            ELSE 0 
        END AS is_field_missing
    FROM failed_files ff
    LEFT JOIN read_grip_result gr 
        ON ff.expected_stream_id = gr.stream_id
    WHERE ff.failed_field_name IN ('grip_data', 'robot_tf')
),
-- 3. 누락된 필드별 건수 집계
field_missing_count AS (
    SELECT 
        failed_field_name,
        COUNT(*) AS missing_count
    FROM missing_records
    WHERE is_missing_stream = 0 OR is_field_missing = 1
    GROUP BY failed_field_name
)
SELECT 
    failed_field_name AS 필드명,
    missing_count AS 누락_건수
FROM field_missing_count
ORDER BY 필드명;
```

### 설명
*   **failed_files CTE**: 제공된 로그의 `detail` 필드에서 `reason` 배열을 파싱하여, 각 실패한 파일에 대해 `scene_key`, `attempt_num`, `expected_stream_id`, 그리고 `failed_field_name` (예: `grip_data`, `robot_tf`) 을 추출합니다.
*   **missing_records CTE**: 추출된 `expected_stream_id` 와 `read_grip_result` 테이블을 JOIN 합니다.
    *   `is_missing_stream`: `read_grip_result` 에 해당 `stream_id` 가 없는 경우 (1) 를 기록합니다. 이는 이벤트 저장소에도 없음을 의미하므로 필드 누락으로 간주합니다.
    *   `is_field_missing`: `read_grip_result` 에 해당 `stream_id` 가 있으면, 로그에서 지목된 필드명 (`failed_field_name`) 이 `NULL` 인지 확인합니다.
        *   `robot_tf` 에러: `read_grip_result` 의 `robot_tf` 컬럼이 `NULL` 인지 확인합니다.
        *   `grip_data` 에러: `read_grip_result` 의 `grip_data` 컬럼이 `NULL` 인지 확인합니다.
        *   `read_multimodal` 은 `robot_tf` 컬럼이 스키마에 정의되어 있지 않으므로, `robot_tf` 에러가 발생하더라도 `read_multimodal` 테이블에서는 해당 필드가 존재하지 않으므로 누락으로 간주하지 않습니다.
*   **field_missing_count**: `is_missing_stream` 이 0 이거나 `is_field_missing` 가 1 인 경우를 필터링하여, 필드별 누락 건수를 집계합니다.

### 결과 해석
*   **grip_data**: `02004` 파일에서 `grip_data` 에러가 발생했고, `read_grip_result` 에 해당 `stream_id` 가 없거나 `grip_data` 가 `NULL` 이라면 누락 건수가 1 증가합니다.
*   **robot_tf**: `02005` 파일에서 `robot_tf` 에러가 발생했고, `read_grip_result` 에 해당 `stream_id` 가 없거나 `robot_tf` 가 `NULL` 이라면 누락 건수가 1 증가합니다.
*   `read_multimodal` 은 `robot_tf` 필드가 없으므로, `robot_tf` 에러가 발생하더라도 `read_multimodal` 테이블에서는 누락으로 간주되지 않습니다. 따라서 `robot_tf` 누락 건수는 `read_grip_result` 에서만 계산됩니다.
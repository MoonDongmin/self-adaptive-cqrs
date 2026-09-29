제공된 로그와 스키마 정보를 바탕으로, `insert.file.failed` 로 인해 적재가 거부된 건을 **위반 필드명**, **거부 사유**, **원본 값**과 함께 **건수**로 집계하는 SQL 쿼리를 작성합니다.

### 분석 과정
1.  **위반 필드 및 사유 추출**: 로그의 `insert.file.failed` 행에서 `detail` 컬럼을 파싱하여 Zod 오류 구조 (`reason`) 를 추출합니다.
    *   필드명: `reason` 배열 내 `path` 의 마지막 요소 (예: `grip_succeed`).
    *   사유: `reason` 배열 내 `code` (예: `invalid_type`, `too_big`).
    *   원본 값: `reason` 배열 내 `expected` (예: `number`).
    *   대상 파일명: `detail` 내 `file` 필드.
2.  **집계**: 위 정보를 추출하여 `file_name`, `violation_field`, `violation_code`, `expected_type` 컬럼을 생성하고, `file_name` 기준으로 `COUNT(*)` 합니다.
3.  **백필 (필요 시)**: 만약 Event Store 에 해당 이벤트가 아예 없다면 (로그에 `insert.file.failed` 만 있고 `insert.file.ok` 가 없는 경우), Read Model 에는 데이터가 없을 것입니다. 하지만 질문은 "적재가 거부된 건"을 집계하는 것이므로, 로그에 명시된 실패 건만 추출하여 집계하는 것이 핵심입니다. Event Store 가 비어있을 경우 Read Model 은 빈 값이 되므로, 로그 기반 집계만 수행하면 됩니다.

### SQL 쿼리

```sql
-- 적재가 거부된 (insert.file.failed) 건을 위반 필드명, 거부 사유, 원본 값과 함께 건수로 집계합니다.
-- 로그의 detail 필드에서 Zod 오류 구조를 파싱하여 분석합니다.

SELECT 
    -- 위반 필드명: path 배열의 마지막 요소 (예: "grip_succeed")
    SPLIT_PART(SPLIT_PART(detail, 'path": [', ']'), '"', 1) AS violation_field,
    
    -- 거부 사유: reason 배열의 code (예: "invalid_type", "too_big")
    SPLIT_PART(SPLIT_PART(detail, 'code": "', '"'), '"', 1) AS violation_code,
    
    -- 원본 값: reason 배열의 expected (예: "number")
    SPLIT_PART(SPLIT_PART(detail, 'expected": "', '"'), '"', 1) AS expected_type,
    
    -- 대상 파일명: detail 내 file 필드
    SPLIT_PART(detail, 'file=', ' ') AS failed_file_name,
    
    -- 건수: 해당 파일명으로 그룹화한 행의 수
    COUNT(*) AS failure_count

FROM (
    -- 로그에서 insert.file.failed 레벨의 행만 필터링
    SELECT detail
    FROM (
        -- [상황] 에 포함된 로그 데이터 (가상의 로그 테이블 또는 CTE 로 가정)
        -- 실제 운영 환경에서는 logging_context 의 로그 테이블 (예: system_logs) 에서 필터링해야 합니다.
        -- 여기서는 제공된 로그 데이터를 직접 쿼리하는 형태로 작성합니다.
        SELECT '09:58:42.840' AS time, '40' AS level, 'insert.file.failed' AS action, '0069e24d-fc33-4d71-84a0-4aeab4ae354b' AS correlation_id, '-', 'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02002', '1', 'toy-data 파일 적재 실패 ← 트립 앵커', '{"reason":[{"expected":"number","code":"invalid_type","path":["grip_succeed"],"message":"Invalid input: expected number, received string"}],"file":"반려동물용품_CR01_강아지공룡알장난감_02002_01_20230923.json"}' AS detail
        UNION ALL
        SELECT '09:58:42.841' AS time, '40' AS level, 'insert.file.failed' AS action, '0069e24d-fc33-4d71-84a0-4aeab4ae354b' AS correlation_id, '-', 'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02003', '1', 'toy-data 파일 적재 실패', '{"reason":[{"origin":"number","code":"too_big","maximum":1,"inclusive":true,"path":["grip_succeed"],"message":"Too big: expected number to be <=1"}],"file":"반려동물용품_CR01_강아지공룡알장난감_02003_01_20230923.json"}' AS detail
    ) AS failed_logs
    WHERE level = '40' AND action = 'insert.file.failed'
) AS failed_log_detail

GROUP BY 
    violation_field,
    violation_code,
    expected_type,
    failed_file_name
ORDER BY 
    failed_file_name;
```
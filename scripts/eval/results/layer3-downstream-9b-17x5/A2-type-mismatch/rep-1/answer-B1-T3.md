제공된 로그와 스키마 정보를 바탕으로, Zod 거부 (Validation Error) 로 인해 적재가 실패한 건들의 위반 필드명, 거부 사유, 원본 값, 건수를 집계하는 SQL 입니다.

이 쿼리는 `read_grip_result` 테이블의 `stream_id` 와 `detail` 로그의 `file` 필드를 매칭하여, 해당 파일이 `insert.file.failed` 로 기록된 경우의 상세 사유를 추출합니다. `read_multimodal` 테이블은 실패 로그가 발생하기 전 이미 매핑이 완료된 상태이므로, 실패 건의 집계에는 포함되지 않습니다.

```sql
-- 실패 건수 집계 쿼리
SELECT 
    -- 위반 필드명: 로그의 detail 에서 'path' 배열의 마지막 요소 추출
    SPLIT_PART(SPLIT_PART(detail, 'path':',', 2), ']', 1) AS violation_field_name,
    
    -- 거부 사유: 로그의 detail 에서 'message' 필드 추출
    SPLIT_PART(detail, 'message": "', RPOSITION('"' || detail || '"', 'message": "') + LENGTH('message": "') - 1) AS rejection_reason,
    
    -- 원본 값: 
    -- 1. invalid_type: path 가 'grip_succeed' 이고 expected 가 'number' 인 경우, detail 에는 원본 값이 명시되지 않음 (문자열 타입이므로). 
    --    하지만 'reason' 필드에 "received string" 이나 path 에 있는 값이 있을 수 있으나, 제공된 로그에서는 구체적인 문자열 값이 path 에만 나와있고 message 에는 타입만 나와있음.
    --    따라서 타입 오류인 경우 '원본 값'은 로그에 명시적으로 없으므로 NULL 또는 'string' 타입 정보로 처리.
    --    로그: "path": ["grip_succeed"], "message": "Invalid input: expected number, received string"
    --    원본 값은 path 에 있는 값이므로 'grip_succeed' 필드의 값이 문자열로 들어갔다는 뜻.
    --    구체적인 문자열 값은 로그에 없으므로 NULL 로 처리하거나, 'string' 타입임을 나타내는 문자로 대체.
    CASE 
        WHEN detail LIKE '%expected number, received string%' THEN 'string'
        ELSE NULL 
    END AS original_value,
    
    -- 건수: 해당 stream_id 가 실패 로그에 몇 번 등장하는지 카운트
    COUNT(*) AS failure_count

FROM read_grip_result
JOIN (
    SELECT 
        'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02002' AS stream_id,
        'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02003' AS stream_id
) AS failed_logs ON read_grip_result.stream_id = failed_logs.stream_id
WHERE 
    -- 실패한 파일들의 stream_id 만 필터링
    read_grip_result.stream_id IN ('grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02002', 'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02003')
    AND read_grip_result.stream_id LIKE 'grip-attempt:%'
GROUP BY 
    violation_field_name, rejection_reason, original_value
ORDER BY 
    rejection_reason, failure_count DESC;
```
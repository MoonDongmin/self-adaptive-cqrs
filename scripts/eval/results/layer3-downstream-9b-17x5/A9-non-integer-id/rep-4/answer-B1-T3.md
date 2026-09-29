제공된 로그와 스키마 정보를 바탕으로, Zod 검증 오류로 인해 적재가 실패한 두 파일에 대한 위반 필드명과 원본 값을 조회하는 SQL 입니다.

로그에서 `insert.file.failed` 이벤트의 `detail` 필드에 포함된 `reason` 배열을 파싱하여, `path` (위반 필드 경로) 와 `message` (오류 내용, 원본 값 포함) 를 추출합니다.

```sql
SELECT 
    -- 위반 필드명: path 배열의 마지막 요소
    path[array_length(path, 1) - 1] as violated_field_name,
    -- 원본 값: message 필드에서 "received" 키워드 이후의 값을 추출
    -- 예: "Invalid input: expected int, received number" -> "number"
    SPLIT_PART(SPLIT_PART(message, 'received ', 2), ' ', 1) as original_value
FROM (
    SELECT 
        detail::jsonb as detail_json
    FROM insight_event_store
    WHERE action = 'insert.file.failed'
      AND stream_id IN (
          'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02022_01_20230923',
          'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02023_01_20230923'
      )
) AS failed_events
CROSS JOIN LATERAL (
    SELECT jsonb_array_elements(detail_json->'reason') as reason_item
) AS reasons
CROSS JOIN LATERAL (
    SELECT jsonb_path_exists(reason_item, '{expected}') as has_expected,
           jsonb_path_exists(reason_item, '{format}') as has_format,
           jsonb_path_exists(reason_item, '{code}') as has_code,
           jsonb_path_exists(reason_item, '{path}') as has_path,
           jsonb_path_exists(reason_item, '{message}') as has_message
    FROM jsonb_array_elements(detail_json->'reason')
) AS checks
WHERE has_path = true AND has_message = true
ORDER BY stream_id, path;
```
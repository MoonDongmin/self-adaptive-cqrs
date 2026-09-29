제시된 상황과 자료에 따르면, `insert.file.failed` 로 인해 특정 파일 (반려동물용품_CR01_강아지공룡알장난감_02002, 02003) 의 적재가 차단되었습니다. 이 경우 이벤트 스토어 (`event_store`) 에 해당 이벤트가 유입되지 않았으므로, Read Model (`read_grip_result`, `read_multimodal`) 에는 해당 데이터가 존재하지 않습니다.

따라서 "적재가 거부된 건"에 대한 정보는 원본 파일의 메타데이터 (파일명, 거부 사유, 위반 필드명, 원본 값) 를 직접 조회하여 집계해야 합니다. 자료의 `insert.file.failed` 로그에서 해당 정보를 추출하여 SQL 로 구현합니다.

```sql
SELECT 
    file_name AS rejected_file_name,
    jsonb_path_text('reason') AS rejection_reason,
    jsonb_path_text('reason', 0, 'expected') AS expected_field_type,
    jsonb_path_text('reason', 0, 'code') AS rejection_code,
    jsonb_path_text('reason', 0, 'path') AS violated_field_path,
    jsonb_path_text('reason', 0, 'message') AS rejection_message,
    1 AS rejection_count
FROM insight_logs
WHERE action = 'insert.file.failed'
  AND stream_id IN ('grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02002', 'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02003')
  AND correlation_id = 'ac26991b-9f8d-4831-b386-957e1b997958'
GROUP BY 
    file_name,
    jsonb_path_text('reason'),
    jsonb_path_text('reason', 0, 'expected'),
    jsonb_path_text('reason', 0, 'code'),
    jsonb_path_text('reason', 0, 'path'),
    jsonb_path_text('reason', 0, 'message');
```
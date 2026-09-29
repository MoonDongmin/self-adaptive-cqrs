제공된 로그와 스키마 정보를 분석한 결과, `projection.map.failed` 로그의 `detail` 필드에 "objects 비어 있음"이라는 메시지가 포함되어 있으며, 이는 `read_grip_result` 테이블의 `object_name` 필드가 `payload.objects[0].class_name` 에 의존하고 있어, 이벤트의 `objects` 배열이 비어 있을 경우 매핑이 실패하고 해당 데이터가 저장되지 않음을 의미합니다.

따라서, `read_grip_result` 테이블에 `object_name` 필드가 NULL 이거나 빈 문자열인 데이터를 포함하는지 확인하여, 이벤트 소싱 파이프라인에서 객체 정보가 누락된 이벤트가 투영되어 저장된 데이터를 찾아내는 검증 SQL 을 작성합니다.

```sql
SELECT 
    stream_id,
    global_seq,
    object_name,
    grip_succeed,
    occurred_at
FROM 
    read_grip_result
WHERE 
    object_name IS NULL 
    OR object_name = ''
ORDER BY 
    global_seq ASC;
```
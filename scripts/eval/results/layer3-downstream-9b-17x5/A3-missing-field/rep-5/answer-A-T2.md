제공된 자료에 따르면, `insert.file.failed` 로직은 Zod 스키마 검증 실패 시 해당 파일의 이벤트를 `event_store` 에 적재하지 않고 차단하고 있습니다. 따라서 `read_grip_result` 및 `read_multimodal` 같은 Read Model 테이블에는 해당 이벤트에 대한 데이터가 존재하지 않아야 합니다.

시스템의 정합성을 검증하기 위해, 실패로 인해 유입되지 않았어야 하는 이벤트들이 실제로 `event_store` 에 존재하지 않는지 확인하는 SQL 을 작성합니다.

```sql
SELECT 
    stream_id, 
    attempt_num, 
    COUNT(*) AS event_count
FROM 
    event_store
WHERE 
    (stream_id, attempt_num) IN (
        ('grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02004', 1),
        ('grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02005', 1)
    )
GROUP BY 
    stream_id, 
    attempt_num;
```
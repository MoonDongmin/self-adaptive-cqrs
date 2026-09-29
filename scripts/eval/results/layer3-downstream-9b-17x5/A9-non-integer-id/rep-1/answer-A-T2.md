제공된 자료에 따르면, 적재 실패 원인은 Zod 의 `safeint` 검증 실패 (소스 데이터의 타입 결함: `int` 대신 `number` 입력) 이며, 시스템은 이미 해당 이벤트를 거부 (`insert.file.failed`) 하여 Event Store 에 유입되지 않게 차단했습니다. 따라서 Read Model 을 생성하거나 수정할 DDL은 불필요하며, 격리된 상태의 실패된 이벤트가 Event Store 에 남아있지 않음을 검증하는 SQL 만 실행하면 됩니다.

```sql
SELECT count(*) AS rejected_event_count 
FROM event_store 
WHERE (stream_id, attempt_num) IN (
    ('grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02022', 1), 
    ('grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02023', 1)
);
```
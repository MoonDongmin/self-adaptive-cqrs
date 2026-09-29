제공된 자료에 따르면, `insert.file.failed` 로 인해 Zod 검증이 거절된 두 파일 (`_02002`, `_02003`) 의 이벤트는 Event Store 에 적재되지 않았으며, 따라서 Read Model (`read_grip_result`) 에는 해당 데이터가 포함되지 않았습니다.

권고 사항인 "거절 유지 + 원천 데이터 수정 요청"에 따라, Read Model 구조를 변경하거나 DDL 을 실행하는 것이 아니라, **Zod 검증으로 인해 적재되지 않았음을 확인하는 검증 SQL**을 작성해야 합니다.

```sql
SELECT count(*) AS rejected_event_count 
FROM event_store 
WHERE stream_id IN ('grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02002', 'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02003')
  AND attempt_num = 1;
```
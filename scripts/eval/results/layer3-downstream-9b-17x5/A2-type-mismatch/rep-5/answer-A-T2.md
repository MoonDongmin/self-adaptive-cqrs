제공된 자료에 따르면, `read_grip_result` 및 `read_multimodal` 테이블의 스키마는 Zod 검증 오류 (타입 불일치, 범위 초과) 로 인해 데이터가 적재 (Ingestion) 되지 않았으므로, Read Model 에 결함 데이터가 유입되어 오염된 상태는 아닙니다. 따라서 새로운 Read Model 테이블을 생성하거나 기존 테이블을 수정할 필요가 없으며, **Zod 가 거절하여 Event Store 에 유입되지 않았음을 검증하는 SQL**만 실행하면 됩니다.

다음은 결함 파일 (`반려동물용품_CR01_강아지공룡알장난감_02002` 및 `반려동물용품_CR01_강아지공룡알장난감_02003`) 에 해당하는 이벤트가 Event Store 에 존재하지 않음을 확인하는 SQL 입니다.

```sql
SELECT count(*) AS rejected_event_count 
FROM event_store 
WHERE (stream_id, attempt_num) IN (
    ('grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02002', 1),
    ('grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02003', 1)
);
```
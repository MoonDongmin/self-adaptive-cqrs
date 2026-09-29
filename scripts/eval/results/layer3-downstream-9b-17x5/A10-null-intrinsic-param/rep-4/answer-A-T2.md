제공된 자료에 따르면, Read Model (`read_grip_result`, `read_multimodal`) 의 스키마는 결함 데이터 (null 값) 를 수용할 수 없으며, 시스템 로직은 Zod 검증 실패 시 해당 파일의 이벤트 append 를 차단하고 배치 트랜잭션은 롤백하지 않고 정상 종료합니다. 따라서 Read Model 에 결함 데이터가 유입되지 않았으므로, 새로운 테이블을 생성하거나 기존 테이블을 수정할 필요는 없습니다.

필요한 조치는 **거절된 파일에 대한 이벤트가 event_store 에 실제로 유입되지 않았음을 검증**하는 것입니다.

```sql
SELECT count(*) AS rejected_event_count 
FROM event_store 
WHERE (stream_id, attempt_num) IN (
    ('grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02024', 1),
    ('grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02025', 1)
);
```
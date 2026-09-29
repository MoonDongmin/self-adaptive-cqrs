제공된 자료에 따르면, `unknown` 타겟 리드 모델은 이미 존재하지 않으며, 발생된 오류 (Zod strictness 위반으로 인한 파일 적재 실패) 는 해당 파일이 이벤트 스토어에 완전히 적재되지 않았음을 의미합니다. 따라서 새로운 Read Model 테이블을 생성할 필요 없이, **적재 실패로 인해 데이터가 유입되지 않았음을 검증하는 SQL**을 작성해야 합니다.

자료의 `constraints` 에 따라 `read_` 접두사와 스네이크 케이스를 사용하며, `stream_id` 와 `attempt_num` 을 식별자로 사용합니다.

```sql
-- 격리 (Containment): Zod 검증 실패로 인해 event_store 에 유입되지 않았음을 확인한다.
-- 예상 결과: rejected_event_count = 0 (정상적인 상태)
SELECT 
    COUNT(*) AS rejected_event_count
FROM 
    event_store
WHERE 
    (stream_id, attempt_num) IN (
        ('grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02022', 1),
        ('grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02023', 1)
    );
```
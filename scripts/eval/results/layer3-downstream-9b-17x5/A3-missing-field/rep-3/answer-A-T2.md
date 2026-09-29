제공된 자료에 따르면, `read_grip_result` 테이블의 스키마는 변경되지 않아야 하며 (v1 자산 무손상), 실패한 파일들은 Zod 검증으로 인해 이벤트 스토어 (Event Store) 에 유입되지 않았으므로 Read Model 에 데이터가 존재하지 않아야 합니다. 따라서 새로운 테이블을 생성하거나 기존 테이블을 수정하는 DDL 대신, 실패한 파일에 대한 이벤트가 유입되지 않았음을 검증하는 SQL 을 작성해야 합니다.

실패한 파일 (`..._02004`, `..._02005`) 의 `stream_id` 와 `attempt_num` 을 추출하여, 해당 키로 `event_store` 를 조회했을 때 레코드 개수가 0 인지 확인하는 쿼리입니다.

```sql
SELECT count(*) AS rejected_event_count 
FROM event_store 
WHERE (stream_id, attempt_num) IN (('grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02004', 1), ('grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02005', 1));
```
제공된 자료에 따르면, `insert.file.failed` 로 인해 특정 파일의 payload 가 Zod 검증에 실패하여 이벤트 스토어(event_store) 에 적재되지 않았습니다. 시스템은 이미 `insert.batch.done` 로 정상적으로 배치 처리를 완료했고, Projection 은 무중단으로 진행 중입니다.

자료의 권고 사항 (Recommendation) 에 따라 **Read Model 스키마 변경이나 새 테이블 생성은 금지**되며, **v1 자산 무손상** 원칙을 준수해야 합니다. 따라서 Read Model 테이블 (`read_grip_result`, `read_multimodal`) 에는 결함 데이터를 반영할 수 없으며, 데이터 무해화 원칙에 따라 **적재되지 않은 이벤트가 실제로 event_store 에 존재하지 않는지 검증**하는 SQL 만 실행해야 합니다.

검증 대상은 로그에서 명시된 두 파일 (`02002`, `02003`) 의 `stream_id` 와 `attempt_num` 입니다.

```sql
SELECT count(*) AS rejected_event_count 
FROM event_store 
WHERE (stream_id, attempt_num) IN (
    ('grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02002', 1), 
    ('grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02003', 1)
);
```
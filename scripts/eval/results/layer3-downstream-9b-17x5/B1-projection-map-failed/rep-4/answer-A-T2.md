제공된 자료에 따르면, `read_grip_result` 테이블의 스키마 변경이나 새 테이블 생성은 금지되어 있으며, 해결책은 **결함 이벤트를 격리 (Skip/Dead-letter)**하고 **정상 이벤트의 투영 상태를 복구**하는 것입니다. 따라서 DDL 대신, 결함 이벤트를 식별하여 `read_grip_result` 테이블에서 해당 PK 조합을 삭제하고, 이후 재투영을 통해 정상 데이터만 다시 채우는 검증 SQL 을 작성합니다.

```sql
-- 1. 결함 이벤트 (poison pill) 를 식별하여 해당 PK 조합을 read_grip_result 에서 삭제한다.
--    결함 이벤트 ID: 5f22aa5e-c635-4cb1-ad2b-60856d1534dc
--    stream_id: grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02011
--    삭제 기준: 해당 stream_id 와 일치하는 모든 record (stream_id 가 PK 의 scene_key 와 attempt_num 을 결정함)
DELETE FROM read_grip_result
WHERE stream_id = 'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02011';

-- 2. 삭제 후, 해당 결함 이벤트 ID 를 가진 record 가 완전히 제거되었는지 검증한다.
SELECT COUNT(*) AS deleted_count
FROM read_grip_result
WHERE stream_id = 'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02011';

-- 3. (선택적) 전체 Read Model 에서 해당 stream_id 가 존재하지 않는지 확인하여 투영 불일치를 감지한다.
--    만약 count 가 0 이라면 삭제 성공, 1 이상이라면 여전히 데이터가 남아있어 추가 조치가 필요할 수 있음.
SELECT stream_id, COUNT(*) AS record_count
FROM read_grip_result
WHERE stream_id = 'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02011'
GROUP BY stream_id;
```
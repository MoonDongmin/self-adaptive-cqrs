제공된 자료에 따르면, `read_grip_result` 스키마 변경이나 새 Read Model 생성은 금지되어 있으며, 해결책은 결함 이벤트 (poison pill) 를 격리하고 정상 이벤트의 투영을 재개하는 것입니다. 따라서 새로운 DDL 대신, 결함 이벤트를 식별하고 현재 커서 위치를 확인하여 정상 이벤트가 누락되었는지 검증하는 SQL 을 작성합니다.

```sql
-- 1. 결함 이벤트 (Poison Pill) 식별
-- 자료에 명시된 실패 원인 이벤트 ID: 232e7e97-2e91-4920-bd94-e6a98c2d6272
SELECT event_id, stream_id, attempt_num, global_seq 
FROM event_store 
WHERE event_id = '232e7e97-2e91-4920-bd94-e6a98c2d6272';

-- 2. 현재 투영 커서 위치 확인
-- projector_name: grip-result-projector
SELECT projector_name, last_event_seq 
FROM projection_cursor 
WHERE projector_name = 'grip-result-projector';

-- 3. 검증: 커서 이후의 정상 이벤트가 미투영 상태인지 확인
-- 결함 이벤트 ID 를 제외하고, 커서 이후의 이벤트 중 read_grip_result 로 투영되어야 할 이벤트가 있는지 확인
-- (참고: event_store 에는 모든 이벤트가 저장되므로, 해당 stream_id 가 read_grip_result 의 stream_id 패턴과 일치하는지, 혹은 투영 로직이 적용되어야 할지 판단 필요. 
-- 하지만 자료의 권고 사항에 따라 "결함 이벤트 skip" 후 "catch-up 재실행"이므로, 
-- 현재 커서 이후의 이벤트 중 결함 이벤트가 아닌 것들의 투영 상태를 확인하는 쿼리가 핵심임)
-- 
-- 주의: event_store 는 원본 이벤트 저장소이므로, 투영 상태 (투영되었는지 여부) 는 projection_cursor 나 별도의 투영 로그 테이블에 저장되어야 합니다.
-- 자료에 'read_grip_result' 스키마에 'global_seq' 컬럼이 있고, 'stream_id'도 있다는 점을 고려하면, 
-- Read Model 테이블에 투영된 이벤트의 global_seq 가 있는지 확인하는 것이 투영 완료 여부를 판단하는 가장 확실한 방법입니다.
-- 
-- 따라서, 커서 이후의 global_seq 를 가진 이벤트 중, read_grip_result 테이블에 해당 global_seq 가 있는지 확인하여 누락된 정상 이벤트를 찾습니다.
-- 
-- 단, event_id 가 결함 이벤트인 경우를 제외해야 합니다.
-- 
-- 가정: event_store 에는 모든 이벤트가 있고, read_grip_result 에는 투영된 이벤트만 있습니다.
-- 
SELECT 
    e.global_seq,
    e.event_id,
    e.stream_id,
    r.scene_key,
    r.attempt_num
FROM event_store e
JOIN read_grip_result r ON e.global_seq = r.global_seq
WHERE e.global_seq > (SELECT last_event_seq FROM projection_cursor WHERE projector_name = 'grip-result-projector')
  AND e.event_id != '232e7e97-2e91-4920-bd94-e6a98c2d6272'
  AND e.stream_id LIKE 'grip-attempt:%'; -- stream_id 패턴 필터링 (자료 예시 기준)
```

**설명:**
1.  **결함 이벤트 식별**: 자료의 `evidenceSources` 와 `logging_context` 에서 명시된 `event_id` (`232e7e97-2e91-4920-bd94-e6a98c2d6272`) 를 기준으로 해당 이벤트를 `event_store` 에서 조회합니다.
2.  **커서 위치 확인**: `projection_cursor` 테이블에서 해당 프로젝트 (`grip-result-projector`) 의 현재 마지막 처리된 시퀀스 (`last_event_seq`) 를 조회합니다.
3.  **누락 이벤트 검증**: 
    *   `WHERE e.global_seq > (SELECT last_event_seq ...)` : 현재 커서 이후의 이벤트만 조회합니다.
    *   `AND e.event_id != '232e7e97-2e91-4920-bd94-e6a98c2d6272'` : 결함 이벤트 (Poison Pill) 를 제외합니다.
    *   `JOIN read_grip_result` : `read_grip_result` 테이블에 해당 `global_seq` 가 이미 존재하는지 확인합니다. 만약 JOIN 결과 행이 0 개라면, 해당 `global_seq` 의 이벤트가 아직 투영되지 않았음을 의미합니다.
    *   `AND e.stream_id LIKE 'grip-attempt:%'` : `read_grip_result` 의 용도 (장면별 로봇 파지 결과) 와 일치하는 스트림 ID 패턴을 필터링하여 관련 이벤트만 대상으로 합니다. (자료의 `stream_id` 예시 패턴 기반)

이 쿼리를 실행하여 결과 행이 있다면, 해당 `global_seq` 를 가진 이벤트가 결함 이벤트가 아닌 정상 이벤트임에도 불구하고 `read_grip_result` 에 저장되어 있지 않음을 의미하며, 이는 투영 파이프라인이 결함 이벤트로 인해 중단되었음을 확인하는 근거가 됩니다. 이후 해당 `global_seq` 를 기준으로 `projection_cursor` 를 업데이트하고 재실행해야 합니다.
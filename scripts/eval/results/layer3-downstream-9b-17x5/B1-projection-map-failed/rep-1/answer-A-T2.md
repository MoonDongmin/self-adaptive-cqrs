제공된 자료에 따르면, `read_grip_result` 테이블의 스키마 변경이나 새 테이블 생성은 금지되어 있으며, 해결책은 결함 이벤트 (poison event) 를 Dead-letter 처리하여 배치 트랜잭션의 롤백을 방지하고, 이후 정상 이벤트의 재투영을 검증하는 것입니다. 따라서 SQL 은 결함 이벤트를 식별하고, 해당 이벤트를 제외하고 미투영된 정상 이벤트의 개수를 확인하는 쿼리로 구성됩니다.

```sql
-- 1. 결함 이벤트 (poison event) 식별 및 확인
SELECT event_id, stream_id, attempt_num, global_seq 
FROM event_store 
WHERE event_id = 'dbb75288-2d78-4771-9cde-45c52ee7d8fd';

-- 2. 결함 이벤트를 제외하고 미투영된 정상 이벤트 개수 확인 (재투영 전 검증)
SELECT COUNT(*) AS unprojected_normal_events
FROM event_store
WHERE global_seq > (
    SELECT last_event_seq 
    FROM projection_cursor 
    WHERE projector_name = 'grip-result-projector'
)
  AND event_id != 'dbb75288-2d78-4771-9cde-45c52ee7d8fd';
```
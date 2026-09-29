제공된 자료와 상황 (치명적 투영 실패, Poison Event, Dead-letter 처리 필요) 을 바탕으로, 먼저 결함 이벤트를 `read_grip_result` 테이블에서 격리 (삭제) 하는 백필 SQL 을 작성하고, 그 후 질문의 요구사항에 맞는 최종 SELECT 문을 작성합니다.

### 1. 백필 SQL (Poison Event Isolation)
결함 이벤트 (`dbb75288-2d78-4771-9cde-45c52ee7d8fd`) 가 `read_grip_result` 테이블에 존재할 경우 이를 제거하여, 이후 재투영 시 해당 이벤트가 다시 읽히지 않도록 합니다. `read_grip_result` 테이블의 PK 는 `(scene_key, attempt_num)` 이므로, 해당 PK 조합을 가진 행을 삭제합니다.

```sql
-- Poison event 격리: 결함 이벤트에 해당하는 PK 조합을 가진 read_grip_result 행 삭제
DELETE FROM read_grip_result
WHERE (scene_key, attempt_num) IN (
    SELECT scene_key, attempt_num 
    FROM event_store 
    WHERE event_id = 'dbb75288-2d78-4771-9cde-45c52ee7d8fd'
);
```

### 2. 최종 SELECT 문 (미투영 정상 이벤트 수 조회)
재투영을 시작하기 전, Poison 이벤트를 제외하고 현재 커서 이후로 아직 투영되지 않은 정상 이벤트의 수를 조회합니다. `read_grip_result` 테이블의 PK `(scene_key, attempt_num)` 을 사용하여 `event_store` 의 `stream_id` 와 `attempt_num` 을 조인하여, 해당 PK 조합이 `read_grip_result` 에 존재하지 않는 이벤트를 찾습니다.

```sql
SELECT COUNT(*) AS unprojected_normal_events
FROM event_store es
WHERE es.global_seq > (
    SELECT last_event_seq 
    FROM projection_cursor 
    WHERE projector_name = 'grip-result-projector'
)
  AND es.event_id != 'dbb75288-2d78-4771-9cde-45c52ee7d8fd'
  AND NOT EXISTS (
      SELECT 1 
      FROM read_grip_result rgr
      WHERE rgr.scene_key = es.scene_key
        AND rgr.attempt_num = es.attempt_num
  );
```
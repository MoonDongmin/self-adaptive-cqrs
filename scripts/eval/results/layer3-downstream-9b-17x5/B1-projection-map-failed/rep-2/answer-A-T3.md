제공된 자료에 따르면, `read_grip_result` 테이블의 스키마 변경이나 새로운 Read Model 생성은 금지되어 있으며, 해결책은 결함 이벤트를 격리하여 투영 커서를 안전하게 전진하는 것입니다. 따라서 새 DDL 대신, 결함 이벤트를 식별하고 해당 이벤트를 투영 처리에서 제외 (Skip) 하도록 하는 SQL 을 작성합니다. 이는 `SkipProjectionError` 로격리된 이벤트를 `event_store` 에서 필터링하고, `projection_cursor` 를 해당 이벤트의 시퀀스 (`global_seq`) 로 업데이트하여, 이후의 정상 이벤트들이 투영될 수 있도록 합니다.

```sql
-- 1. 결함 이벤트 (poison event) 의 식별 및 격리 처리
-- 해당 이벤트 ID 를 가진 모든 기록을 event_store 에서 논리적으로 삭제하거나 투영 가능 플래그를 false 로 변경하여, 
-- 이후 투영 로직에서 이 이벤트를 건너뛰도록 합니다. 
-- (가정: event_store 에는 투영 상태 플래그 컬럼이 존재하거나, 해당 event_id 를 가진 행을 물리/논리 삭제)
-- 여기서는 event_id 를 기반으로 해당 이벤트를 투영 큐에서 제외하는 UPDATE 를 수행합니다.
UPDATE event_store
SET is_projected = false, -- 또는 projection_status = 'skipped'
  skip_reason = 'poison_event: empty_objects'
WHERE event_id = '949923ab-381a-4bf9-af3e-61583aed52c0';

-- 2. 투영 커서 (Cursor) 전진
-- 격리된 이벤트의 global_seq 를 기준으로 투영 커서를 전진시켜, 
-- 해당 이벤트 이후의 정상 이벤트들만 다음 투영 배치에서 처리되도록 합니다.
UPDATE projection_cursor
SET last_event_seq = (
    SELECT COALESCE(MAX(global_seq), 0)
    FROM event_store
    WHERE event_id != '949923ab-381a-4bf9-af3e-61583aed52c0' -- 격리된 이벤트 제외
    AND is_projected = true -- 이미 투영된 이벤트만 고려 (선택 사항: 격리된 이벤트는 is_projected=false 로 유지)
)
WHERE projector_name = 'grip-result-projector';

-- 3. 조치 검증 (Verification)
-- 격리 조치 후, 해당 이벤트 이후의 정상 이벤트들이 모두 투영되었는지 확인합니다.
SELECT 
    COUNT(*) AS total_events_after_isolation,
    COUNT(CASE WHEN is_projected = true THEN 1 END) AS projected_count,
    COUNT(CASE WHEN is_projected = false THEN 1 END) AS unprojected_count
FROM event_store
WHERE global_seq > (SELECT last_event_seq FROM projection_cursor WHERE projector_name = 'grip-result-projector');
```
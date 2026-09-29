제공된 로그와 스키마 정보를 바탕으로, `payload.objects` 가 비어 있는 'poison' 이벤트를 제외하고 아직 투영되지 않은 정상 이벤트의 수를 조회하는 SQL 입니다.

이 쿼리는 다음 논리로 구성됩니다:
1.  **Poison 이벤트 식별**: 로그의 `detail` 필드에 "objects 비어 있음"이 포함된 이벤트는 `stream_events` 테이블에서 `payload->'objects'` 가 NULL 이거나 배열 길이가 0 인 경우로 필터링합니다.
2.  **투영되지 않은 이벤트 식별**: 해당 이벤트의 `stream_id` 와 `global_seq` 가 `read_grip_result` 와 `read_multimodal` 테이블에 모두 존재하지 않는 경우를 찾습니다. (Read Model 은 두 테이블 모두에 기록되어야 완전한 투영으로 간주된다고 가정하거나, 최소한 하나라도 누락된 상태라면 '아직 투영되지 않음'으로 간주합니다. 보통 CQRS 에서 Read Model 은 Event Store 의 하위 집합이어야 하므로, Event Store 에는 있고 Read Model 에는 없는 것을 찾습니다.)
3.  **백필 (Backfill) 고려**: 만약 `read_grip_result` 에는 있지만 `read_multimodal` 에는 없는 경우 (또는 그 반대), 이는 투영 불일치 상태이므로 아직 '완전히' 투영되지 않은 것으로 간주하여 포함합니다.

```sql
-- Poison 이벤트 (payload.objects 가 비어 있는 경우) 를 제외하고, 아직 Read Model 에 투영되지 않은 정상 이벤트의 수 조회

-- 1. Poison 이벤트 필터링 (payload.objects 가 NULL 이거나 빈 배열인 경우)
-- 이 쿼리는 stream_events 테이블에서 'poison'으로 간주될 이벤트들을 추출합니다.
WITH poison_event_ids AS (
    SELECT stream_id, global_seq
    FROM "stream_events"
    WHERE payload IS NOT NULL
      AND (
          payload->'objects' IS NULL 
          OR jsonb_array_length(payload->'objects') = 0
      )
),

-- 2. 아직 투영되지 않은 이벤트 추출
-- Event Store 에는 존재하지만, read_grip_result 와 read_multimodal 에 모두 존재하지 않는 경우를 찾습니다.
-- 만약 Read Model 이 부분적으로만 업데이트되었다면, 두 테이블 중 하나라도 누락된 경우를 '아직 투영되지 않음'으로 간주할 수 있습니다.
-- 여기서는 가장 엄격한 기준 (두 테이블 모두에 없음) 으로 설정하거나, 
-- 실제 운영상 '투영 실패'로 간주되는 경우를 포착하기 위해, 
-- Event Store 에는 있고 (Poison 제외), Read Model 에는 없는 모든 레코드를 찾습니다.
unprojected_events AS (
    SELECT se.stream_id, se.global_seq
    FROM "stream_events" se
    WHERE NOT EXISTS (
        -- read_grip_result 에 해당 레코드 없음
        SELECT 1 FROM read_grip_result rgr
        WHERE rgr.stream_id = se.stream_id
          AND rgr.global_seq = se.global_seq
    )
    AND NOT EXISTS (
        -- read_multimodal 에 해당 레코드 없음
        SELECT 1 FROM read_multimodal rm
        WHERE rm.stream_id = se.stream_id
          AND rm.global_seq = se.global_seq
    )
)

-- 3. Poison 이벤트 ID 를 제외하고 남은 이벤트의 수 집계
SELECT COUNT(*) AS unprojected_count
FROM unprojected_events ue
WHERE NOT EXISTS (
    SELECT 1 FROM poison_event_ids pe
    WHERE pe.stream_id = ue.stream_id
      AND pe.global_seq = ue.global_seq
);
```
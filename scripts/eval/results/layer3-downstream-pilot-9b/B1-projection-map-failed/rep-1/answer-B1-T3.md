제공된 로그와 스키마 정보를 바탕으로, `projection.map.failed` 로 인해 처리되지 않은 이벤트 (결함 이벤트) 를 제외하고, 아직 Read Model 에 투영되지 않은 정상 이벤트의 수를 조회하기 위한 SQL 입니다.

먼저, 로그 분석 결과 `stream_id` 가 `grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02011` 이고, `global_seq` 가 `1` 인 이벤트가 실패했습니다. 이 특정 시퀀스는 Read Model 에 존재하지 않아야 합니다. 반면, 같은 `stream_id` 에 `global_seq` 가 `2` 부터 `52` 까지 (또는 로그에 나타난 `projection.event.mapped` 횟수에 따라 해당 시퀀스들) 는 정상적으로 매핑되었을 가능성이 높습니다.

따라서, **해당 결함 이벤트의 `stream_id` 와 `global_seq` 조합을 제외하고**, `read_grip_result` 와 `read_multimodal` 테이블에 존재하는 모든 고유한 `(stream_id, global_seq)` 조합의 수를 계산하는 것이 가장 정확합니다.

```sql
SELECT 
    COUNT(DISTINCT r.stream_id) as total_unprojected_events
FROM 
    (
        SELECT stream_id, global_seq FROM read_grip_result
        UNION
        SELECT stream_id, global_seq FROM read_multimodal
    ) AS all_read_records
WHERE 
    NOT EXISTS (
        SELECT 1
        FROM (
            SELECT 'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02011' as failed_stream_id, 1 as failed_global_seq
        ) AS poison_event
        WHERE poison_event.failed_stream_id = all_read_records.stream_id
          AND poison_event.failed_global_seq = all_read_records.global_seq
    );
```
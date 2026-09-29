제공된 자료와 상황 분석에 따라, 먼저 `read_gripper_temperature` 테이블을 백필 (Backfill) 하는 SQL 을 작성하고, 이어질 시간대별 평균 조회 SQL 을 작성합니다.

### 1. 백필 SQL (Backfill)
기존 Read Model (`read_grip_result`) 에는 `gripper_temperature` 필드가 없으므로, 이벤트 스토어 (Event Store) 에서 `payload.schema.drift` 로 유입된 `gripper_temperature` 값을 추출하여 새 테이블 `read_gripper_temperature` 에 삽입해야 합니다.
`payload.schema.drift` 이벤트의 `detail` 컬럼에는 `newKeys` 가 JSON 형식으로 저장되어 있으며, 여기서 `gripper_temperature` 값을 추출해야 합니다. Postgres 의 `jsonb` 타입을 활용하여 추출합니다.

```sql
INSERT INTO read_gripper_temperature (scene_key, attempt_num, occurred_at, gripper_temperature, stream_id, global_seq)
SELECT 
    -- stream_id 에서 'grip-attempt:' 접두사를 제거하여 scene_key 추출
    SUBSTRING(stream_id, POSITION(': ' IN stream_id) + 2) AS scene_key,
    -- 파일명 (stream_id) 에서 시도 번호 추출 (예: 00001_01 -> 01)
    CAST(SUBSTRING(SUBSTRING(stream_id, POSITION(': ' IN stream_id) + 2), 1, POSITION('_' IN SUBSTRING(stream_id, POSITION(': ' IN stream_id) + 2)) - 1) AS SMALLINT) AS attempt_num,
    -- 파일명 (stream_id) 에서 날짜 추출 (예: 20230923 -> 2023-09-23T00:00:00Z)
    -- 파일명 형식: {scene_key}_{attempt_num}_{batch_num}_{date}
    -- date 부분만 추출 후 timestamptz 로 변환 (시각은 00:00:00Z 로 고정)
    (
        CASE 
            WHEN SUBSTRING(stream_id, POSITION('_' IN SUBSTRING(stream_id, POSITION(': ' IN stream_id) + 2)) + 1, 4) = '2023' THEN
                TO_TIMESTAMP(
                    SUBSTRING(stream_id, POSITION('_' IN SUBSTRING(stream_id, POSITION(': ' IN stream_id) + 2)) + 1, 8) || 'T00:00:00Z'
                )
            ELSE NULL 
        END
    ) AS occurred_at,
    -- detail.col 에서 gripper_temperature 추출
    (SELECT value FROM jsonb_each(detail) WHERE key = 'gripper_temperature')::NUMERIC AS gripper_temperature,
    stream_id,
    global_seq
FROM event_store
WHERE action = 'payload.schema.drift'
  AND detail IS NOT NULL
  AND detail->>'newKeys' IS NOT NULL
  AND (detail->>'newKeys')::jsonb->>'gripper_temperature' IS NOT NULL;
```

### 2. 조회 SQL (Time-series Average)
요청하신 대로 `gripper_temperature` 를 시간대 (시 단위) 별 평균값으로 시간 순으로 조회하는 SQL 입니다. `occurred_at` 필드에 인덱스가 있다고 가정하고, `EXTRACT(hour FROM occurred_at)` 를 사용하여 시 단위로 그룹화합니다.

```sql
SELECT 
    EXTRACT(hour FROM occurred_at) AS hour,
    AVG(gripper_temperature) AS avg_gripper_temperature,
    COUNT(*) AS record_count
FROM read_gripper_temperature
GROUP BY hour
ORDER BY hour ASC;
```
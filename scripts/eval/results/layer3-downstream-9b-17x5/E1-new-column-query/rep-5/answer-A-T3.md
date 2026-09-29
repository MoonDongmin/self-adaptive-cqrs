사용자의 요청인 "최근 적재 데이터에 gripper_temperature 필드가 들어오기 시작했다. 이 값을 시간대별로 조회하고 싶다"는 현재 제공된 Read Model (`read_grip_result`, `read_multimodal`) 에 해당 필드가 존재하지 않으므로 **현재 Read Model 로는 불가능**합니다.

자료에 따르면 `payload.schema.drift` 로 인해 `gripper_temperature` 필드가 유입되었으나, 이를 저장하는 새로운 Read Model (`read_grip_sensor_context_v1`) 이 아직 생성되지 않았습니다. 따라서 해결책은 **새로운 Read Model 테이블을 생성**하는 것입니다.

다음은 `read_grip_sensor_context_v1` 테이블을 생성하는 SQL 입니다.

```sql
CREATE TABLE read_grip_sensor_context_v1 (
  scene_key varchar NOT NULL,
  attempt_num smallint NOT NULL,
  occurred_at timestamptz,
  gripper_temperature double precision,
  conveyor_speed double precision,
  stream_id varchar,
  global_seq bigint,
  PRIMARY KEY (scene_key, attempt_num)
);
```

이제 다음 질문에 답하는 SELECT 문을 작성하라: gripper_temperature 를 시간대(시 단위)별 평균값으로 시간 순으로 조회하라.
필요하면 기존 데이터(read_grip_result, read_multimodal, event_store)로 새 테이블을 채우는 백필 SQL 을 먼저 작성하고,
질문에 답하는 SELECT 문은 반드시 마지막 ```sql 블록에 단독으로 작성하라.

```sql
SELECT
  date_trunc('hour', occurred_at) AS hour_bucket,
  AVG(gripper_temperature) AS avg_gripper_temperature,
  COUNT(*) AS record_count
FROM read_grip_sensor_context_v1
WHERE occurred_at >= NOW() - INTERVAL '1 day'
GROUP BY hour_bucket
ORDER BY hour_bucket ASC;
```
사용자의 요청인 "gripper_temperature 를 시간대(시 단위)별 평균값으로 시간 순으로 조회"는 새로 생성된 `read_grip_sensor_v1` 테이블을 통해 가능합니다.

필요한 경우 백필 (백업 데이터 채우기) SQL 은 다음과 같습니다.

```sql
-- 백필 SQL: 기존 적재 데이터 (event_store) 에서 신규 필드가 유실된 데이터를 `read_grip_sensor_v1` 에 복사
-- 참고: 실제 운영 환경에서는 Projection Service 의 catchUp 로직이 자동으로 이 작업을 수행해야 합니다.
-- 여기서는 수동으로 과거 데이터를 복원하는 시나리오를 가정합니다.
INSERT INTO read_grip_sensor_v1 (scene_key, attempt_num, gripper_temperature, conveyor_speed, occurred_at)
SELECT 
  stream_id::text as scene_key,
  attempt_num,
  payload->>'gripper_temperature'::double precision as gripper_temperature,
  payload->>'conveyor_speed'::double precision as conveyor_speed,
  occurred_at
FROM event_store
WHERE stream_id LIKE 'grip-attempt:%'
  AND payload->>'gripper_temperature' IS NOT NULL
ON CONFLICT (scene_key, attempt_num) DO NOTHING;
```

질문에 답하는 SELECT 문은 다음과 같습니다.

```sql
SELECT 
  date_trunc('hour', occurred_at) as time_bucket,
  AVG(gripper_temperature) as avg_gripper_temperature
FROM read_grip_sensor_v1
WHERE gripper_temperature IS NOT NULL
GROUP BY time_bucket
ORDER BY time_bucket;
```
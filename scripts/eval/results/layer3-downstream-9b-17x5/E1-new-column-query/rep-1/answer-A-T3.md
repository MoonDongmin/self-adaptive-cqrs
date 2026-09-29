사용자의 요청인 "gripper_temperature 를 시간대(시 단위)별 평균값으로 시간 순으로 조회"는 `read_grip_result_v2` 테이블의 `occurred_at` 컬럼과 `gripper_temperature` 컬럼을 활용해야 합니다.

기존 `read_grip_result` 테이블에는 `gripper_temperature` 필드가 존재하지 않으므로, 해당 필드를 포함하는 `read_grip_result_v2` 테이블을 기준으로 조회해야 합니다.

```sql
SELECT
  date_trunc('hour', occurred_at) AS time_bucket,
  AVG(gripper_temperature) AS avg_gripper_temperature,
  COUNT(*) AS record_count
FROM
  read_grip_result_v2
WHERE
  occurred_at IS NOT NULL
  AND gripper_temperature IS NOT NULL
GROUP BY
  date_trunc('hour', occurred_at)
ORDER BY
  time_bucket ASC;
```
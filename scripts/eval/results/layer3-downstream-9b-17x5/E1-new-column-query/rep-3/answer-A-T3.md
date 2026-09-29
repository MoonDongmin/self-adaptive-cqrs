현재 제공된 자료에 따르면, `gripper_temperature` 필드는 신규 Read Model `read_grip_environmental_data` 에만 정의되어 있으며, 기존 Read Model (`read_grip_result`, `read_multimodal`) 에는 포함되어 있지 않습니다. 따라서 기존 테이블을 수정하는 대신, 새로 생성된 `read_grip_environmental_data` 테이블을 사용하여 조회해야 합니다.

요청하신 "시간대(시 단위)별 평균값으로 시간 순으로 조회"하는 SQL 은 다음과 같습니다.

```sql
SELECT
  DATE_TRUNC('hour', occurred_at) AS time_bucket,
  AVG(gripper_temperature) AS avg_gripper_temperature,
  COUNT(*) AS record_count
FROM
  read_grip_environmental_data
WHERE
  occurred_at IS NOT NULL
  AND gripper_temperature IS NOT NULL
GROUP BY
  DATE_TRUNC('hour', occurred_at)
ORDER BY
  time_bucket ASC;
```
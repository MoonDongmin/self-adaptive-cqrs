제공된 자료에 따르면, `payload.schema.drift` 로그에 `gripper_temperature` 필드가 신규로 유입되었음을 알 수 있습니다. CQRS 아키텍처에서 Projection 로직은 이벤트 스토어에 들어온 이벤트를 실시간으로 처리하여 Read Model 을 업데이트하므로, 해당 필드가 포함된 이벤트가 들어오면 기존 `read_grip_result` 테이블에 동적으로 추가될 것입니다. 따라서 별도의 새 테이블 생성 SQL 은 필요 없으며, 기존 `read_grip_result` 테이블에 `gripper_temperature` 필드가 있다고 가정하고 조회를 수행하면 됩니다.

요청하신 **시 단위 평균값**을 **시간 순**으로 조회하는 SQL 은 다음과 같습니다.

```sql
SELECT 
    DATE_TRUNC('hour', occurred_at) AS time_bucket,
    AVG(gripper_temperature) AS avg_gripper_temperature
FROM read_grip_result
WHERE occurred_at >= NOW() - INTERVAL '1 hour'
GROUP BY time_bucket
ORDER BY time_bucket ASC;
```
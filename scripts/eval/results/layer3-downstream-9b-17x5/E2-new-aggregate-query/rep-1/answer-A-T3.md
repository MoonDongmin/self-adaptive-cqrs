제공된 자료에 따르면, `read_object_grip_aggregate_v1` 테이블은 `object_name`을 Primary Key로 가지며, `attempt_count`, `success_count`, `success_rate` 컬럼을 포함하고 있습니다. 따라서 `object_name`별 상위 3개 객체를 조회하기 위해 해당 테이블을 직접 쿼리하면 됩니다.

```sql
SELECT 
  object_name,
  attempt_count,
  success_count,
  success_rate
FROM read_object_grip_aggregate_v1
ORDER BY success_rate DESC
LIMIT 3;
```
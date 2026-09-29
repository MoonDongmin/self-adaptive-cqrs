제공된 자료에 따르면, `read_grip_result_v2` 테이블은 `z_avg_m`, `prev_z_avg_m`, `delta_z_m`, `grip_outlier_flag` 필드를 포함하고 있으며, `scene_key` 와 `attempt_num` 이 주 키입니다.

질문하신 대로 같은 장면 (`scene_key`) 내에서 시도 (`attempt_num`) 간 평균 깊이 변화량 (`delta_z_m`) 이 0.10m 를 넘는 경우를 조회하는 SQL 입니다.

```sql
SELECT
  scene_key,
  attempt_num,
  z_avg_m,
  prev_z_avg_m,
  delta_z_m,
  grip_outlier_flag
FROM
  read_grip_result_v2
WHERE
  ABS(delta_z_m) > 0.10
ORDER BY
  scene_key,
  attempt_num;
```
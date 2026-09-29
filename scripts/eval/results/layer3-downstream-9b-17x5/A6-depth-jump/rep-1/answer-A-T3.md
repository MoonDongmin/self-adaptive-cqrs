제공된 자료에 따르면, `read_grip_result_v2` 테이블은 `z_avg` 컬럼을 포함하고 있으며, `grip_outlier_flag` 컬럼은 동장 내 시전 간 Z 평균 변화량이 0.10m 를 초과했을 때 1 로 설정된 정합성 플래그입니다.

질문하신 대로, 같은 `scene_key` 내에서 `attempt_num` 이 증가하는 순서대로 `z_avg` 의 변화량 (delta) 을 계산하여 0.10m 를 초과하는 경우를 조회하는 SQL 입니다.

```sql
WITH ordered_attempts AS (
    SELECT 
        scene_key,
        attempt_num,
        z_avg,
        LAG(z_avg) OVER (PARTITION BY scene_key ORDER BY attempt_num) AS prev_z_avg
    FROM read_grip_result_v2
),
delta_calc AS (
    SELECT 
        scene_key,
        attempt_num,
        z_avg,
        prev_z_avg,
        ABS(z_avg - prev_z_avg) AS z_delta
    FROM ordered_attempts
    WHERE prev_z_avg IS NOT NULL
)
SELECT 
    scene_key,
    attempt_num,
    z_avg,
    prev_z_avg,
    z_delta
FROM delta_calc
WHERE z_delta > 0.10
ORDER BY scene_key, attempt_num;
```
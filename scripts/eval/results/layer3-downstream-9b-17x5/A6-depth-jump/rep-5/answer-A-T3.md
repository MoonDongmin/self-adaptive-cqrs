제공된 자료에 따르면, `read_grip_result_v2` 테이블은 `z_avg_m`(Z 좌표 평균) 과 `grip_outlier_flag`(시계열 급변 플래그) 필드를 포함하고 있으며, 기존 `read_grip_result` 테이블은 JSONB 형식의 `grip_3d_pose`만 저장하고 있어 시계열 검증이 불가능합니다.

따라서 먼저 `read_grip_result_v2` 테이블에 필요한 데이터를 백필 (backfill) 하고, 이후 시계열 급변 (Δ > 0.10m) 을 가진 장면을 조회하는 SQL 을 작성합니다.

### 1. 백필 SQL (Backfill)
`read_grip_result_v2` 테이블을 생성 후, 기존 `read_grip_result` 테이블의 `grip_3d_pose` 데이터를 읽어 `z_avg_m` 을 계산하고, `grip_outlier_flag` 는 동장 내 직전 시도와의 Z 평균 차이를 0.10m 초과하는지 판단하여 1 또는 0 으로 채웁니다.

```sql
-- 백필: read_grip_result_v2 에 기존 데이터를 기반으로 z_avg_m 과 grip_outlier_flag 계산
INSERT INTO read_grip_result_v2 (
  scene_key,
  attempt_num,
  object_name,
  grip_succeed,
  occurred_at,
  z_avg_m,
  grip_outlier_flag
)
SELECT 
  r.scene_key,
  r.attempt_num,
  r.object_name,
  r.grip_succeed,
  r.occurred_at,
  -- z_avg_m: grip_3d_pose 의 z1~z8 평균 계산
  (
    (SELECT COALESCE((SELECT SUM(z) FROM jsonb_array_elements(grip_3d_pose) WHERE key IN ('z1','z2','z3','z4','z5','z6','z7','z8')), 0))
  )::double precision / 8.0,
  -- grip_outlier_flag: 같은 scene_key 에서 직전 시도 대비 z_avg_m 차이가 0.10m 초과 시 1, 아니면 0
  CASE 
    WHEN r.attempt_num = 1 THEN 0
    ELSE (
      SELECT CASE 
        WHEN ABS(
          (SELECT COALESCE((SELECT SUM(z) FROM jsonb_array_elements(r2.grip_3d_pose) WHERE key IN ('z1','z2','z3','z4','z5','z6','z7','z8')), 0))::double precision / 8.0
        ) - (
          SELECT COALESCE((SELECT SUM(z) FROM jsonb_array_elements(r3.grip_3d_pose) WHERE key IN ('z1','z2','z3','z4','z5','z6','z7','z8')), 0))::double precision / 8.0
        ) > 0.10 
        THEN 1 
        ELSE 0 
      END
      FROM read_grip_result r2, read_grip_result r3
      WHERE r2.scene_key = r.scene_key 
        AND r3.scene_key = r.scene_key 
        AND r2.attempt_num = r.attempt_num - 1
        AND r3.attempt_num = r.attempt_num - 2
    )
  END
FROM read_grip_result r
LEFT JOIN LATERAL (
  SELECT * FROM read_grip_result 
  WHERE scene_key = r.scene_key 
  ORDER BY attempt_num 
  LIMIT 1
) r2 ON TRUE
LEFT JOIN LATERAL (
  SELECT * FROM read_grip_result 
  WHERE scene_key = r.scene_key 
  ORDER BY attempt_num 
  LIMIT 2
) r3 ON TRUE
ON CONFLICT (scene_key, attempt_num) DO NOTHING;
```

### 2. 시계열 급변 (Jump) 조회 SQL
`read_grip_result_v2` 테이블에서 같은 `scene_key` 내 `attempt_num` 이 증가하는 순서대로 `z_avg_m` 의 변화량 (Δ) 이 0.10m 를 초과하는 경우를 조회합니다.

```sql
SELECT 
  curr.scene_key,
  curr.attempt_num AS current_attempt,
  prev.attempt_num AS prev_attempt,
  curr.z_avg_m AS current_z_avg,
  prev.z_avg_m AS prev_z_avg,
  ROUND(curr.z_avg_m - prev.z_avg_m, 3) AS delta_z_avg_m,
  curr.grip_outlier_flag AS outlier_flag
FROM read_grip_result_v2 curr
JOIN read_grip_result_v2 prev 
  ON curr.scene_key = prev.scene_key 
  AND curr.attempt_num = prev.attempt_num + 1
WHERE 
  curr.z_avg_m - prev.z_avg_m > 0.10
ORDER BY 
  curr.scene_key, curr.attempt_num;
```
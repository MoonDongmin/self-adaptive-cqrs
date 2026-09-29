파지 성공 (`grip_succeed = 1`) 이면서 최소 깊이 (`grip_3d_pose` 내 z1~z8 중 최소값) 가 물리적 하한 0.01m 미만인 시도를 조회하는 SQL 입니다.

```sql
SELECT 
  scene_key,
  attempt_num,
  object_name,
  grip_succeed,
  (
    COALESCE((
      SELECT LEAST(
        COALESCE((grip_3d_pose->'z1')::numeric, -999),
        COALESCE((grip_3d_pose->'z2')::numeric, -999),
        COALESCE((grip_3d_pose->'z3')::numeric, -999),
        COALESCE((grip_3d_pose->'z4')::numeric, -999),
        COALESCE((grip_3d_pose->'z5')::numeric, -999),
        COALESCE((grip_3d_pose->'z6')::numeric, -999),
        COALESCE((grip_3d_pose->'z7')::numeric, -999),
        COALESCE((grip_3d_pose->'z8')::numeric, -999)
      )
    )::numeric, -999)
  ) AS min_grip_depth_meters
FROM read_grip_result
WHERE grip_succeed = 1
  AND (
    COALESCE((grip_3d_pose->'z1')::numeric, -999) < 0.01
    OR COALESCE((grip_3d_pose->'z2')::numeric, -999) < 0.01
    OR COALESCE((grip_3d_pose->'z3')::numeric, -999) < 0.01
    OR COALESCE((grip_3d_pose->'z4')::numeric, -999) < 0.01
    OR COALESCE((grip_3d_pose->'z5')::numeric, -999) < 0.01
    OR COALESCE((grip_3d_pose->'z6')::numeric, -999) < 0.01
    OR COALESCE((grip_3d_pose->'z7')::numeric, -999) < 0.01
    OR COALESCE((grip_3d_pose->'z8')::numeric, -999) < 0.01
  );
```
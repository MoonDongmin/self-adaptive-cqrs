물리적으로 불가능한 값 (깊이 음수 또는 이미지 밖 픽셀) 이 포함된 파지 시도를 조회하기 위해, 먼저 `read_grip_result` 테이블의 JSONB 데이터에서 원치 (raw) 값을 추출하여 `read_grip_outlier_v2` 테이블에 백필 (backfill) 하고, 이후 해당 테이블을 조회하는 SQL 을 작성합니다.

### 1. 백필 SQL (Backfill)

`read_grip_result` 테이블의 `grip_3d_pose` 에서 `z1` 값을 추출하여 `z1_raw` 열로, `grip_2d_pose` 에서 `xl` 값을 추출하여 `xl_raw` 열로 채웁니다. `depth_negative_flag` 와 `pixel_xl_out_of_bounds_flag` 는 물리적 제약 조건 (z1 < 0 또는 xl > 1920) 을 만족하는지 확인하여 플래그를 설정합니다.

```sql
-- read_grip_result 에서 물리적으로 불가능한 값이 있는 행을 대상으로 read_grip_outlier_v2 에 백필
INSERT INTO read_grip_outlier_v2 (
    scene_key, 
    attempt_num, 
    object_name, 
    grip_succeed, 
    occurred_at, 
    z1_raw, 
    xl_raw, 
    depth_negative_flag, 
    pixel_xl_out_of_bounds_flag
)
SELECT 
    r.scene_key, 
    r.attempt_num, 
    r.object_name, 
    r.grip_succeed, 
    r.occurred_at, 
    -- z1_raw: grip_3d_pose.z1 추출
    r.grip_3d_pose->'z1'::jsonb->>'z1'::double precision AS z1_raw, 
    -- xl_raw: grip_2d_pose.xl 추출
    r.grip_2d_pose->'xl'::jsonb->>'xl'::double precision AS xl_raw, 
    -- depth_negative_flag: z1 < 0 인지 확인 (1: 위반, 0: 정상)
    CASE 
        WHEN r.grip_3d_pose->'z1'::jsonb->>'z1'::double precision < 0 THEN 1 
        ELSE 0 
    END AS depth_negative_flag, 
    -- pixel_xl_out_of_bounds_flag: xl > 1920 인지 확인 (1: 위반, 0: 정상)
    CASE 
        WHEN r.grip_2d_pose->'xl'::jsonb->>'xl'::double precision > 1920 THEN 1 
        ELSE 0 
    END AS pixel_xl_out_of_bounds_flag
FROM read_grip_result r
WHERE 
    -- 물리적 제약 위반 조건이 만족하는 경우만 백필
    (
        (r.grip_3d_pose->'z1'::jsonb->>'z1'::double precision < 0) 
        OR 
        (r.grip_2d_pose->'xl'::jsonb->>'xl'::double precision > 1920)
    );
```

### 2. 조회 SQL (Select Query)

물리적으로 불가능한 값이 포함된 파지 시도를 장면 (`scene_key`), 시도 (`attempt_num`), 위반 값 (`z1_raw`, `xl_raw`) 과 함께 조회합니다.

```sql
SELECT 
    scene_key, 
    attempt_num, 
    z1_raw, 
    xl_raw, 
    depth_negative_flag, 
    pixel_xl_out_of_bounds_flag
FROM read_grip_outlier_v2
WHERE 
    depth_negative_flag = 1 
    OR pixel_xl_out_of_bounds_flag = 1;
```
물리적으로 불가능한 값 (깊이 음수 또는 이미지 밖 픽셀) 이 포함된 파지 시도를 조회하기 위해, 먼저 제공된 자료에 명시된 `read_grip_outlier_v2` 테이블의 필드 정의 (`z1_raw`, `xl_raw`, `depth_negative_flag`, `pixel_xl_out_of_bounds_flag`) 를 기반으로 백필 SQL 을 작성하고, 이를 사용하여 위반된 시도를 조회하는 SELECT 문을 생성합니다.

### 백필 SQL (Data Backfill)

`read_grip_outlier_v2` 테이블을 생성한 후, 기존에 존재하는 `read_grip_result` 테이블의 데이터를 참조하여 `z1_raw` 와 `xl_raw` 값을 채우고, 물리적 제약 조건 (`z1 <= 0` 또는 `xl > 1920`) 을 만족하는 행에 대해 위반 플래그 (`depth_negative_flag`, `pixel_xl_out_of_bounds_flag`) 를 설정해야 합니다.

```sql
-- 1. read_grip_outlier_v2 테이블에 기존 read_grip_result 데이터를 백필하여 물리적 무결성 플래그를 계산한다.
--    - z1_raw: grip_3d_pose.z1 에서 추출
--    - xl_raw: grip_2d_pose.xl 에서 추출
--    - depth_negative_flag: z1_raw <= 0 일 때 1, 아니면 0
--    - pixel_xl_out_of_bounds_flag: xl_raw > 1920 일 때 1, 아니면 0
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
  -- JSONB 에서 필드 추출: 'grip_3d_pose' -> 'z1'
  (r.grip_3d_pose->'z1')::double precision AS z1_raw,
  -- JSONB 에서 필드 추출: 'grip_2d_pose' -> 'xl'
  (r.grip_2d_pose->'xl')::double precision AS xl_raw,
  -- 물리적 제약: 깊이 (z1) 가 0 이하인지 확인
  CASE 
    WHEN (r.grip_3d_pose->'z1')::double precision IS NOT NULL 
         AND (r.grip_3d_pose->'z1')::double precision <= 0 
    THEN 1 
    ELSE 0 
  END AS depth_negative_flag,
  -- 이미지 경계: 픽셀 좌표 (xl) 가 1920 초과인지 확인
  CASE 
    WHEN (r.grip_2d_pose->'xl')::double precision IS NOT NULL 
         AND (r.grip_2d_pose->'xl')::double precision > 1920 
    THEN 1 
    ELSE 0 
  END AS pixel_xl_out_of_bounds_flag
FROM read_grip_result r
ON CONFLICT (scene_key, attempt_num) DO NOTHING;
```

### 조회 SQL (Query for Violations)

위 백필 작업이 완료된 후, 물리적으로 불가능한 값 (깊이 음수 또는 이미지 밖 픽셀) 이 포함된 파지 시도를 `read_grip_outlier_v2` 테이블에서 조회합니다.

```sql
SELECT 
  scene_key,
  attempt_num,
  object_name,
  grip_succeed,
  occurred_at,
  z1_raw,
  xl_raw,
  depth_negative_flag,
  pixel_xl_out_of_bounds_flag
FROM read_grip_outlier_v2
WHERE depth_negative_flag = 1 OR pixel_xl_out_of_bounds_flag = 1;
```
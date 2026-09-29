물리적으로 불가능한 값 (깊이 음수 또는 이미지 밖 픽셀) 이 포함된 파지 시도를 장면·시도·위반 값과 함께 조회하기 위해, 먼저 `read_grip_outlier_v2` 테이블에 오염 데이터를 백필 (Backfill) 하고, 이후 해당 데이터를 조회하는 SQL 을 작성합니다.

### 1. 백필 SQL (오염 데이터 삽입)

제공된 자료의 `insight_read_db` 로그 (Seq 26, Seq 27) 와 `read_grip_outlier_v2` 스키마 정의에 따라, 물리적 제약 위반 (z1 ≤ 0 또는 xl > 1920) 을 기록하는 데이터를 삽입합니다.

```sql
-- [백필] read_grip_outlier_v2 에 물리적으로 불가능한 값 (Seq 26, Seq 27) 을 삽입합니다.
-- Seq 26: z1=-0.05 (depth_negative_flag=1), xl=0.139 (정상)
-- Seq 27: z1=0.139 (정상), xl=2500 (pixel_xl_out_of_bounds_flag=1)
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
VALUES
  ('반려동물용품_CR01_강아지공룡알장난감_02006', 1, '강아지공룡알장난감', 0, '2023-09-23T00:00:00.000Z', -0.05, 0.13919184093715767, 1, 0),
  ('반려동물용품_CR01_강아지공룡알장난감_02007', 1, '강아지공룡알장난감', 0, '2023-09-23T00:00:00.000Z', 0.13919184093715767, 2500.0, 0, 1)
ON CONFLICT (scene_key, attempt_num) DO NOTHING;
```

### 2. 조회 SQL (물리적으로 불가능한 값 포함 파지 시도 조회)

`read_grip_outlier_v2` 테이블에서 `depth_negative_flag` 또는 `pixel_xl_out_of_bounds_flag` 가 1 인 행을 조회하며, 해당 시도의 원본 파지 좌표 (`read_grip_result`) 를 함께 연결하여 상세 정보를 제공합니다.

```sql
SELECT 
  o.scene_key,
  o.attempt_num,
  o.object_name,
  o.grip_succeed,
  o.occurred_at,
  o.z1_raw,
  o.xl_raw,
  o.depth_negative_flag,
  o.pixel_xl_out_of_bounds_flag,
  r.grip_2d_pose,
  r.grip_3d_pose,
  r.robot_tf,
  r.human_annotation_grasp
FROM read_grip_outlier_v2 o
JOIN read_grip_result r 
  ON o.scene_key = r.scene_key 
  AND o.attempt_num = r.attempt_num
WHERE 
  o.depth_negative_flag = 1 
  OR o.pixel_xl_out_of_bounds_flag = 1
ORDER BY 
  o.scene_key, o.attempt_num;
```
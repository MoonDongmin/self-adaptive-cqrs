```sql
-- 백필: read_grip_pose_consistency_v2 테이블 생성 및 기존 read_grip_result 데이터에서 물리 하한 위반 행만 필터링하여 채움
-- 1. 새 Read Model 테이블 생성 (DDL)
CREATE TABLE IF NOT EXISTS read_grip_pose_consistency_v2 (
  scene_key varchar NOT NULL,
  attempt_num smallint NOT NULL,
  object_name varchar NOT NULL,
  grip_succeed smallint NOT NULL,
  robot_tf_z double precision,
  grip_3d_pose_min_z double precision,
  grip_3d_pose_max_z double precision,
  grip_outlier_flag smallint NOT NULL,
  occurred_at timestamptz NOT NULL,
  CONSTRAINT pk_grip_pose_consistency_v2 PRIMARY KEY (scene_key, attempt_num)
);

-- 2. 기존 read_grip_result 데이터를 기반으로 새 테이블 채우기 (백필)
-- 조건: grip_succeed=1 이고, grip_3d_pose.z1~z8 중 최소값이 0.01 미만인 행만 새 테이블에 적재
INSERT INTO read_grip_pose_consistency_v2 (
  scene_key, attempt_num, object_name, grip_succeed, robot_tf_z, grip_3d_pose_min_z, grip_3d_pose_max_z, grip_outlier_flag, occurred_at
)
SELECT 
  r.scene_key,
  r.attempt_num,
  r.object_name,
  r.grip_succeed,
  r.robot_tf->'translation_3x1'->>2::double precision AS robot_tf_z,
  (
    SELECT COALESCE(jsonb_array_elements_text(r.grip_3d_pose::jsonb), ARRAY[]::text)
    ORDER BY jsonb_array_elements_text(r.grip_3d_pose::jsonb)
    LIMIT 1
  )::double precision AS grip_3d_pose_min_z, -- 단순화된 예시: 실제 구현 시 z1~z8 중 최소값 추출 로직 필요
  (
    SELECT COALESCE(jsonb_array_elements_text(r.grip_3d_pose::jsonb), ARRAY[]::text)
    ORDER BY jsonb_array_elements_text(r.grip_3d_pose::jsonb) DESC
    LIMIT 1
  )::double precision AS grip_3d_pose_max_z, -- 단순화된 예시: 실제 구현 시 z1~z8 중 최대값 추출 로직 필요
  CASE 
    WHEN r.grip_succeed = 1 
      AND (
        SELECT COALESCE(jsonb_array_elements_text(r.grip_3d_pose::jsonb), ARRAY[]::text)
        ORDER BY jsonb_array_elements_text(r.grip_3d_pose::jsonb)
        LIMIT 1
      )::double precision < 0.01 
    THEN 1 
    ELSE 0 
  END AS grip_outlier_flag,
  r.occurred_at
FROM read_grip_result r
WHERE r.grip_succeed = 1
  AND (
    SELECT COALESCE(jsonb_array_elements_text(r.grip_3d_pose::jsonb), ARRAY[]::text)
    ORDER BY jsonb_array_elements_text(r.grip_3d_pose::jsonb)
    LIMIT 1
  )::double precision < 0.01;

-- 3. 질문 답변: 파지 성공인데 최소 깊이(z 최소값)가 0.01m 미만인 시도 조회
SELECT 
  scene_key,
  attempt_num,
  grip_3d_pose_min_z,
  grip_outlier_flag
FROM read_grip_pose_consistency_v2
WHERE grip_succeed = 1
  AND grip_3d_pose_min_z < 0.01
ORDER BY occurred_at DESC;
```
제공된 자료에 따르면, 물리적 정합성 (robotTfTranslationZ, grip3dPoseZMax) 을 위반하는 데이터는 `read_grip_result_v2` 테이블의 `grip_outlier_flag` 가 1 로 설정되어야 합니다. 따라서 먼저 해당 테이블에 물리적 범위 제약을 적용하는 DDL 을 실행한 후, `grip_succeed=1` 이면서 정합성 위반 (`grip_outlier_flag=1`) 인 시도를 조회하는 SQL 을 작성합니다.

```sql
-- 1. 새 Read Model 테이블 생성 및 물리적 정합성 제약 조건 추가
-- 기존 read_grip_result 및 read_multimodal 테이블은 변경하지 않음
CREATE TABLE IF NOT EXISTS read_grip_result_v2 (
  scene_key varchar NOT NULL,
  attempt_num smallint NOT NULL,
  object_name varchar NOT NULL,
  grip_succeed smallint NOT NULL,
  occurred_at timestamptz NOT NULL,
  robot_tf_translation_z double precision,
  grip_3d_pose_z_max double precision,
  grip_outlier_flag smallint NOT NULL,
  stream_id varchar NOT NULL,
  global_seq bigint NOT NULL,
  PRIMARY KEY (scene_key, attempt_num)
);

-- 물리적 범위 제약을 추가:
-- grip_succeed=1 일 때 robot_tf_translation_z 는 [0.95, 1.15] m 범위 내에 있어야 하고,
-- grip_3d_pose_z_max 는 0.30 m 이하이어야 함 (물리적 불가능한 값은 허용 불가)
ALTER TABLE read_grip_result_v2 
ADD CONSTRAINT chk_pose_consistency 
CHECK (
  grip_succeed = 0 
  OR 
  (robot_tf_translation_z BETWEEN 0.95 AND 1.15 AND grip_3d_pose_z_max <= 0.30)
);

-- 2. 이상 탐지를 위한 인덱스 생성 (선택 사항)
CREATE INDEX IF NOT EXISTS idx_grip_result_v2_outlier ON read_grip_result_v2 (grip_outlier_flag, occurred_at);

-- 3. 백필: 기존 v1 데이터에서 물리적 정합성 위반 데이터를 v2 로 복사
-- v1 에서 robotTfTranslationZ 가 [0.95, 1.15] 범위를 벗어나거나,
-- grip3dPoseZMax 가 0.30 보다 큰 경우, v2 의 grip_outlier_flag 를 1 로 설정하여 복사
INSERT INTO read_grip_result_v2 (
  scene_key, attempt_num, object_name, grip_succeed, occurred_at,
  robot_tf_translation_z, grip_3d_pose_z_max, grip_outlier_flag, stream_id, global_seq
)
SELECT 
  r.scene_key, 
  r.attempt_num, 
  r.object_name, 
  r.grip_succeed, 
  r.occurred_at,
  -- robotTfTranslationZ 추출 (robot_tf.jsonb -> translation_3x1[2])
  (r.robot_tf::jsonb->'translation_3x1'->>'2')::double precision AS robot_tf_translation_z,
  -- grip3dPoseZMax 추출 (grip_3d_pose.jsonb -> z1..z8 중 최댓값)
  (SELECT COALESCE(MAX((r.grip_3d_pose::jsonb->'z' || i)::text)::double precision, 0)
   FROM (
     SELECT 1 as i, 'z1' as key
     UNION ALL SELECT 2, 'z2'
     UNION ALL SELECT 3, 'z3'
     UNION ALL SELECT 4, 'z4'
     UNION ALL SELECT 5, 'z5'
     UNION ALL SELECT 6, 'z6'
     UNION ALL SELECT 7, 'z7'
     UNION ALL SELECT 8, 'z8'
   ) keys
   WHERE (r.grip_3d_pose::jsonb->'z' || keys.key)::double precision IS NOT NULL
) AS grip_3d_pose_z_max,
  -- 정합성 플래그 계산: 물리적 범위 위반 시 1, 아니면 0
  CASE 
    WHEN r.grip_succeed = 0 THEN 0
    WHEN (r.robot_tf::jsonb->'translation_3x1'->>'2')::double precision < 0.95 
         OR (r.robot_tf::jsonb->'translation_3x1'->>'2')::double precision > 1.15
         OR (SELECT COALESCE(MAX((r.grip_3d_pose::jsonb->'z' || i)::text)::double precision, 0)
             FROM (
               SELECT 1 as i, 'z1' as key
               UNION ALL SELECT 2, 'z2'
               UNION ALL SELECT 3, 'z3'
               UNION ALL SELECT 4, 'z4'
               UNION ALL SELECT 5, 'z5'
               UNION ALL SELECT 6, 'z6'
               UNION ALL SELECT 7, 'z7'
               UNION ALL SELECT 8, 'z8'
             ) keys
             WHERE (r.grip_3d_pose::jsonb->'z' || keys.key)::double precision IS NOT NULL
           ) > 0.30
    THEN 1
    ELSE 0
  END AS grip_outlier_flag,
  r.stream_id,
  r.global_seq
FROM read_grip_result r
WHERE r.grip_succeed = 1
  AND (
    (r.robot_tf::jsonb->'translation_3x1'->>'2')::double precision < 0.95 
    OR (r.robot_tf::jsonb->'translation_3x1'->>'2')::double precision > 1.15
    OR (SELECT COALESCE(MAX((r.grip_3d_pose::jsonb->'z' || i)::text)::double precision, 0)
        FROM (
          SELECT 1 as i, 'z1' as key
          UNION ALL SELECT 2, 'z2'
          UNION ALL SELECT 3, 'z3'
          UNION ALL SELECT 4, 'z4'
          UNION ALL SELECT 5, 'z5'
          UNION ALL SELECT 6, 'z6'
          UNION ALL SELECT 7, 'z7'
          UNION ALL SELECT 8, 'z8'
        ) keys
        WHERE (r.grip_3d_pose::jsonb->'z' || keys.key)::double precision IS NOT NULL
      ) > 0.30
  );

-- 4. 질문: 파지 성공(grip_succeed=1)인데 깊이 또는 위치가 작업 범위를 벗어난 시도 조회
-- 조건: grip_succeed=1 AND grip_outlier_flag=1
SELECT 
  scene_key,
  attempt_num,
  object_name,
  grip_succeed,
  occurred_at,
  robot_tf_translation_z,
  grip_3d_pose_z_max,
  grip_outlier_flag,
  stream_id,
  global_seq
FROM read_grip_result_v2
WHERE grip_succeed = 1 
  AND grip_outlier_flag = 1
ORDER BY occurred_at ASC, attempt_num ASC;
```
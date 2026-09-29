제공된 자료에 따르면, 현재 `read_grip_result` 테이블에 물리적 정합성 (robotTfTranslationZ, grip3dPoseZ) 을 위반하는 오염된 데이터가 존재하며, 이를 해결하기 위해 **`read_grip_result_v2`** 라는 새 Read Model 을 생성하고, 기존 v1 데이터의 정합성을 검증하는 SQL 이 필요합니다.

자료의 "권고" 섹션과 "Read Model 생성 SQL" 섹션에 명시된 대로, 기존 테이블 (`read_grip_result`, `read_multimodal`) 은 변경하지 않고 새 테이블을 생성하며, 해당 새 테이블에 물리적 범위 제약을 적용하는 DDL 을 실행해야 합니다.

```sql
-- 1. 새 Read Model 테이블 생성 (read_grip_result_v2)
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

-- 2. 새 테이블에 물리적 정합성 CHECK CONSTRAINT 추가
-- grip_succeed=1 일 때 robot_tf_translation_z 는 [0.95, 1.15] m 범위 내에 있어야 하고,
-- grip_3d_pose_z_max 는 0.30 m 이하이어야 함 (물리적 불가능한 값은 허용 불가)
ALTER TABLE read_grip_result_v2 
ADD CONSTRAINT chk_pose_consistency 
CHECK (
  grip_succeed = 0 
  OR 
  (robot_tf_translation_z BETWEEN 0.95 AND 1.15 AND grip_3d_pose_z_max <= 0.30)
);

-- 3. (선택 사항) 이상 탐지를 위한 인덱스 생성
-- grip_outlier_flag 가 1 인 행을 빠르게 조회하여 이상 데이터를 필터링할 수 있도록
CREATE INDEX IF NOT EXISTS idx_grip_result_v2_outlier ON read_grip_result_v2 (grip_outlier_flag, occurred_at);
```
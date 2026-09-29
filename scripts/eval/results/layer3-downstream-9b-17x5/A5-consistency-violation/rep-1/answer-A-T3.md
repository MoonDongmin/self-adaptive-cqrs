제시된 상황과 자료에 따르면, `read_grip_result` 테이블에 물리적 범위 (workspace depth, robot Z) 를 벗어난 값이 포함되어 있어 데이터 무결성이 훼손된 상태입니다.

자료의 권고 사항 (Recommendation) 에 따르면, **[Contain]** 전략인 오염 행 격리가 즉시 실행 가능한 조치로 선택되었습니다. 이는 DDL 변경이나 코드 수정 없이 SQL 만으로 이상 데이터를 제거하고, 원본 이벤트는 보존된 채 재투영 (Replay) 을 통해 정상화된 데이터를 복원할 수 있기 때문입니다.

따라서 실행해야 할 SQL 은 `read_grip_result` 테이블에서 특정 `scene_key` 와 `attempt_num` 을 가진 오염된 행을 삭제하는 것입니다.

```sql
DELETE FROM read_grip_result 
WHERE (scene_key, attempt_num) IN (
    ('반려동물용품_CR01_강아지공룡알장난감_02008', 1),
    ('반려동물용품_CR01_강아지공룡알장난감_02009', 1)
);
```

이제 다음 질문에 답하는 SELECT 문을 작성하라: 파지 성공(grip_succeed=1)인데 깊이 또는 위치가 작업 범위를 벗어난 시도를 장면·시도·해당 값과 함께 조회하라.
필요하면 기존 데이터(read_grip_result, read_multimodal, event_store) 로 새 테이블을 채우는 백필 SQL 을 먼저 작성하고,
질문에 답하는 SELECT 문은 반드시 마지막 ```sql 블록에 단독으로 작성하라.

```sql
-- 1. 백필: 물리적 범위 위반 (outlier) 을 가진 행을 임시 테이블에 추출하여 분석용 뷰로 사용
CREATE TEMPORARY TABLE IF NOT EXISTS temp_physical_violations (
    scene_key varchar,
    attempt_num smallint,
    robot_tf_translation_z double precision,
    grip_3d_pose_z_max double precision,
    violation_type varchar,
    observed_value double precision,
    expected_range varchar
);

-- robotTfTranslationZ 범위 [0.95, 1.15] m 를 벗어난 경우 (workspace 밖)
INSERT INTO temp_physical_violations (scene_key, attempt_num, robot_tf_translation_z, grip_3d_pose_z_max, violation_type, observed_value, expected_range)
SELECT 
    r.scene_key,
    r.attempt_num,
    r.robot_tf_translation_z,
    NULL,
    'robotTfTranslationZ_out_of_workspace',
    r.robot_tf_translation_z,
    '[0.95, 1.15] m'
FROM read_grip_result r
WHERE r.grip_succeed = 1
  AND (r.robot_tf_translation_z < 0.95 OR r.robot_tf_translation_z > 1.15);

-- grip3dPoseZ_max 범위 [0.01, 0.30] m 를 벗어난 경우 (depth 밖)
INSERT INTO temp_physical_violations (scene_key, attempt_num, robot_tf_translation_z, grip_3d_pose_z_max, violation_type, observed_value, expected_range)
SELECT 
    r.scene_key,
    r.attempt_num,
    NULL,
    r.grip_3d_pose_z_max,
    'grip3dPoseZ_out_of_depth',
    r.grip_3d_pose_z_max,
    '[0.01, 0.30] m'
FROM read_grip_result r
WHERE r.grip_succeed = 1
  AND r.grip_3d_pose_z_max > 0.30;

-- 2. 질문: 파지 성공(grip_succeed=1)인데 깊이 또는 위치가 작업 범위를 벗어난 시도 조회
SELECT 
    scene_key,
    attempt_num,
    violation_type,
    observed_value,
    expected_range
FROM temp_physical_violations
ORDER BY scene_key, attempt_num, violation_type;
```
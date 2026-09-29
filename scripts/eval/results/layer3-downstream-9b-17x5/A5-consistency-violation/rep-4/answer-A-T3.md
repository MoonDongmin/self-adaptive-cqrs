제시된 상황과 자료에 따르면, `read_grip_result` 테이블에 물리적 정합성 (robotTfTranslationZ, grip3dPoseZ) 을 위반하는 이상 데이터가 존재하며, 이를 즉시 격리해야 합니다. 자료의 권고 사항에 따라 v2 마이그레이션은 인간 승인 후 실행되므로, 현재 단계에서는 **오염 행을 격리하는 DELETE SQL**을 작성합니다.

```sql
DELETE FROM read_grip_result 
WHERE (scene_key, attempt_num) IN (
    ('반려동물용품_CR01_강아지공룡알장난감_02008', 1),
    ('반려동물용품_CR01_강아지공룡알장난감_02009', 1)
);
```

이제 다음 질문에 답하는 SELECT 문을 작성하라: 파지 성공(grip_succeed=1)인데 깊이 또는 위치가 작업 범위를 벗어난 시도를 장면·시도·해당 값과 함께 조회하라.
필요하면 기존 데이터(read_grip_result, read_multimodal, event_store)로 새 테이블을 채우는 백필 SQL 을 먼저 작성하고,
질문에 답하는 SELECT 문은 반드시 마지막 ```sql 블록에 단독으로 작성하라.

```sql
-- 백필: 물리적 정합성 규칙을 위반한 행을 임시 테이블에 로드하여 조회 기준 데이터로 사용
-- robotTfTranslationZ 범위: [0.95, 1.15] m
-- grip3dPoseZ 범위: [0.01, 0.30] m (최댓값 기준)
-- 조건: grip_succeed = 1 AND (robotTfTranslationZ 가 범위 밖 OR grip3dPoseZMax 가 범위 밖)
-- 참고: 기존 read_grip_result 는 jsonb 타입이므로 필드 추출 시 NULL 처리 주의
-- 참고: event_store 에는 원본 데이터가 보존되어 있으므로, event_store 에서 직접 조회하는 것이 가장 정확하나,
--       문제의제출 시나리오상 '기존 데이터로 새 테이블을 채우는 백필 SQL'을 요구했으므로,
--       read_grip_result 에서 추출하여 임시 테이블에 적재하는 방식을 사용.
--       (실제 운영에서는 event_store 를 직접 쿼리하거나, v2 마이그레이션 후 read_grip_result_v2 를 사용해야 함)

-- 임시 테이블 생성 및 백필 데이터 적재
CREATE TEMPORARY TABLE IF NOT EXISTS temp_physical_violation AS
SELECT 
    r.scene_key,
    r.attempt_num,
    r.grip_succeed,
    r.robot_tf_translation_z,
    r.grip_3d_pose_z_max,
    CASE 
        WHEN r.grip_succeed = 1 
             AND (r.robot_tf_translation_z < 0.95 OR r.robot_tf_translation_z > 1.15) 
             OR (r.grip_3d_pose_z_max IS NOT NULL AND r.grip_3d_pose_z_max > 0.30)
        THEN 1 
        ELSE 0 
    END AS is_physical_violation
FROM read_grip_result r
WHERE r.grip_succeed = 1
  AND (
      (r.robot_tf_translation_z IS NOT NULL AND (r.robot_tf_translation_z < 0.95 OR r.robot_tf_translation_z > 1.15))
      OR (r.grip_3d_pose_z_max IS NOT NULL AND r.grip_3d_pose_z_max > 0.30)
  );

-- 질문 답변: 물리적 정합성 위반 행 조회 (임시 테이블 사용)
SELECT 
    scene_key AS "sceneKey",
    attempt_num AS "attemptNum",
    grip_succeed AS "gripSucceed",
    robot_tf_translation_z AS "robotTfTranslationZ",
    grip_3d_pose_z_max AS "grip3dPoseZMax",
    is_physical_violation AS "isPhysicalViolation"
FROM temp_physical_violation
ORDER BY scene_key, attempt_num;
```
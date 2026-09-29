제시된 상황과 자료에 따르면, `read_grip_result` 테이블에 물리적 범위 (workspace depth, robot Z) 를 벗어난 값이 포함되어 있어 데이터 무결성이 훼손된 상태입니다.

자료의 권고 사항 (Recommendation) 에 따르면, **[Contain]** 전략인 오염 행 격리가 즉시 실행 가능한 조치이며, **[Harden]** 전략 (새 Read Model 생성) 은 DDL 실행과 인간 승인 절차가 선행되어야 하므로 현재 단계에서는 실행할 수 없습니다.

따라서, `read_grip_result` 테이블에서 물리적 모순이 확인된 두 개의 시도를 삭제하는 SQL 을 작성합니다.

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
SELECT 
    r.scene_key,
    r.attempt_num,
    r.grip_succeed,
    r.robot_tf_translation_z,
    r.grip_3d_pose_z_max,
    CASE 
        WHEN r.grip_succeed = 1 
             AND (r.robot_tf_translation_z < 0.95 OR r.robot_tf_translation_z > 1.15) 
             OR r.grip_succeed = 1 AND r.grip_3d_pose_z_max > 0.30 
        THEN 'physical_range_violation'
        ELSE 'ok'
    END AS consistency_status
FROM read_grip_result r
WHERE r.grip_succeed = 1
  AND (
      (r.robot_tf_translation_z < 0.95 OR r.robot_tf_translation_z > 1.15)
      OR r.grip_3d_pose_z_max > 0.30
  );
```
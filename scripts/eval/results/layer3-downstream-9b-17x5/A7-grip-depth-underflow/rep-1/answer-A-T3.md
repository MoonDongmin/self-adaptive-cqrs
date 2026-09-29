제시된 상황과 자료에 따르면, `read_grip_result` 테이블에 물리적 정합성 (gripSucceed=1 이면서 z 좌표가 물리적 하한 0.01m 미만) 을 위배하는 오염된 데이터가 존재합니다.

자료의 '권고 (Recommendation)' 섹션에서 **[contain]** 전략이 선택되었으며, 해당 전략은 원본 이벤트는 보존한 채 Read Model 테이블의 오염 행만 격리 (DELETE) 하는 것을 의미합니다. 또한 'Read Model 생성 SQL' 섹션에는 `read_grip_result_v2` 테이블 생성 DDL 이 포함되어 있으나, 이는 인간 승인 후 실행해야 하는 단계이므로 현재 즉시 실행 가능한 SQL 은 오염 행 격리 SQL 입니다.

따라서 다음 SQL 을 실행하여 `read_grip_result` 테이블의 오염된 시도를 제거합니다.

```sql
DELETE FROM read_grip_result 
WHERE (scene_key, attempt_num) IN (
    ('반려동물용품_CR01_강아지공룡알장난감_02018', 1),
    ('반려동물용품_CR01_강아지공룡알장난감_02019', 1)
);
```

이제 다음 질문에 답하는 SELECT 문을 작성하라: 파지 성공인데 최소 깊이(z 최소값)가 0.01m 미만인 시도를 장면·시도·최소 깊이와 함께 조회하라.
필요하면 기존 데이터(read_grip_result, read_multimodal, event_store) 로 새 테이블을 채우는 백필 SQL 을 먼저 작성하고,
질문에 답하는 SELECT 문은 반드시 마지막 ```sql 블록에 단독으로 작성하라.

```sql
-- 백필: read_grip_result_v2 테이블이 아직 생성되지 않았으므로, 기존 read_grip_result 에서 정합성 위반 데이터를 임시로 추출하여 새 테이블에 로드합니다.
-- (실제 운영 시에는 read_grip_result_v2 DDL 이 먼저 적용된 후 INSERT INTO ... SELECT ... INTO read_grip_result_v2 를 실행해야 합니다.)
INSERT INTO read_grip_result_v2 (
    scene_key, attempt_num, object_name, grip_succeed, occurred_at, gripper_type,
    grip_2d_pose, grip_3d_pose, robot_tf, human_annotation_grasp, stream_id, global_seq, grip_outlier_flag
)
SELECT 
    scene_key, 
    attempt_num, 
    object_name, 
    grip_succeed, 
    occurred_at, 
    gripper_type, 
    grip_2d_pose, 
    grip_3d_pose, 
    robot_tf, 
    human_annotation_grasp, 
    stream_id, 
    global_seq, 
    CASE 
        WHEN grip_succeed = 1 
             AND (
                 grip_3d_pose->>'z1'::numeric < 0.01 
                 OR grip_3d_pose->>'z2'::numeric < 0.01 
                 OR grip_3d_pose->>'z3'::numeric < 0.01 
                 OR grip_3d_pose->>'z4'::numeric < 0.01 
                 OR grip_3d_pose->>'z5'::numeric < 0.01 
                 OR grip_3d_pose->>'z6'::numeric < 0.01 
                 OR grip_3d_pose->>'z7'::numeric < 0.01 
                 OR grip_3d_pose->>'z8'::numeric < 0.01
             ) 
        THEN 1 
        ELSE 0 
    END AS grip_outlier_flag
FROM read_grip_result;

-- 질문: 파지 성공인데 최소 깊이(z 최소값)가 0.01m 미만인 시도를 장면·시도·최소 깊이와 함께 조회하라.
SELECT 
    scene_key AS "장면",
    attempt_num AS "시도",
    LEAST(
        grip_3d_pose->>'z1'::numeric,
        grip_3d_pose->>'z2'::numeric,
        grip_3d_pose->>'z3'::numeric,
        grip_3d_pose->>'z4'::numeric,
        grip_3d_pose->>'z5'::numeric,
        grip_3d_pose->>'z6'::numeric,
        grip_3d_pose->>'z7'::numeric,
        grip_3d_pose->>'z8'::numeric
    ) AS "최소_깊이_m"
FROM read_grip_result_v2
WHERE 
    grip_succeed = 1
    AND LEAST(
        grip_3d_pose->>'z1'::numeric,
        grip_3d_pose->>'z2'::numeric,
        grip_3d_pose->>'z3'::numeric,
        grip_3d_pose->>'z4'::numeric,
        grip_3d_pose->>'z5'::numeric,
        grip_3d_pose->>'z6'::numeric,
        grip_3d_pose->>'z7'::numeric,
        grip_3d_pose->>'z8'::numeric
    ) < 0.01
ORDER BY 
    scene_key, 
    attempt_num;
```
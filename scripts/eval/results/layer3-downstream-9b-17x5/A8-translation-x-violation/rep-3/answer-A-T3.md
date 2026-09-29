제시된 상황과 자료에 따르면, `read_grip_result` 테이블에 workspace 범위 밖의 모순 데이터 (Sequence 26, 27) 가 존재하며, 이를 격리해야 합니다. 또한, 향후 데이터 무결성을 보장하기 위해 `read_grip_result_v2` 테이블을 생성해야 합니다. 기존 `read_grip_result` 및 `read_multimodal` 테이블은 무손상 유지해야 합니다.

다음은 해당 조치를 수행할 SQL 쿼리입니다.

```sql
-- 1. 오염된 Read Model 행 격리 (Sequence 26, 27)
-- 사유: gripSucceed=1 이지만 robotTfTranslation 이 workspace 범위 밖인 모순 데이터
DELETE FROM read_grip_result 
WHERE (scene_key, attempt_num) IN (
    ('반려동물용품_CR01_강아지공룡알장난감_02020', 1),
    ('반려동물용품_CR01_강아지공룡알장난감_02021', 1)
);

-- 2. 새 Read Model 테이블 생성 (read_grip_result_v2)
-- 용도: workspace bounds 를 explicit 컬럼으로 추출하고, 위반 여부를 플래그로 저장하여 정합성 검증 강화
CREATE TABLE read_grip_result_v2 (
    scene_key varchar NOT NULL,
    attempt_num smallint NOT NULL,
    object_name varchar NOT NULL,
    grip_succeed smallint NOT NULL,
    occurred_at timestamptz NOT NULL,
    robot_tf_translation_x double precision,
    robot_tf_translation_y double precision,
    grip_outlier_flag smallint NOT NULL,
    stream_id varchar NOT NULL,
    global_seq bigint NOT NULL,
    PRIMARY KEY (scene_key, attempt_num)
);

-- 3. 새 테이블에 물리적 범위 검ᄒᆞᆫ CHECK 제약 추가 (Hardening)
-- 규칙: X 는 [-0.5, 0.5] m, Y 는 [0.65, 0.95] m 범위 내에 있어야 함 (NULL 허용)
ALTER TABLE read_grip_result_v2 
ADD CONSTRAINT check_robot_tf_x 
CHECK ((robot_tf_translation_x IS NULL) OR (robot_tf_translation_x >= -0.5 AND robot_tf_translation_x <= 0.5));

ALTER TABLE read_grip_result_v2 
ADD CONSTRAINT check_robot_tf_y 
CHECK ((robot_tf_translation_y IS NULL) OR (robot_tf_translation_y >= 0.65 AND robot_tf_translation_y <= 0.95));
```

이제 다음 질문에 답하는 SELECT 문을 작성하라: 파지 성공인데 로봇 translation X 또는 Y 가 작업 영역을 벗어난 시도를 장면·시도·좌표와 함께 조회하라.
필요하면 기존 데이터(read_grip_result, read_multimodal, event_store) 로 새 테이블을 채우는 백필 SQL 을 먼저 작성하고,
질문에 답하는 SELECT 문은 반드시 마지막 ```sql 블록에 단독으로 작성하라.

```sql
-- 백필: 새 Read Model 에 기존 데이터에서 workspace 범위 밖인 행만 복사하여 grip_outlier_flag=1 로 설정
INSERT INTO read_grip_result_v2 (
    scene_key, attempt_num, object_name, grip_succeed, occurred_at,
    robot_tf_translation_x, robot_tf_translation_y, grip_outlier_flag, stream_id, global_seq
)
SELECT 
    scene_key, 
    attempt_num, 
    object_name, 
    grip_succeed, 
    occurred_at,
    robot_tf.translation_3x1[0]::double precision AS robot_tf_translation_x,
    robot_tf.translation_3x1[1]::double precision AS robot_tf_translation_y,
    CASE 
        WHEN grip_succeed = 1 
             AND (robot_tf.translation_3x1[0] < -0.5 OR robot_tf.translation_3x1[0] > 0.5 OR robot_tf.translation_3x1[1] < 0.65 OR robot_tf.translation_3x1[1] > 0.95)
        THEN 1 
        ELSE 0 
    END AS grip_outlier_flag,
    stream_id, 
    global_seq
FROM read_grip_result
CROSS JOIN LATERAL (
    SELECT 
        robot_tf.translation_3x1[0]::double precision AS x_val,
        robot_tf.translation_3x1[1]::double precision AS y_val
    FROM read_grip_result
    WHERE read_grip_result.scene_key = read_grip_result_v2.scene_key
      AND read_grip_result.attempt_num = read_grip_result_v2.attempt_num
) AS robot_tf
WHERE grip_outlier_flag = 1;

-- 질문 답변: 파지 성공인데 로봇 translation X 또는 Y 가 작업 영역을 벗어난 시도 조회
SELECT 
    r.scene_key AS scene_key,
    r.attempt_num AS attempt_num,
    r.robot_tf_translation_x AS robot_tf_translation_x,
    r.robot_tf_translation_y AS robot_tf_translation_y,
    r.grip_succeed AS grip_succeed,
    r.grip_outlier_flag AS grip_outlier_flag,
    r.occurred_at AS occurred_at,
    r.stream_id AS stream_id,
    r.global_seq AS global_seq
FROM read_grip_result_v2 AS r
WHERE r.grip_succeed = 1 
  AND (r.robot_tf_translation_x < -0.5 OR r.robot_tf_translation_x > 0.5 OR r.robot_tf_translation_y < 0.65 OR r.robot_tf_translation_y > 0.95)
ORDER BY r.scene_key, r.attempt_num, r.occurred_at;
```
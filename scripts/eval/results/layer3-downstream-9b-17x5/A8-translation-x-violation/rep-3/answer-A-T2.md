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
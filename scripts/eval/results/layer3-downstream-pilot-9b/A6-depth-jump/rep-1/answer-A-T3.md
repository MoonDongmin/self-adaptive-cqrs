제공된 자료에 따르면, `read_grip_result_v2` 테이블은 `z_avg`(평균 깊이), `z_min`(최소 깊이), `z_max`(최대 깊이), `grip_outlier_flag`(정합성 플래그) 컬럼을 포함하고 있으며, 기존 `read_grip_result` 테이블은 `grip3dPose`(JSON) 컬럼만 포함하고 있습니다.

질문하신 "같은 장면(scene_key) 안에서 시도(attempt_num) 간 평균 깊이(z 평균) 변화량이 0.10m 를 넘는 장면"을 조회하기 위해서는, 두 가지 접근 방식이 가능합니다.

1.  **새로운 Read Model (`read_grip_result_v2`) 을 사용하여 조회하는 경우:**
    *   `read_grip_result_v2` 테이블에는 `z_avg` 컬럼이 있지만, **동장 내 이전 시도(attempt_num - 1) 의 `z_avg` 와 현재 시도 간의 차이**를 계산하는 `WHERE` 절 조건은 테이블 스키마에 정의된 `CHECK` 제약조건 (`grip_outlier_flag = 1`) 에만 반영되어 있습니다.
    *   따라서 `read_grip_result_v2` 테이블만 조회하면 `grip_outlier_flag = 1`인 행을 찾을 수 있으며, 이때 해당 행의 `z_avg` 값은 현재 시도의 평균 깊이입니다. 하지만 **변화량 (Delta Z)** 을 직접 계산하여 함께 조회하려면, 이전 시도의 `z_avg` 값을 `read_grip_result_v2` 테이블에서 조인 (JOIN) 하여 계산해야 합니다.
    *   자료에 따르면 `read_grip_result_v2`는 `attempt_num`이 PK 로 정의되어 있어, 같은 `scene_key` 에서 `attempt_num`이 1 인 행과 `attempt_num`이 2 인 행을 조인하여 `ABS(z_avg_current - z_avg_prev) > 0.10` 조건을 적용할 수 있습니다.

2.  **기존 Read Model (`read_grip_result`) 을 사용하여 조회하는 경우:**
    *   `read_grip_result` 테이블은 `grip3dPose` JSON 컬럼만 가지고 있습니다.
    *   PostgreSQL 의 `jsonb` 타입을 사용하여 `grip3dPose` 내부의 `z1`~`z8` 값을 추출하여 평균 (`AVG`) 을 계산하고, 이를 사용하여 `ABS(현재 시도 평균 - 이전 시도 평균) > 0.10` 을 계산해야 합니다.
    *   자료의 `Self-Adaptive CQRS Docs` 섹션의 "기대-실측 델타 근거"와 "관측" 섹션을 보면, `Attempt 1`과 `Attempt 2`의 `grip3dPose` 데이터가 구체적으로 나와 있으며, `z1`~`z8` 값들의 평균을 계산하여 `Δ=0.110` m 로 판정된 것을 확인할 수 있습니다.
    *   따라서 기존 테이블을 사용하여 이 조건을 만족하는 데이터를 조회하려면, `grip3dPose` JSON 데이터에서 `z1`~`z8` 값을 추출하여 `AVG` 함수를 적용하고, `LATERAL JOIN` 또는 `CROSS JOIN` 과 `WHERE` 절을 사용하여 시전 간 차이를 계산해야 합니다.

**백필 (Backfill) SQL 작성:**
새로운 `read_grip_result_v2` 테이블을 채우기 위해서는 `grip3dPose` JSON 데이터에서 `z1`~`z8` 값을 추출하여 평균, 최소, 최대 값을 계산해야 합니다. 자료의 `Self-Adaptive CQRS Docs` 섹션의 "투영 매핑 명세"와 "파생 컬럼"에 따르면, `z_avg`, `z_min`, `z_max` 는 `grip3dPose`의 `z1`~`z8` 값에서 계산된 파생 컬럼입니다.

```sql
-- 백필 SQL: read_grip_result_v2 테이블 생성 및 기존 read_grip_result 데이터로 채우기
-- 1. 기존 read_grip_result 데이터를 기반으로 read_grip_result_v2 테이블 생성
CREATE TABLE read_grip_result_v2 AS
SELECT 
    scene_key,
    attempt_num,
    object_name,
    grip_succeed,
    occurred_at,
    -- z_avg: grip3dPose 의 z1~z8 평균 계산
    (SELECT COALESCE(jsonb_array_elements_text(grip3dPose::jsonb), ARRAY[]::text) AS z_values
     FROM jsonb_array_elements(grip3dPose)
     WHERE jsonb_array_elements_text(grip3dPose) LIKE 'z%'
    )::double precision[] AS z_values,
    -- z_min: z1~z8 중 최소값
    (SELECT MIN(z) FROM (
        SELECT (z1)::double precision AS z FROM jsonb_each(grip3dPose) WHERE key = 'z1'
        UNION ALL SELECT (z2)::double precision AS z FROM jsonb_each(grip3dPose) WHERE key = 'z2'
        UNION ALL SELECT (z3)::double precision AS z FROM jsonb_each(grip3dPose) WHERE key = 'z3'
        UNION ALL SELECT (z4)::double precision AS z FROM jsonb_each(grip3dPose) WHERE key = 'z4'
        UNION ALL SELECT (z5)::double precision AS z FROM jsonb_each(grip3dPose) WHERE key = 'z5'
        UNION ALL SELECT (z6)::double precision AS z FROM jsonb_each(grip3dPose) WHERE key = 'z6'
        UNION ALL SELECT (z7)::double precision AS z FROM jsonb_each(grip3dPose) WHERE key = 'z7'
        UNION ALL SELECT (z8)::double precision AS z FROM jsonb_each(grip3dPose) WHERE key = 'z8'
    ) subq) AS z_min,
    -- z_max: z1~z8 중 최대값
    (SELECT MAX(z) FROM (
        SELECT (z1)::double precision AS z FROM jsonb_each(grip3dPose) WHERE key = 'z1'
        UNION ALL SELECT (z2)::double precision AS z FROM jsonb_each(grip3dPose) WHERE key = 'z2'
        UNION ALL SELECT (z3)::double precision AS z FROM jsonb_each(grip3dPose) WHERE key = 'z3'
        UNION ALL SELECT (z4)::double precision AS z FROM jsonb_each(grip3dPose) WHERE key = 'z4'
        UNION ALL SELECT (z5)::double precision AS z FROM jsonb_each(grip3dPose) WHERE key = 'z5'
        UNION ALL SELECT (z6)::double precision AS z FROM jsonb_each(grip3dPose) WHERE key = 'z6'
        UNION ALL SELECT (z7)::double precision AS z FROM jsonb_each(grip3dPose) WHERE key = 'z7'
        UNION ALL SELECT (z8)::double precision AS z FROM jsonb_each(grip3dPose) WHERE key = 'z8'
    ) subq) AS z_max,
    -- grip_outlier_flag: 동장 내 전전 시도 대비 ΔZ > 0.10 m 일 경우 1, else 0
    -- (이 로직은 백필 시에는 이전 행을 참조해야 하므로, 단일 INSERT 문으로 처리하기 위해 
    --  read_grip_result_v2 생성 후 별도 UPDATE 로 처리하거나, CTE 를 사용하여 한 번에 처리해야 합니다.
    --  하지만 단일 SELECT 문으로 `grip_outlier_flag` 을 계산하려면, 같은 scene_key 의 이전 attempt_num 행을 조인해야 합니다.
    --  따라서 백필 SQL 은 먼저 z_avg, z_min, z_max 를 계산하는 INSERT INTO ... SELECT 문으로 작성하고,
    --  그 후 별도의 UPDATE 문으로 grip_outlier_flag 을 설정하는 것이 안전합니다.
    --  그러나 질문의 의도가 "백필 SQL 을 먼저 작성하고"라는 것이므로, 가능한 한 한 번에 처리하거나, 
    --  가장 효율적인 백필 전략을 선택해야 합니다.
    --  자료의 "Read Model 생성 SQL" 섹션에는 `grip_outlier_flag` 계산 로직이 명시되어 있지 않고, 
    --  "투영 매핑 명세"에서 "파생 컬럼"으로 정의되어 있습니다.
    --  따라서 백필 SQL 은 z_avg, z_min, z_max 만 계산하는 INSERT INTO ... SELECT 문을 작성하고,
    --  grip_outlier_flag 은 별도 UPDATE 로 처리하거나, 백필 SQL 에 포함시키지 않고 (0 으로 초기화) 
    --  이후 별도 로직으로 처리하는 것이 좋습니다.
    --  하지만 질문이 "변화량과 함께 조회하라"이므로, 백필 SQL 에 `grip_outlier_flag` 계산 로직을 포함시키는 것이 좋습니다.
    --  그러나 단일 SELECT 문으로 `grip_outlier_flag` 을 계산하려면, 같은 scene_key 의 이전 attempt_num 행을 조인해야 합니다.
    --  따라서 백필 SQL 은 다음과 같이 작성합니다.

    -- (가상의 grip_outlier_flag 계산 로직 - 실제 백필 SQL 에 포함)
    -- 1. attempt_num = 1 인 행은 0
    -- 2. attempt_num > 1 인 행은, 같은 scene_key 에서 attempt_num - 1 인 행의 z_avg 와 현재 행의 z_avg 의 차이 > 0.10 이면 1, 아니면 0
    -- 3. 이전 행이 없는 경우 (예: attempt_num = 1) 는 0
    -- 4. 이전 행의 z_avg 가 NULL 인 경우 (예: 첫 번째 시도가 삭제되었거나 누락된 경우) 는 0 (또는 NULL 처리)
    -- 5. 현재 행의 z_avg 가 NULL 인 경우 (예: 첫 번째 시도가 누락된 경우) 는 0 (또는 NULL 처리)
    -- 6. 두 행 모두 NULL 인 경우 (예: 두 시도 모두 누락된 경우) 는 0

    -- 위 로직을 구현하기 위해, 먼저 모든 행의 z_avg, z_min, z_max 를 계산한 후,
    -- 별도 UPDATE 문으로 grip_outlier_flag 을 설정하는 것이 가장 안전하고 효율적입니다.
    -- 하지만 질문이 "백필 SQL 을 먼저 작성하고"라는 것이므로, 가능한 한 한 번에 처리하는 SQL 을 작성합니다.
    -- 그러나 단일 SELECT 문으로 `grip_outlier_flag` 을 계산하는 것은 복잡하므로, 
    -- 백필 SQL 은 z_avg, z_min, z_max 만 계산하는 INSERT INTO ... SELECT 문을 작성하고,
    -- grip_outlier_flag 은 별도 UPDATE 로 처리하는 것이 좋습니다.
    -- 하지만 질문이 "백필 SQL 을 먼저 작성하고"라는 것이므로, 가능한 한 한 번에 처리하는 SQL 을 작성합니다.
    -- 따라서 백필 SQL 은 다음과 같이 작성합니다.

    -- (백필 SQL 예시 - z_avg, z_min, z_max 만 계산)
    -- INSERT INTO read_grip_result_v2 (scene_key, attempt_num, object_name, grip_succeed, occurred_at, z_avg, z_min, z_max, grip_outlier_flag, stream_id, global_seq)
    -- SELECT 
    --     scene_key,
    --     attempt_num,
    --     object_name,
    --     grip_succeed,
    --     occurred_at,
    --     (SELECT COALESCE(jsonb_array_elements_text(grip3dPose), ARRAY[]::text) AS z_values
    --      FROM jsonb_array_elements(grip3dPose)
    --      WHERE jsonb_array_elements_text(grip3dPose) LIKE 'z%'
    --     )::double precision[] AS z_values,
    --     (SELECT MIN(z) FROM (
    --         SELECT (z1)::double precision AS z FROM jsonb_each(grip3dPose) WHERE key = 'z1'
    --         UNION ALL SELECT (z2)::double precision AS z FROM jsonb_each(grip3dPose) WHERE key = 'z2'
    --         UNION ALL SELECT (z3)::double precision AS z FROM jsonb_each(grip3dPose) WHERE key = 'z3'
    --         UNION ALL SELECT (z4)::double precision AS z FROM jsonb_each(grip3dPose) WHERE key = 'z4'
    --         UNION ALL SELECT (z5)::double precision AS z FROM jsonb_each(grip3dPose) WHERE key = 'z5'
    --         UNION ALL SELECT (z6)::double precision AS z FROM jsonb_each(grip3dPose) WHERE key = 'z6'
    --         UNION ALL SELECT (z7)::double precision AS z FROM jsonb_each(grip3dPose) WHERE key = 'z7'
    --         UNION ALL SELECT (z8)::double precision AS z FROM jsonb_each(grip3dPose) WHERE key = 'z8'
    --     ) subq) AS z_min,
    --     (SELECT MAX(z) FROM (
    --         SELECT (z1)::double precision AS z FROM jsonb_each(grip3dPose) WHERE key = 'z1'
    --         UNION ALL SELECT (z2)::double precision AS z FROM jsonb_each(grip3dPose) WHERE key = 'z2'
    --         UNION ALL SELECT (z3)::double precision AS z FROM jsonb_each(grip3dPose) WHERE key = 'z3'
    --         UNION ALL SELECT (z4)::double precision AS z FROM jsonb_each(grip3dPose) WHERE key = 'z4'
    --         UNION ALL SELECT (z5)::double precision AS z FROM jsonb_each(grip3dPose) WHERE key = 'z5'
    --         UNION ALL SELECT (z6)::double precision AS z FROM jsonb_each(grip3dPose) WHERE key = 'z6'
    --         UNION ALL SELECT (z7)::double precision AS z FROM jsonb_each(grip3dPose) WHERE key = 'z7'
    --         UNION ALL SELECT (z8)::double precision AS z FROM jsonb_each(grip3dPose) WHERE key = 'z8'
    --     ) subq) AS z_max,
    --     0 AS grip_outlier_flag, -- 초기값은 0
    --     stream_id,
    --     global_seq
    -- FROM read_grip_result;

    -- (백필 SQL 예시 - z_avg, z_min, z_max, grip_outlier_flag 계산)
    -- INSERT INTO read_grip_result_v2 (scene_key, attempt_num, object_name, grip_succeed, occurred_at, z_avg, z_min, z_max, grip_outlier_flag, stream_id, global_seq)
    -- SELECT 
    --     r.scene_key,
    --     r.attempt_num,
    --     r.object_name,
    --     r.grip_succeed,
    --     r.occurred_at,
    --     (SELECT COALESCE(jsonb_array_elements_text(r.grip3dPose), ARRAY[]::text) AS z_values
    --      FROM jsonb_array_elements(r.grip3dPose)
    --      WHERE jsonb_array_elements_text(r.grip3dPose) LIKE 'z%'
    --     )::double precision[] AS z_avg,
    --     (SELECT MIN(z) FROM (
    --         SELECT (z1)::double precision AS z FROM jsonb_each(r.grip3dPose) WHERE key = 'z1'
    --         UNION ALL SELECT (z2)::double precision AS z FROM jsonb_each(r.grip3dPose) WHERE key = 'z2'
    --         UNION ALL SELECT (z3)::double precision AS z FROM jsonb_each(r.grip3dPose) WHERE key = 'z3'
    --         UNION ALL SELECT (z4)::double precision AS z FROM jsonb_each(r.grip3dPose) WHERE key = 'z4'
    --         UNION ALL SELECT (z5)::double precision AS z FROM jsonb_each(r.grip3dPose) WHERE key = 'z5'
    --         UNION ALL SELECT (z6)::double precision AS z FROM jsonb_each(r.grip3dPose) WHERE key = 'z6'
    --         UNION ALL SELECT (z7)::double precision AS z FROM jsonb_each(r.grip3dPose) WHERE key = 'z7'
    --         UNION ALL SELECT (z8)::double precision AS z FROM jsonb_each(r.grip3dPose) WHERE key = 'z8'
    --     ) subq) AS z_min,
    --     (SELECT MAX(z) FROM (
    --         SELECT (z1)::double precision AS z FROM jsonb_each(r.grip3dPose) WHERE key = 'z1'
    --         UNION ALL SELECT (z2)::double precision AS z FROM jsonb_each(r.grip3dPose) WHERE key = 'z2'
    --         UNION ALL SELECT (z3)::double precision AS z FROM jsonb_each(r.grip3dPose) WHERE key = 'z3'
    --         UNION ALL SELECT (z4)::double precision AS z FROM jsonb_each(r.grip3dPose) WHERE key = 'z4'
    --         UNION ALL SELECT (z5)::double precision AS z FROM jsonb_each(r.grip3dPose) WHERE key = 'z5'
    --         UNION ALL SELECT (z6)::double precision AS z FROM jsonb_each(r.grip3dPose) WHERE key = 'z6'
    --         UNION ALL SELECT (z7)::double precision AS z FROM jsonb_each(r.grip3dPose) WHERE key = 'z7'
    --         UNION ALL SELECT (z8)::double precision AS z FROM jsonb_each(r.grip3dPose) WHERE key = 'z8'
    --     ) subq) AS z_max,
    --     -- grip_outlier_flag 계산 로직
    --     CASE 
    --         WHEN r.attempt_num = 1 THEN 0
    --         ELSE (
    --             SELECT CASE 
    --                 WHEN ABS(r.z_avg - prev.z_avg) > 0.10 THEN 1 
    --                 ELSE 0 
    --             END
    --             FROM read_grip_result_v2 prev
    --             WHERE prev.scene_key = r.scene_key 
    --             AND prev.attempt_num = r.attempt_num - 1
    --             LIMIT 1
    --         )
    --     END AS grip_outlier_flag,
    --     r.stream_id,
    --     r
제시된 상황과 자료에 따르면, `read_grip_result` 테이블에는 `jump_delta_m` 필드가 존재하지 않으며, 시계열 점프 검증을 위한 필드도 없습니다. 따라서 기존 `read_grip_result` 테이블만으로는 질문의 조건 (0.10m 초과 변화량 조회) 을 직접 만족하는 SELECT 문은 작성할 수 없습니다.

질문 조건을 충족하기 위해서는 먼저 `grip_3d_pose` JSONB 컬럼에 저장된 `z1`~`z8` 값을 추출하여 평균 (`z_avg_current`) 을 계산하고, 이를 기준으로 시계열 차이를 구하는 백필 SQL 을 먼저 실행해야 합니다. 그 후, 계산된 결과로 `jump_delta_m` 필드가 0.10m 를 초과하는 레코드를 조회하는 SELECT 문을 작성합니다.

### 1. 백필 SQL (Read Model 재생성)

`read_grip_result` 테이블의 `grip_3d_pose` 컬럼에서 `z1`~`z8` 값을 추출하여 평균을 계산하고, `attempt_num` 에 따라 시계열로 정렬된 이전 시도의 평균과 현재 시도의 평균 차이를 `jump_delta_m`으로 저장하는 SQL 입니다.

```sql
-- 백필: 시계열 z 평균 계산 및 jump_delta_m 필드 추가 (read_grip_result 재생성)
-- 1. 기존 데이터에서 z1~z8 추출하여 평균 계산
-- 2. attempt_num 에 따라 시계열로 정렬하여 이전 시도 대비 delta 계산
-- 3. 계산된 결과를 update 로 적용 (기존 레코드만 업데이트)

WITH ordered_attempts AS (
    SELECT 
        scene_key,
        attempt_num,
        grip_3d_pose,
        ROW_NUMBER() OVER (PARTITION BY scene_key ORDER BY attempt_num) as rn,
        LAG(grip_3d_pose) OVER (PARTITION BY scene_key ORDER BY attempt_num) as prev_grip_3d_pose
    FROM read_grip_result
),
z_stats AS (
    SELECT 
        scene_key,
        attempt_num,
        grip_3d_pose,
        prev_grip_3d_pose,
        -- 현재 시도 z 평균 계산
        (
            COALESCE((SELECT jsonb_array_elements_text(grip_3d_pose) as val FROM jsonb_array_elements(grip_3d_pose) WHERE jsonb_array_elements(grip_3d_pose).key = 'z'::text) LIMIT 1),
            -- 위 JSONB 파싱은 Postgres 에서 직접적인 평균 계산이 복잡하므로, 
            -- z1~z8 키를 직접 추출하여 평균을 내는 서브쿼리 사용
            (
                SELECT COALESCE((
                    SELECT SUM(val::numeric) * 1.0 / 8.0
                    FROM UNNEST(
                        SELECT jsonb_array_elements_text(grip_3d_pose) as val 
                        FROM jsonb_array_elements(grip_3d_pose) 
                        WHERE jsonb_array_elements(grip_3d_pose).key = 'z'::text
                    )
                ), 0.0)
            )
        ) as z_avg_current,
        -- 이전 시도 z 평균 계산 (prev 가 null 이면 null)
        (
            CASE 
                WHEN prev_grip_3d_pose IS NOT NULL THEN
                    (
                        SELECT COALESCE((
                            SELECT SUM(val::numeric) * 1.0 / 8.0
                            FROM UNNEST(
                                SELECT jsonb_array_elements_text(prev_grip_3d_pose) as val 
                                FROM jsonb_array_elements(prev_grip_3d_pose) 
                                WHERE jsonb_array_elements(prev_grip_3d_pose).key = 'z'::text
                            )
                        ), 0.0)
                    )
                ELSE NULL
            END
        ) as z_avg_prev
    FROM ordered_attempts
),
final_stats AS (
    SELECT 
        scene_key,
        attempt_num,
        z_avg_current,
        z_avg_prev,
        -- jump_delta_m 계산: abs(current - prev)
        -- prev 가 null 이면 jump_delta_m 은 NULL 로 처리 (1 차 시도)
        CASE 
            WHEN z_avg_prev IS NOT NULL THEN ABS(z_avg_current - z_avg_prev)
            ELSE NULL
        END as jump_delta_m
    FROM z_stats
)
UPDATE read_grip_result r
SET 
    z_avg_current = f.z_avg_current,
    jump_delta_m = f.jump_delta_m
FROM final_stats f
WHERE r.scene_key = f.scene_key 
  AND r.attempt_num = f.attempt_num;
```

### 2. 질문 답변 SELECT 문

백필 SQL 을 통해 `jump_delta_m` 필드가 생성되고 채워진 후, 같은 장면 (`scene_key`) 안에서 시도 (`attempt_num`) 간 평균 깊이 변화량이 0.10m 를 넘는 장면을 조회하는 SQL 입니다.

```sql
SELECT 
    scene_key,
    attempt_num,
    z_avg_current,
    jump_delta_m
FROM read_grip_result
WHERE jump_delta_m IS NOT NULL 
  AND jump_delta_m > 0.10
ORDER BY scene_key, attempt_num;
```
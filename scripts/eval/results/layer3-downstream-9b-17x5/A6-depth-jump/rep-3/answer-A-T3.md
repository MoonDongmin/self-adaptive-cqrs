제공된 자료에 따르면, 현재 시스템은 `read_grip_result` 테이블을 사용하고 있으며, `grip3d_pose_z_avg`와 `grip_outlier_flag` 컬럼이 추가되어 있지 않습니다. 먼저 해당 컬럼을 추가하고, 문제의 시나리오 (scene_key: `반려동물용품_CR01_강아지공룡알장난감_02010`) 에 포함된 두 시도 (attempt 1, 2) 의 Z 좌표 평균을 계산하여 `grip_outlier_flag` 를 설정하는 백필 SQL 을 작성한 후, 요청된 조건을 만족하는 SELECT 문을 작성합니다.

### 백필 SQL (Schema Update & Data Backfill)

```sql
-- 1. 기존 read_grip_result 테이블에 Z 평균 및 이상 플래그 컬럼 추가
ALTER TABLE read_grip_result 
ADD COLUMN grip3d_pose_z_avg doublePrecision,
ADD COLUMN grip_outlier_flag smallint;

-- 2. 해당 scene_key 와 attempt_num 을 가진 모든 행에 대해 Z 평균 계산 및 이상 플래그 설정
-- 규칙: 같은 scene_key 내의 연속된 attempt 간 Z 평균 차이가 0.10m 를 초과하면 1, 아니면 0
UPDATE read_grip_result
SET 
    grip3d_pose_z_avg = (
        SELECT AVG(z)
        FROM jsonb_array_elements(grip_3d_pose) AS z
        WHERE z IS NOT NULL
    ),
    grip_outlier_flag = (
        SELECT CASE 
            WHEN ABS(current_avg - prev_avg) > 0.10 THEN 1 
            ELSE 0 
        END
        FROM (
            SELECT 
                AVG(z) AS current_avg
            FROM jsonb_array_elements(grip_3d_pose) AS z
            WHERE z IS NOT NULL
        ) sub
        LEFT JOIN LATERAL (
            SELECT 
                AVG(z) AS prev_avg
            FROM jsonb_array_elements(
                LAG(grip_3d_pose, 1) OVER (PARTITION BY scene_key ORDER BY attempt_num)
            ) AS prev_row
        ) prev ON true
        WHERE prev.prev_avg IS NOT NULL
    );

-- 3. 계산된 값이 없는 경우 (NULL) 에 대한 기본값 처리 (필요시)
-- 만약 위 UPDATE 가 NULL 을 반환하는 경우, 물리적 연속성이 없는 첫 번째 시도나 데이터 오류 시 0 으로 초기화
UPDATE read_grip_result
SET grip_outlier_flag = 0
WHERE grip_outlier_flag IS NULL;
```

### 조회 SQL (Question Answer)

```sql
SELECT 
    r.scene_key,
    r.attempt_num,
    r.grip3d_pose_z_avg,
    r.grip_outlier_flag,
    CASE 
        WHEN r.grip_outlier_flag = 1 THEN 'Sudden Jump Detected'
        ELSE 'Normal'
    END AS jump_status
FROM read_grip_result r
JOIN LATERAL (
    SELECT 
        AVG(z) AS prev_avg
    FROM jsonb_array_elements(
        LAG(r.grip_3d_pose, 1) OVER (PARTITION BY r.scene_key ORDER BY r.attempt_num)
    ) AS prev_row
) prev ON true
WHERE r.grip_outlier_flag = 1
   OR (
       r.grip_outlier_flag IS NULL 
       AND ABS(r.grip3d_pose_z_avg - prev.prev_avg) > 0.10
   )
ORDER BY r.scene_key, r.attempt_num;
```
제공된 자료에 따르면, 현재 시스템은 `read_grip_result` 테이블을 사용하고 있으며, 센서 값의 급격한 변화 (Sudden Jump) 를 감지했으나 이를 DB 스키마나 저장된 데이터에 반영하지 못하고 있습니다.

해결책은 **[fix]** 옵션인 "Z 평균 계산 및 플래그 적용"입니다. 이는 새 테이블을 만드는 것이 아니라, 기존 `read_grip_result` 테이블에 `grip3d_pose_z_avg`와 `grip_outlier_flag` 컬럼을 추가하고, 해당 필드를 계산하여 저장하는 것입니다.

따라서 실행해야 할 SQL 은 기존 테이블의 스키마를 확장하는 `ALTER TABLE` 문과, 해당 규칙을 적용하여 데이터를 업데이트하는 `UPDATE` 문입니다.

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
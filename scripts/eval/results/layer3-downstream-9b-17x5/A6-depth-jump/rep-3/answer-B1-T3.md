제시된 자료에 따르면, 1 차 관찰자가 제시한 'z 평균'이라는 표현은 원시 레코드 (JSON) 의 `grip3dPose` 내 `z1` 좌표 값과 일치하지 않으므로 가설로 기각됩니다. 따라서 검증 기준은 **같은 `scene_key` 내의 연속된 시도 (`attempt_num`) 간 `z1` 좌표의 변화량**이 0.10m 를 초과하는 경우로 수정되어야 합니다.

기존 `read_grip_result` 테이블에 `z1` 값이 `grip_3d_pose` JSONB 컬럼에 저장되어 있으므로, 별도의 백필 SQL 없이 기존 테이블을 활용하여 `LAG` 함수를 통해 이전 시도의 `z1` 값을 가져와 차이를 계산하는 SELECT 문을 작성합니다.

```sql
WITH ordered_attempts AS (
    SELECT 
        scene_key,
        attempt_num,
        grip_3d_pose->'z1'::numeric AS z_curr,
        LAG(grip_3d_pose->'z1'::numeric) OVER (
            PARTITION BY scene_key 
            ORDER BY attempt_num
        ) AS z_prev
    FROM read_grip_result
    WHERE grip_succeed = 1
),
jump_check AS (
    SELECT 
        scene_key,
        attempt_num,
        z_curr,
        z_prev,
        (z_curr - z_prev) AS z_delta,
        CASE 
            WHEN (z_curr - z_prev) > 0.10 THEN true 
            ELSE false 
        END AS is_sudden_jump
    FROM ordered_attempts
    WHERE z_curr IS NOT NULL
)
SELECT 
    scene_key,
    attempt_num,
    z_curr,
    z_prev,
    z_delta,
    is_sudden_jump
FROM jump_check
WHERE is_sudden_jump = true
ORDER BY scene_key, attempt_num;
```
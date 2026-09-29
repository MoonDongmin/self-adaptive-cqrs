제시된 자료와 스키마를 분석한 결과, **새 Read Model 테이블은 필요 없습니다.** 기존 `read_grip_result` 테이블에 저장된 데이터만으로도 1 차 관찰기의 '가설'을 검증할 수 있습니다.

### 분석 근거
1.  **가설 1 (suddenJump_withinScene):** "같은 sceneKey 내 attempt 간 z 평균 변화량 > 0.10 m"
    *   **검증 방법:** `read_grip_result` 테이블에서 `scene_key`가 동일한 레코드들을 그룹화하여, `attempt_num`이 다른 두 레코드 간의 `z1` (또는 모든 z 좌표의 평균) 차이를 계산하면 됩니다. 자료에 `globalSequence`가 순차적으로 증가하므로 시계열 순서대로 정렬하여 비교할 수 있습니다.
2.  **가설 2 (pixelRangeViolation):** "xl=2500.0 which exceeds image width 1920"
    *   **검증 방법:** `read_grip_result` 테이블의 `grip_2d_pose` JSONB 컬럼에서 `xl` 값을 추출하여 `2500 > 1920`인지 확인하면 됩니다. 자료에 이미 `2500`으로 명시되어 있습니다.
3.  **가설 3 (depthNegative):** "minz=-0.083 which is <= 0"
    *   **검증 방법:** `read_grip_result` 테이블의 `grip_3d_pose` JSONB 컬럼에서 `z1` ~ `z8` 값을 추출하여 `MIN(z1..z8) <= 0`인지 확인하면 됩니다. 자료에 이미 `-0.083`으로 명시되어 있습니다.

따라서, 1 차 판정된 사유들이 원시 데이터 (JSONB) 와 일치하는지, 그리고 추가적인 물리적 불일치 (예: 다른 시도에 대한 깊이 부정, 픽셀 범위 위반 등) 가 더 있는지 확인하는 SQL 을 작성합니다.

```sql
-- 1 차 가설 검증 및 추가 물리성 위반 사항 추출
-- 목표: 
-- 1. 'suddenJump_withinScene' 가설 검증: 같은 sceneKey 내 시도별 z 평균 변화량 확인
-- 2. 'pixelRangeViolation' 가설 검증: xl > 1920 확인
-- 3. 'depthNegative' 가설 검증: 모든 시도의 최소 z 좌표가 0 이하인지 확인 (가설의 minz 가 특정 시도만 해당되는지, 전체 scene 의 문제인지 확인)

WITH scene_z_stats AS (
    -- 각 sceneKey 에 대해 시도별 z 평균 (z1~z8 의 평균) 계산
    SELECT 
        scene_key,
        attempt_num,
        (
            (SELECT COALESCE((data->'z1')::numeric, 0) + 
             COALESCE((data->'z2')::numeric, 0) + 
             COALESCE((data->'z3')::numeric, 0) + 
             COALESCE((data->'z4')::numeric, 0) + 
             COALESCE((data->'z5')::numeric, 0) + 
             COALESCE((data->'z6')::numeric, 0) + 
             COALESCE((data->'z7')::numeric, 0) + 
             COALESCE((data->'z8')::numeric, 0)) 
            / 8.0
        ) AS avg_z
    FROM read_grip_result
    WHERE grip_3d_pose IS NOT NULL
),
-- 시도별 z 평균의 시차 (순차적으로 정렬된 시도 간의 차이)
z_diffs AS (
    SELECT 
        s1.scene_key,
        s1.attempt_num AS attempt_from,
        s2.attempt_num AS attempt_to,
        s2.avg_z - s1.avg_z AS z_delta
    FROM scene_z_stats s1
    JOIN scene_z_stats s2 ON s1.scene_key = s2.scene_key
    WHERE s2.attempt_num = s1.attempt_num + 1
      AND s2.occurred_at >= s1.occurred_at -- 시간 순서 보장 (동일한 occurred_at 일 경우 attempt_num 순)
),
-- 가설 1 검증: z 변화량이 0.10 보다 큰 경우
sudden_jump_candidates AS (
    SELECT * FROM z_diffs WHERE z_delta > 0.10
),
-- 가설 2 검증: xl > 1920
pixel_violations AS (
    SELECT 
        scene_key,
        attempt_num,
        (grip_2d_pose->'xl')::numeric AS xl_val
    FROM read_grip_result
    WHERE grip_2d_pose IS NOT NULL
      AND (grip_2d_pose->'xl')::numeric > 1920
),
-- 가설 3 검증: scene 내 최소 z 값이 0 이하인 경우 (가설의 'record' 가 특정 시도일 수 있으나, 물리적으로 불가능한 상태라면 해당 시도 또는 전체 scene 의 문제)
-- 여기서는 해당 시도의 z1~z8 중 최소값이 0 이하인 시도를 찾음. 
-- 만약 모든 시도가 0 이하라면 scene 전체가 문제일 수 있음.
depth_negative_records AS (
    SELECT 
        scene_key,
        attempt_num,
        (
            SELECT MIN(val)
            FROM LATERAL jsonb_array_elements_text(grip_3d_pose->'z1')::numeric,
            LATERAL jsonb_array_elements_text(grip_3d_pose->'z2')::numeric,
            LATERAL jsonb_array_elements_text(grip_3d_pose->'z3')::numeric,
            LATERAL jsonb_array_elements_text(grip_3d_pose->'z4')::numeric,
            LATERAL jsonb_array_elements_text(grip_3d_pose->'z5')::numeric,
            LATERAL jsonb_array_elements_text(grip_3d_pose->'z6')::numeric,
            LATERAL jsonb_array_elements_text(grip_3d_pose->'z7')::numeric,
            LATERAL jsonb_array_elements_text(grip_3d_pose->'z8')::numeric
        ) AS min_z
    FROM read_grip_result
    WHERE grip_3d_pose IS NOT NULL
      AND grip_3d_pose->'z1' IS NOT NULL
      AND grip_3d_pose->'z2' IS NOT NULL
      AND grip_3d_pose->'z3' IS NOT NULL
      AND grip_3d_pose->'z4' IS NOT NULL
      AND grip_3d_pose->'z5' IS NOT NULL
      AND grip_3d_pose->'z6' IS NOT NULL
      AND grip_3d_pose->'z7' IS NOT NULL
      AND grip_3d_pose->'z8' IS NOT NULL
      AND (
          (grip_3d_pose->'z1')::numeric <= 0 
          OR (grip_3d_pose->'z2')::numeric <= 0 
          OR (grip_3d_pose->'z3')::numeric <= 0 
          OR (grip_3d_pose->'z4')::numeric <= 0 
          OR (grip_3d_pose->'z5')::numeric <= 0 
          OR (grip_3d_pose->'z6')::numeric <= 0 
          OR (grip_3d_pose->'z7')::numeric <= 0 
          OR (grip_3d_pose->'z8')::numeric <= 0
      )
)
-- 최종 결과: 가설이 맞는지 확인하고, 해당 시도의 상세 정보 (stream_id 등) 를 함께 반환
SELECT 
    COALESCE(sj.scene_key, pv.scene_key, dn.scene_key) AS scene_key,
    COALESCE(sj.attempt_from, pv.attempt_num, dn.attempt_num) AS attempt_num,
    COALESCE(sj.attempt_to, NULL, NULL) AS related_attempt_num, -- sudden jump 에만 관련 시도가 필요
    COALESCE(sj.z_delta, NULL, NULL) AS z_delta,
    COALESCE(pv.xl_val, NULL, NULL) AS xl_val,
    COALESCE(dn.min_z, NULL, NULL) AS min_z,
    -- 가설 이름 매핑
    CASE 
        WHEN sj.scene_key IS NOT NULL THEN 'suddenJump_withinScene'
        WHEN pv.scene_key IS NOT NULL THEN 'pixelRangeViolation'
        WHEN dn.scene_key IS NOT NULL THEN 'depthNegative'
        ELSE 'Unknown'
    END AS verified_cause,
    -- 원본 데이터 출처
    COALESCE(sj.scene_key, pv.scene_key, dn.scene_key) || '#' || COALESCE(CAST(sj.attempt_from AS text), CAST(pv.attempt_num AS text), CAST(dn.attempt_num AS text)) AS record_id,
    -- 추가 정보: 해당 시도의 stream_id
    (SELECT stream_id FROM read_grip_result WHERE scene_key = COALESCE(sj.scene_key, pv.scene_key, dn.scene_key) AND attempt_num = COALESCE(sj.attempt_from, pv.attempt_num, dn.attempt_num)) AS stream_id
FROM 
    (SELECT * FROM sudden_jump_candidates) sj
FULL OUTER JOIN 
    (SELECT * FROM pixel_violations) pv ON sj.scene_key = pv.scene_key AND sj.attempt_from = pv.attempt_num
FULL OUTER JOIN 
    (SELECT * FROM depth_negative_records) dn ON sj.scene_key = dn.scene_key AND sj.attempt_from = dn.attempt_num
ORDER BY 
    verified_cause, record_id;
```

### 설명 및 주의사항
1.  **JSONB 추출:** Postgres 의 `->` 연산자를 사용하여 JSONB 필드 (`grip_2d_pose`, `grip_3d_pose`) 에서 특정 키 (`xl`, `z1` 등) 의 값을 추출하여 `numeric` 타입으로 변환합니다. `COALESCE` 를 사용하여 NULL 이면 0 으로 처리하여 계산 오류를 방지합니다.
2.  **suddenJump_withinScene 검증:** `scene_z_stats` CTE 를 통해 각 시도의 `z1`~`z8` 평균을 계산한 후, `z_diffs` CTE 를 통해 연속된 시도 (attempt_num + 1) 간의 차이를 구합니다. `z_delta > 0.10` 조건을 만족하는 레코드를 필터링합니다.
3.  **pixelRangeViolation 검증:** `grip_2d_pose` 의 `xl` 값이 1920 을 초과하는지 확인합니다.
4.  **depthNegative 검증:** `grip_3d_pose` 의 `z1`~`z8` 중 최소값이 0 이하인지 확인합니다. 자료에 따르면 `반려동물용품_CR01_강아지공룡알장난감_02006#1` 의 `z1` 이 `-0.05` 로 0 이하이므로 이 조건을 만족해야 합니다.
5.  **결과 통합:** 세 가지 가설을 각각 검증한 후, 하나의 쿼리에서 `FULL OUTER JOIN` 을 사용하여 충돌이 있는 시나리오 (예: 같은 시도가 두 가지 사유를 모두 만족하는 경우) 를 포착하고, `verified_cause` 컬럼으로 명확히 구분하여 반환합니다.
6.  **record_id:** 자료에 있는 `sceneKey#attemptNumber` 형식 (예: `반려동물용품_CR01_강아지공룡알장난감_02006#1`) 과 일치하도록 ID 를 구성합니다.

이 SQL 은 제공된 JSON 데이터와 `read_grip_result` 테이블 스키마를 기반으로 작성되었으며, 새 테이블 생성 없이 기존 테이블을 활용하여 1 차 가설을 검증하고 실제 원시 데이터의 물리성 위반 여부를 확인하는 데 적합합니다.
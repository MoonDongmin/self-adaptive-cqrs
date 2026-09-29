제시된 자료와 스키마를 분석한 결과, 물리적으로 불가능한 값 (깊이 음수 또는 이미지 밖 픽셀) 을 포함하는 파지 시도를 조회하기 위해 **새 Read Model 테이블은 필요 없습니다.** 기존 `read_grip_result` 테이블에 저장된 데이터만으로도 검증이 가능합니다.

### 분석 근거
1.  **depthNegative (깊이 음수):** 자료에 따르면 `반려동물용품_CR01_강아지공룡알장난감_02006#1` 의 `z1` 값이 `-0.05` 로 0 이하입니다. `read_grip_result` 테이블의 `grip_3d_pose` JSONB 컬럼에서 `z1`~`z8` 값을 추출하여 `MIN(z1..z8) <= 0`인지 확인하면 됩니다.
2.  **pixelRangeViolation (이미지 밖 픽셀):** 자료에 따르면 `반려동물용품_CR01_강아지공룡알장난감_02007#1` 의 `xl` 값이 `2500` 로 이미지 너비 `1920` 을 초과합니다. `read_grip_result` 테이블의 `grip_2d_pose` JSONB 컬럼에서 `xl` 값을 추출하여 `xl > 1920`인지 확인하면 됩니다.
3.  **suddenJump_withinScene (갑작스러운 Z 변화):** 자료의 1 차 가설은 "같은 sceneKey 내 attempt 간 z 평균 변화량 > 0.10 m"입니다. 이 가설은 `read_grip_result` 테이블의 시계열 데이터 (attempt_num, occurred_at, z 좌표) 를 활용하여 검증할 수 있습니다.

따라서, 물리적으로 불가능한 값 (가설 2 와 3) 을 포함하는 레코드를 `read_grip_result` 테이블에서 직접 추출하는 SELECT 문을 작성합니다.

```sql
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
    ) AS min_z,
    (grip_2d_pose->'xl')::numeric AS xl_val,
    grip_3d_pose->'z1' AS z1_raw,
    grip_2d_pose->'xl' AS xl_raw,
    stream_id,
    global_seq,
    object_name,
    grip_succeed,
    occurred_at
FROM read_grip_result
WHERE grip_3d_pose IS NOT NULL
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
  OR (
      (grip_2d_pose->'xl')::numeric > 1920 
      OR (grip_2d_pose->'xr')::numeric > 1920 
      OR (grip_2d_pose->'yl')::numeric > 1080 
      OR (grip_2d_pose->'yr')::numeric > 1080
  )
ORDER BY 
    CASE 
        WHEN (grip_3d_pose->'z1')::numeric <= 0 THEN 1
        WHEN (grip_2d_pose->'xl')::numeric > 1920 THEN 2
        ELSE 3
    END,
    scene_key,
    attempt_num;
```
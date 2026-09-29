물리적으로 불가능한 값 (깊이 음수 또는 이미지 밖 픽셀) 이 포함된 파지 시도를 조회하기 위해, 먼저 신규로 생성된 `read_grip_outlier_v2` 테이블에 원본 이벤트 데이터 (Seq 26, 27) 를 백필 (backfill) 하여 채워넣는 SQL 을 작성한 후, 해당 데이터를 기반으로 조회하는 SELECT 문을 작성합니다.

### 1. 백필 SQL (새로운 Read Model 채우기)

제공된 자료의 원시 레코드 (Raw JSON) 에서 `z1` 과 `xl` 값을 추출하여 `read_grip_outlier_v2` 테이블에 삽입하고, 물리적 제약 조건을 기준으로 위반 플래그 (`depth_negative_flag`, `pixel_xl_out_of_bounds_flag`) 를 계산하여 업데이트합니다.

```sql
-- [백필] 원본 이벤트 데이터 (Seq 26, 27) 를 기반으로 read_grip_outlier_v2 테이블 채우기
-- 1. 해당 시나리오의 원본 데이터를 임시 테이블로 로드하여 처리
WITH source_data AS (
    SELECT 
        '반려동물용품_CR01_강아지공룡알장난감_02006' AS scene_key,
        1 AS attempt_num,
        '강아지공룡알장난감' AS object_name,
        0 AS grip_succeed,
        '2023-09-23T00:00:00.000Z'::timestamptz AS occurred_at,
        -0.05 AS z1_raw, -- 자료: "z1":-0.05
        NULL AS xl_raw, -- 해당 레코드 (Seq 26) 에는 xl 값이 정의되지 않음 (grip2dPose 없음)
        0 AS depth_negative_flag, -- 초기값
        0 AS pixel_xl_out_of_bounds_flag -- 초기값
    UNION ALL
    SELECT 
        '반려동물용품_CR01_강아지공룡알장난감_02007' AS scene_key,
        1 AS attempt_num,
        '강아지공룡알장난감' AS object_name,
        0 AS grip_succeed,
        '2023-09-23T00:00:00.000Z'::timestamptz AS occurred_at,
        NULL AS z1_raw, -- 해당 레코드 (Seq 27) 에는 z1 값이 정의되지 않음 (grip3dPose 없음)
        2500.0 AS xl_raw, -- 자료: "xl":2500
        0 AS depth_negative_flag, -- 초기값
        0 AS pixel_xl_out_of_bounds_flag -- 초기값
)
-- 2. 계산된 위반 플래그를 적용하고 최종 데이터로 upsert
INSERT INTO read_grip_outlier_v2 (
    scene_key, attempt_num, object_name, grip_succeed, occurred_at, 
    z1_raw, xl_raw, depth_negative_flag, pixel_xl_out_of_bounds_flag
)
SELECT 
    scene_key, 
    attempt_num, 
    object_name, 
    grip_succeed, 
    occurred_at, 
    z1_raw, 
    xl_raw, 
    CASE WHEN z1_raw IS NOT NULL AND z1_raw <= 0 THEN 1 ELSE 0 END AS depth_negative_flag,
    CASE WHEN xl_raw IS NOT NULL AND xl_raw > 1920 THEN 1 ELSE 0 END AS pixel_xl_out_of_bounds_flag
FROM source_data
ON CONFLICT (scene_key, attempt_num) DO UPDATE SET
    object_name = EXCLUDED.object_name,
    grip_succeed = EXCLUDED.grip_succeed,
    occurred_at = EXCLUDED.occurred_at,
    z1_raw = EXCLUDED.z1_raw,
    xl_raw = EXCLUDED.xl_raw,
    depth_negative_flag = EXCLUDED.depth_negative_flag,
    pixel_xl_out_of_bounds_flag = EXCLUDED.pixel_xl_out_of_bounds_flag;
```

### 2. 조회 SQL (물리적으로 불가능한 값 포함 파지 시도 조회)

위 백필 작업 후, `read_grip_outlier_v2` 테이블에서 물리적 제약 위반 (깊이 ≤ 0 또는 픽셀 좌표 > 1920) 이 발생한 레코드를 조회합니다.

```sql
SELECT 
    scene_key,
    attempt_num,
    object_name,
    grip_succeed,
    occurred_at,
    z1_raw,
    xl_raw,
    depth_negative_flag,
    pixel_xl_out_of_bounds_flag
FROM read_grip_outlier_v2
WHERE depth_negative_flag = 1 OR pixel_xl_out_of_bounds_flag = 1;
```
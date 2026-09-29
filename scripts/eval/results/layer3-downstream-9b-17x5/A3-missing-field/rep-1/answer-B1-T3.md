제공된 로그와 스키마 정보를 바탕으로, `insert.file.failed` 로 인해 Read Model 에 반영되지 않은 데이터 (누락) 를 필드별 원인으로 집계하는 SQL 쿼리를 작성합니다.

### 분석 과정

1.  **실패 로그 추출**:
    *   로그에서 `level 40` 인 `insert.file.failed` 행을 찾습니다.
    *   **1 번 실패**: `file=반려동물용품_CR01_강아지공룡알장난감_02004_01_20230923.json`, `reason` 에 `grip_data` 관련 Zod 오류 포함.
    *   **2 번 실패**: `file=반려동물용품_CR01_강아지공룡알장난감_02005_01_20230923.json`, `reason` 에 `robot_tf` 관련 Zod 오류 포함.

2.  **필수 필드 매핑**:
    *   **`read_grip_result`** 테이블의 필수 필드: 스키마 정의에 따라 `scene_key`, `attempt_num`, `object_name`, `grip_succeed`, `gripper_type`, `occurred_at`, `grip_2d_pose`, `grip_3d_pose`, `robot_tf`, `human_annotation_grasp`, `stream_id`, `global_seq` 가 있습니다.
    *   **`read_multimodal`** 테이블의 필수 필드: `scene_key`, `attempt_num`, `occurred_at`, `image_2d_file_name`, `image_2d_uri`, `video_file_name`, `video_uri`, `stream_id`, `global_seq` 가 있습니다.

3.  **누락 원인 (필드) 도출**:
    *   **1 번 파일 (`...02004_01...`)**: `reason` 에 `grip_data` 오류가 있습니다. `read_grip_result` 생성 시 `grip_data` 필드가 Zod 에서 거부되었으므로, `read_grip_result` 테이블의 `grip_data` 필드가 누락된 것으로 간주합니다. (참고: 스키마에는 `grip_data` 라는 컬럼명이 명시적으로 없으나, `robot_tf` 와 같은 JSONB 필드들이 있고, `grip_data` 가 Zod 에 의해 거부되었다는 것은 해당 필드가 Read Model 에 저장되어야 할 필드였음을 의미합니다. 스키마에 없는 필드는 `read_grip_result` 의 `robot_tf` 등 다른 필드들이 누락되었을 수 있으나, 로그의 `reason` 이 `grip_data` 를 명시했으므로, 가장 직접적인 누락 원인은 `grip_data` 입니다. 하지만 스키마에 `grip_data` 가 없으므로, 스키마에 정의된 필드 중 `grip_data` 에 의존하거나 영향을 받은 필드를 고려해야 합니다.
    *   **정리**: 로그의 `reason` 에 명시된 필드 (`grip_data`, `robot_tf`) 가 해당 Read Model 테이블의 필수 필드인지 확인합니다.
        *   `read_grip_result` 스키마: `robot_tf` 가 있습니다. `grip_data` 는 없습니다.
        *   `read_multimodal` 스키마: `robot_tf` 가 없습니다.
    *   **논리**:
        *   1 번 실패 (`...02004`): `reason` = `grip_data` 오류. `read_grip_result` 에 `grip_data` 필드가 없으므로, 이 오류는 `read_grip_result` 생성을 막는 직접적인 필드 누락 원인이 아닙니다. 하지만 `read_grip_result` 는 `robot_tf` 를 포함합니다. 만약 `grip_data` 가 없으면 파생된 `robot_tf` 도 생성되지 않았을 수 있습니다. 그러나 문제의 핵심은 "적재 검증 실패 (Zod 거부)"로 인해 **어떤 필드가 누락되었는지**를 집계하는 것입니다.
        *   2 번 실패 (`...02005`): `reason` = `robot_tf` 오류. `read_multimodal` 에 `robot_tf` 필드가 없으므로, 이 오류는 `read_multimodal` 생성을 막는 직접적인 필드 누락 원인이 아닙니다.

    *   **재검토**: 로그의 `reason` 에 있는 필드명이 바로 누락된 필드명으로 간주하는 것이 가장 합리적입니다.
        *   1 번: `grip_data` 누락.
        *   2 번: `robot_tf` 누락.

    *   **Read Model 영향**:
        *   `read_grip_result` 테이블: `robot_tf` 필드가 필수입니다. 1 번 실패 (`grip_data` 오류) 시, `robot_tf` 가 생성되었을지? 로그는 `insert.file.failed` 이므로 이벤트가 저장소에 들어가지 않았습니다. 따라서 `read_grip_result` 전체가 생성되지 않았습니다. 이때 누락된 필드는 `reason` 에 있는 `grip_data` 입니다.
        *   `read_multimodal` 테이블: `robot_tf` 필드가 없습니다. 2 번 실패 (`robot_tf` 오류) 시, `read_multimodal` 전체가 생성되지 않았습니다. 이때 누락된 필드는 `robot_tf` 입니다.

    *   **결론**:
        *   `read_grip_result` 누락 건수: `grip_data` 필드 누락으로 인한 건수.
        *   `read_multimodal` 누락 건수: `robot_tf` 필드 누락으로 인한 건수.

    *   **주의**: 스키마에 `grip_data` 가 없으므로, `read_grip_result` 에서 `grip_data` 필드를 카운트하는 것은 불가능합니다. 하지만 질문은 "필수 필드 누락으로 거부된 적재 건을 누락 필드명별 건수로 집계하라"입니다. 로그에 명시된 `reason` 의 필드명을 그대로 사용하여 집계하는 것이 맞습니다.
        *   1 번: `grip_data` (1 건)
        *   2 번: `robot_tf` (1 건)

    *   **백필 SQL**:
        *   실패한 파일명에서 `scene_key` 와 `attempt_num` 을 추출합니다.
        *   해당 키로 `read_grip_result` 와 `read_multimodal` 테이블에서 레코드가 존재하는지 확인합니다.
        *   존재하지 않는 경우 (MISSING), 해당 파일의 실패 원인이 해당 테이블의 필드 누락으로 간주합니다.

### SQL 쿼리

```sql
-- 1. 실패한 파일에서 scene_key 와 attempt_num 추출 및 Read Model 존재 여부 확인
WITH failed_files AS (
    SELECT 
        '반려동물용품_CR01_강아지공룡알장난감_02004' AS scene_key,
        1 AS attempt_num,
        'grip_data' AS failed_field
    UNION ALL
    SELECT 
        '반려동물용품_CR01_강아지공룡알장난감_02005' AS scene_key,
        1 AS attempt_num,
        'robot_tf' AS failed_field
),
missing_records AS (
    SELECT 
        ff.scene_key,
        ff.attempt_num,
        ff.failed_field,
        CASE 
            WHEN gr.scene_key IS NULL THEN 1 ELSE 0 
        END AS is_grip_result_missing
    FROM failed_files ff
    LEFT JOIN read_grip_result gr 
        ON gr.scene_key = ff.scene_key 
        AND gr.attempt_num = ff.attempt_num
    UNION ALL
    SELECT 
        ff.scene_key,
        ff.attempt_num,
        ff.failed_field,
        CASE 
            WHEN mm.scene_key IS NULL THEN 1 ELSE 0 
        END AS is_multimodal_missing
    FROM failed_files ff
    LEFT JOIN read_multimodal mm 
        ON mm.scene_key = ff.scene_key 
        AND mm.attempt_num = ff.attempt_num
)
-- 2. 필드별 누락 건수 집계
SELECT 
    failed_field AS missing_field_name,
    SUM(is_grip_result_missing) AS read_grip_result_missing_count,
    SUM(is_multimodal_missing) AS read_multimodal_missing_count
FROM missing_records
GROUP BY failed_field
ORDER BY missing_field_name;
```
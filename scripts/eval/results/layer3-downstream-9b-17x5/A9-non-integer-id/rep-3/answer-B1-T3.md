제공된 로그와 스키마 정보를 바탕으로, Zod 검증 (`safeint` 규칙 위반) 으로 인해 적재가 실패하여 Read Model 에 반영되지 않은 데이터 (누락된 데이터) 를 식별하는 SQL 쿼리를 작성합니다.

### 분석 과정

1.  **실패 원인 및 영향 데이터 식별**:
    *   로그에서 `insert.file.failed` 로그가 두 번 발생했습니다.
    *   **1 번째 실패**: `file=반려동물용품_CR01_강아지공룡알장난감_02022_01_20230923.json`
        *   `scene_key`: `반려동물용품_CR01_강아지공룡알장난감_02022` (파일명에서 `_01_` 이전 부분)
        *   `attempt_num`: `01` (파일명에서 `_` 이후 숫자)
        *   `reason`: `path: ["objects", 0, "id"]`, `expected: "int", received: number`
    *   **2 번째 실패**: `file=반려동물용품_CR01_강아지공룡알장난감_02023_01_20230923.json`
        *   `scene_key`: `반려동물용품_CR01_강아지공룡알장난감_02023`
        *   `attempt_num`: `01`
        *   `reason`: `path: ["human_annotation_grasp", 0, "num_keypoints"]`, `expected: "int", received: number`

2.  **Read Model 상태 확인 전략**:
    *   **`read_grip_result`**: 파지 결과 (성공/실패, 포즈 등) 를 저장합니다. 실패한 파일에서 파생된 이벤트가 저장소에 추가되지 않았으므로, 해당 `scene_key` 와 `attempt_num` 조합의 레코드가 존재하지 않을 것입니다.
    *   **`read_multimodal`**: 미디어 링크 (이미지/비디오) 를 저장합니다. 실패한 파일에서 파생된 미디어 링크가 저장소에 추가되지 않았으므로, 해당 `scene_key` 와 `attempt_num` 조합의 레코드가 존재하지 않을 것입니다.
    *   **누락된 데이터 식별**: 위 두 테이블에서 실패한 시도에 대한 레코드가 `NULL` (존재하지 않음) 인 경우를 찾아냅니다.

3.  **필요한 필드 추출**:
    *   질문에서 요구하는 "위반 필드명"과 "원본 값"은 로그의 `detail` 컬럼에 `reason` 필드로 포함되어 있습니다.
    *   `reason` 은 JSON 형식입니다. `reason` 필드에서 `path` 배열의 마지막 요소 (필드명) 와 `message` 또는 `code` 를 추출하여 원본 값 (received number) 을 파악해야 합니다.
    *   로그 예시: `reason=[ { "expected": "int", "format": "safeint", "code": "invalid_type", "path": [ "objects", 0, "id" ], "message": "Invalid input: expected int, received number" } ]`
    *   **필드명**: `path` 배열의 마지막 원소 (`id` 또는 `num_keypoints`).
    *   **원본 값**: `message` 필드에서 `received` 키워드 뒤에 붙은 값 (`number`).

4.  **SQL 작성 전략**:
    *   **Step 1 (필요시 백필)**: 제공된 자료에는 Event Store 테이블 스키마가 명시적으로 주어지지 않았으며, Event Store 에 직접 접근하여 원본 값을 추출하는 쿼리를 작성하라고 명시적으로 지시받지 않았습니다. 다만, "필요하면 기존 데이터...로 새 테이블을 채우는 백필 SQL 을 먼저 작성하고"라는 지시가 있습니다. 하지만 `read_grip_result` 와 `read_multimodal` 은 실패로 인해 데이터가 **반영되지 않았으므로** (NULL), 백필할 데이터가 없습니다. 따라서 백필 SQL 은 생략하고 바로 최종 SELECT 문으로 넘어갑니다.
    *   **Step 2 (최종 SELECT)**:
        1.  로그에서 실패한 파일 정보를 추출하여 CTE (`failed_files`) 만듭니다. 여기서 `scene_key`, `attempt_num`, `reason` (JSON) 을 포함합니다.
        2.  `read_grip_result` 와 `read_multimodal` 테이블을 `failed_files` 와 LEFT JOIN 하여, 해당 시도가 Read Model 에 존재하는지 확인합니다.
        3.  존재하지 않는 경우 (Read Model 에 NULL 인 경우) 에만 결과를 반환합니다.
        4.  `reason` JSON 필드에서 `path` 의 마지막 원소 (필드명) 와 `message` 의 `received` 값을 추출하여 선택합니다.

### SQL 쿼리

```sql
-- 실패한 파일 정보 추출 (scene_key, attempt_num, reason)
WITH failed_files AS (
    SELECT 
        '반려동물용품_CR01_강아지공룡알장난감_02022' AS scene_key,
        1 AS attempt_num,
        '[   {     "expected": "int",     "format": "safeint",     "code": "invalid_type",     "path": [       "objects",       0,       "id"     ],     "message": "Invalid input: expected int, received number"   } ]'::jsonb AS reason
    UNION ALL
    SELECT 
        '반려동물용품_CR01_강아지공룡알장난감_02023' AS scene_key,
        1 AS attempt_num,
        '[   {     "expected": "int",     "format": "safeint",     "code": "invalid_type",     "path": [       "human_annotation_grasp",       0,       "num_keypoints"     ],     "message": "Invalid input: expected int, received number"   } ]'::jsonb AS reason
)

-- Read Model 에 해당 시도가 존재하는지 확인하고, 누락된 경우만 필터링
SELECT 
    ff.scene_key,
    ff.attempt_num,
    -- 위반 필드명 추출: path 배열의 마지막 원소
    (ff.reason->'0'->'path'->>-1) AS violated_field_name,
    -- 원본 값 추출: message 에서 'received' 키워드 뒤의 값
    -- 예: "Invalid input: expected int, received number" -> "number"
    -- JSONB 에서 문자열 값을 추출하는 방법: jsonb_path_query_array 또는 문자열 처리
    -- Postgres 14+ 에서는 jsonb_path_query_array 가 있지만, 호환성을 위해 문자열 파싱 로직을 적용하거나
    -- 간단한 문자열 매칭을 사용하거나, jsonb_path_query 를 사용하여 'received' 값 추출 후 문자열로 변환
    (
        SELECT 
            CASE 
                WHEN jsonb_path_query_array(ff.reason, '$[*].message') IS NOT NULL THEN
                    (jsonb_path_query_array(ff.reason, '$[*].message')[0]::text)
                ELSE NULL
            END
        WHERE jsonb_path_query_array(ff.reason, '$[*].message') IS NOT NULL
    ) AS original_value,
    -- 추가 정보: 위반 코드 (code)
    (ff.reason->'0'->'code') AS violation_code
FROM failed_files ff
LEFT JOIN read_grip_result grg 
    ON grg.scene_key = ff.scene_key 
    AND grg.attempt_num = ff.attempt_num
LEFT JOIN read_multimodal mm 
    ON mm.scene_key = ff.scene_key 
    AND mm.attempt_num = ff.attempt_num
WHERE 
    -- Read Model 에 해당 시도가 존재하지 않는 경우 (누락됨)
    (grg IS NULL OR mm IS NULL)
ORDER BY 
    ff.scene_key, 
    ff.attempt_num;
```

**설명**:
1.  **failed_files CTE**: 로그에서 추출된 두 개의 실패한 파일 정보를 `scene_key`, `attempt_num`, `reason` (JSONB 타입으로 변환) 으로 구성합니다.
2.  **JOIN**: `failed_files` 를 `read_grip_result` 와 `read_multimodal` 과 LEFT JOIN 합니다.
3.  **WHERE 조건**: `grg` 와 `mm` 중 하나라도 `NULL` 이면 해당 시도는 Read Model 에 완전히 반영되지 않았음을 의미하므로 필터링합니다. (실제로는 두 테이블 모두 NULL 이어야 하지만, 논리적으로 하나라도 누락되면 해당 시도의 데이터가 불완전하므로 누락으로 간주합니다. 보통은 `grg IS NULL AND mm IS NULL` 이 더 정확할 수 있으나, 적재 실패 시 보통 두 테이블 모두 업데이트되지 않으므로 `IS NULL` 조건을 유지합니다.)
4.  **필드 추출**:
    *   `violated_field_name`: `reason` JSONB 의 첫 번째 요소 (`->'0'`) 의 `path` 배열 (`->'path'`) 의 마지막 원소 (`->>-1`) 를 추출합니다.
    *   `original_value`: `reason` JSONB 의 첫 번째 요소의 `message` 필드에서 `received` 키워드 뒤의 값을 추출합니다. `jsonb_path_query_array` 를 사용하여 `message` 배열을 추출하고, 첫 번째 문자열로 변환합니다. (Postgres 14+ 기능 사용)
    *   `violation_code`: `reason` JSONB 의 `code` 필드를 추출합니다.
5.  **결과**: 실패로 인해 Read Model 에 반영되지 않은 시도에 대한 `scene_key`, `attempt_num`, `violated_field_name`, `original_value` 를 반환합니다.

*(참고: 만약 사용 중인 Postgres 버전이 14 미만이라면 `jsonb_path_query_array` 대신 `jsonb_path_query` 와 `regexp_split_to_array` 등을 조합하여 필드를 추출해야 할 수 있습니다. 위 쿼리는 최신 Postgres 문법을 가정했습니다.)*
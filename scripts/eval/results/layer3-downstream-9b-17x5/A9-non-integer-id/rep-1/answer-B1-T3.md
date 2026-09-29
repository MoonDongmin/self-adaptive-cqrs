제공된 로그와 스키마 정보를 바탕으로, Zod 검증 실패로 인해 적재가 거부된 데이터 건을 **위반 필드명**과 **원본 값**과 함께 조회하는 SQL 을 작성합니다.

### 분석 과정

1.  **로그에서 위반 정보 추출**:
    *   `insert.file.failed` 로그의 `detail` 필드에 Zod 오류 객체가 포함되어 있습니다.
    *   **1 번째 실패**: `reason` 배열의 첫 번째 객체에서 `path` (위반 필드 경로) 와 `message` (원본 값 포함 메시지) 를 추출합니다.
        *   필드: `human_annotation_grasp` (객체 내의 하위 필드)
        *   원본 값: `number` (message: "received number")
    *   **2 번째 실패**: `reason` 배열의 두 번째 객체에서 추출합니다.
        *   필드: `human_annotation_grasp` -> `num_keypoints`
        *   원본 값: `number` (message: "received number")
    *   **대상 파일**: `반려동물용품_CR01_강아지공룡알장난감_02022_01_20230923.json` 과 `반려동물용품_CR01_강아지공룡알장난감_02023_01_20230923.json`.

2.  **데이터 구조 매핑**:
    *   **Scene Key**: 파일명에서 `CR01_강아지공룡알장난감_` 접두사와 `_01_20230923` 접미사를 제거하여 `반려동물용품_02022` 와 `반려동물용품_02023` 으로 변환합니다. (참고: 제공된 스키마 예시 `반려동물용품_CR01_강아지공룡알장난감_00018` 과 비교 시, 실제 파일명 `..._02022_...` 에서 `CR01_강아지공룡알장난감_` 부분을 잘라내면 `반려동물용품_02022` 가 됩니다. 하지만 스키마 예시와 파일명 패턴을 정확히 일치시키기 위해, 파일명에서 `CR01_강아지공룡알장난감_` 부분을 제거하고 남은 부분을 `scene_key` 로 사용합니다.
        *   파일명: `반려동물용품_CR01_강아지공룡알장난감_02022_01_20230923.json`
        *   Scene Key 추출: `split('_')` 로 나눈 후 `0` 인덱스(`반려동물용품`) + `1` 인덱스(`CR01`) + `2` 인덱스(`강아지공룡알장난감`) + `3` 인덱스(`02022`) 를 합치거나, 단순히 `stream_id` 규칙을 따릅니다.
        *   로그의 `stream_id` 는 `grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00258` 형식입니다.
        *   실패 파일의 `stream_id` 는 `grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02022` 입니다.
        *   따라서 `scene_key` 는 `반려동물용품_CR01_강아지공룡알장난감_02022` 입니다.
    *   **Attempt**: 파일명 `_01_` 부분에서 `1` 입니다.
    *   **위반 필드명**: 로그의 `reason.path` 배열을 문자열로 연결합니다. (`human_annotation_grasp.0.num_keypoints` 또는 `human_annotation_grasp[0].num_keypoints` 형태). 로그는 `path: ["human_annotation_grasp", 0, "num_keypoints"]` 이므로, 이를 `human_annotation_grasp[0].num_keypoints` 형식으로 표현하는 것이 명확합니다.
    *   **원본 값**: 로그의 `reason.message` 에서 `received` 뒤에 오는 값 (`number`) 입니다.

3.  **SQL 작성 전략**:
    *   로그 테이블 (또는 임시 테이블) 에서 `insert.file.failed` 로그를 필터링하여 `reason` 필드를 파싱해야 합니다.
    *   제공된 자료에는 로그 테이블의 스키마가 명시적으로 주어지지 않았으나, `detail` 필드에 JSON 형식의 오류 정보가 들어있다고 가정하고, 해당 JSON 데이터를 추출하여 필드명과 원본 값을 조합하는 쿼리를 작성합니다.
    *   만약 로그 테이블이 없다면, 제공된 텍스트 데이터를 직접 처리하는 SQL 은 불가능하므로, **가상의 로그 테이블 `log_events`** 를 가정하고 쿼리를 작성합니다. (실제 운영 환경에서는 `log_events` 테이블에 해당 로그가 저장되어 있을 것입니다).
    *   `reason` 필드는 JSONB 타입으로 가정합니다.
    *   `path` 배열을 문자열로 변환하여 필드명을 구성합니다.
    *   `message` 필드에서 `received` 키워드 뒤의 값을 추출하여 원본 값을 가져옵니다.

4.  **구체적인 SQL 로직**:
    *   `SELECT` 문에서 `log_events` 테이블을 JOIN 하거나 서브쿼리를 사용하여 `insert.file.failed` 로그만 선택합니다.
    *   `reason` JSONB 배열의 첫 번째 (또는 실패 원인) 객체를 선택합니다.
    *   `path` 배열을 `_` 로 연결하여 필드명 (`human_annotation_grasp[0].num_keypoints`) 을 만듭니다.
    *   `message` 문자열에서 `received` 이후의 단어를 추출하여 `original_value` (`number`) 로 만듭니다.

### SQL 코드

```sql
-- Zod 검증 실패로 거부된 적재 건을 위반 필드명과 원본 값과 함께 조회
-- 가정: 로그가 저장된 테이블이 log_events 이며, action='insert.file.failed' 인 행만 조회
SELECT 
    -- 위반 필드명 구성: path 배열을 '.' 로 연결하고, 숫자 인덱스는 '[index]' 형식으로 감쌈
    -- 예: ["human_annotation_grasp", 0, "num_keypoints"] -> human_annotation_grasp[0].num_keypoints
    (
        SELECT 
            string_agg(
                CASE 
                    WHEN jsonb_typeof(val) = 'array' THEN val::text || '[' || idx || ']'
                    ELSE val::text
                END,
                '.'
            )
        FROM jsonb_array_elements(reason) WITH ORDINALITY AS t(val, idx)
        WHERE jsonb_typeof(val) != 'array' OR (jsonb_typeof(val) = 'array' AND idx = 0) -- 첫 번째 요소는 항상 포함, 이후 요소는 조건에 따라 처리 (단순화: 전체 path 연결)
        -- 위 로직은 복잡하므로, path 전체를 문자열로 변환 후 처리하는 대안 사용
        -- 대안: path 배열을 문자열로 변환하여 '.' 로 연결
        -- path: ["human_annotation_grasp", 0, "num_keypoints"] -> "human_annotation_grasp.0.num_keypoints"
        -- 하지만 JSONB 의 path 는 보통 문자열 배열입니다.
        -- 정확한 필드명 추출: path[0] + '.' + path[1] + '[' + path[2] + ']' 형태 등 상황에 따라 다름.
        -- 여기서는 path 배열을 '.' 로 연결하고, 숫자는 그대로 두는 방식이 일반적이지만, 
        -- JSONB 파싱 시 숫자는 문자로 변환됩니다.
        -- 따라서 path 배열을 문자열로 변환 후, 숫자가 있는 부분을 감싸는 로직이 필요할 수 있으나,
        -- 가장 직관적인 필드명 표현은 path 배열을 '.' 로 연결하는 것입니다.
        -- 예: human_annotation_grasp.0.num_keypoints
        (SELECT string_agg(val::text, '.') FROM jsonb_array_elements(reason)) as violation_field_path
    ) as violation_field_name,
    
    -- 원본 값 추출: message 필드에서 "received" 이후의 값을 추출
    -- 예: "Invalid input: expected int, received number" -> "number"
    (
        SELECT 
            CASE 
                WHEN message ILIKE '%received %' THEN 
                    SUBSTRING(message FROM POSITION('received ' IN message) + LENGTH('received '))
                ELSE 
                    NULL
            END as original_value_raw
    ) as original_value,
    
    -- 추가 정보: 실패한 파일명
    detail as failed_file_name,
    
    -- 추가 정보: 시도 번호 (파일명에서 추출, 예시: _01_ -> 1)
    -- 파일명: 반려동물용품_CR01_강아지공룡알장난감_02022_01_20230923.json
    -- 시도 번호는 파일명에서 '_01_' 부분의 숫자
    (
        SELECT 
            CASE 
                WHEN filename ILIKE '%_01_%' THEN 1
                WHEN filename ILIKE '%_02_%' THEN 2
                WHEN filename ILIKE '%_03_%' THEN 3
                ELSE 0
            END
        FROM UNNEST(ARRAY[filename]) -- filename 은 detail 필드에서 추출 필요, 여기서는 detail 필드 전체를 filename 으로 가정하거나 별도 컬럼 가정
        -- 실제 구현 시 detail 필드에서 파일명을 추출하거나 별도 컬럼이 있을 수 있음.
        -- 여기서는 detail 필드가 파일명 전체를 포함한다고 가정하고, REGEXP_SUBSTR 을 사용하여 시도 번호 추출
        REGEXP_SUBSTR(detail, '_(\d+)_', 1, 1, '1')::int as attempt_num
    ) as attempt_num,
    
    -- 실패한 장면 키 (scene_key)
    -- stream_id 에서 'grip-attempt:' 접두사 제거
    (
        SELECT 
            CASE 
                WHEN stream_id ILIKE 'grip-attempt:%' THEN 
                    SUBSTRING(stream_id FROM POSITION(':') + 1)
                ELSE 
                    stream_id
            END
        FROM UNNEST(ARRAY[stream_id])
    ) as scene_key,
    
    -- 로그 레벨 및 시간
    level,
    time,
    correlation_id,
    action,
    global_seq

FROM log_events
WHERE action = 'insert.file.failed'
  AND time >= NOW() - INTERVAL '1 hour'
ORDER BY time DESC;
```

**주의**: 위 SQL 은 `log_events` 테이블의 구조가 `detail` (JSONB), `stream_id` (TEXT), `filename` (TEXT, 별도 컬럼 또는 detail 내), `time` (TIMESTAMP) 등이 있다고 가정하여 작성되었습니다. 실제 테이블 구조에 따라 `filename` 컬럼이 없다면 `detail` 필드에서 파일명을 추출하는 로직을 수정해야 합니다. 또한 `path` 배열을 문자열로 변환하는 부분에서 JSONB 파싱의 세부 사항 (숫자 타입 처리 등) 에 따라 결과가 달라질 수 있으므로, 실제 환경에서 테스트 후 필드명 포맷을 조정해야 할 수 있습니다.

**최종 수정된 SQL (가정된 `log_events` 테이블 구조 기반, `detail` 에 `reason` (JSONB) 과 `message` (TEXT) 가 있다고 가정)**:

```sql
SELECT 
    -- 위반 필드명: path 배열을 '.' 로 연결
    (SELECT string_agg(val::text, '.') FROM jsonb_array_elements(reason)) as violation_field_name,
    
    -- 원본 값: message 에서 'received' 이후 값 추출
    (
        SELECT 
            CASE 
                WHEN message ILIKE '%received %' THEN 
                    SUBSTRING(message FROM POSITION('received ' IN message) + LENGTH('received '))
                ELSE 
                    NULL
            END
    ) as original_value,
    
    -- 시도 번호: 파일명에서 '_XX_' 패턴 추출
    (
        SELECT 
            CASE 
                WHEN filename ILIKE '%_01_%' THEN 1
                WHEN filename ILIKE '%_02_%' THEN 2
                WHEN filename ILIKE '%_03_%' THEN 3
                ELSE 0
            END
    ) as attempt_num,
    
    -- 장면 키: stream_id 에서 'grip-attempt:' 제거
    (
        SELECT 
            CASE 
                WHEN stream_id ILIKE 'grip-attempt:%' THEN 
                    SUBSTRING(stream_id FROM POSITION(':') + 1)
                ELSE 
                    stream_id
            END
    ) as scene_key,
    
    -- 기타 로그 정보
    time,
    level,
    correlation_id,
    action,
    global_seq,
    detail

FROM log_events
WHERE action = 'insert.file.failed'
  AND time >= NOW() - INTERVAL '1 hour'
ORDER BY time DESC;
```

**참고**: 위 SQL 은 `filename` 컬럼이 `log_events` 테이블에 존재한다고 가정했습니다. 만약 `filename` 컬럼이 없고 `detail` 필드에만 파일명이 포함되어 있다면, `detail` 필드에서 파일명을 추출하는 로직 (예: `REGEXP_SUBSTR(detail, 'file=([^ ]+)')`) 을 `attempt_num` 추출 로직과 함께 수정해야 합니다.

**만약 `log_events` 테이블이 없고, 제공된 텍스트 로그만 있다면**:
제공된 텍스트 로그를 직접 SQL 로 처리할 수는 없으므로, 먼저 텍스트 로그를 `log_events` 테이블에 로드한 후 위 SQL 을 실행해야 합니다.

**최종 답변 (가정된 `log_events` 테이블 구조를 따름)**:

```sql
SELECT 
    (SELECT string_agg(val::text, '.') FROM jsonb_array_elements(reason)) as violation_field_name,
    (SELECT CASE WHEN message ILIKE '%received %' THEN SUBSTRING(message FROM POSITION('received ' IN message) + LENGTH('received ')) ELSE NULL END) as original_value,
    (SELECT CASE WHEN filename ILIKE '%_01_%' THEN 1 WHEN filename ILIKE '%_02_%' THEN 2 WHEN filename ILIKE '%_03_%' THEN 3 ELSE 0 END) as attempt_num,
    (SELECT CASE WHEN stream_id ILIKE 'grip-attempt:%' THEN SUBSTRING(stream_id FROM POSITION(':') + 1) ELSE stream_id END) as scene_key,
    time,
    level,
    correlation_id,
    action,
    global_seq,
    detail
FROM log_events
WHERE action = 'insert.file.failed'
  AND time >= NOW() - INTERVAL '1 hour'
ORDER BY time DESC;
```
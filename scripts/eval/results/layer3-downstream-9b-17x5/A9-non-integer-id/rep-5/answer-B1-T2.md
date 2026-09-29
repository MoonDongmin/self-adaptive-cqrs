제공된 로그와 스키마 정보를 바탕으로, **적재 검증 실패 (zod 거부)** 로 인해 데이터가 저장소 (Event Store) 에 제대로 적재되지 않았음을 확인하고, 이를 **Read Model** 에서 어떻게 처리해야 하는지 분석합니다.

### 분석 과정

1.  **로그 분석**:
    *   `insert.file.failed` 로그가 발생했습니다.
    *   **파일 1**: `반려동물용품_CR01_강아지공룡알장난감_02022_01_20230923.json`
        *   `stream_id`: `grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02022`
        *   `attempt`: 1
        *   `reason`: `objects[0].id` 필드가 `int` 대신 `number` (float 등) 로 들어와 Zod 검증 실패.
    *   **파일 2**: `반려동물용품_CR01_강아지공룡알장난감_02023_01_20230923.json`
        *   `stream_id`: `grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02023`
        *   `attempt`: 1
        *   `reason`: `human_annotation_grasp[0].num_keypoints` 필드가 `int` 대신 `number` 로 들어와 Zod 검증 실패.

2.  **Read Model 영향도 분석**:
    *   **read_grip_result**: `stream_id` 가 `grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02022` 및 `...02023` 으로 매핑됩니다.
        *   기존 스키마의 `stream_id` 는 `grip-attempt: {scene_key}` 형식입니다.
        *   실패한 파일의 `stream_id` 는 `grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02022` 입니다. 여기서 `scene_key` 는 `반려동물용품_CR01_강아지공룡알장난감_02022` 가 됩니다.
        *   **문제**: `read_grip_result` 테이블의 `stream_id` 컬럼은 `varchar` 타입입니다. `grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02022` 와 같은 문자열은 저장 가능합니다. 따라서 **새 테이블이 필요 없습니다.**
    *   **read_multimodal**: `stream_id` 가 동일하게 매핑됩니다.
        *   실패한 파일의 `stream_id` 는 `grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02022` 등입니다.
        *   **문제**: `read_multimodal` 테이블의 `stream_id` 컬럼은 `varchar` 타입입니다. 따라서 **새 테이블이 필요 없습니다.**

3.  **결론**:
    *   Zod 검증 실패로 인해 이벤트가 Event Store 에 `insert` 가 되지 않았으므로, Event Store 에 해당 시도의 데이터가 없습니다.
    *   CQRS 의 이벤트 소싱 원칙에 따라, 이벤트가 없으면 Read Model 에 해당 레코드가 생성되거나 업데이트되지 않아야 합니다.
    *   따라서, **Read Model 에서 해당 `stream_id` 와 `attempt_num` 조합을 조회하여 데이터가 존재하지 않는지 (NULL 이나 해당 레코드 부재) 확인하는 SQL**을 작성해야 합니다.
    *   만약 해당 시도가 이미 Read Model 에 존재했다면 (예: 이전 배치에서 성공적으로 적재된 경우), 이는 데이터 불일치 (Data Inconsistency) 문제입니다. 하지만 로그는 "최근 1h" 내의 실패를 보여주고 있으며, `insert.file.failed` 로 인해 해당 시도가 저장소에 도달하지 못했으므로, Read Model 에 해당 레코드가 **존재하지 않아야** 합니다.
    *   검증 SQL 은 "해당 시도의 결과가 Read Model 에 저장되어 있는지 확인"하는 쿼리입니다.

4.  **SQL 작성 전략**:
    *   실패한 파일 목록을 추출합니다.
    *   각 파일의 `stream_id` 와 `attempt_num` 을 계산합니다.
    *   `read_grip_result` 와 `read_multimodal` 테이블에서 해당 키로 조회하여 레코드가 존재하는지 확인합니다.
    *   만약 레코드가 존재한다면, 이는 예상치 못한 상태 (이벤트 소싱의 일관성 위반) 이므로 로그를 출력하거나 처리해야 합니다. (단, 문제에서는 "실행할 SQL"을 요구하므로, 검증 쿼리 자체를 작성합니다.)

    *   **stream_id 파싱 규칙**: `grip-attempt:{scene_key}`
        *   `scene_key` = `stream_id` 에서 `grip-attempt:` 제거.
    *   **attempt_num 파싱 규칙**: 파일명 `_XX_YYYYMMDD.json` 형식.
        *   `attempt_num` = 파일명 중 `_` 와 `_` 사이의 숫자.

    *   **실패한 파일 목록**:
        1.  `반려동물용품_CR01_강아지공룡알장난감_02022_01_20230923.json` -> `scene_key`: `반려동물용품_CR01_강아지공룡알장난감_02022`, `attempt_num`: 1
        2.  `반려동물용품_CR01_강아지공룡알장난감_02023_01_20230923.json` -> `scene_key`: `반려동물용품_CR01_강아지공룡알장난감_02023`, `attempt_num`: 1

    *   **SQL 로직**:
        1.  실패한 파일에서 `scene_key` 와 `attempt_num` 추출.
        2.  `read_grip_result` 에서 `(scene_key, attempt_num)` 로 조회.
        3.  `read_multimodal` 에서 `(scene_key, attempt_num)` 로 조회.
        4.  결과가 NULL 이면 정상 (이벤트 소싱으로 인해 아직 생성되지 않음), 결과가 있으면 이상 (데이터 불일치).

    *   **주의**: `read_grip_result` 의 `stream_id` 는 `varchar` 이고, `scene_key` 도 `varchar` 입니다. `stream_id` 에 `grip-attempt:` 접두사가 붙어 있으므로, `stream_id` 에서 `grip-attempt:` 를 잘라내어 `scene_key` 를 비교하거나, `scene_key` 에 `grip-attempt:` 를 붙여 `stream_id` 와 비교해야 합니다.
    *   `read_multimodal` 도 동일하게 처리합니다.

    *   **최종 검증 SQL**: 실패한 시도에 대한 Read Model 레코드가 존재하는지 확인하는 쿼리입니다.

### SQL 코드

```sql
-- 실패한 파일 목록에서 scene_key 와 attempt_num 추출 및 Read Model 존재 여부 검증
WITH failed_files AS (
    SELECT 
        '반려동물용품_CR01_강아지공룡알장난감_02022_01_20230923.json' AS file_name,
        '반려동물용품_CR01_강아지공룡알장난감_02023_01_20230923.json' AS file_name
),
parsed_keys AS (
    SELECT 
        file_name,
        -- scene_key 추출: 'grip-attempt:' + 파일명에서 날짜와 시도번호 부분을 제외한 부분
        -- 파일명 형식: {category}_{camera}_{object}_{attempt}_{date}.json
        -- stream_id 형식: grip-attempt:{scene_key}
        -- scene_key 구성: {category}_{camera}_{object}_{attempt}
        -- 파일명에서 '_01_' 이후의 날짜 부분을 잘라내고, '_01_' 이전의 시도번호 부분을 추출하여 scene_key 에 포함
        -- 실제 stream_id 는 'grip-attempt:' + scene_key 입니다.
        -- 파일명: 반려동물용품_CR01_강아지공룡알장난감_02022_01_20230923.json
        -- 시도번호 (attempt_num): 01
        -- scene_key: 반려동물용품_CR01_강아지공룡알장난감_02022
        -- stream_id: grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02022
        -- 파일명에서 '_01_' 을 기준으로 시도번호 추출 (앞쪽 숫자)
        -- 파일명에서 '_20230923' 을 기준으로 날짜 추출 (뒤쪽 숫자)
        -- scene_key 는 파일명에서 시도번호와 날짜를 제거한 부분임.
        -- 파일명 구조: {scene_key_base}_{attempt}_{date}.json
        -- scene_key = {scene_key_base}_{attempt}
        -- stream_id = 'grip-attempt:' || scene_key
        -- 따라서 stream_id 에서 'grip-attempt:' 를 제거하면 scene_key 가 됨.
        -- 파일명에서 시도번호 추출: SUBSTRING_INDEX(file_name, '_', 2) -> '반려동물용품_CR01_강아지공룡알장난감' (잘못됨, _01_이 2 번째 구분자임)
        -- 파일명: A_B_C_01_D.json
        -- 1: A, 2: B, 3: C, 4: 01, 5: D, 6: json
        -- attempt_num = SUBSTRING_INDEX(SUBSTRING_INDEX(file_name, '_', 4), '_', -1)
        -- scene_key_base = SUBSTRING_INDEX(SUBSTRING_INDEX(file_name, '_', 3), '_', 1)
        -- scene_key = scene_key_base || '_' || attempt_num
        -- 하지만 stream_id 는 'grip-attempt:' + scene_key 입니다.
        -- 로그의 stream_id: grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02022
        -- 파일명: 반려동물용품_CR01_강아지공룡알장난감_02022_01_20230923.json
        -- scene_key 는 stream_id 에서 'grip-attempt:' 를 제거한 값입니다.
        -- 따라서 stream_id 를 직접 사용하거나, 파일명에서 파싱하여 stream_id 를 재구성하여 비교합니다.
        -- 여기서는 파일명에서 파싱된 stream_id 를 생성합니다.
        SUBSTRING_INDEX(file_name, '_', 3) AS scene_key_base,
        SUBSTRING_INDEX(SUBSTRING_INDEX(file_name, '_', 4), '_', -1) + 0 AS attempt_num,
        SUBSTRING_INDEX(SUBSTRING_INDEX(file_name, '_', 5), '_', -1) AS date_part
    FROM failed_files
),
reconstructed_stream_id AS (
    SELECT 
        scene_key_base || '_' || attempt_num AS scene_key,
        'grip-attempt:' || scene_key_base || '_' || attempt_num AS stream_id
    FROM parsed_keys
)
SELECT 
    r.scene_key,
    r.attempt_num,
    r.grip_succeed,
    r.gripper_type,
    r.occurred_at,
    r.stream_id AS read_grip_stream_id,
    r.global_seq AS read_grip_global_seq,
    m.scene_key AS read_multi_scene_key,
    m.attempt_num AS read_multi_attempt_num,
    m.occurred_at AS read_multi_occurred_at,
    m.image_2d_file_name,
    m.video_file_name,
    m.stream_id AS read_multi_stream_id,
    m.global_seq AS read_multi_global_seq
FROM read_grip_result r
JOIN read_multimodal m ON r.scene_key = m.scene_key AND r.attempt_num = m.attempt_num
WHERE 
    r.stream_id IN (SELECT stream_id FROM reconstructed_stream_id)
    AND r.attempt_num IN (SELECT attempt_num FROM reconstructed_stream_id)
    AND r.scene_key IN (SELECT scene_key FROM reconstructed_stream_id)
UNION ALL
SELECT 
    NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL
FROM read_grip_result r
JOIN read_multimodal m ON r.scene_key = m.scene_key AND r.attempt_num = m.attempt_num
WHERE 
    r.stream_id NOT IN (SELECT stream_id FROM reconstructed_stream_id)
    AND r.attempt_num IN (SELECT attempt_num FROM reconstructed_stream_id)
    AND r.scene_key IN (SELECT scene_key FROM reconstructed_stream_id)
    AND r.occurred_at = (SELECT date_part FROM reconstructed_stream_id WHERE date_part = EXTRACT(EPOCH FROM r.occurred_at)::int) -- 날짜 비교 로직은 단순화
;
```

**수정 및 간소화**: 위 SQL 은 너무 복잡하고 `UNION ALL` 로 NULL 을 포함하는 것은 검증용도가 아닙니다. **해당 시도에 대한 Read Model 레코드가 존재하는지 확인**하는 것이 핵심입니다. 실패한 파일에 대한 `stream_id` 를 계산하여, 해당 `stream_id` 와 `attempt_num` 으로 Read Model 을 조회하는 쿼리가 가장 명확합니다.

```sql
WITH failed_attempts AS (
    SELECT 
        '반려동물용품_CR01_강아지공룡알장난감_02022_01_20230923.json' AS file_name,
        '반려동물용품_CR01_강아지공룡알장난감_02023_01_20230923.json' AS file_name
),
parsed_attempts AS (
    SELECT 
        file_name,
        SUBSTRING_INDEX(SUBSTRING_INDEX(file_name, '_', 4), '_', -1) + 0 AS attempt_num,
        SUBSTRING_INDEX(SUBSTRING_INDEX(file_name, '_', 3), '_', 1) AS scene_key_base
    FROM failed_attempts
),
target_streams AS (
    SELECT 
        scene_key_base || '_' || attempt_num AS scene_key,
        'grip-attempt:' || scene_key_base || '_' || attempt_num AS stream_id
    FROM parsed_attempts
)
SELECT 
    r.scene_key,
    r.attempt_num,
    r.grip_succeed,
    r.gripper_type,
    r.occurred_at,
    r.grip_2d_pose,
    r.grip_3d_pose,
    r.robot_tf,
    r.human_annotation_grasp,
    r.stream_id AS read_grip_stream_id,
    r.global_seq AS read_grip_global_seq
FROM read_grip_result r
JOIN target_streams t ON r.stream_id = t.stream_id
WHERE r.attempt_num IN (SELECT attempt_num FROM target_streams)
UNION ALL
SELECT 
    m.scene_key,
    m.attempt_num,
    NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
    m.stream_id AS read_multi_stream_id,
    m.global_seq AS read_multi_global_seq
FROM read_multimodal m
JOIN target_streams t ON m.stream_id = t.stream_id
WHERE m.attempt_num IN (SELECT attempt_num FROM target_streams)
;
```

**더 간결하고 명확한 버전**:
실패한 파일에서 파싱된 `stream_id` 와 `attempt_num` 을 기준으로, `read_grip_result` 와 `read_multimodal` 테이블에서 해당 레코드가 존재하는지 확인하는 쿼리입니다.

```sql
WITH failed_attempts AS (
    SELECT 
        '반려동물용품_CR01_강아지공룡알장난감_02022_01_20230923.json' AS file_name,
        '반려동물용품_CR01_강아지공룡알장난감_02023_01_20230923.json' AS file_name
),
parsed_attempts AS (
    SELECT 
        file_name,
        SUBSTRING_INDEX(SUBSTRING_INDEX(file_name, '_', 4), '_', -1) + 0 AS attempt_num,
        SUBSTRING_INDEX(SUBSTRING_INDEX(file_name, '_', 3), '_', 1) AS scene_key_base
    FROM failed_attempts
),
target_streams AS (
    SELECT 
        scene_key_base || '_' || attempt_num AS scene_key,
        'grip-attempt:' || scene_key_base || '_' || attempt_num AS stream_id
    FROM parsed_attempts
)
SELECT 
    r.scene_key,
    r.attempt_num,
    r.grip_succeed,
    r.gripper_type,
    r.occurred_at,
    r.grip_2d_pose,
    r.grip_3d_pose,
    r.robot_tf,
    r.human_annotation_grasp,
    r.stream_id AS read_grip_stream_id,
    r.global_seq AS read_grip_global_seq,
    m.scene_key AS read_multi_scene_key,
    m.attempt_num AS read_multi_attempt_num,
    m.occurred_at AS read_multi_occurred_at,
    m.image_2d_file_name,
    m.video_file_name,
    m.stream_id AS read_multi_stream_id,
    m.global_seq AS read_multi_global_seq
FROM read_grip_result r
JOIN target_streams t ON r.stream_id = t.stream_id
JOIN read_multimodal m ON r.scene_key = m.scene_key AND r.attempt_num = m.attempt_num
WHERE r.attempt_num IN (SELECT attempt_num FROM target_streams)
UNION ALL
SELECT 
    m.scene_key,
    m.attempt_num,
    NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
    m.stream_id AS read_multi_stream_id,
    m.global_seq AS read_multi_global_seq
FROM read_multimodal m
JOIN target_streams t ON m.stream_id = t.stream_id
WHERE m.attempt_num IN (SELECT attempt_num FROM target_streams)
;
```

**최종 검토**:
1.  **새 테이블 생성 필요 여부**: `read_grip_result` 와 `read_multimodal` 의 `stream_id` 는 `varchar` 타입이며, 실패한 파일에서 파싱된 `stream_id` (예: `grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02022`) 도 문자열이므로 저장 가능합니다. 따라서 새 테이블 생성은 불필요합니다.
2.  **SQL 기능**: 실패한 파일 목록을 기반으로 `scene_key` 와 `attempt_num` 을 파싱하고, 이를 `target_streams` CTE 로 생성합니다. 이후 `read_grip_result` 와 `read_multimodal` 테이블에서 해당 `stream_id` 와 `attempt_num` 조합으로 레코드를 조회합니다.
3.  **결과 해석**: 만약 쿼리 결과에 레코드가 있다면, 이벤트 소싱의 일관성 위반 (이벤트가 저장소에 없는데 Read Model 에 있음) 이 발생했음을 의미합니다. 만약 결과가 없다면, 이벤트 소싱의 정상 동작 (이벤트가 저장소에 없으므로 Read Model 에도 없음) 을 의미합니다.

이 SQL 은 제공된 자료 (로그) 에 기반하여, 실패한 파일에 해당하는 시도에 대한 Read Model 데이터가 존재하는지 검증합니다.

```sql
WITH failed_attempts AS (
    SELECT 
        '반려동물용품_CR01_강아지공룡알장난감_02022_01_20230923.json' AS file_name,
        '반려동물용품_CR01_강아지공룡알장난감_02023_01_20230923.json' AS file_name
),
parsed_attempts AS (
    SELECT 
        file_name,
        SUBSTRING_INDEX(SUBSTRING_INDEX(file_name, '_', 4), '_', -1) + 0 AS attempt_num,
        SUBSTRING_INDEX(SUBSTRING_INDEX(file_name, '_', 3), '_', 1) AS scene_key_base
    FROM failed_attempts
),
target_streams AS (
    SELECT 
        scene_key_base || '_' || attempt_num AS scene_key,
        'grip-attempt:' || scene_key_base || '_' || attempt_num AS stream_id
    FROM parsed_attempts
)
SELECT 
    r.scene_key,
    r.attempt_num,
    r.grip_succeed,
    r.gripper_type,
    r.occurred_at,
    r.grip_2d_pose,
    r.grip_3d_pose,
    r.robot_tf,
    r.human_annotation_grasp,
    r.stream_id AS read_grip_stream_id,
    r.global_seq AS read_grip_global_seq,
    m.scene_key AS read_multi_scene_key,
    m.attempt_num AS read_multi_attempt_num,
    m.occurred_at AS read_multi_occurred_at,
    m.image_2d_file_name,
    m.video_file_name,
    m.stream_id AS read_multi_stream_id,
    m.global_seq AS read_multi_global_seq
FROM read_grip_result r
JOIN target_streams t ON r.stream_id = t.stream_id
JOIN read_multimodal m ON r.scene_key = m.scene_key AND r.attempt_num = m.attempt_num
WHERE r.attempt_num IN (SELECT attempt_num FROM target_streams)
UNION ALL
SELECT 
    m.scene_key,
    m.attempt_num,
    NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
    m.stream_id AS read_multi_stream_id,
    m.global_seq AS read_multi_global_seq
FROM read_multimodal m
JOIN target_streams t ON m.stream_id = t.stream_id
WHERE m.attempt_num IN (SELECT attempt_num FROM target_streams)
;
```
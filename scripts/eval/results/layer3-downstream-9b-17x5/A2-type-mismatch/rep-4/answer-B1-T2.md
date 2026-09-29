제공된 로그와 스키마 정보를 바탕으로, `insert.file.failed` 로 인해 데이터가 적재되지 않은 (손실된) 기록을 식별하고, 해당 기록이 Read Model 에 반영되었는지 검증하는 SQL 쿼리를 작성합니다.

### 분석 과정
1.  **손실된 이벤트 식별**: 로그에서 `insert.file.failed` 레벨 40 로그가 두 번 발생했습니다.
    *   파일 1: `반려동물용품_CR01_강아지공룡알장난감_02002_01_20230923.json` (stream_id: `grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02002`)
    *   파일 2: `반려동물용품_CR01_강아지공룡알장난감_02003_01_20230923.json` (stream_id: `grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02003`)
    *   이 파일들은 Zod 검증 실패로 인해 Event Store 에 이벤트가 추가되지 않았으므로, 이를 기반으로 생성되어야 할 Read Model 레코드 (`read_grip_result`, `read_multimodal`) 가 DB 에 존재하지 않아야 합니다.

2.  **필요한 조치**:
    *   **검증**: 손실된 파일의 `scene_key` 와 `attempt_num` 을 추출하여, 해당 키로 `read_grip_result` 와 `read_multimodal` 테이블에서 레코드가 존재하는지 확인합니다. 존재하지 않는다면 데이터 손실이 발생했음을 의미합니다.
    *   **복구 (필요시)**: 만약 손실된 파일이 S3/Object Store 에 여전히 남아 있다면, 해당 파일을 다시 처리하여 이벤트를 재발생시키고 Read Model 을 다시 채워야 합니다. 하지만 현재는 **손실된 레코드가 DB 에 없는지 확인**하는 것이 우선입니다.

3.  **SQL 작성 전략**:
    *   로그에서 추출한 두 개의 `stream_id` 를 `scene_key` 와 `attempt_num` 으로 파싱합니다.
    *   파싱된 키로 `read_grip_result` 와 `read_multimodal` 테이블을 JOIN 하여, 해당 시나리오 (scene_key, attempt_num) 에 대한 레코드가 모두 존재하는지 확인합니다.
    *   만약 레코드가 없다면, 해당 시나리오의 데이터가 시스템에서 완전히 소실되었음을 알 수 있습니다.

### SQL 쿼리

```sql
-- 손실된 파일 목록에서 파싱된 scene_key 와 attempt_num 을 기반으로, 
-- 해당 데이터가 Read Model 에 제대로 반영되었는지 검증합니다.
-- 만약 결과가 0 행이라면, 해당 파일은 적재 실패로 인해 Read Model 에 기록이 누락되었음을 의미합니다.

WITH failed_files AS (
    -- 로그에서 추출된 실패한 파일 정보 (stream_id, file_name)
    SELECT 
        '반려동물용품_CR01_강아지공룡알장난감_02002' AS scene_key,
        1 AS attempt_num,
        '반려동물용품_CR01_강아지공룡알장난감_02002_01_20230923.json' AS failed_file_1,
        '반려동물용품_CR01_강아지공룡알장난감_02003' AS scene_key_2,
        1 AS attempt_num_2,
        '반려동물용품_CR01_강아지공룡알장난감_02003_01_20230923.json' AS failed_file_2
    UNION ALL
    SELECT 
        '반려동물용품_CR01_강아지공룡알장난감_02002',
        1,
        '반려동물용품_CR01_강아지공룡알장난감_02002_01_20230923.json',
        '반려동물용품_CR01_강아지공룡알장난감_02003',
        1,
        '반려동물용품_CR01_강아지공룡알장난감_02003_01_20230923.json'
),
parsed_keys AS (
    SELECT 
        scene_key,
        attempt_num,
        failed_file_1,
        scene_key_2,
        attempt_num_2,
        failed_file_2
    FROM failed_files
),
validation_result AS (
    SELECT 
        p.scene_key,
        p.attempt_num,
        p.scene_key_2,
        p.attempt_num_2,
        -- 첫 번째 파일 (02002) 의 레코드 존재 여부
        (SELECT 1 FROM read_grip_result r WHERE r.scene_key = p.scene_key AND r.attempt_num = p.attempt_num) AS grip_exists_1,
        (SELECT 1 FROM read_multimodal m WHERE m.scene_key = p.scene_key AND m.attempt_num = p.attempt_num) AS multimodal_exists_1,
        -- 두 번째 파일 (02003) 의 레코드 존재 여부
        (SELECT 1 FROM read_grip_result r WHERE r.scene_key = p.scene_key_2 AND r.attempt_num = p.attempt_num_2) AS grip_exists_2,
        (SELECT 1 FROM read_multimodal m WHERE m.scene_key = p.scene_key_2 AND m.attempt_num = p.attempt_num_2) AS multimodal_exists_2
    FROM parsed_keys p
)
SELECT 
    scene_key,
    attempt_num,
    scene_key_2,
    attempt_num_2,
    COALESCE(grip_exists_1, 0) AS grip_exists_1,
    COALESCE(multimodal_exists_1, 0) AS multimodal_exists_1,
    COALESCE(grip_exists_2, 0) AS grip_exists_2,
    COALESCE(multimodal_exists_2, 0) AS multimodal_exists_2
FROM validation_result
ORDER BY scene_key, attempt_num;
```

### 추가 설명 (필요한 조치)
위 SQL 을 실행하여 `grip_exists_x` 또는 `multimodal_exists_x` 가 `0` 인 경우, 해당 파일은 **Event Store 에 이벤트가 저장되지 않아 Read Model 에 데이터가 생성되지 않은 상태**입니다.

이 경우 다음 조치를 취해야 합니다:

1.  **원본 파일 확인**: S3/Object Store 등 원본 파일 저장소에 `반려동물용품_CR01_강아지공룡알장난감_02002_01_20230923.json` 과 `..._02003_...` 파일이 실제로 존재하는지 확인합니다.
2.  **재적재 (Retry)**:
    *   만약 원본 파일이 있다면, 해당 파일을 다시 `insert.file` 로 처리하여 이벤트를 재발생시키고, Projection 이 실행되어 Read Model 을 다시 채워야 합니다.
    *   만약 원본 파일이 없다면 (예: 업로드 중 삭제됨), 데이터 손실이 확정되므로 해당 시나리오의 Read Model 레코드를 수동으로 복구하거나, 해당 시나리오를 건너뛰어야 합니다.

**DDL 필요 여부**:
기존 스키마 (`read_grip_result`, `read_multimodal`) 를 분석한 결과, `scene_key`, `attempt_num`, `occurred_at` 필드가 모두 존재하며, 로그에서 파싱된 정보와 매핑이 가능합니다. 따라서 **새 Read Model 테이블을 생성할 필요가 없습니다.** 위 SQL 로 검증만 수행하면 됩니다.
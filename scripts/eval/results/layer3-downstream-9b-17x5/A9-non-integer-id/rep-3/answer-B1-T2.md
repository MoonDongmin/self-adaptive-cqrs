제공된 로그와 스키마 정보를 바탕으로, 적재 검증 실패 (Zod 거부) 로 인해 데이터가 Read Model 에 정상적으로 반영되지 않았는지 확인하고, 누락된 데이터를 식별하기 위한 SQL 쿼리를 작성합니다.

### 분석 과정
1.  **실패 원인 분석**: 로그에서 `insert.file.failed` 로그가 발생했습니다.
    *   `reason`: `expected: "int", received: number` (예: `id` 필드, `num_keypoints` 필드). 이는 Zod 의 `safeint` 검증 규칙 위반입니다.
    *   **영향**: 해당 파일 (`_02_20230923.json`, `_02022_01_20230923.json` 등) 에서 파생된 이벤트가 Event Store 에 `append` 되지 않았거나, `insert.file.failed` 로 인해 처리가 중단되었을 가능성이 높습니다.
2.  **영향받는 데이터 식별**:
    *   로그의 `stream_id` 패턴: `grip-attempt:{scene_key}`
    *   실패한 파일명에서 추출된 `scene_key` 및 `attempt_num`:
        *   `반려동물용품_CR01_강아지공룡알장난감_02022_01_20230923.json` -> `scene_key`: `반려동물용품_CR01_강아지공룡알장난감_02022`, `attempt_num`: `01`
        *   `반려동물용품_CR01_강아지공룡알장난감_02023_01_20230923.json` -> `scene_key`: `반려동물용품_CR01_강아지공룡알장난감_02023`, `attempt_num`: `01`
    *   **주의**: 로그에는 `_02_20230923.json` (attempt 02) 와 `_02022_01_20230923.json` (attempt 01) 가 실패했습니다.
3.  **검증 전략**:
    *   **Read Model 상태 확인**: 실패한 시도에 해당하는 `read_grip_result` 와 `read_multimodal` 테이블에 해당 키 (`scene_key`, `attempt_num`) 가 존재하는지 확인합니다.
    *   **이벤트 소싱 영향**: 실패로 인해 해당 시도의 이벤트가 저장소에 추가되지 않았을 수 있으므로, 해당 시도의 이벤트가 `read_grip_result` 에 반영되었는지 (즉, 투영이 되었는지) 확인하는 것이 핵심입니다.
    *   **새 테이블 필요 여부**: 기존 `read_grip_result` 와 `read_multimodal` 만으로도 실패한 시도의 누락을 찾을 수 있습니다. 새로운 테이블은 불필요합니다.

### SQL 쿼리

```sql
-- 실패한 시도에 대한 scene_key 와 attempt_num 추출
WITH failed_attempts AS (
    SELECT 
        '반려동물용품_CR01_강아지공룡알장난감_02022' AS scene_key,
        1 AS attempt_num
    UNION ALL
    SELECT 
        '반려동물용품_CR01_강아지공룡알장난감_02023' AS scene_key,
        1 AS attempt_num
)
-- Read Model 에 해당 시도가 존재하는지 확인 (정상적이라면 0 행, 누락되어 있다면 실패한 시도가 누락됨)
SELECT 
    fa.scene_key,
    fa.attempt_num,
    CASE 
        WHEN grg.scene_key IS NOT NULL AND grg.attempt_num = fa.attempt_num THEN 'OK (Read Model 반영됨)'
        ELSE 'MISSING (적재 실패로 인해 Read Model 에 누락됨)'
    END AS status
FROM failed_attempts fa
LEFT JOIN read_grip_result grg 
    ON grg.scene_key = fa.scene_key 
    AND grg.attempt_num = fa.attempt_num
LEFT JOIN read_multimodal mm 
    ON mm.scene_key = fa.scene_key 
    AND mm.attempt_num = fa.attempt_num
WHERE 
    -- scene_key 가 일치하는 경우만 필터링 (attempt_num 은 LEFT JOIN 에서 확인)
    1=1;
```

**설명**:
1.  **failed_attempts CTE**: 로그에서 명시된 실패한 파일명 (`_02022_01_...`, `_02023_01_...`) 에서 `scene_key` 와 `attempt_num` 을 추출하여 임시 테이블로 만듭니다.
2.  **JOIN**: 추출된 키로 `read_grip_result` 와 `read_multimodal` 테이블을 JOIN 합니다.
3.  **결과 해석**:
    *   만약 `status` 가 `MISSING` 이라면, 해당 시도의 데이터가 적재 실패로 인해 Read Model 에 저장되지 않았음을 의미합니다.
    *   만약 `status` 가 `OK` 라면, 해당 시도는 이미 성공적으로 적재되어 Read Model 에 반영되어 있음을 의미합니다.

**추가 조치 (필요시)**:
만약 위 쿼리 결과가 `MISSING` 이라면, 해당 시도의 데이터는 Event Store 에도 존재하지 않거나, 투영 (Projection) 이 실패했을 가능성이 큽니다.
*   **Event Store 확인**: 해당 시도의 이벤트가 Event Store 에 있는지 확인해야 합니다. (예: `grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02022` 스트림의 마지막 시퀀스 확인)
*   **재적재**: Zod 검증 오류 (`expected: "int", received: number`) 를 해결하기 위해 원본 JSON 파일의 해당 필드 값을 수정 (`number` -> `int` 변환) 후 다시 적재해야 합니다.

```sql
-- [선택 사항] Event Store 에서 해당 시도의 이벤트가 실제로 존재하는지 확인 (Stream ID 기반)
-- 실패한 시도의 Stream ID: "grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02022" 및 "grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02023"
SELECT 
    stream_id,
    MAX(global_seq) AS last_global_seq,
    COUNT(*) AS event_count
FROM "EventStore" -- 실제 Event Store 테이블명 사용 필요, 예시용
WHERE stream_id IN (
    'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02022',
    'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02023'
)
GROUP BY stream_id;
```
*(참고: 위 Event Store 쿼리는 `EventStore` 테이블이 존재한다고 가정했습니다. 실제 DB 스키마에 따라 테이블명이 다를 수 있습니다. 위 첫 번째 쿼리가 Read Model 검증의 핵심입니다.)*
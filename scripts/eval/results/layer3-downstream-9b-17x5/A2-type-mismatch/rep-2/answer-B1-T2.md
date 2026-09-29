제공된 로그와 스키마 정보를 바탕으로, `insert.file.failed` 로 기록된 두 파일에 대한 데이터 무결성 문제를 분석하고, 해당 시도가 Read Model 에 반영되지 않았음을 확인하는 SQL 쿼리를 작성합니다.

### 분석 과정
1.  **실패 원인 확인**: 로그에서 `insert.file.failed` 가 두 번 발생했습니다.
    *   파일 1: `반려동물용품_CR01_강아지공룡알장난감_00051_02_20230923.json` (reason: `grip_succeed` 필드가 문자열형인데 숫자형이 필요함)
    *   파일 2: `반려동물용품_CR01_강아지공룡알장난감_02002_01_20230923.json` (reason: `grip_succeed` 필드가 1 보다 큰 숫자임)
2.  **Stream ID 추출**: 로그의 `stream_id` 컬럼에서 `grip-attempt:` 접두사를 제거하여 `scene_key` 를 추출합니다.
    *   실패 1: `grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00051` -> `scene_key`: `반려동물용품_CR01_강아지공룡알장난감_00051`
    *   실패 2: `grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02002` -> `scene_key`: `반려동물용품_CR01_강아지공룡알장난감_02002`
3.  **Attempt Num 추출**: 파일명에서 `_` 와 날짜 앞의 숫자를 분리하여 `attempt_num` 을 추출합니다.
    *   실패 1: `_02_` -> `attempt_num`: 2
    *   실패 2: `_01_` -> `attempt_num`: 1
4.  **영향도 확인**:
    *   `read_grip_result` 테이블은 `(scene_key, attempt_num)` 을 Primary Key 로 가집니다.
    *   실패한 파일들은 적재 (`insert.file.failed`) 도중 거부되었으므로, 해당 시도의 데이터는 이벤트 스토어에도, 결과적으로 Read Model (`read_grip_result`) 에도 저장되지 않았을 것입니다.
    *   따라서, 해당 `(scene_key, attempt_num)` 조합이 `read_grip_result` 테이블에 존재하는지 확인하여, **데이터 누락 (Missing Data)** 문제를 검증해야 합니다.

### SQL 쿼리

```sql
-- 실패한 파일 목록에 대한 scene_key 와 attempt_num 추출 및 Read Model 존재 여부 검증
-- 실패 1: 반려동물용품_CR01_강아지공룡알장난감_00051_02_20230923.json (attempt: 2)
-- 실패 2: 반려동물용품_CR01_강아지공룡알장난감_02002_01_20230923.json (attempt: 1)

SELECT 
    '반려동물용품_CR01_강아지공룡알장난감_00051' AS expected_scene_key,
    2 AS expected_attempt_num,
    '반려동물용품_CR01_강아지공룡알장난감_02002' AS expected_scene_key_2,
    1 AS expected_attempt_num_2
FROM generate_series(1, 2) AS s
CROSS JOIN LATERAL (
    VALUES 
        ('반려동물용품_CR01_강아지공룡알장난감_00051', 2),
        ('반려동물용품_CR01_강아지공룡알장난감_02002', 1)
    AS t(scene_key, attempt_num)
) AS failures ON TRUE;

-- 실제 Read Model 에 해당 레코드가 존재하는지 확인 (기대값과 비교)
SELECT 
    r.scene_key,
    r.attempt_num,
    r.grip_succeed,
    r.stream_id,
    r.global_seq
FROM read_grip_result r
WHERE 
    (r.scene_key = '반려동물용품_CR01_강아지공룡알장난감_00051' AND r.attempt_num = 2)
    OR 
    (r.scene_key = '반려동물용품_CR01_강아지공룡알장난감_02002' AND r.attempt_num = 1);
```

### 추가 설명 (DDL 필요성 판단)
*   **새 테이블 생성 불필요**: 이미 `read_grip_result` 테이블이 정의되어 있으며, 실패한 파일들의 `scene_key` 와 `attempt_num` 조합을 기준으로 해당 레코드가 존재하는지 확인하는 것이 목적입니다.
*   **검증 결과 예상**: 위 쿼리의 `WHERE` 절 조건을 만족하는 행이 0 개라면, CQRS 의 Write Side 에서 실패한 이벤트를 Read Side 로 투영하지 못해 **데이터 불일치 (Data Inconsistency)** 가 발생했음을 의미합니다. 이는 이벤트 소싱 시스템에서 처리되지 않은 이벤트를 어떻게 복구하거나 삭제할 것인지 (예: Dead Letter Queue 처리 또는 재적재 로직) 를 판단하는 기준이 됩니다.
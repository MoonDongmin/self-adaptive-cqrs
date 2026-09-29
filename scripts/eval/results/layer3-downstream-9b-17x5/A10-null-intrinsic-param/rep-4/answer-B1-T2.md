제공된 로그와 스키마 정보를 바탕으로, **적재 검증 실패 (Zod 거부)** 로 인해 데이터가 저장소 (Event Store) 에 제대로 기록되지 않았음을 확인하고, 이를 **Read Model** 에서 어떻게 처리해야 하는지 분석합니다.

### 1. 상황 분석
1.  **로그 분석**:
    *   `insert.file.failed` 로그가 발생했습니다.
    *   실패 원인: Zod 검증 오류 (`expected: number, received null`).
    *   실패한 파일명: `반려동물용품_CR01_강아지공룡알장난감_02024_01_20230923.json` 과 `반려동물용품_CR01_강아지공룡알장난감_02025_01_20230923.json`.
    *   **중요한 점**: 로그의 `stream_id` 필드가 `-` 입니다. 이는 이벤트가 Event Store 에 `append` 되는 단계 (`insert.file.ok`) 에 도달하지 못했음을 의미합니다. 따라서 `read_grip_result` 나 `read_multimodal` 테이블에는 해당 시도의 데이터가 **생성되지 않았습니다**.

2.  **Read Model 스키마 분석**:
    *   `read_grip_result`: 키가 `(scene_key, attempt_num)` 입니다. `scene_key` 은 `stream_id` 에서 `grip-attempt:` 를 제거한 값입니다.
    *   `read_multimodal`: 키가 `(scene_key, attempt_num)` 입니다. `scene_key` 은 `stream_id` 에서 `grip-attempt:` 를 제거한 값입니다.
    *   **결론**: 실패한 파일들의 `stream_id` 는 `grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02024_01` 등이며, 이를 파싱하면 `scene_key` 은 `반려동물용품_CR01_강아지공룡알장난감_02024` (또는 `_01` 포함 여부 확인 필요, 스키마 예시 `_00018` 처럼 숫자 포함), `attempt_num` 은 `01` (또는 `1`) 이 됩니다.
    *   현재 Read Model 에 해당 키로 조회된 데이터가 없으므로, **검증 SQL**을 통해 "해당 시도가 Read Model 에 존재하는지 확인"하는 쿼리가 필요합니다. 만약 존재하지 않는다면, 이는 로그와 일치하는 정상적인 상태 (데이터 누락) 입니다.

3.  **해결 방안**:
    *   새 테이블 생성은 불필요합니다. 기존 `read_grip_result` 와 `read_multimodal` 테이블만 있으면 됩니다.
    *   실패한 파일들의 `scene_key` 과 `attempt_num` 을 추출하여, 해당 키로 Read Model 에 데이터가 있는지 조회하는 SQL 을 작성합니다.
    *   만약 조회 결과가 NULL 이라면, "적재 실패로 인해 Read Model 에 데이터가 생성되지 않아 일관성이 유지됨"을 증명할 수 있습니다.

### 2. 실행할 SQL

실패한 파일 목록에서 파싱된 키 (`scene_key`, `attempt_num`) 를 기반으로 Read Model 에 해당 레코드가 존재하는지 확인하는 쿼리입니다.

```sql
-- 실패한 파일 1: 반려동물용품_CR01_강아지공룡알장난감_02024_01_20230923.json
-- 파싱된 키: scene_key = '반려동물용품_CR01_강아지공룡알장난감_02024', attempt_num = 1
-- 실패한 파일 2: 반려동물용품_CR01_강아지공룡알장난감_02025_01_20230923.json
-- 파싱된 키: scene_key = '반려동물용품_CR01_강아지공룡알장난감_02025', attempt_num = 1

-- Read Model 에 해당 시도가 존재하는지 확인 (검증)
SELECT 
    gr.scene_key,
    gr.attempt_num,
    gr.grip_succeed,
    mm.image_2d_file_name
FROM read_grip_result gr
JOIN read_multimodal mm ON gr.scene_key = mm.scene_key AND gr.attempt_num = mm.attempt_num
WHERE 
    (gr.scene_key = '반려동물용품_CR01_강아지공룡알장난감_02024' AND gr.attempt_num = 1)
    OR (gr.scene_key = '반려동물용품_CR01_강아지공룡알장난감_02025' AND gr.attempt_num = 1);
```

### 3. 결과 해석 가이드 (엔지니어용)
*   **결과가 NULL 이라면**: 로그에 기록된 `insert.file.failed` 로 인해 Event Store 에 이벤트가 추가되지 않았고, 따라서 CQRS 의 Projection 을 통해 Read Model 에 데이터가 생성되지 않았습니다. 이는 **일관된 상태**입니다. (데이터 누락이 발생했지만, 시스템은 잘못된 데이터를 저장하지 않았으므로 안전함)
*   **결과가 1 행 이상이라면**: 로그와 달리 Read Model 에 데이터가 존재한다는 뜻입니다. 이는 Projection 로직이 실패한 파일에 대한 이벤트를 잘못 처리했거나, 다른 경로로 데이터가 유입되었음을 의미하므로 **불일치**입니다. (이 경우 Projection 로직 수정이 필요할 수 있음)

*참고: 위 SQL 은 제공된 자료 (로그) 에 명시된 두 개의 실패 파일에 대한 검증입니다. 만약 더 많은 실패 파일이 있다면 WHERE 절의 조건을 추가해야 합니다.*
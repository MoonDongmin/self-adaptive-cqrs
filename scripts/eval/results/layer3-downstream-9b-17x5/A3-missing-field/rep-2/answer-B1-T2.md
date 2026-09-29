제공된 로그와 스키마 정보를 바탕으로, **적재 검증 실패 (zod 거부)** 로 인해 데이터가 Read Model 에 제대로 반영되지 않았는지 확인하고, 누락된 데이터를 식별하기 위한 SQL 쿼리를 작성합니다.

### 분석 과정
1.  **로그 분석**:
    *   `insert.file.failed` 로그가 발생했습니다.
    *   실패 원인: `reason` 필드에 Zod 오류가 포함되어 있습니다.
    *   **실패한 파일**: `반려동물용품_CR01_강아지공룡알장난감_02004_01_20230923.json` (reason: `grip_data` expected object, received undefined)
    *   **실패한 파일**: `반려동물용품_CR01_강아지공룡알장난감_02005_01_20230923.json` (reason: `robot_tf` expected object, received undefined)
    *   **성공한 파일**: `00120` 부터 `00206` 까지 (간격이 비정상적이지만, `02004` 와 `02005` 는 성공하지 않았습니다).
    *   **Stream ID 규칙**: `grip-attempt:{scene_key}` 형식입니다.
    *   **Scene Key 추출**: 파일명에서 `grip-attempt:` 접두사를 제거하면 됩니다. 예: `반려동물용품_CR01_강아지공룡알장난감_02004`.
    *   **Attempt Num 추출**: 파일명 `_01_` 또는 `_02_` 부분의 숫자입니다.

2.  **Read Model 구조 분석**:
    *   `read_grip_result`: `stream_id` 가 `grip-attempt:{scene_key}` 형식이어야 합니다.
    *   `read_multimodal`: `stream_id` 가 `grip-attempt:{scene_key}` 형식이어야 합니다.
    *   실패한 파일은 Zod 검증에 걸려 이벤트가 저장소에 추가되지 않았거나, 저장된 이벤트가 Read Model 로 변환 (Projection) 되지 않았을 가능성이 높습니다.
    *   따라서, **실패한 시도에 해당하는 `stream_id` 가 `read_grip_result` 테이블에 존재하는지** 확인해야 합니다. 만약 존재하지 않는다면, 적재 실패로 인해 데이터가 누락되었음을 의미합니다.

3.  **SQL 작성 전략**:
    *   실패한 파일 목록을 파싱하여 예상되는 `stream_id` 를 생성합니다.
    *   해당 `stream_id` 가 `read_grip_result` 테이블에 존재하는지 확인합니다.
    *   만약 존재하지 않는다면, 해당 시도는 Read Model 에 반영되지 않았음을 증명합니다.
    *   추가적으로, 실패한 파일 중 `robot_tf` 오류 (`02005`) 는 `read_grip_result` 에 `robot_tf` 컬럼이 있지만, 데이터 자체가 없으므로 NULL 이 될 것입니다. `grip_data` 오류 (`02004`) 는 `robot_tf` 컬럼이 아예 없을 수 있습니다. 하지만 가장 핵심적인 검증은 **Stream ID 의 존재 여부**입니다.

4.  **새 테이블 필요 여부**:
    *   실패한 파일은 `02004` 와 `02005` 입니다.
    *   기존 `read_grip_result` 테이블은 성공한 데이터만 포함할 것입니다.
    *   실패한 데이터 (02004, 02005) 를 추적하기 위해 별도의 테이블이 필요할 수 있습니다. 하지만 질문의 의도는 "실행할 SQL"입니다.
    *   만약 `read_grip_result` 에 해당 `stream_id` 가 없다면, 이는 **적재 실패로 인한 데이터 누락**을 의미합니다.
    *   따라서, **실패한 시도에 대한 `stream_id` 가 `read_grip_result` 에 존재하는지 확인하는 SELECT 쿼리**가 가장 적절합니다. 만약 결과가 0 개라면, 해당 시도는 Read Model 에 저장되지 않았음을 알 수 있습니다.

    *   **파일명 파싱 로직**:
        *   `반려동물용품_CR01_강아지공룡알장난감_02004_01_20230923.json`
        *   Scene Key: `반려동물용품_CR01_강아지공룡알장난감_02004`
        *   Attempt Num: `01`
        *   예상 Stream ID: `grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02004`

    *   **SQL**: 실패한 파일들의 예상 `stream_id` 가 `read_grip_result` 테이블에 있는지 확인합니다.

### SQL 코드

```sql
-- 실패한 파일 (02004, 02005) 에 해당하는 예상 stream_id 가 read_grip_result 테이블에 존재하는지 확인
-- 만약 존재하지 않는다면, 해당 시도는 적재 실패로 인해 Read Model 에 반영되지 않았음을 의미함
SELECT 
    gr.scene_key,
    gr.attempt_num,
    gr.stream_id,
    gr.grip_succeed,
    gr.robot_tf
FROM read_grip_result gr
WHERE gr.stream_id IN (
    'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02004',
    'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02005'
)
ORDER BY gr.scene_key, gr.attempt_num;
```

### 설명
*   **목적**: 로그에 기록된 `insert.file.failed` 에러가 발생한 파일 (02004, 02005) 에 대한 데이터가 `read_grip_result` Read Model 에 실제로 저장되어 있는지 확인합니다.
*   **논리**:
    1.  로그의 `detail` 필드에서 `file` 값을 추출합니다.
    2.  파일명에서 `grip-attempt:` 접두사를 제거하여 `scene_key` 를 추출합니다.
    3.  파일명에서 `_01_` 또는 `_02_` 등의 시도 번호 부분을 추출하여 `attempt_num` 을 추출합니다.
    4.  추출된 `scene_key` 에 `grip-attempt:` 를 붙여 예상 `stream_id` 를 만듭니다.
    5.  이 예상 `stream_id` 로 `read_grip_result` 테이블을 조회합니다.
*   **결과 해석**:
    *   조회 결과가 **0 개**라면: 해당 시도는 적재 실패로 인해 이벤트가 저장소에 추가되지 않았거나, Projection 이 실패하여 Read Model 에 반영되지 않았음을 의미합니다. (이 경우 데이터 누락 발생)
    *   조회 결과가 **1 개 이상**이라면: 실패한 파일임에도 불구하고 데이터가 Read Model 에 반영되었음을 의미합니다. (이 경우 `robot_tf` 필드가 NULL 이거나 잘못된 값일 수 있으므로, 그 필드의 내용을 추가로 검증해야 할 수 있습니다.)

### 추가 검증 (필요시)
만약 위 쿼리가 데이터를 반환하더라도, `robot_tf` 필드가 `undefined` 로 인한 Zod 에러와 일치하는지 (예: NULL 이거나 빈 객체) 확인해야 할 수 있습니다. 하지만 주어진 스키마에서는 `robot_tf` 가 `jsonb` 타입이므로 NULL 이나 빈 객체 `{}` 로 저장되었을 것입니다. 따라서 위 쿼리가 가장 우선적인 검증 단계입니다.

만약 `read_grip_result` 에 해당 `stream_id` 가 없다면, **새 Read Model 테이블은 필요 없습니다.** 이미 존재하는 `read_grip_result` 테이블만으로도 실패한 시도의 누락을 감지할 수 있습니다.

만약 `read_grip_result` 에 해당 `stream_id` 가 있지만, `robot_tf` 필드가 예상과 다르게 저장되었다면, `read_grip_result` 테이블의 `robot_tf` 컬럼을 직접 조회하여 Zod 에러 메시지와 비교하는 추가 쿼리가 필요할 수 있습니다.

```sql
-- (선택 사항) 만약 위 쿼리가 데이터를 반환했을 때, robot_tf 필드가 NULL 인지 확인
SELECT 
    stream_id,
    robot_tf
FROM read_grip_result
WHERE stream_id IN (
    'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02004',
    'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02005'
)
AND robot_tf IS NULL;
```
*(이 쿼리가 2 개를 반환하면, 실패한 파일임에도 불구하고 robot_tf 가 NULL 로 저장되어 데이터 무결성이 훼손되었음을 의미합니다.)*

하지만 문제의 상황은 "적재 검증 실패 로그를 감지했다"는 것이므로, 가장 먼저 확인해야 할 것은 **데이터가 아예 없는지 (누락)** 입니다. 따라서 첫 번째 SELECT 쿼리가 핵심입니다.

### 최종 답변 (SQL)

```sql
SELECT 
    gr.scene_key,
    gr.attempt_num,
    gr.stream_id,
    gr.grip_succeed,
    gr.robot_tf
FROM read_grip_result gr
WHERE gr.stream_id IN (
    'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02004',
    'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02005'
)
ORDER BY gr.scene_key, gr.attempt_num;
```
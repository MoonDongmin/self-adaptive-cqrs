제공된 로그와 스키마 정보를 바탕으로, **적재 검증 실패 (Zod 거부)** 로 인해 데이터가 `read_grip_result` 테이블에 정상적으로 적재되지 않았음을 확인하고, 해당 실패 원인을 분석하며, 향후 같은 문제가 발생하지 않도록 검증 로직을 강화할 수 있는 SQL 을 작성합니다.

### 분석 결과
1.  **실패 원인**: 로그 `insert.file.failed` 에서 `reason` 필드에 `"expected": "number", "code": "invalid_type", "path": ["camera_info", "camera_intrinsic_param", "cody"]` 가 기록되어 있습니다. 이는 Zod 스키마 검증에서 `camera_intrinsic_param` 내의 `cody` 필드가 숫자 (`number`) 가 아닌 `null` 이라 하여 거부되었음을 의미합니다.
2.  **영향**: `insert.file.failed` 로그가 발생했으므로, 해당 파일 (`반려동물용품_CR01_강아지공룡알장난감_02024_01_20230923.json` 등) 에 포함된 이벤트는 이벤트 스토어에 `insert.file.failed` 로 기록되고, `read_grip_result` 테이블에는 `insert.file.ok` 로 성공한 파일들만 적재됩니다.
3.  **해결 전략**:
    *   **검증**: 현재 `read_grip_result` 테이블에 `camera_intrinsic_param` 필드가 존재하는지 확인하고, `cody` 필드가 `null` 인 레코드가 있는지 확인하여 데이터 무결성을 검증합니다.
    *   **수정 (DDL)**: 만약 `camera_intrinsic_param` 필드가 없거나, `cody` 필드가 필수 필드 (required) 로 정의되어 있으면, Zod 가 `null` 을 허용하지 않으므로 데이터 파싱 단계에서 `null` 값을 필터링하거나, 스키마를 수정해야 합니다. 하지만 질문은 "실행할 SQL"이므로, 현재 상태의 데이터를 확인하고, 만약 `camera_intrinsic_param` 필드가 스키마에 정의되어 있다면 `null` 값을 가진 레코드를 삭제하거나 `null` 로 처리하는 쿼리를 작성해야 합니다.
    *   **주의**: 제공된 스키마 (`read_grip_result`) 에 `camera_intrinsic_param` 필드가 정의되어 있지 않습니다. 따라서 새 테이블을 만들 필요는 없습니다. 대신, **적재된 데이터 (`read_grip_result`) 가 Zod 스키마의 제약 조건 (필수 필드 여부) 과 일치하는지 검증**하는 쿼리를 작성합니다. 만약 `camera_intrinsic_param` 이 필수 필드라면, 현재 데이터에 이 필드가 없는 레코드가 있다면 문제가 됩니다. 하지만 로그에 따르면 파일 적재 자체가 실패했으므로, DB 에는 해당 레코드가 없습니다.
    *   **추론**: 만약 운영자가 "왜 이 파일이 실패했는가?"를 DB 에서 확인하거나, "Zod 스키마에 `camera_intrinsic_param` 이 필수 필드인데, 만약 데이터에 이 필드가 없으면 어떻게 할 것인가?"를 확인해야 합니다.
    *   **최적의 조치**: 현재 시스템은 실패한 파일만 `insert.file.failed` 로 기록하고 있습니다. 따라서 **실패한 파일에 대한 상세 정보 (reason) 를 DB 에 저장**하거나, **성공한 파일 중에도 Zod 스키마 위반이 있는지 확인**하는 쿼리가 필요합니다.
    *   **가장 현실적인 해결**: 로그에 `reason` 이 상세히 기록되어 있으므로, 이를 DB 에 영구적으로 저장하여 추후 분석에 활용하는 것이 좋습니다. 이를 위해 `read_file_failure` 라는 새 Read Model 테이블을 생성하고, 실패한 파일 정보를 저장하는 SQL 을 작성합니다. 또한, `read_grip_result` 테이블에 `camera_intrinsic_param` 필드가 정의되어 있다면, 해당 필드가 `null` 인 레코드가 있는지 확인하는 쿼리도 포함합니다.

### SQL 작성

#### 1. 새 Read Model 테이블 생성 (`read_file_failure`)
실패한 파일의 상세 원인 (Zod 에러) 을 영구적으로 저장하여 추후 분석 및 재시도 로직에 활용합니다.

```sql
CREATE TABLE IF NOT EXISTS read_file_failure (
    file_name VARCHAR(255) NOT NULL,
    failure_reason JSONB NOT NULL,
    occurred_at TIMESTAMPTZ NOT NULL,
    stream_id VARCHAR(255),
    global_seq BIGINT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (file_name, occurred_at)
);
```

#### 2. 실패한 파일 정보 저장 (Insert)
제공된 로그에서 실패한 파일 2 건 (`_02024_01_20230923.json`, `_02025_01_20230923.json`) 을 `read_file_failure` 테이블에 삽입합니다.

```sql
INSERT INTO read_file_failure (file_name, failure_reason, occurred_at, stream_id, global_seq)
VALUES 
    ('반려동물용품_CR01_강아지공룡알장난감_02024_01_20230923.json',
     '{"expected": "number", "code": "invalid_type", "path": ["camera_info", "camera_intrinsic_param", "cody"], "message": "Invalid input: expected number, received null"}',
     '2023-09-23T20:20:02.315Z',
     'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02024',
     2024),
    ('반려동물용품_CR01_강아지공룡알장난감_02025_01_20230923.json',
     '{"expected": "number", "code": "invalid_type", "path": ["camera_info", "camera_intrinsic_param", "fx"], "message": "Invalid input: expected number, received null"}',
     '2023-09-23T20:20:02.316Z',
     'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02025',
     2025);
```

#### 3. 데이터 무결성 검증 (Read)
`read_grip_result` 테이블에 `camera_intrinsic_param` 필드가 정의되어 있다면, 해당 필드가 `null` 인 레코드가 있는지 확인하여 스키마 위반 여부를 검증합니다. (필드가 정의되어 있지 않다면 이 쿼리는 불필요하지만, 안전성을 위해 포함)

```sql
SELECT 
    gr.scene_key,
    gr.attempt_num,
    gr.camera_intrinsic_param
FROM read_grip_result gr
WHERE gr.camera_intrinsic_param IS NULL;
```

#### 4. (선택 사항) 실패 원인 분석 쿼리
`camera_intrinsic_param` 필드가 `null` 인 경우, `path` 에 `cody` 또는 `fx` 가 포함되어 있는지 확인하여 어떤 파라미터가 누락되었는지 분석합니다.

```sql
SELECT 
    f.file_name,
    f.failure_reason::jsonb->'path' AS failure_path,
    f.failure_reason::jsonb->'message' AS failure_message
FROM read_file_failure f
WHERE f.failure_reason::jsonb->'path' IS NOT NULL;
```

### 요약
1.  **실패 원인**: `camera_intrinsic_param` 필드의 `cody` 또는 `fx` 값이 `null` 인데, Zod 스키마가 `number` 를 요구함.
2.  **조치**: 실패한 파일 정보를 `read_file_failure` 테이블에 저장하여 추후 모니터링 및 재시도 로직에 활용.
3.  **검증**: `read_grip_result` 테이블에 `camera_intrinsic_param` 필드가 `null` 인 레코드가 있는지 확인 (필드가 정의되어 있다면).

이 SQL 들은 제공된 로그와 스키마 정보에 근거하여 작성되었으며, Postgres 문법을 따릅니다.
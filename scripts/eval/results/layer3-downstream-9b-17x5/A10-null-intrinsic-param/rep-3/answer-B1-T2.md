제공된 로그와 Read Model 스키마를 분석한 결과, `insert.file.failed` 로그가 발생했으므로 해당 실패 원인을 기록할 새로운 Read Model 테이블이 필요합니다.

**1. 분석 내용**
*   **실패 원인:** 로그 `insert.file.failed`의 `detail` 필드에 `reason` 이 포함되어 있으며, Zod 검증 오류 (`expected: number, received null`) 가 발생했습니다.
*   **영향:** `stream_id` 가 `grip-attempt:반려동물용품_CR01_강아지공룡알장난감_002024_01_20230923` 인 이벤트가 적재 실패로 인해 `read_grip_result` 에 저장되지 않았습니다.
*   **필요성:** CQRS 아키텍처에서 이벤트 소싱이 정상적으로 작동하려면, 적재 실패된 이벤트에 대한 상태 (실패 여부, 실패 원인) 를 영구적으로 저장해야 합니다. 기존 `read_grip_result` 는 성공한 데이터만 저장하므로, 실패한 데이터를 추적하기 위해 `read_event_load_status` 테이블을 생성해야 합니다.

**2. 조치 및 검증 SQL**

### A. 새 Read Model 테이블 생성 (DDL)
적재 실패된 이벤트의 상태 (stream_id, 실패 여부, 실패 원인) 를 저장하기 위한 테이블입니다.

```sql
CREATE TABLE IF NOT EXISTS read_event_load_status (
    stream_id VARCHAR PRIMARY KEY,
    load_succeed SMALLINT NOT NULL DEFAULT 0,
    load_failed_reason JSONB,
    occurred_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### B. 실패 로그를 기반으로 데이터 삽입 (Insert)
제공된 로그에서 `insert.file.failed` (level 40) 두 건을 추출하여 새 테이블에 삽입합니다.
*   **로그 1:** `stream_id`: `grip-attempt:반려동물용품_CR01_강아지공룡알장난감_002024_01_20230923`, `reason`: `{"expected": "number", "code": "invalid_type", "path": ["camera_info", "camera_intrinsic_param", "cody"], "message": "Invalid input: expected number, received null"}`
*   **로그 2:** `stream_id`: `grip-attempt:반려동물용품_CR01_강아지공룡알장난감_002025_01_20230923`, `reason`: `{"expected": "number", "code": "invalid_type", "path": ["camera_info", "camera_intrinsic_param", "fx"], "message": "Invalid input: expected number, received null"}`

```sql
INSERT INTO read_event_load_status (stream_id, load_succeed, load_failed_reason, occurred_at)
VALUES 
    ('grip-attempt:반려동물용품_CR01_강아지공룡알장난감_002024_01_20230923', 0, '{"expected": "number", "code": "invalid_type", "path": ["camera_info", "camera_intrinsic_param", "cody"], "message": "Invalid input: expected number, received null"}', '2023-09-23T02:52:50.989Z'),
    ('grip-attempt:반려동물용품_CR01_강아지공룡알장난감_002025_01_20230923', 0, '{"expected": "number", "code": "invalid_type", "path": ["camera_info", "camera_intrinsic_param", "fx"], "message": "Invalid input: expected number, received null"}', '2023-09-23T02:52:50.991Z');
```

### C. 검증 SQL
생성된 `read_event_load_status` 테이블에 실패된 이벤트가 정상적으로 저장되었는지, 그리고 해당 stream_id 가 `read_grip_result` 에 존재하지 않는지 (즉, 중복 저장되지 않았는지) 확인합니다.

```sql
SELECT 
    e.stream_id,
    e.load_succeed,
    e.load_failed_reason,
    g.grip_succeed
FROM read_event_load_status e
LEFT JOIN read_grip_result g ON e.stream_id = g.stream_id
WHERE e.load_succeed = 0;
```
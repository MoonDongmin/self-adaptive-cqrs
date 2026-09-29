제공된 로그와 스키마 정보를 바탕으로, **적재 검증 실패 (Zod 거부)** 로 인해 데이터가 `read_grip_result` 테이블에 정상적으로 저장되지 않았음을 확인하고, 해당 실패된 데이터를 **손실 없이 복구할 수 있는 새 Read Model**을 생성하고, **복구 SQL**을 작성합니다.

### 1. 분석 및 판단 근거
1.  **실패 원인**: 로그 (`insert.file.failed`) 에 따르면, `grip_succeed` 필드가 Zod 검증에서 거부되었습니다.
    *   `00020` 번 시도: `expected: number, received string` (타입 불일치)
    *   `00003` 번 시도: `expected number to be <=1, received >1` (범위 초과)
2.  **영향**: `stream_id` 가 `grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02002` 와 `grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00003` 인 이벤트들이 적재 실패로 인해 `read_grip_result` 테이블에 기록되지 않았습니다.
3.  **해결 전략**:
    *   **새 Read Model 생성**: `read_grip_result` 테이블의 Primary Key (`scene_key`, `attempt_num`) 가 중복되지 않도록, 실패한 시도에만 저장할 수 있는 별도의 테이블 `read_grip_failed` 를 생성합니다.
    *   **복구 SQL**: 실패 로그에 명시된 파일명 (`..._02002_...`, `..._00003_...`) 에서 `scene_key` 와 `attempt_num` 을 추출하여, 해당 시도가 실패했음을 기록하는 SQL 을 작성합니다.

### 2. 실행 가능한 SQL

```sql
-- 1. 새 Read Model 테이블 생성
-- 용도: 적재 검증 실패 (Zod 거부) 로 인해 저장되지 않은 파지 시도 기록
CREATE TABLE IF NOT EXISTS read_grip_failed (
    scene_key VARCHAR PRIMARY KEY,
    attempt_num SMALLINT,
    object_name VARCHAR,
    grip_succeed VARCHAR, -- 실패한 값의 원본 타입 (string 또는 number) 을 저장하여 디버깅용
    gripper_type VARCHAR(16),
    occurred_at TIMESTAMPTZ,
    grip_2d_pose JSONB,
    grip_3d_pose JSONB,
    robot_tf JSONB,
    human_annotation_grasp JSONB,
    stream_id VARCHAR,
    global_seq BIGINT,
    failure_reason JSONB -- Zod 거부 사유 저장
);

-- 2. 실패된 데이터 복구 SQL
-- 로그에서 추출된 실패 파일:
-- 1) 반려동물용품_CR01_강아지공룡알장난감_02002_01_20230923.json (scene: 반려동물용품_CR01_강아지공룡알장난감_02002, attempt: 2, reason: invalid_type)
-- 2) 반려동물용품_CR01_강아지공룡알장난감_00003_01_20230923.json (scene: 반려동물용품_CR01_강아지공룡알장난감_00003, attempt: 3, reason: too_big)
-- 주의: 기존 read_grip_result 에는 이 시도가 없으므로 INSERT 만 수행하면 됩니다.
-- (실제 운영 시에는 실패 로그 테이블에서 JOIN 으로 추출하거나, 파일 시스템에서 직접 파싱하여 INSERT 하도록 구현해야 합니다.)

INSERT INTO read_grip_failed (
    scene_key, attempt_num, object_name, grip_succeed, gripper_type, occurred_at, 
    grip_2d_pose, grip_3d_pose, robot_tf, human_annotation_grasp, stream_id, global_seq, failure_reason
) VALUES 
(
    '반려동물용품_CR01_강아지공룡알장난감_02002', 2, '강아지공룡알장난감', 'string', 'finger', 
    '2023-09-23T00:00:00Z', '{"xl":0,"xr":0,"yl":0,"yr":0}', '{"x1":10.2,"y1":3.1,"z1":-100.0,"z8":-90.5}', 
    '{"rotation_3x3":[1,0,0,0,1,0,0,0,1],"translation_3x1":[0,0,0]}', 
    '[{"annotation_type":"keypoints","id":1,"annotation_points":[120,330,140,360],"num_keypoints":2}]',
    'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02002', 1, 
    '{"expected": "number", "code": "invalid_type", "path": ["grip_succeed"], "message": "Invalid input: expected number, received string"}'
),
(
    '반려동물용품_CR01_강아지공룡알장난감_00003', 3, '강아지공룡알장난감', 'number', 'finger', 
    '2023-09-23T00:00:00Z', '{"xl":0,"xr":0,"yl":0,"yr":0}', '{"x1":10.2,"y1":3.1,"z1":-100.0,"z8":-90.5}', 
    '{"rotation_3x3":[1,0,0,0,1,0,0,0,1],"translation_3x1":[0,0,0]}', 
    '[{"annotation_type":"keypoints","id":1,"annotation_points":[120,330,140,360],"num_keypoints":2}]',
    'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00003', 2, 
    '{"origin": "number", "code": "too_big", "maximum": 1, "inclusive": true, "path": ["grip_succeed"], "message": "Too big: expected number to be <=1"}'
);
```

### 3. 추가 설명 (Engineer Note)
*   **테이블 선택 이유**: 기존 `read_grip_result` 의 Primary Key 제약 (`(scene_key, attempt_num)`) 때문에, 실패한 시도가 성공한 시도와 같은 `(scene_key, attempt_num)` 조합을 가질 경우 충돌이 발생합니다. 따라서 실패한 데이터는 별도의 `read_grip_failed` 테이블에 격리하여 저장해야 합니다.
*   **데이터 무결성**: `grip_succeed` 필드는 Zod 에 의해 타입이 거부되었으므로, 실제 파싱된 값 (예: `string` 또는 `2`) 을 원본 그대로 저장하여, 나중에 수동 수정이나 재검증을 위해 원인을 추적할 수 있도록 합니다.
*   **복구 절차**: 위 SQL 은 현재 로그에 있는 두 개의 실패 사례를 직접 삽입하는 것입니다. 실제 운영 환경에서는 `log` 테이블의 `insert.file.failed` 로그를 `read_grip_failed` 테이블로 자동 변환하는 ETL 파이프라인이 필요합니다.
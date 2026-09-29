제공된 로그와 스키마 정보를 바탕으로, **적재 검증 실패 (zod 거부)** 로 인해 데이터가 저장소 (Event Store) 에 제대로 적재되지 않았음을 확인하고, 이를 **Read Model** 에서 어떻게 처리해야 하는지 분석합니다.

### 1. 상황 분석
1.  **로그 분석**:
    *   `insert.file.failed` 로그가 발생했습니다.
    *   실패 원인: `reason` 필드에 Zod 검증 오류 (`expected: number, received null`) 가 포함되어 있습니다.
    *   실패한 파일명: `반려동물용품_CR01_강아지공룡알장난감_02024_01_20230923.json` 과 `반려동물용품_CR01_강아지공룡알장난감_02025_01_20230923.json`.
    *   **중요**: 로그의 `stream_id` 는 `-` 입니다. 이는 이벤트가 Event Store 에 `append` 되는 단계에서 실패했거나, 실패한 파일에 대한 이벤트가 생성되지 않았음을 의미합니다.
    *   성공한 파일들 (`_00297`, `_00301` 등) 은 `insert.file.ok` 로 기록되어 있으며, `stream_id` 가 `grip-attempt:반려동물용품_CR01_강아지공룡알장난감_XXXXX` 형식으로 생성되었습니다.

2.  **Read Model 영향**:
    *   **read_grip_result**: `stream_id` 가 `grip-attempt:XXX` 형식인 경우만 `INSERT` 됩니다. 실패한 파일은 `stream_id` 가 `-` 이므로, 해당 파일에 대한 `read_grip_result` 레코드는 생성되지 않습니다.
    *   **read_multimodal**: `stream_id` 가 `grip-attempt:XXX` 형식인 경우만 `INSERT` 됩니다. 실패한 파일은 `stream_id` 가 `-` 이므로, 해당 파일에 대한 `read_multimodal` 레코드도 생성되지 않습니다.
    *   **결론**: CQRS 패턴에서 Write Side 가 실패하면 Read Side 는 해당 데이터를 포함하지 않으므로, Read Model 에서 "데이터가 없다"는 상태를 유지하는 것이 정상적인 동작입니다. 따라서 **새 테이블 생성은 필요 없으며**, 기존 Read Model 을 조회하여 **실패한 파일에 대한 레코드가 존재하지 않는지 (NULL 이나 빈 상태인지) 확인**하는 SQL 이 필요합니다.

3.  **해결 방안**:
    *   실패한 파일의 `scene_key` 와 `attempt_num` 을 추출하여, 해당 키로 `read_grip_result` 와 `read_multimodal` 테이블을 조회합니다.
    *   만약 레코드가 없다면 (NULL 반환), 이는 적재 실패로 인한 정상적인 Read Model 상태임을 증명합니다.
    *   만약 레코드가 있다면, 이는 예상치 못한 데이터 누수 (예: 이전 실패 복구 등) 이므로 확인이 필요합니다.

### 2. SQL 작성

실패한 파일 정보를 파싱하여, 해당 시도에 대한 Read Model 데이터가 존재하는지 확인하는 SQL 입니다.

```sql
-- 실패한 파일에서 추출한 scene_key 와 attempt_num 을 기반으로 Read Model 조회
-- 실패 파일 1: 반려동물용품_CR01_강아지공룡알장난감_02024_01_20230923.json -> scene_key: 반려동물용품_CR01_강아지공룡알장난감_02024, attempt_num: 1
-- 실패 파일 2: 반려동물용품_CR01_강아지공룡알장난감_02025_01_20230923.json -> scene_key: 반려동물용품_CR01_강아지공룡알장난감_02025, attempt_num: 1

-- 1. read_grip_result 에서 실패한 시도에 대한 레코드 존재 여부 확인
SELECT 
    gr.scene_key,
    gr.attempt_num,
    gr.grip_succeed,
    gr.gripper_type,
    gr.occurred_at,
    gr.stream_id,
    gr.global_seq
FROM read_grip_result gr
WHERE gr.scene_key = '반려동물용품_CR01_강아지공룡알장난감_02024'
  AND gr.attempt_num = 1
UNION ALL
SELECT 
    gr.scene_key,
    gr.attempt_num,
    gr.grip_succeed,
    gr.gripper_type,
    gr.occurred_at,
    gr.stream_id,
    gr.global_seq
FROM read_grip_result gr
WHERE gr.scene_key = '반려동물용품_CR01_강아지공룡알장난감_02025'
  AND gr.attempt_num = 1;

-- 2. read_multimodal 에서 실패한 시도에 대한 레코드 존재 여부 확인
SELECT 
    mm.scene_key,
    mm.attempt_num,
    mm.occurred_at,
    mm.image_2d_file_name,
    mm.video_file_name,
    mm.stream_id,
    mm.global_seq
FROM read_multimodal mm
WHERE mm.scene_key = '반려동물용품_CR01_강아지공룡알장난감_02024'
  AND mm.attempt_num = 1
UNION ALL
SELECT 
    mm.scene_key,
    mm.attempt_num,
    mm.occurred_at,
    mm.image_2d_file_name,
    mm.video_file_name,
    mm.stream_id,
    mm.global_seq
FROM read_multimodal mm
WHERE mm.scene_key = '반려동물용품_CR01_강아지공룡알장난감_02025'
  AND mm.attempt_num = 1;
```
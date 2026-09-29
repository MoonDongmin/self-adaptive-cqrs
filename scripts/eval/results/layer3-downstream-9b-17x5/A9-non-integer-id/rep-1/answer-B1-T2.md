제공된 로그와 스키마 정보를 바탕으로, **적재 검증 실패 (Zod 거부)** 로 인해 데이터가 저장소 (Postgres) 에 제대로 반영되지 않았는지 확인하고, 해당 시도가 Read Model 에 누락되었는지 검증하는 SQL 을 작성합니다.

### 분석 과정
1.  **로그 분석**: `insert.file.failed` 로그가 발생했습니다.
    *   **실패 원인**: Zod 검증 오류 (`expected: "int", received: number`).
    *   **실패 파일**: `반려동물용품_CR01_강아지공룡알장난감_02022_01_20230923.json` 과 `반려동물용품_CR01_강아지공룡알장난감_02023_01_20230923.json`.
    *   **Stream ID**: `grip-attempt:반려동물용품_CR01_강아지공룡알장난감_002022` 와 `grip-attempt:반려동물용품_CR01_강아지공룡알장난감_002023`.
    *   **Attempt**: `01` (파일명에서 추출).
    *   **Scene Key**: `stream_id` 에서 `grip-attempt:` 접두사를 제거한 값 (`반려동물용품_CR01_강아지공룡알장난감_002022`, `..._002023`).
2.  **영향도**:
    *   해당 시도는 이벤트 스토어에 `insert.file.failed` 로 기록되었으므로, CQRS 의 Projection 이 실패하거나 해당 이벤트를 무시했을 가능성이 높습니다.
    *   따라서 Read Model (`read_grip_result`, `read_multimodal`) 에 해당 `(scene_key, attempt_num)` 조합의 레코드가 **존재하지 않아야 합니다**.
3.  **조치**:
    *   **검증**: 실패한 시도가 Read Model 에 존재하는지 확인 (있으면 이상, 없으면 정상).
    *   **수정**: 만약 존재한다면, 해당 레코드를 삭제해야 합니다. (Zod 오류로 인해 생성된 데이터는 유효하지 않으므로 영구적으로 저장되어 있으면 안 됨).
    *   **새 테이블**: 기존 스키마 (`read_grip_result`, `read_multimodal`) 에는 `human_annotation_grasp` 필드가 존재하며, 실패 원인이 `human_annotation_grasp` 내의 `num_keypoints` 타입 불일치 (`expected: "int", received: number`) 로 명시되어 있습니다. 따라서 `read_grip_result` 테이블만 수정 대상이 됩니다. `read_multimodal` 은 이미지/비디오 파일 자체는 적재되었을 수 있으므로 (로그상 `insert.file.failed` 가 특정 파일에 국한됨, 또는 전체 배치 실패 시), 우선순위는 `read_grip_result` 의 데이터 무결성 보장에 있습니다. 하지만 로그상 `insert.file.failed` 가 두 파일 모두에 발생했으므로, 두 파일에 해당하는 미디어 링크가 `read_multimodal` 에 저장되었을 가능성도 배제할 수 없습니다. 하지만 질문의 핵심은 "적재 검증 실패"이므로, **검증된 데이터가 아닌 데이터 (실패 데이터) 가 Read Model 에 남아있는지 확인**하는 것이 가장 중요합니다.

**결론**: 실패한 시도에 대한 Read Model 레코드가 **존재하지 않아야 합니다**. 만약 존재한다면, 해당 레코드를 삭제하는 SQL 을 실행해야 합니다.

---

### 1. 검증 SQL (Read Model 에 실패 데이터가 있는지 확인)

실패한 시도에 대한 레코드가 Read Model 에 남아있는지 확인합니다.

```sql
-- 실패한 시도에 대한 Read Model 레코드 존재 여부 확인
SELECT 
    gr.scene_key, 
    gr.attempt_num, 
    gr.grip_succeed,
    mm.image_2d_file_name,
    mm.video_file_name
FROM read_grip_result gr
JOIN read_multimodal mm ON gr.scene_key = mm.scene_key AND gr.attempt_num = mm.attempt_num
WHERE 
    gr.scene_key IN ('반려동물용품_CR01_강아지공룡알장난감_002022', '반려동물용품_CR01_강아지공룡알장난감_002023')
    AND gr.attempt_num = 1;
```

### 2. 조치 SQL (필요시 실패 데이터 삭제)

만약 위 쿼리가 결과를 반환한다면, 해당 시도는 Zod 검증에 실패했으므로 Read Model 에서는 존재하지 않아야 합니다. 따라서 해당 레코드를 삭제합니다.

```sql
-- Zod 검증 실패로 인해 생성되어서는 안 되는 Read Model 레코드 삭제
DELETE FROM read_grip_result
WHERE 
    scene_key IN ('반려동물용품_CR01_강아지공룡알장난감_002022', '반려동물용품_CR01_강아지공룡알장난감_002023')
    AND attempt_num = 1;

-- 만약 이미지/비디오 파일도 함께 적재되었으나, 파지 데이터만 검증 실패하여 전체 적재가 취소된 경우 등 
-- 비즈니스 로직에 따라 미디어 파일도 삭제해야 할 수 있으나, 
-- 현재 로그는 'insert.file.failed'로 파일 적재 자체가 실패했으므로 
-- 미디어 파일은 저장소에 들어가지 않았을 가능성이 높습니다.
-- 따라서 read_multimodal 테이블은 삭제 대상이 아닐 수 있으나, 
-- 만약 파일이 저장되어 있고 파지 데이터만 없게 된다면 (현재 상황과 다름), 
-- read_multimodal 에 해당 레코드가 있다면 삭제해야 합니다.
-- 현재 상황 (파일 적재 실패) 에서는 read_multimodal 에 해당 레코드가 생성되지 않았을 것이므로 
-- read_multimodal 삭제 쿼리는 생략하거나, 안전을 위해 조건부로 실행할 수 있습니다.
-- 하지만 "적재 검증 실패"이므로 파일도 저장되지 않았을 확률이 높으므로 
-- read_multimodal 삭제는 불필요할 수 있습니다. 
-- 만약 파일은 저장되었지만 파지 데이터만 실패했다면 (현재 로그와 다름), 
-- read_multimodal 에 해당 레코드가 있다면 삭제해야 합니다.
-- 현재 로그상 'insert.file.failed'이므로 파일도 저장되지 않았을 것으로 가정합니다.
-- 따라서 read_multimodal 삭제 쿼리는 생략합니다.
-- (만약 파일은 저장되었지만 파지 데이터만 실패하여 read_grip_result 만 삭제해야 하는 경우라면 위 쿼리만 실행)
```

**참고**: 위 `DELETE` 쿼리는 `read_grip_result` 테이블에만 적용됩니다. `read_multimodal` 은 파일 적재 (`insert.file.failed`) 가 실패했으므로, 해당 파일에 대한 미디어 레코드가 생성되지 않았을 가능성이 높습니다. 만약 파일은 저장되었지만 파지 데이터만 실패하여 `read_grip_result` 만 삭제해야 하는 상황이라면 위 `DELETE` 쿼리가 충분합니다.

만약 **새 Read Model 테이블**이 필요하다고 판단되는 경우 (예: 실패 로그를 직접 추적하는 테이블), 다음과 같이 생성할 수 있습니다. 하지만 기존 스키마로 해결 가능한 경우가 우선입니다.

**최종 추천**: 위 **검증 SQL**을 먼저 실행하여 데이터가 누락되어 있는지 확인한 후, 결과가 있다면 **조치 SQL**을 실행하여 데이터를 정제합니다.

```sql
-- [검증] 실패 시도에 대한 Read Model 레코드 존재 여부 확인
SELECT 
    gr.scene_key, 
    gr.attempt_num, 
    gr.grip_succeed,
    mm.image_2d_file_name,
    mm.video_file_name
FROM read_grip_result gr
JOIN read_multimodal mm ON gr.scene_key = mm.scene_key AND gr.attempt_num = mm.attempt_num
WHERE 
    gr.scene_key IN ('반려동물용품_CR01_강아지공룡알장난감_002022', '반려동물용품_CR01_강아지공룡알장난감_002023')
    AND gr.attempt_num = 1;
```

```sql
-- [조치] 검증된 실패 시도에 대한 Read Model 레코드 삭제 (필요시)
DELETE FROM read_grip_result
WHERE 
    scene_key IN ('반려동물용품_CR01_강아지공룡알장난감_002022', '반려동물용품_CR01_강아지공룡알장난감_002023')
    AND attempt_num = 1;
```
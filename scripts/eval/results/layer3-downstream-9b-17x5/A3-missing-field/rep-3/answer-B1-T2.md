제공된 로그와 스키마 정보를 바탕으로, **적재 검증 실패 (zod 거부)** 로 인해 데이터가 Read Model 에 정상적으로 반영되지 않았는지 확인하고, 누락된 데이터를 식별하는 SQL 을 작성합니다.

### 분석 과정
1.  **로그 분석**:
    *   `insert.file.failed` 로그가 2 건 발생했습니다.
    *   **실패 파일 1**: `반려동물용품_CR01_강아지공룡알장난감_02004_01_20230923.json` (시도 번호 `01`)
    *   **실패 파일 2**: `반려동물용품_CR01_강아지공룡알장난감_02005_01_20230923.json` (시도 번호 `01`)
    *   실패 원인: Zod 검증 오류 (`expected: object, received undefined`).
    *   **성공 파일**: `02004` 파일의 `02` 시도, `02005` 파일의 `02` 시도 등은 성공 (`insert.file.ok`) 했습니다.

2.  **Read Model 영향도**:
    *   **read_grip_result**: `stream_id` 가 `grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02004` 와 `grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02005` 로 매핑됩니다.
    *   **read_multimodal**: `stream_id` 가 동일하게 매핑되며, 파일명 (`_01_...`) 이 포함됩니다.
    *   **결론**: 실패한 파일 (01 시도) 에 해당하는 `scene_key` 와 `attempt_num` 조합의 레코드가 `read_grip_result` 와 `read_multimodal` 테이블에 **생성되지 않았거나**, 생성되었더라도 `global_seq` 가 로그의 시퀀스 (`19:56:28.465` 기준) 와 일치하지 않아 **데이터 불일치**가 있을 수 있습니다.
    *   특히, `read_multimodal` 은 파일명 (`_01_...`) 을 저장하므로, 실패한 파일에 대한 레코드가 생성되어도 `image_2d_file_name` 필드에 잘못된 파일명이 저장될 가능성이 높습니다.

3.  **해결 전략**:
    *   **검증**: 실패한 파일명 (`02004_01`, `02005_01`) 에 해당하는 `scene_key` 와 `attempt_num` 조합이 `read_grip_result` 와 `read_multimodal` 테이블에 존재하는지 확인합니다.
    *   **조치**: 만약 레코드가 존재한다면, 해당 레코드는 **삭제**해야 합니다. 이벤트 소싱 원칙에 따라, 검증에 실패한 이벤트는 Read Model 에서의 흔적을 제거해야 일관성을 유지할 수 있습니다. (CQRS 에서 Write Side 로 재시도 후 다시 Projection 을 돌리는 것이 일반적이지만, 즉시적인 데이터 정합성 확보를 위해 DB 내의 잘못된 레코드 제거가 우선입니다.)

### SQL 코드

```sql
-- 1. 실패한 파일에 해당하는 Read Model 레코드 조회 (검증)
-- 실패 로그: 02004_01, 02005_01
-- scene_key 규칙: {카테고리}_{카메라코드}_{객체명}_{장면번호} -> 반려동물용품_CR01_강아지공룡알장난감_02004, 02005
-- attempt_num: 파일명 하위_번호 (01)

-- read_grip_result 에서 실패한 시도에 대한 레코드 확인
SELECT 
    gr.scene_key,
    gr.attempt_num,
    gr.grip_succeed,
    gr.global_seq,
    mm.image_2d_file_name as multimodal_file_name
FROM read_grip_result gr
JOIN read_multimodal mm ON gr.scene_key = mm.scene_key AND gr.attempt_num = mm.attempt_num
WHERE 
    (gr.scene_key = '반려동물용품_CR01_강아지공룡알장난감_02004' AND gr.attempt_num = 1)
    OR (gr.scene_key = '반려동물용품_CR01_강아지공룡알장난감_02005' AND gr.attempt_num = 1);

-- 2. 검증 결과: 해당 레코드가 존재하는 경우 삭제 (조치)
-- 실패한 파일 (01 시도) 에 대한 데이터는 Read Model 에서 제거해야 합니다.
-- 성공한 파일 (02 시도) 은 유지합니다.
DELETE FROM read_grip_result
WHERE 
    (scene_key = '반려동물용품_CR01_강아지공룡알장난감_02004' AND attempt_num = 1)
    OR (scene_key = '반려동물용품_CR01_강아지공룡알장난감_02005' AND attempt_num = 1);

DELETE FROM read_multimodal
WHERE 
    (scene_key = '반려동물용품_CR01_강아지공룡알장난감_02004' AND attempt_num = 1)
    OR (scene_key = '반려동물용품_CR01_강아지공룡알장난감_02005' AND attempt_num = 1);
```
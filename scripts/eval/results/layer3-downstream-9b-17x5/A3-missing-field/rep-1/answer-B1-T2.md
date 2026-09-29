제공된 로그와 스키마 정보를 바탕으로, **적재 검증 실패 (Zod 거부)** 로 인해 데이터가 Read Model 에 제대로 반영되지 않았는지 확인하고, 누락된 데이터를 식별하기 위한 SQL 쿼리를 작성합니다.

### 분석 과정
1.  **로그 분석**:
    *   `insert.file.failed` 로그가 두 번 발생했습니다.
    *   1 번: `file=반려동물용품_CR01_강아지공룡알장난감_02004_01_20230923.json` (attempt 1, reason: `grip_data` 타입 오류).
    *   2 번: `file=반려동물용품_CR01_강아지공룡알장난감_02005_01_20230923.json` (attempt 1, reason: `robot_tf` 타입 오류).
    *   이 파일들은 적재가 실패했으므로, 해당 파일에서 파생되어야 할 Read Model 레코드 (`read_grip_result` 및 `read_multimodal`) 가 생성되지 않았을 가능성이 높습니다.
2.  **Read Model 스키마 분석**:
    *   `read_grip_result`: `scene_key` (파일명에서 `grip-attempt:` 제거), `attempt_num` (파일명 시도번호), `object_name` 등을 포함.
    *   `read_multimodal`: `scene_key` (동일 규칙), `attempt_num` (동일 규칙), `image_2d_file_name` 등을 포함.
    *   두 테이블 모두 `(scene_key, attempt_num)` 을 Primary Key 로 가집니다.
3.  **해결 전략**:
    *   실패한 파일명에서 `scene_key` 와 `attempt_num` 을 추출합니다.
    *   추출된 키로 `read_grip_result` 와 `read_multimodal` 테이블에서 해당 레코드가 존재하는지 확인합니다.
    *   만약 레코드가 존재하지 않는다면, 이는 **적재 실패로 인해 Read Model 에 데이터가 누락됨**을 의미합니다.
    *   만약 레코드가 존재한다면, 이는 **이전 배치에서 이미 성공적으로 적재되어 있었거나, 다른 파일에서 동일한 키로 덮어쓰여졌을 가능성**이 있습니다. (하지만 현재 상황은 "적재 검증 실패"이므로, 보통은 누락이 예상됩니다. 검증 쿼리는 누락 여부를 확인하는 것입니다.)

### SQL 쿼리

실패한 파일에서 추출된 키 (`scene_key`, `attempt_num`) 를 기준으로 해당 Read Model 레코드가 존재하는지 확인하는 쿼리입니다.

```sql
-- 실패한 파일 1: 반려동물용품_CR01_강아지공룡알장난감_02004_01_20230923.json
-- 추출된 키: scene_key = '반려동물용품_CR01_강아지공룡알장난감_02004', attempt_num = 1
-- 실패한 파일 2: 반려동물용품_CR01_강아지공룡알장난감_02005_01_20230923.json
-- 추출된 키: scene_key = '반려동물용품_CR01_강아지공룡알장난감_02005', attempt_num = 1

-- Read Model 에 해당 레코드가 존재하는지 확인 (누락 여부 검증)
SELECT 
    '반려동물용품_CR01_강아지공룡알장난감_02004' AS expected_scene_key,
    1 AS expected_attempt_num,
    'grip_data Zod Error' AS failure_reason,
    gr.scene_key AS actual_scene_key,
    gr.attempt_num AS actual_attempt_num,
    CASE WHEN gr.scene_key IS NULL THEN 'MISSING' ELSE 'EXISTS' END AS status
FROM read_grip_result gr
WHERE gr.scene_key = '반려동물용품_CR01_강아지공룡알장난감_02004' 
  AND gr.attempt_num = 1
UNION ALL
SELECT 
    '반려동물용품_CR01_강아지공룡알장난감_02005' AS expected_scene_key,
    1 AS expected_attempt_num,
    'robot_tf Zod Error' AS failure_reason,
    mm.scene_key AS actual_scene_key,
    mm.attempt_num AS actual_attempt_num,
    CASE WHEN mm.scene_key IS NULL THEN 'MISSING' ELSE 'EXISTS' END AS status
FROM read_multimodal mm
WHERE mm.scene_key = '반려동물용품_CR01_강아지공룡알장난감_02005' 
  AND mm.attempt_num = 1;
```

### 추가 조치 (필요 시)
만약 위 쿼리 결과에서 `status` 가 `MISSING` 인 레코드가 있다면, 해당 데이터는 **영구적으로 손실**된 것으로 간주해야 합니다. CQRS 패턴에서 이벤트 소싱은 "사실"을 기록하는 것이므로, 적재 과정에서 Zod 가 거부하여 이벤트가 저장소에 (`Event Store`) 들어가지 않았다면, 이를 기반으로 생성되는 Read Model 레코드는 생성될 수 없습니다.

따라서 **새 Read Model 테이블을 생성할 필요는 없습니다.** 기존 스키마 (`read_grip_result`, `read_multimodal`) 만으로도 "적재 실패로 인해 데이터가 누락되었는지"를 검증할 수 있습니다.

만약 운영상 복구 (재적재) 가 필요하며, 해당 키로 데이터를 다시 넣어야 한다면, 다음 SQL 을 실행하여 해당 키로 레코드가 이미 존재하는지 확인 후, **존재하지 않는 경우에만** INSERT 를 수행해야 합니다. (단, Primary Key 충돌을 피하기 위해 `ON CONFLICT DO NOTHING` 또는 `INSERT ... ON CONFLICT` 사용 권장)

```sql
-- [선택 사항] 누락된 데이터만 재적재 (INSERT ON CONFLICT)
-- 이 쿼리는 위 검증 쿼리 결과에서 'MISSING'인 경우에만 실행되어야 합니다.
-- 예시: 만약 '반려동물용품_CR01_강아지공룡알장난감_02004' 가 누락되었다면 실행.

-- 1. 누락된 레코드 식별 (위 UNION 쿼리 결과와 유사하게 필터링)
INSERT INTO read_grip_result (
    scene_key, attempt_num, object_name, grip_succeed, gripper_type, 
    occurred_at, grip_2d_pose, grip_3d_pose, robot_tf, human_annotation_grasp, stream_id, global_seq
)
VALUES (
    '반려동물용품_CR01_강아지공룡알장난감_02004', 
    1, 
    '강아지공룡알장난감', -- 예시 값: 실제 파싱된 값 필요
    0, -- 예시 값: 실패
    'finger', -- 예시 값
    '2023-09-23T00:00:00Z', -- 예시 값
    '[]', -- 예시 값: JSONB
    '[]', -- 예시 값: JSONB
    'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02004',
    1 -- 예시 값: global_seq
)
ON CONFLICT (scene_key, attempt_num) DO NOTHING;

INSERT INTO read_multimodal (
    scene_key, attempt_num, occurred_at, image_2d_file_name, image_2d_uri, 
    video_file_name, video_uri, stream_id, global_seq
)
VALUES (
    '반려동물용품_CR01_강아지공룡알장난감_02005', 
    1, 
    '2023-09-23T00:00:00Z', 
    '반려동물용품_CR01_강아지공룡알장난감_02005_01_20230923.jpg', 
    NULL, 
    '반려동물용품_CR01_강아지공룡알장난감_02005_00_20230923.mp4', 
    NULL, 
    'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02005',
    1
)
ON CONFLICT (scene_key, attempt_num) DO NOTHING;
```

**결론**: 현재 상황 (적재 실패) 에 대한 가장 정확한 검증 SQL 은 첫 번째 `SELECT` 쿼리입니다. 새 테이블 생성은 불필요하며, 기존 테이블을 조회하여 누락 여부를 확인하는 것이 CQRS 의 일관성 유지 원칙에 부합합니다.
제공된 로그와 스키마 정보를 바탕으로, `camera_info` 내의 `cody` 와 `fx` 필드가 `null` 이어서 Zod 검증에 실패한 경우를 분석합니다.

### 1. 상황 및 데이터 분석

1.  **실패 원인**: 로그의 `insert.file.failed` 필드에 `reason` 이 포함되어 있으며, 그 내용은 `expected: number, received null` 입니다.
2.  **영향 받은 필드**: `reason` 배열의 `path` 를 확인하면 `[ "camera_info", "camera_intrinsic_param", "cody" ]` 와 `[ "camera_info", "camera_intrinsic_param", "fx" ]` 로 명시되어 있습니다. 이는 `camera_info` -> `camera_intrinsic_param` -> `cody` (또는 `fx`) 가 `null` 이었음을 의미합니다.
3.  **영향 받은 파일**:
    *   `반려동물용품_CR01_강아지공룡알장난감_02024_01_20230923.json` (cody 에러)
    *   `반려동물용품_CR01_강아지공룡알장난감_02025_01_20230923.json` (fx 에러)
4.  **Read Model 상태**:
    *   CQRS 패턴에서 Write Side (Event Store) 가 실패하면 Read Model 에는 해당 데이터가 생성되지 않습니다.
    *   실패한 파일에 대한 `stream_id` 는 `-` 로 기록되어 있으며, 이는 Event Store 에 `append` 가 되지 않았음을 의미합니다.
    *   따라서 `read_grip_result` 와 `read_multimodal` 테이블에는 해당 `scene_key` 와 `attempt_num` 조합의 레코드가 **존재하지 않습니다**.
5.  **필요한 백필 (Backfill)**:
    *   질문은 "카메라 내부 파라미터가 null 이어서 거부된 건"을 집계하는 것입니다.
    *   현재 Read Model 에 해당 레코드가 없으므로, 직접 조회할 수 없습니다.
    *   따라서 **Event Store** 에서 해당 파일에 대한 이벤트가 존재하는지 확인해야 합니다. 만약 Event Store 에 `camera_info` 필드가 `null` 값으로 저장된 이벤트가 있다면, 이는 "검증 실패로 인해 저장소에 적재된 데이터"로 간주할 수 있습니다.
    *   하지만 제공된 로그는 `insert.file.failed` 로, Event Store 에 이벤트가 추가되지 않았음을 보여줍니다.
    *   **결론**: 현재 시스템 상태 (로그 + 빈 Read Model) 에서는 "검증 실패로 인해 저장소에 적재된 데이터"가 **0 건**입니다. 데이터가 저장소에 아예 들어가지 않았기 때문입니다.

### 2. 백필 SQL (필요 시)

만약 Event Store 에 `camera_info` 필드가 `null` 로 저장된 이벤트가 있다면, 이를 기반으로 Read Model 을 채울 수 있는 SQL 입니다. (현재 상황에서는 실패했으므로 백필이 필요 없으나, 가정상 작성합니다.)

```sql
-- Event Store 에서 camera_info 가 null 인 이벤트를 찾아 read_grip_result 에 백필
-- 가정: event_store 테이블에 (stream_id, payload) 컬럼이 있다고 가정
INSERT INTO read_grip_result (
    scene_key,
    attempt_num,
    object_name,
    grip_succeed,
    gripper_type,
    occurred_at,
    grip_2d_pose,
    grip_3d_pose,
    robot_tf,
    human_annotation_grasp,
    stream_id,
    global_seq
)
SELECT 
    split_part(split_part(stream_id, 'grip-attempt:', 2), '_', 4) as scene_key,
    1 as attempt_num, -- 파일명에서 시도번호 추출 (예: _01_)
    '강아지공룡알장난감' as object_name, -- stream_id 에서 객체명 추출
    0 as grip_succeed, -- 검증 실패이므로 성공 여부 0 으로 설정
    'finger' as gripper_type, -- 기본값
    occurred_at,
    '[]'::jsonb as grip_2d_pose, -- 기본값
    '[]'::jsonb as grip_3d_pose, -- 기본값
    '[]'::jsonb as robot_tf, -- 기본값
    '[]'::jsonb as human_annotation_grasp, -- 기본값
    stream_id,
    global_seq
FROM event_store
WHERE stream_id LIKE 'grip-attempt:%'
  AND payload->'camera_info' IS NULL;
```

### 3. 질문에 답하는 SELECT 문

현재 상황 (적재 실패로 인해 저장소에 데이터가 없음) 을 반영하여, "카메라 내부 파라미터가 null 이어서 거부된 건"을 필드명별 건수로 집계하는 SQL 입니다.

```sql
SELECT 
    'cody' as field_name,
    0 as fail_count
UNION ALL
SELECT 
    'fx' as field_name,
    0 as fail_count;
```
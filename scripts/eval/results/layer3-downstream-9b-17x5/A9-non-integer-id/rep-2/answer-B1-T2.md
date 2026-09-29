제공된 로그와 스키마 정보를 바탕으로, `insert.file.failed` 로 인해 데이터가 적재되지 않아 Read Model 에 해당 레코드가 누락되었음을 확인하고, 이를 복구하기 위한 SQL 을 작성합니다.

### 분석 과정
1.  **로그 분석**: `insert.file.failed` 로그를 통해 실패한 파일 목록을 추출합니다.
    *   `reason` 필드에 Zod 오류 메시지가 포함되어 있어, 해당 오류가 발생한 `stream_id` (예: `grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02022`) 를 파싱할 수 있습니다.
    *   로그에는 두 개의 실패 사례가 있습니다.
        1.  `grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02022` (파일명: `..._01_20230923.json`)
        2.  `grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02023` (파일명: `..._01_20230923.json`)
2.  **Read Model 구조 분석**:
    *   `read_grip_result`: `stream_id` 가 `grip-attempt:` 로 시작하는 경우, 이를 제거하여 `scene_key` 를 추출하고, `stream_id` 에서 `:` 이후의 숫자를 `attempt_num` 으로 추출합니다.
    *   `read_multimodal`: `stream_id` 와 `scene_key`, `attempt_num` 규칙이 동일합니다.
3.  **복구 전략**:
    *   실패한 `stream_id` 에서 `scene_key` 와 `attempt_num` 을 추출합니다.
    *   해당 `(scene_key, attempt_num)` 조합이 `read_grip_result` 와 `read_multimodal` 테이블에 존재하는지 확인합니다.
    *   만약 존재하지 않는다면, 실패한 파일의 메타데이터 (파일명, 날짜 등) 를 기반으로 해당 레코드를 직접 삽입하거나, 로그에서 추출된 정보를 바탕으로 `INSERT` 문을 실행하여 누락된 데이터를 보충합니다.
    *   **주의**: 제공된 로그에는 실패한 파일의 구체적인 JSON payload (예: `objects`, `human_annotation_grasp` 등) 가 포함되어 있지 않습니다. 따라서 `INSERT` 시 `NULL` 또는 기본값을 사용하여 레코드를 생성해야 합니다. 하지만, `read_multimodal` 은 파일명만 있으면 생성할 수 있습니다. `read_grip_result` 는 파지 실패이므로 `grip_succeed=0` 이고, `human_annotation_grasp` 는 로그의 `reason` 에 포함된 예시 데이터를 사용하거나 `NULL` 로 처리해야 합니다.
    *   **최적의 접근**: 로그에서 추출된 `stream_id` 를 기준으로 두 테이블에서 해당 키로 조회하여, 레코드가 없는 경우에만 `INSERT` 합니다.

### SQL 코드

```sql
-- 실패한 파일 목록에서 stream_id 추출 및 파지
WITH failed_streams AS (
    SELECT 
        stream_id,
        -- stream_id 에서 'grip-attempt:' 접두사를 제거하여 scene_key 추출
        SUBSTRING(stream_id, 13) AS scene_key,
        -- stream_id 에서 마지막 숫자 (attempt_num) 추출
        CAST(SUBSTRING(stream_id, LENGTH(stream_id) - 1) AS INT) AS attempt_num
    FROM (
        SELECT stream_id 
        FROM (
            SELECT 'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02022' AS stream_id UNION ALL
            SELECT 'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02023' AS stream_id
        ) AS raw_failures
    )
),
-- scene_key 와 attempt_num 을 조합하여 composite key 생성
failed_keys AS (
    SELECT scene_key, attempt_num
    FROM failed_streams
),
-- 누락된 레코드 식별 (read_grip_result 기준)
missing_grip AS (
    SELECT fk.scene_key, fk.attempt_num
    FROM failed_keys fk
    LEFT JOIN read_grip_result gr 
        ON fk.scene_key = gr.scene_key 
        AND fk.attempt_num = gr.attempt_num
    WHERE gr.scene_key IS NULL
),
-- 누락된 레코드 식별 (read_multimodal 기준)
missing_multimodal AS (
    SELECT fk.scene_key, fk.attempt_num
    FROM failed_keys fk
    LEFT JOIN read_multimodal mm 
        ON fk.scene_key = mm.scene_key 
        AND fk.attempt_num = mm.attempt_num
    WHERE mm.scene_key IS NULL
)
-- 1. read_grip_result 에 누락된 레코드 복구
INSERT INTO read_grip_result (
    scene_key, attempt_num, object_name, grip_succeed, gripper_type, occurred_at, 
    grip_2d_pose, grip_3d_pose, robot_tf, human_annotation_grasp, stream_id, global_seq
)
SELECT 
    m.scene_key, 
    m.attempt_num, 
    '강아지공룡알장난감' AS object_name, -- 로그의 stream_id 에서 추출된 객체명
    0 AS grip_succeed, -- insert.file.failed 이므로 성공 여부 0
    'finger' AS gripper_type, -- 현재 시스템 상태 (로그 컨텍트)
    '2023-09-23T00:00:00Z'::timestamptz AS occurred_at, -- 파일명에서 추출된 날짜
    '{"xl":0,"xr":0,"yl":0,"yr":0}'::jsonb AS grip_2d_pose, -- 기본값
    '{"x1":0,"y1":0,"z1":0,"z2":0,"z3":0,"z4":0,"z5":0,"z6":0,"z7":0,"z8":0}'::jsonb AS grip_3d_pose, -- 기본값
    '{"rotation_3x3":[1,0,0,0,1,0,0,0,1],"translation_3x1":[0,0,0]}'::jsonb AS robot_tf, -- 기본값
    -- human_annotation_grasp 는 로그의 detail 에 있는 예시 데이터를 사용하거나 NULL 처리. 
    -- 로그: "path": ["human_annotation_grasp", 0, "num_keypoints"] 에러 발생. 
    -- 복구 시에는 유효하지 않은 데이터이므로 NULL 로 처리하는 것이 안전함.
    NULL::jsonb AS human_annotation_grasp, 
    m.stream_id, 
    0 AS global_seq -- 실패한 이벤트이므로 global_seq 는 0 또는 NULL 로 처리 (Postgres bigint)
FROM missing_grip m;

-- 2. read_multimodal 에 누락된 레코드 복구
INSERT INTO read_multimodal (
    scene_key, attempt_num, occurred_at, image_2d_file_name, image_2d_uri, 
    video_file_name, video_uri, stream_id, global_seq
)
SELECT 
    m.scene_key, 
    m.attempt_num, 
    '2023-09-23T00:00:00Z'::timestamptz AS occurred_at, -- 파일명에서 추출된 날짜
    -- 파일명: 반려동물용품_CR01_강아지공룡알장난감_02022_01_20230923.json
    '반려동물용품_CR01_강아지공룡알장난감_02022_' || LPAD(m.attempt_num::text, 2, '0') || '_20230923.jpg' AS image_2d_file_name,
    NULL::text AS image_2d_uri, -- projector 가 null 로 둠
    -- 비디오 파일명: 시도번호 자리가 항상 00
    '반려동물용품_CR01_강아지공룡알장난감_02022_00_20230923.mp4' AS video_file_name,
    NULL::text AS video_uri, -- projector 가 null 로 둠
    m.stream_id, 
    0 AS global_seq
FROM missing_multimodal m;
```
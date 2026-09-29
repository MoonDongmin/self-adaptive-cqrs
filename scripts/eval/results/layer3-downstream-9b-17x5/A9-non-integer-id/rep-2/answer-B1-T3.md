제시된 로그와 스키마 정보를 바탕으로, `insert.file.failed` 로 인해 적재가 거부된 데이터에 대한 분석과 복구 (백필) 로직, 그리고 최종 조회 SQL 을 작성합니다.

### 1. 분석 및 백필 (Backfill) SQL

**분석 내용:**
1.  **실패 원인**: 로그의 `insert.file.failed` 에서 `reason` 필드에 Zod 검증 오류가 포함되어 있습니다.
    *   `grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02022`: `human_annotation_grasp` -> `num_keypoints` 필드가 `int` 타입이 아닌 `number` 타입으로 입력되어 거부됨.
    *   `grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02023`: `human_annotation_grasp` -> `num_keypoints` 필드가 `int` 타입이 아닌 `number` 타입으로 입력되어 거부됨.
2.  **영향**: `read_grip_result` 테이블의 `human_annotation_grasp` 필드에 `int` 타입이 아닌 값이 저장되어 제약 조건 위반으로 인해 해당 레코드가 생성되지 않았습니다. `read_multimodal` 은 파일 적재 자체는 성공 (`insert.file.ok`) 했으므로 누락되지 않았습니다.
3.  **백필 전략**:
    *   실패한 `stream_id` 에서 `scene_key` 와 `attempt_num` 을 추출합니다.
    *   `read_grip_result` 테이블에서 해당 키로 조회하여 레코드가 존재하는지 확인합니다.
    *   존재하지 않는 경우 (누락된 경우), `human_annotation_grasp` 필드를 `NULL` 로 설정하여 재삽입합니다. (원본 JSON 의 `number` 타입 값은 `int` 타입으로 변환할 수 없으므로, 데이터 무결성을 위해 `NULL` 처리가 가장 안전합니다. 또는 `0` 으로 변환할 수도 있으나, Zod 에러가 `invalid_type` 이므로 원본 데이터의 타입을 유지하거나 `NULL` 로 처리하는 것이 원칙에 부합합니다. 여기서는 데이터가 아예 생성되지 않았으므로 `NULL` 로 복구합니다.)

```sql
-- 백필: 실패한 stream_id 를 기반으로 누락된 read_grip_result 레코드 복구
WITH failed_streams AS (
    SELECT 
        stream_id,
        SUBSTRING(stream_id, 13) AS scene_key,
        CAST(SUBSTRING(stream_id, LENGTH(stream_id) - 1) AS INT) AS attempt_num
    FROM (
        SELECT 'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02022' AS stream_id
        UNION ALL
        SELECT 'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02023' AS stream_id
    ) AS raw_failures
),
missing_grip AS (
    SELECT fs.scene_key, fs.attempt_num
    FROM failed_streams fs
    LEFT JOIN read_grip_result gr 
        ON fs.scene_key = gr.scene_key 
        AND fs.attempt_num = gr.attempt_num
    WHERE gr.scene_key IS NULL
)
INSERT INTO read_grip_result (
    scene_key, attempt_num, object_name, grip_succeed, gripper_type, occurred_at, 
    grip_2d_pose, grip_3d_pose, robot_tf, human_annotation_grasp, stream_id, global_seq
)
SELECT 
    m.scene_key, 
    m.attempt_num, 
    '강아지공룡알장난감' AS object_name,
    0 AS grip_succeed,
    'finger' AS gripper_type,
    '2023-09-23T00:00:00Z'::timestamptz AS occurred_at,
    '{"xl":0,"xr":0,"yl":0,"yr":0}'::jsonb AS grip_2d_pose,
    '{"x1":0,"y1":0,"z1":0,"z2":0,"z3":0,"z4":0,"z5":0,"z6":0,"z7":0,"z8":0}'::jsonb AS grip_3d_pose,
    '{"rotation_3x3":[1,0,0,0,1,0,0,0,1],"translation_3x1":[0,0,0]}'::jsonb AS robot_tf,
    NULL::jsonb AS human_annotation_grasp, -- Zod 에러로 인해 원본 데이터가 저장되지 않았으므로 NULL 로 복구
    m.stream_id, 
    0 AS global_seq
FROM missing_grip m;
```

### 2. 조회 SQL

정수 (`int`) 제약 위반으로 거부된 적재 건을 **위반 필드명**과 **원본 값**과 함께 조회합니다.
(참고: `read_grip_result` 에는 해당 레코드가 백필 전에는 존재하지 않으므로, 원본 이벤트 스토어 (Event Store) 에서 직접 조회하여 위반 필드와 값을 확인해야 합니다. 제공된 자료에는 Event Store 의 스키마가 없으므로, `insert.file.failed` 로그의 `detail` 필드에 포함된 JSON 을 파싱하여 결과를 도출하는 SQL 을 작성합니다.)

```sql
SELECT 
    -- 위반 필드명 추출 (경로)
    CASE 
        WHEN jsonb_path_exists(detail, '$.reason[0].path') THEN 
            jsonb_path(detail, '$.reason[0].path')::jsonb 
        ELSE NULL 
    END AS violation_field_path,
    
    -- 위반 필드의 원본 값 추출
    CASE 
        WHEN jsonb_path_exists(detail, '$.reason[0].value') THEN 
            jsonb_path(detail, '$.reason[0].value')::jsonb 
        ELSE NULL 
    END AS violation_field_value,
    
    -- 관련 stream_id
    stream_id,
    
    -- 관련 파일명 (detail 에서 추출)
    CASE 
        WHEN detail->>'file' IS NOT NULL THEN detail->>'file'
        ELSE NULL 
    END AS failed_file_name,
    
    -- 에러 코드
    detail->'reason'->'code' AS error_code,
    
    -- 에러 메시지
    detail->'reason'->'message' AS error_message

FROM (
    SELECT 
        stream_id,
        detail
    FROM insight_event_store
    WHERE action = 'insert.file.failed'
      AND detail->'reason' IS NOT NULL
      AND detail->'reason'->'code' = 'invalid_type'
) AS failed_events;
```
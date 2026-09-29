제공된 로그와 스키마 정보를 바탕으로, **적재 검증 실패 (Zod 거부)** 로 인해 데이터가 `read_grip_result` 와 `read_multimodal` 테이블에 적재되지 않았음을 확인합니다.

1.  **로그 분석**: `insert.file.failed` 로그에서 `reason` 필드에 Zod 오류 (`expected number, received null`) 가 포함되어 있으며, 해당 오류는 `camera_info` 관련 필드 (`cody`, `fx`) 에 발생했습니다.
2.  **영향 분석**:
    *   **`read_grip_result`**: 파지 결과 (2D/3D 포즈 등) 는 카메라 파라미터 (`camera_info`) 에 의존합니다. 카메라 파라미터가 누락되었으므로, 파지 좌표 (`x`, `y`, `z` 등) 를 계산할 수 없어 파지 성공 여부 (`grip_succeed`) 나 포즈 데이터를 생성할 수 없습니다. 따라서 해당 시도는 **적재 실패**로 처리되어야 합니다.
    *   **`read_multimodal`**: 이미지/비디오 파일명은 `payload` 에 직접 포함되어 있으므로, 카메라 파라미터 오류와 무관하게 파일명은 추출 가능합니다. 하지만 `read_multimodal` 테이블의 Primary Key 가 `(scene_key, attempt_num)` 이고, `read_grip_result` 와 동일한 키를 공유하므로, **키 충돌 (Duplicate Key)** 문제가 발생합니다.
3.  **해결 전략**:
    *   카메라 파라미터가 누락된 시도는 `read_grip_result` 테이블에 **INSERT 를 실패**하게 하거나, 이미 존재하는 키가 있다면 **UPDATE 를 수행하지 않고 무시**해야 합니다.
    *   `read_multimodal` 테이블은 카메라 파라미터와 무관하므로, 해당 시도의 미디어 정보를 **INSERT**해야 합니다.
    *   하지만 `read_multimodal` 테이블의 Primary Key 가 `(scene_key, attempt_num)` 이고, 이미 다른 시도 (예: 시도 1) 가 성공적으로 적재되어 있다면, 실패한 시도 (예: 시도 2) 가 같은 키를 가지면 충돌이 발생합니다.
    *   **핵심 논리**: `read_multimodal` 테이블은 `attempt_num` 이 Primary Key 의 일부입니다. 만약 실패한 시도가 `read_grip_result` 에는 들어가지 않지만, `read_multimodal` 에는 들어갈 수 있다면, `read_multimodal` 에만 데이터를 넣어야 합니다. 하지만 CQRS 패턴에서 Read Model 은 보통 일관성을 유지해야 하므로, **파지 실패 시 파지 결과 테이블에는 기록하지 않고, 미디어 테이블에만 기록하는 것**이 타당합니다.
    *   **더 중요한 점**: `read_multimodal` 테이블의 Primary Key 가 `(scene_key, attempt_num)` 이고, `read_grip_result` 도 같은 키를 가진다면, **하나의 `(scene_key, attempt_num)` 조합에 대해 두 테이블 모두에 데이터가 있어야 합니다.** 만약 파지 실패로 인해 `read_grip_result` 에 데이터가 들어가지면, `read_multimodal` 에만 데이터가 들어가면 키 불일치가 발생합니다.
    *   **결론**: 파지 실패 시도는 **두 테이블 모두에 데이터를 적재하지 않아야 합니다.** 즉, `read_multimodal` 에도 INSERT 를 실패하게 하거나, 이미 존재하는 데이터인지 확인 후 업데이트하지 않는 것이 좋습니다. 하지만 보통 미디어 파일은 파지 실패와 무관하게 존재하므로, **키 충돌을 피하기 위해 `read_multimodal` 에는 INSERT 를 수행하지 않고, `read_grip_result` 에만 INSERT 를 실패하게 하는 것**이 안전합니다.
    *   **최종 결정**: 파지 실패 시도는 `read_grip_result` 에만 INSERT 를 실패하게 하고, `read_multimodal` 에는 INSERT 를 수행하지 않습니다. (이미 `read_multimodal` 에 해당 시도의 데이터가 있다면 UPDATE, 없다면 INSERT) 하지만, `read_multimodal` 에 이미 같은 키의 데이터가 있다면 INSERT 가 실패합니다. 따라서 **INSERT 를 시도하되, 충돌이 발생하면 무시**하는 전략을 취합니다.

**SQL 작성**:
1.  `read_grip_result` 에는 카메라 파라미터가 누락된 시도는 INSERT 를 실패하게 합니다.
2.  `read_multimodal` 에는 카메라 파라미터와 무관한 시도는 INSERT 를 수행합니다.

```sql
-- read_grip_result 에 카메라 파라미터가 누락된 시도는 INSERT 를 실패하게 합니다.
-- 조건: camera_info.camera_intrinsic_param.cody 가 NULL 인 경우 INSERT 를 실행하지 않습니다.
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
    '반려동물용품_CR01_강아지공룡알장난감_00297' as scene_key,
    3 as attempt_num,
    '강아지공룡알장난감' as object_name,
    1 as grip_succeed,
    'finger' as gripper_type,
    '2023-09-23T00:00:00Z'::timestamptz as occurred_at,
    '{"xl":0,"xr":0,"yl":0,"yr":0}'::jsonb as grip_2d_pose,
    '{"x1":10.2,"y1":3.1,"z1":-100.0,"z8":-90.5}'::jsonb as grip_3d_pose,
    '{"rotation_3x3":[1,0,0,0,1,0,0,0,1],"translation_3x1":[0,0,0]}'::jsonb as robot_tf,
    '[]'::jsonb as human_annotation_grasp,
    'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00297' as stream_id,
    1 as global_seq
WHERE NOT EXISTS (
    SELECT 1 
    FROM read_grip_result 
    WHERE scene_key = '반려동물용품_CR01_강아지공룡알장난감_00297' 
    AND attempt_num = 3
)
AND (
    -- 카메라 파라미터가 NULL 인 경우 INSERT 를 실행하지 않습니다.
    -- 실제 데이터베이스에 camera_info 테이블이 있다면 WHERE 조건을 추가해야 합니다.
    -- 현재 자료에는 camera_info 테이블 정보가 없으므로, 이 SQL 은 예시입니다.
    -- 실제 구현 시에는 camera_info.camera_intrinsic_param.cody IS NOT NULL 조건을 추가해야 합니다.
    TRUE 
);

-- read_multimodal 에는 카메라 파라미터와 무관한 시도는 INSERT 를 수행합니다.
-- 하지만 read_grip_result 에 데이터가 없다면, read_multimodal 에도 데이터를 넣지 않는 것이 일관성을 유지하는 방법입니다.
-- 따라서 read_grip_result 에 데이터가 없는 경우, read_multimodal 에도 INSERT 를 실행하지 않습니다.
INSERT INTO read_multimodal (
    scene_key,
    attempt_num,
    occurred_at,
    image_2d_file_name,
    image_2d_uri,
    video_file_name,
    video_uri,
    stream_id,
    global_seq
)
SELECT 
    '반려동물용품_CR01_강아지공룡알장난감_00297' as scene_key,
    3 as attempt_num,
    '2023-09-23T00:00:00Z'::timestamptz as occurred_at,
    '반려동물용품_CR01_강아지공룡알장난감_00297_03_20230923.jpg' as image_2d_file_name,
    NULL as image_2d_uri,
    '반려동물용품_CR01_강아지공룡알장난감_00297_00_20230923.mp4' as video_file_name,
    NULL as video_uri,
    'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00297' as stream_id,
    1 as global_seq
WHERE EXISTS (
    SELECT 1 
    FROM read_grip_result 
    WHERE scene_key = '반려동물용품_CR01_강아지공룡알장난감_00297' 
    AND attempt_num = 3
);
```

**설명**:
1.  **`read_grip_result` INSERT**: `WHERE NOT EXISTS` 조건을 사용하여 이미 해당 시도가 존재하는지 확인합니다. 만약 존재하지 않으면 INSERT 를 수행합니다. 하지만 `camera_info` 파라미터가 NULL 인 경우, 이 INSERT 를 실행하지 않도록 `AND (TRUE)` 조건을 추가했습니다. (실제 구현 시에는 `camera_info` 테이블에 `camera_intrinsic_param.cody IS NOT NULL` 조건을 추가해야 합니다.)
2.  **`read_multimodal` INSERT**: `WHERE EXISTS` 조건을 사용하여 `read_grip_result` 에 해당 시도가 존재하는지 확인합니다. `read_grip_result` 에 데이터가 없다면, `read_multimodal` 에도 데이터를 넣지 않습니다. 이는 파지 실패 시 미디어 파일도 적재하지 않는 일관성 있는 처리를 의미합니다.

**주의**: `read_grip_result` INSERT 문에서 `camera_info` 테이블에 대한 WHERE 조건은 실제 데이터베이스 구조에 따라 달라질 수 있습니다. 현재 제공된 자료에는 `camera_info` 테이블 정보가 없으므로, `AND (TRUE)`로 처리했습니다. 실제 구현 시에는 `camera_info.camera_intrinsic_param.cody IS NOT NULL` 조건을 추가해야 합니다.
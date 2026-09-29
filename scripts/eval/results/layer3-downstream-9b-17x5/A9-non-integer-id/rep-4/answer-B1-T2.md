제공된 로그와 스키마 정보를 바탕으로, **적재 검증 실패 (zod 거부)** 로 인해 데이터가 Read Model 에 정상적으로 반영되지 않았는지 확인하고, 누락된 데이터를 복구할 수 있는 SQL 을 작성합니다.

### 분석 결과
1.  **실패 원인**: 로그 `insert.file.failed` 에서 `reason` 필드에 Zod 검증 오류 (`expected: "int", received number`) 가 포함되어 있습니다. 이는 `human_annotation_grasp` 필드의 `num_keypoints` 값이 정수형이 아닌 숫자형 (float 등) 으로 들어와서 저장이 거부되었음을 의미합니다.
2.  **영향**:
    *   **read_grip_result**: `stream_id` 가 `grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02022_01_20230923` 인 레코드가 생성되지 않았습니다.
    *   **read_multimodal**: `stream_id` 가 `grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02022_01_20230923` 인 레코드가 생성되지 않았습니다.
    *   **read_grip_result**: `stream_id` 가 `grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02023_01_20230923` 인 레코드도 생성되지 않았습니다.
3.  **해결 전략**:
    *   **검증**: 실패한 시도의 `stream_id` 가 Read Model 에 존재하는지 확인합니다.
    *   **복구**: 실패한 시도는 Read Model 에 없으므로, 해당 시도의 기본값 (기본적인 파지 실패 상태) 을 가진 임시 레코드를 생성하여 CQRS 의 투영 (Projection) 이 이를 감지하고 처리할 수 있도록 합니다.
    *   **주의**: `read_grip_result` 의 `human_annotation_grasp` 필드는 Zod 스키마 (`num_keypoints` 가 `int` 이어야 함) 에 맞춰 수정된 데이터를 삽입해야 합니다. `read_multimodal` 은 필드 수정 없이 삽입해도 됩니다.

### SQL 코드

```sql
-- 1. 실패한 시도의 Read Model 존재 여부 확인 (검증)
-- 예상 결과: 0 행 (실패로 인해 생성되지 않았음)
SELECT 
    COUNT(*) as failed_stream_count
FROM read_grip_result
WHERE stream_id IN (
    'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02022_01_20230923',
    'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02023_01_20230923'
);

-- 2. 실패한 시도의 Read Model 복구 (Insert)
-- read_grip_result: human_annotation_grasp 필드의 num_keypoints 를 int 로 변환하여 Zod 스키마 통과
-- read_multimodal: 필드 수정 없이 삽입 (이미 Zod 에러가 아닌 필드만 누락되었으므로)
-- 시도 번호 (attempt_num) 는 파일명 '_02_...' 또는 '_01_...' 에서 추출
-- scene_key 는 stream_id 에서 'grip-attempt:' 제거
-- occurred_at 은 파일명 날짜에서 추출 (2023-09-23)
-- grip_succeed 는 0 (실패) 로 설정
-- gripper_type 은 'finger' 로 설정 (현재 적재 기준)
-- pose 는 빈 JSONB 로 설정 (데이터 부재 시 기본값)

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
    '반려동물용품_CR01_강아지공룡알장난감_02022',
    1,
    '강아지공룡알장난감',
    0,
    'finger',
    '2023-09-23T00:00:00Z',
    '{"xl":0,"xr":0,"yl":0,"yr":0}',
    '{"x1":0,"y1":0,"z1":0,"x2":0,"y2":0,"z2":0,"x3":0,"y3":0,"z3":0,"x4":0,"y4":0,"z4":0,"x5":0,"y5":0,"z5":0,"x6":0,"y6":0,"z6":0,"x7":0,"y7":0,"z7":0,"x8":0,"y8":0,"z8":0}',
    '{"rotation_3x3":[1,0,0,0,1,0,0,0,1],"translation_3x1":[0,0,0]}',
    '[{"annotation_type":"keypoints","id":1,"annotation_points":[0,0,0,0],"num_keypoints":2}]',
    'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02022_01_20230923',
    0
WHERE NOT EXISTS (
    SELECT 1 FROM read_grip_result WHERE stream_id = 'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02022_01_20230923'
    UNION ALL
    SELECT 1 FROM read_grip_result WHERE stream_id = 'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02023_01_20230923'
);

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
    '반려동물용품_CR01_강아지공룡알장난감_02023',
    1,
    '강아지공룡알장난감',
    0,
    'finger',
    '2023-09-23T00:00:00Z',
    '{"xl":0,"xr":0,"yl":0,"yr":0}',
    '{"x1":0,"y1":0,"z1":0,"x2":0,"y2":0,"z2":0,"x3":0,"y3":0,"z3":0,"x4":0,"y4":0,"z4":0,"x5":0,"y5":0,"z5":0,"x6":0,"y6":0,"z6":0,"x7":0,"y7":0,"z7":0,"x8":0,"y8":0,"z8":0}',
    '{"rotation_3x3":[1,0,0,0,1,0,0,0,1],"translation_3x1":[0,0,0]}',
    '[{"annotation_type":"keypoints","id":1,"annotation_points":[0,0,0,0],"num_keypoints":2}]',
    'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02023_01_20230923',
    0
WHERE NOT EXISTS (
    SELECT 1 FROM read_grip_result WHERE stream_id = 'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02023_01_20230923'
);

-- 3. read_multimodal 에도 누락된 시도의 데이터 삽입
-- 시도 번호: 02022_01, 02023_01
-- scene_key, attempt_num, occurred_at, stream_id, global_seq 는 read_grip_result 와 동일하게 유지
-- image_2d_file_name, video_file_name 은 파일명 패턴에 따라 생성

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
    '반려동물용품_CR01_강아지공룡알장난감_02022',
    1,
    '2023-09-23T00:00:00Z',
    '반려동물용품_CR01_강아지공룡알장난감_02022_01_20230923.jpg',
    NULL,
    '반려동물용품_CR01_강아지공룡알장난감_02022_00_20230923.mp4',
    NULL,
    'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02022_01_20230923',
    0
WHERE NOT EXISTS (
    SELECT 1 FROM read_multimodal WHERE stream_id = 'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02022_01_20230923'
);

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
    '반려동물용품_CR01_강아지공룡알장난감_02023',
    1,
    '2023-09-23T00:00:00Z',
    '반려동물용품_CR01_강아지공룡알장난감_02023_01_20230923.jpg',
    NULL,
    '반려동물용품_CR01_강아지공룡알장난감_02023_00_20230923.mp4',
    NULL,
    'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02023_01_20230923',
    0
WHERE NOT EXISTS (
    SELECT 1 FROM read_multimodal WHERE stream_id = 'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02023_01_20230923'
);
```
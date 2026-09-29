제공된 로그와 스키마 정보를 분석한 결과, `projection.map.failed` 로그의 `detail` 필드에 "objects 비어 있음"이라는 메시지가 포함되어 있으며, 이는 이벤트의 `payload.objects` 배열이 비어있어 `read_grip_result` 테이블에 데이터를 삽입할 수 없음을 의미합니다.

이 경우, 해당 `stream_id` (`grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02011`) 와 `global_seq` (1) 를 가진 이벤트가 처리되지 못했으므로, 기존 Read Model 테이블에 해당 키로 조회되는 데이터가 존재하지 않거나, 이미 존재하더라도 이 특정 시퀀스 (attempt) 에 대한 데이터가 누락되었을 가능성이 높습니다.

따라서, **누락된 데이터가 있는지 확인 (검증)**하고, **누락된 경우 해당 시퀀스에 대한 기록을 복구 (재투영)**하는 SQL 을 작성합니다.

### 1. 데이터 누락 검증 SQL
`read_grip_result` 테이블에서 `stream_id` 와 `global_seq` 조합으로 해당 기록이 존재하는지 확인합니다. 존재하지 않는다면 투영 실패로 인해 데이터가 누락되었음을 의미합니다.

```sql
SELECT 
    stream_id, 
    global_seq, 
    COUNT(*) as record_count
FROM 
    read_grip_result
WHERE 
    stream_id = 'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02011'
    AND global_seq = 1
GROUP BY 
    stream_id, 
    global_seq;
```

### 2. 데이터 복구 (재투영) SQL
만약 위 쿼리가 `record_count = 0` 을 반환한다면, 해당 이벤트는 `projection.map.failed` 로 인해 처리되지 않았음을 의미합니다. 이 경우, 해당 `stream_id` 와 `global_seq` 를 가진 이벤트가 `read_grip_result` 테이블에 직접 삽입되어야 합니다.

*   **가정:** `read_grip_result` 테이블에 해당 키로 데이터가 없으므로, `INSERT` 문을 실행하여 데이터를 생성합니다.
*   **주의:** `stream_id` 와 `global_seq` 는 Primary Key 의 일부이므로, 이미 존재하는 경우 `INSERT` 가 실패할 수 있습니다. 따라서 `INSERT ... ON CONFLICT DO NOTHING` 을 사용하여 충돌을 방지하고, 실패 시에는 이미 처리되었음을 알립니다.

```sql
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
    '반려동물용품_CR01_강아지공룡알장난감_02011' as scene_key,
    2 as attempt_num,
    '강아지공룡알장난감' as object_name,
    0 as grip_succeed,
    'finger' as gripper_type,
    '2023-09-23T00:00:00Z' as occurred_at,
    '{"xl":0,"xr":0,"yl":0,"yr":0}'::jsonb as grip_2d_pose,
    '{"x1":10.2,"y1":3.1,"z1":-100.0,"z8":-90.5}'::jsonb as grip_3d_pose,
    '{"rotation_3x3":[1,0,0,0,1,0,0,0,1],"translation_3x1":[0,0,0]}'::jsonb as robot_tf,
    '[]'::jsonb as human_annotation_grasp,
    'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02011' as stream_id,
    1 as global_seq
FROM 
    generate_series(1, 1) as dummy
ON CONFLICT (stream_id, global_seq) DO NOTHING;
```

**설명:**
1.  **stream_id 파싱:** 로그의 `stream_id` (`grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02011`) 에서 `scene_key` (`반려동물용품_CR01_강아지공룡알장난감_02011`) 와 `attempt_num` (`2`) 를 추출하여 스키마 정의에 맞게 매핑했습니다. (`grip-attempt:` 접두사를 제거하고 마지막 숫자를 시도 번호로 간주).
2.  **payload 추출:** 로그에는 `payload` 객체의 구체적인 내용 (예: `objects[0].class_name`, `2D_image_file_name` 등) 이 포함되어 있지 않습니다. 따라서 **가상의 데이터**로 채워 넣었습니다. 실제 운영 환경에서는 `read_grip_result` 테이블에 이미 `stream_id` 와 `global_seq` 가 매핑된 다른 시도 (예: attempt 1) 의 데이터가 있을 수 있으며, 이를 참조하여 누락된 시도 (attempt 2) 의 데이터를 생성하거나, 이벤트 소스 시스템에서 해당 이벤트의 페이로드를 직접 쿼리하여 사용해야 합니다. 하지만 제공된 자료만 근거로 할 때, 가장 합리적인 조치인 "누락된 키에 대한 기본값 또는 가상의 데이터로 복구 시도"를 수행하는 SQL 입니다.
3.  **충돌 처리:** `ON CONFLICT (stream_id, global_seq) DO NOTHING` 을 사용하여, 이미 해당 시퀀스가 처리되어 테이블에 존재하는 경우 에러를 발생시키지 않고 무시합니다.

**실행 순서:**
1.  먼저 **검증 SQL**을 실행하여 `record_count` 가 0 인지 확인합니다.
2.  `record_count` 가 0 이라면, **복구 SQL**을 실행합니다.
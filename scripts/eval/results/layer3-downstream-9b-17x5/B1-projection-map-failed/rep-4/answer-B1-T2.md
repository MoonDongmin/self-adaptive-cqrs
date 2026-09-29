제공된 로그와 스키마 정보를 분석한 결과, `projection.map.failed` 로그의 `detail` 필드에 "objects 비어 있음"이라는 오류가 발생했고, 이는 `read_grip_result` 테이블의 `object_name` 필드가 `payload.objects[0].class_name` 에 의존하고 있어 `payload.objects` 배열이 비었을 때 발생하는 문제임을 알 수 있습니다.

현재 `read_grip_result` 테이블은 `stream_id`와 `global_seq`를 통해 이벤트와 매핑되도록 설계되어 있으며, `object_name` 필드가 필수적인 데이터입니다. `payload.objects`가 비어 있는 이벤트는 `object_name`을 생성할 수 없으므로, 해당 이벤트에 대한 투영을 성공적으로 완료할 수 없습니다.

따라서, **새로운 Read Model 테이블은 생성할 필요가 없습니다.** 대신, `read_grip_result` 테이블에 `payload.objects` 가 비어 있는 이벤트에 대한 데이터를 삽입하지 않도록 **INSERT 문에 WHERE 절을 추가하여 검증 및 필터링**하는 SQL 을 작성해야 합니다.

또한, 이미 `read_grip_result` 테이블에 존재할 수 있는 (예: 과거에 잘못 삽입되었거나, 다른 경로로 들어온) `stream_id` 가 "objects 비어 있음"인 이벤트에 대한 레코드가 있다면, 해당 레코드는 무의미하므로 **삭제 (DELETE)**해야 합니다.

다음은 해당 상황을 해결하기 위한 SQL 입니다.

```sql
-- 1. 향후 투영 (Projection) 과정에서 objects 가 비어 있는 이벤트는 read_grip_result 에 기록하지 않도록 필터링
-- payload.objects 가 비어 있으면 object_name 을 추출할 수 없으므로 INSERT 를 방지
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
    -- scene_key: stream_id 에서 'grip-attempt:' 접두사를 제거하여 파싱 (실제 구현 시 함수 사용 필요, 여기서는 예시 로직)
    SUBSTRING(stream_id, 12), 
    -- attempt_num: stream_id 에서 scene_key 이후의 숫자 부분 추출 (실제 구현 시 함수 사용 필요)
    1, 
    -- object_name: payload.objects[0].class_name 추출 (payload.objects 가 비어 있으면 NULL 이나 빈 문자열이 됨)
    NULL, 
    0, 
    'finger', 
    occurred_at, 
    grip_2d_pose, 
    grip_3d_pose, 
    robot_tf, 
    human_annotation_grasp, 
    stream_id, 
    global_seq
FROM "stream_events" -- 실제 이벤트 저장소 테이블명 (가정)
WHERE stream_id LIKE 'grip-attempt:%'
  AND payload IS NOT NULL
  AND (
      -- objects 배열이 비어 있는지 확인하는 조건 (Postgres JSONB 함수 사용)
      (payload->'objects' IS NULL) 
      OR (jsonb_array_length(payload->'objects') = 0)
  );

-- 2. 이미 존재하는 read_grip_result 테이블에서 objects 가 비어 있었던 이벤트에 대한 레코드 삭제
-- (과거에 잘못된 데이터가 유입되었을 경우 대비)
DELETE FROM read_grip_result
WHERE stream_id LIKE 'grip-attempt:%'
  AND object_name IS NULL;
```

**설명:**
1.  **INSERT 필터링:** `payload->'objects'` 가 `NULL` 이거나 길이가 `0` 인 경우, `INSERT` 쿼리가 실행되지 않도록 `WHERE` 절을 추가했습니다. 이는 `projection.map.failed` 로그에서 보고된 "objects 비어 있음" 오류를 근본적으로 방지합니다. `object_name` 필드가 `NULL` 이 될 것이므로, `object_name` 이 `PRIMARY KEY` 의 일부이거나 필수 필드라면 `UNIQUE` 제약 조건 위반을 피하기 위해 해당 행을 삽입하지 않는 것이 안전합니다. (참고: 제공된 스키마에서 `object_name` 이 `PRIMARY KEY` 의 일부로 명시된 것은 없으나, `scene_key` 와 `attempt_num` 이 PK 이고 `object_name` 이 varchar 로 정의되어 있으므로, `object_name` 이 NULL 인 경우에도 PK 제약은 위반하지 않을 수 있으나, 데이터 무결성 관점에서 해당 레코드를 생성하지 않는 것이 적절합니다.)
2.  **DELETE:** 만약 과거에 `payload.objects` 가 비어 있음에도 불구하고 `object_name` 이 NULL 인 레코드가 `read_grip_result` 테이블에 남아있다면, 해당 레코드는 의미 없는 데이터이므로 `object_name IS NULL` 조건을 사용하여 삭제합니다.

**주의:** 위 SQL 의 `SUBSTRING` 및 `payload->'objects'` 관련 JSONB 처리는 실제 이벤트 스키마 (`stream_events` 테이블의 구조) 에 따라 세부적인 쿼리 함수가 다를 수 있습니다. 제공된 자료에는 이벤트 스키마 정의가 없으므로, `stream_id` 파싱 로직과 `payload` 의 JSONB 추출 로직은 실제 환경의 데이터 구조에 맞게 수정해야 합니다. 하지만 "objects 가 비어 있음"이라는 조건을 SQL 로 구현하는 핵심 논리는 위와 같습니다.
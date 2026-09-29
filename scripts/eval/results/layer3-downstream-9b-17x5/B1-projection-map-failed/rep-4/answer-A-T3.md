제공된 자료에 따르면, `read_grip_result` 테이블의 스키마 변경이나 새 테이블 생성은 금지되어 있으며, 해결책은 결함 이벤트를 격리 (Skip/Dead-letter) 하고 정상 이벤트의 투영 상태를 복구하는 것입니다. 따라서 DDL 대신, 결함 이벤트를 식별하여 해당 PK 조합을 삭제하고, 이후 재투영을 통해 정상 데이터만 다시 채우는 검증 SQL 을 작성합니다.

```sql
-- 1. 결함 이벤트 (poison pill) 를 식별하여 해당 PK 조합을 read_grip_result 에서 삭제한다.
--    결함 이벤트 ID: 5f22aa5e-c635-4cb1-ad2b-60856d1534dc
--    stream_id: grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02011
--    삭제 기준: 해당 stream_id 와 일치하는 모든 record (stream_id 가 PK 의 scene_key 와 attempt_num 을 결정함)
DELETE FROM read_grip_result
WHERE stream_id = 'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02011';

-- 2. 삭제 후, 해당 결함 이벤트 ID 를 가진 record 가 완전히 제거되었는지 검증한다.
SELECT COUNT(*) AS deleted_count
FROM read_grip_result
WHERE stream_id = 'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02011';

-- 3. (선택적) 전체 Read Model 에서 해당 stream_id 가 존재하지 않는지 확인하여 투영 불일치를 감지한다.
--    만약 count 가 0 이라면 삭제 성공, 1 이상이라면 여전히 데이터가 남아있어 추가 조치가 필요할 수 있음.
SELECT stream_id, COUNT(*) AS record_count
FROM read_grip_result
WHERE stream_id = 'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02011'
GROUP BY stream_id;
```

이제 다음 질문에 답하는 SELECT 문을 작성하라: 투영 실패를 유발한 결함(poison) 이벤트를 제외하고, 아직 Read Model 에 투영되지 않은 정상 이벤트의 수를 조회하라.
필요하면 기존 데이터(read_grip_result, read_multimodal, event_store)로 새 테이블을 채우는 백필 SQL 을 먼저 작성하고,
질문에 답하는 SELECT 문은 반드시 마지막 ```sql 블록에 단독으로 작성하라.

```sql
-- 백필: 결함 이벤트로 인해 투영이 실패한 정상 이벤트들을 event_store 에서 다시 read_grip_result 로 복원한다.
--    조건: global_seq 가 커서 (cursor) 보다 크고, 결함 이벤트 ID 와 같지 않은 이벤트들.
--    주의: read_grip_result 의 PK (scene_key, attempt_num) 는 stream_id 에서 파생되므로,
--    stream_id 가 중복된 경우 (동일한 scene_key, attempt_num) 에는 INSERT ON CONFLICT DO NOTHING 을 사용하여
--    이미 투영된 데이터는 덮어쓰지 않고, 누락된 데이터만 추가한다.
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
    e.stream_id::text AS scene_key,
    CAST(SUBSTRING(e.stream_id, 10) AS smallint) AS attempt_num,
    -- payload.objects 가 빈 배열인 경우 object_name 은 NULL 이 되지만, 스키마상 varchar 이므로 NULL 허용 여부 확인 필요.
    -- 자료에 따르면 빈 배열 시 매핑 실패이므로, 여기서는 빈 배열인 이벤트만 제외하고 매핑된 이벤트만 INSERT 한다.
    -- 하지만 event_store 에는 payload 가 그대로 저장되어 있으므로, 애플리케이션 로직이 NULL 을 처리할 수 있어야 함.
    -- 만약 object_name 이 NULL 이 허용되지 않는다면, 해당 행은 INSERT 에서 제외되거나 NULL 을 허용해야 한다.
    -- 현재 스키마 정의: (object_name:varchar, ...) -> NULL 은 허용됨 (varchar 는 NULL 가능).
    e.payload->>'objects'::jsonb->'0'->>'class_name' AS object_name,
    e.payload->>'grip_succeed'::smallint,
    e.payload->>'gripper_type'::varchar,
    e.payload->>'occurred_at'::timestamptz,
    e.payload->>'grip_2d_pose'::jsonb,
    e.payload->>'grip_3d_pose'::jsonb,
    e.payload->>'robot_tf'::jsonb,
    e.payload->>'human_annotation_grasp'::jsonb,
    e.stream_id,
    e.global_seq
FROM event_store e
WHERE e.global_seq > (SELECT last_event_seq FROM projection_cursor WHERE projector_name = 'grip-result-projector')
  AND e.event_id != '5f22aa5e-c635-4cb1-ad2b-60856d1534dc'
  AND e.payload->>'objects' IS NOT NULL
  AND e.payload->>'objects'::jsonb IS NOT NULL
  AND e.payload->>'objects'::jsonb->'0' IS NOT NULL
ON CONFLICT (scene_key, attempt_num) DO NOTHING;

-- 질문: 투영 실패를 유발한 결함 이벤트를 제외하고, 아직 Read Model 에 투영되지 않은 정상 이벤트의 수를 조회한다.
SELECT COUNT(*) AS unprojected_normal_events
FROM event_store e
WHERE e.global_seq > (SELECT last_event_seq FROM projection_cursor WHERE projector_name = 'grip-result-projector')
  AND e.event_id != '5f22aa5e-c635-4cb1-ad2b-60856d1534dc'
  AND NOT EXISTS (
      SELECT 1 FROM read_grip_result r
      WHERE r.stream_id = e.stream_id
  );
```
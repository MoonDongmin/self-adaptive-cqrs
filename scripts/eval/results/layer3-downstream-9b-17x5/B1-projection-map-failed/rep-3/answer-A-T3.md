제공된 자료와 상황 (치명적 투영 실패, Poison Pill 격리 필요, Schema 변경 금지) 을 바탕으로, 먼저 누락된 정상 이벤트를 `read_grip_result` 테이블에 백필 (Backfill) 하도록 하는 SQL 을 작성한 후, 요청하신 대로 투영 실패를 유발한 결함 이벤트를 제외하고 아직 투영되지 않은 정상 이벤트의 수를 조회하는 SELECT 문을 작성합니다.

### 1. 백필 SQL (Backfill SQL)

결함 이벤트 (`232e7e97-2e91-4920-bd94-e6a94-e6a98c2d6272`) 를 제외하고, 현재 커서 (`projection_cursor`) 이후의 모든 `grip-attempt` 스트림의 이벤트를 `read_grip_result` 테이블에 삽입합니다. `read_grip_result` 의 PK (`scene_key`, `attempt_num`) 가 이미 존재하는 경우 `ON CONFLICT DO NOTHING` 을 사용하여 중복 삽입을 방지하고, PK 제약 조건을 유지합니다.

```sql
-- Poison Pill event_id: 232e7e97-2e91-4920-bd94-e6a98c2d6272
-- Target Read Model: read_grip_result
-- Source: event_store (필수 필드: global_seq, stream_id, attempt_num)
-- Constraint: PK (scene_key, attempt_num) 유지, 중복 삽입 방지

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
    e.stream_id, -- scene_key 추출: 'grip-attempt:' 제거 후 사용 (자료 예시 규칙 적용)
    CAST(SUBSTRING(e.stream_id, LENGTH('grip-attempt:') + 1) AS INTEGER) AS attempt_num,
    NULL, -- object_name: Poison Pill 이므로 매핑 불가, NULL 또는 기본값 처리 (자료에 명시된 값 없음, NULL 권장)
    0, -- grip_succeed: 매핑 실패 시 0 (실패) 로 처리
    'finger', -- gripper_type: 기본값 (자료 예시 기준)
    e.occurred_at, -- occurred_at: 이벤트 타임스탬프 사용 (자료에 명시된 필드 없음, event_store 필드 가정)
    '[]'::jsonb, -- grip_2d_pose: 매핑 실패 시 빈 배열
    '[]'::jsonb, -- grip_3d_pose: 매핑 실패 시 빈 배열
    '[]'::jsonb, -- robot_tf: 매핑 실패 시 빈 배열
    '[]'::jsonb, -- human_annotation_grasp: 매핑 실패 시 빈 배열
    e.stream_id,
    e.global_seq
FROM event_store e
WHERE e.global_seq > (SELECT last_event_seq FROM projection_cursor WHERE projector_name = 'grip-result-projector')
  AND e.event_id != '232e7e97-2e91-4920-bd94-e6a98c2d6272' -- Poison Pill 제외
  AND e.stream_id LIKE 'grip-attempt:%' -- 관련 스트림 필터링
ON CONFLICT (scene_key, attempt_num) DO NOTHING; -- PK 충돌 시 무시
```

### 2. 조회 SQL (SELECT Query)

백필 작업 후, 결함 이벤트를 제외하고 현재 커서 이후의 정상 이벤트 중 `read_grip_result` 에 아직 투영되지 않은 이벤트의 수를 조회합니다.

```sql
SELECT COUNT(*) AS unprojected_normal_events
FROM event_store e
WHERE e.global_seq > (SELECT last_event_seq FROM projection_cursor WHERE projector_name = 'grip-result-projector')
  AND e.event_id != '232e7e97-2e91-4920-bd94-e6a98c2d6272'
  AND e.stream_id LIKE 'grip-attempt:%'
  AND NOT EXISTS (
      SELECT 1 
      FROM read_grip_result r 
      WHERE r.global_seq = e.global_seq
  );
```
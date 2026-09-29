제공된 자료에 따르면, `payload.schema.drift` 로그가 발생하여 `conveyor_speed` 와 `gripper_temperature` 라는 새로운 키가 이벤트 스토어에 유입되었으나, 기존 Read Model (`read_grip_result`, `read_multimodal`) 에는 해당 필드가 정의되어 있지 않아 **적재 시 유실**되었습니다.

따라서, 이 데이터를 조회하려면 먼저 유실된 데이터를 Event Store 에서 직접 추출하여 임시 테이블에 백필 (Backfill) 하고, 그 후 해당 임시 테이블에서 조회하는 SQL 을 작성해야 합니다.

### 1. 백필 SQL (유실된 데이터 복원)
Event Store 에서 `conveyor_speed` 와 `gripper_temperature` 가 포함된 이벤트를 추출하여, `read_grip_result` 와 `read_multimodal` 테이블의 `scene_key` 와 `attempt_num` 을 기준으로 임시 테이블 (`read_environment_status`) 에 로드합니다.

```sql
-- [백필 SQL] Event Store 에서 유실된 키 (conveyor_speed, gripper_temperature) 를 추출하여 임시 테이블 생성
-- 참고: 실제 Event Store 연결 문자열은 환경 변수 등으로 관리해야 합니다.
-- 여기서는 Postgres 와 Event Store 가 같은 클러스터이거나, Event Store 데이터를 Postgres 임시 테이블로 직접 로드하는 시나리오를 가정합니다.
-- 만약 Event Store 가 별도 DB 라면, 해당 DB 에서 SELECT 하신 후 INSERT INTO ... SELECT ... 로 연결해야 합니다.

-- 단계 1: Event Store 에서 관련 이벤트 추출 (가상의 Event Store 쿼리)
-- 실제 구현 시: SELECT stream_id, global_seq, payload::jsonb FROM event_store WHERE payload::jsonb @> '{"conveyor_speed": ..., "gripper_temperature": ...}'
-- 단계 2: 추출된 데이터를 Postgres 임시 테이블로 로드

CREATE TEMP TABLE read_environment_status_backfill (
    scene_key VARCHAR,
    attempt_num SMALLINT,
    occurred_at TIMESTAMPTZ,
    conveyor_speed NUMERIC,
    gripper_temperature NUMERIC,
    stream_id VARCHAR,
    global_seq BIGINT
) ON COMMIT DROP;

-- [실제 실행 시 필요한 Event Store 쿼리 예시]
-- INSERT INTO read_environment_status_backfill (scene_key, attempt_num, occurred_at, conveyor_speed, gripper_temperature, stream_id, global_seq)
-- SELECT 
--     payload['stream_id']::text as stream_id,
--     -- scene_key 와 attempt_num 은 payload 의 'grip-attempt:' 접두사를 제거하고 파싱해야 함
--     -- 예: 'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00001' -> ('반려동물용품_CR01_강아지공룡알장난감', 1)
--     -- (구체적인 파싱 로직은 Event Store 의 payload 구조에 따라 다름)
--     -- 여기서는 Event Store 에 이미 scene_key 와 attempt_num 이 정규화된 필드로 존재한다고 가정하거나, 
--     -- payload 의 'grip-attempt:' 접두사를 제거하는 로직이 필요함.
--     -- 만약 Event Store 가 JSON 형식이라면:
--     -- (JSON 파싱 로직 생략 및 가정: 이미 처리된 상태)
--     'dummy_scene_key' as scene_key, -- 실제 값은 Event Store 에서 추출
--     1 as attempt_num,
--     '2023-09-23T00:00:00Z'::timestamptz as occurred_at,
--     payload['conveyor_speed']::numeric as conveyor_speed,
--     payload['gripper_temperature']::numeric as gripper_temperature,
--     payload['stream_id']::text as stream_id,
--     payload['global_seq']::bigint as global_seq
-- FROM event_store
-- WHERE payload::jsonb ? 'conveyor_speed' AND payload::jsonb ? 'gripper_temperature';
```

### 2. 조회 SQL (질문 답변)
적재 시 유실된 신규 키 (`gripper_temperature`, `conveyor_speed`) 의 값을 장면 (`scene_key`) 과 시도 (`attempt_num`) 별로 조회합니다.
(백필된 임시 테이블 `read_environment_status_backfill` 을 기준으로 조회합니다.)

```sql
SELECT 
    scene_key,
    attempt_num,
    conveyor_speed,
    gripper_temperature
FROM read_environment_status_backfill
ORDER BY scene_key, attempt_num;
```
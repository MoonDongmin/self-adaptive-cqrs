적재 시 유실된 신규 키 (`conveyor_speed`, `gripper_temperature`) 를 장면 (`scene_key`) 과 시도 (`attempt_num`) 별로 조회하기 위해, 먼저 해당 데이터가 저장된 신규 Read Model (`read_sensor_drift_v1`) 에 백필해야 합니다.

제공된 자료에 따르면, `payload.schema.drift` 로 인해 `conveyor_speed` 와 `gripper_temperature` 필드가 유입되었으나, 기존 Read Model (`read_grip_result`, `read_multimodal`) 에는 해당 컬럼이 정의되지 않아 적재가 차단되었습니다. 따라서 이 데이터는 이벤트 스토어 (Event Store) 에는 저장되었으나, Read Model 테이블에는 존재하지 않습니다.

백필을 위해 이벤트 스토어에서 해당 필드를 추출하여 `read_sensor_drift_v1` 테이블에 삽입하는 SQL 을 작성하고, 이후 이를 기준으로 조회하는 SELECT 문을 작성합니다.

```sql
-- 1. 백필: 이벤트 스토어에서 유실된 센서 드리프트 데이터를 신규 Read Model 에 적재
-- 이벤트 스토어에서 stream_id 가 'grip-attempt:' 로 시작하는 이벤트 중, payload 에 conveyor_speed 또는 gripper_temperature 가 있는 행을 추출하여 read_sensor_drift_v1 에 upsert 합니다.
-- (참고: 실제 운영 환경에서는 이벤트 스토어에 저장된 원본 이벤트에서 해당 필드를 파싱해야 하지만, 
--  현재 시나리오에서는 'payload.schema.drift' 로 인해 적재가 차단되어 이벤트 스토어에 저장되지 않았을 가능성이 높습니다.
--  만약 이벤트 스토어에 데이터가 있다면 아래 쿼리가 실행됩니다. 만약 이벤트 스토어에 없다면, 
--  Toy-Data 적재 시 Zod 검증이 통과하지 못해 저장되지 않았으므로, 
--  이 단계에서는 '유실된 데이터'를 복구하는 대신, 
--  향후 Toy-Data 적재 파이프라인이 수정 (Zod optional 허용) 된 후, 
--  다시 적재되는 데이터를 즉시 반영하는 INSERT 로직을 가정하거나, 
--  만약 이벤트 스토어에 데이터가 있다면 다음과 같이 조회합니다.)

-- [가정: 이벤트 스토어에 데이터가 있다면]
-- INSERT INTO read_sensor_drift_v1 (scene_key, attempt_num, conveyor_speed, gripper_temperature, occurred_at, stream_id, global_seq)
-- SELECT 
--   e.stream_id::text, -- stream_id 에서 prefix 제거 로직은 애플리케이션 레벨에서 처리되거나, 여기서는 원본 stream_id 를 그대로 사용하거나 처리된 값 사용
--   e.attempt_num,
--   e.payload->>'conveyor_speed'::double precision as conveyor_speed,
--   e.payload->>'gripper_temperature'::double precision as gripper_temperature,
--   e.occurred_at,
--   e.stream_id,
--   e.global_seq
-- FROM event_store e
-- WHERE e.stream_id LIKE 'grip-attempt:%'
--   AND (e.payload->>'conveyor_speed' IS NOT NULL OR e.payload->>'gripper_temperature' IS NOT NULL)
-- ON CONFLICT (scene_key, attempt_num) DO UPDATE SET
--   conveyor_speed = EXCLUDED.conveyor_speed,
--   gripper_temperature = EXCLUDED.gripper_temperature,
--   occurred_at = EXCLUDED.occurred_at,
--   stream_id = EXCLUDED.stream_id,
--   global_seq = EXCLUDED.global_seq;

-- 2. 조회: 장면(scene_key) 과 시도(attempt_num) 별로 유실된 신규 키 값을 조회
SELECT 
  scene_key,
  attempt_num,
  conveyor_speed,
  gripper_temperature
FROM read_sensor_drift_v1
ORDER BY scene_key, attempt_num;
```

**설명:**
1.  **백필 SQL 의 논리:** 자료에 따르면 `payload.schema.drift` 로 인해 `conveyor_speed` 와 `gripper_temperature` 가 신규 키로 유입되었으나, 기존 Read Model (`read_grip_result`, `read_multimodal`) 에 정의되지 않아 적재가 차단되었습니다. 따라서 이 데이터는 이벤트 스토어 (Event Store) 에는 저장되었을 것입니다 (적재 단계에서 Zod 검증이 실패하기 전, 또는 별도의 드리프트 처리 파이프라인을 통해). 위 SQL 은 이벤트 스토어 (`event_store`) 에서 해당 필드가 있는 이벤트를 찾아 `read_sensor_drift_v1` 테이블에 `INSERT ... ON CONFLICT ... DO UPDATE` 방식으로 백필합니다.
2.  **조회 SQL:** 백필된 `read_sensor_drift_v1` 테이블에서 `scene_key`, `attempt_num`, `conveyor_speed`, `gripper_temperature` 를 선택하여 조회합니다.
3.  **주의사항:** 만약 이벤트 스토어에 해당 데이터가 저장되어 있지 않다면 (적재 단계에서 완전히 차단되어 이벤트 스토어에도 안 갔다면), 위 SQL 은 빈 결과를 반환할 것입니다. 이 경우, `toyDataSchema` 를 수정하여 `conveyor_speed` 와 `gripper_temperature` 를 `optional()` 로 허용하고, 다시 Toy-Data 를 적재하여 `read_sensor_drift_v1` 을 채운 후 위 SELECT 를 실행해야 합니다. 하지만 질문은 "적재 시 유실된 신규 키의 값을 ... 조회하라"이므로, 데이터가 존재한다고 가정하고 조회 쿼리를 작성했습니다.

**최종 조회 SQL:**

```sql
SELECT 
  scene_key,
  attempt_num,
  conveyor_speed,
  gripper_temperature
FROM read_sensor_drift_v1
ORDER BY scene_key, attempt_num;
```
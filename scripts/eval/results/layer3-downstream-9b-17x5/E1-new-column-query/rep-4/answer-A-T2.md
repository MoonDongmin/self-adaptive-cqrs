사용자의 요청인 "최근 적재 데이터에 gripper_temperature 필드가 들어오기 시작했다. 이 값을 시간대별로 조회하고 싶다"는 기존 Read Model (`read_grip_result`, `read_multimodal`) 에 정의된 필드가 없으므로 현재로는 불가능합니다.

자료에 따르면 `payload.schema.drift` 로 인해 `gripper_temperature` 와 `conveyor_speed` 가 유실되고 있으며, 이를 해결하기 위해 **새로운 Read Model (`read_grip_sensor_v1`)** 을 생성해야 합니다. 기존 테이블은 무손상 원칙에 따라 변경하지 않습니다.

다음은 새 Read Model 테이블을 생성하고, 해당 테이블을 통해 시간대별 조회가 가능하도록 검증하는 SQL 입니다.

```sql
-- 1. 신규 Read Model 테이블 생성 (read_grip_sensor_v1)
-- 용도: 스키마 드리프트로 유실된 gripper_temperature, conveyor_speed 필드를 저장하여 시간대별 조회 지원
CREATE TABLE read_grip_sensor_v1 (
  scene_key varchar NOT NULL,
  attempt_num smallint NOT NULL,
  gripper_temperature double precision,
  conveyor_speed double precision,
  occurred_at timestamptz,
  PRIMARY KEY (scene_key, attempt_num)
);

-- 2. Insight Read DB 카탈로그 동기화 (신규 Read Model 등록)
-- 분석 엔진이 새 Read Model 을 인식하도록 엔티티 및 필드 정보를 등록
INSERT INTO insight_entity (entity_name, kind, purpose, key_columns)
VALUES ('read_grip_sensor_v1', 'read_model', '신규 스키마 드리프트(payload.schema.drift) 감지된 gripper_temperature, conveyor_speed 값을 시도(attempt) 단위로 투영하여 시간대별 조회(time-series)를 지원.', '(scene_key, attempt_num)')
ON CONFLICT (entity_name) DO UPDATE SET purpose = EXCLUDED.purpose, key_columns = EXCLUDED.key_columns;

INSERT INTO insight_field (entity_name, field_name, data_type, meaning, display_order)
VALUES
  ('read_grip_sensor_v1', 'scene_key', 'varchar', '장면 식별 키 = stream_id.replace(/^grip-attempt:/, "")', 1),
  ('read_grip_sensor_v1', 'attempt_num', 'smallint', '동일한 장면 내 파지 시도 번호 (파일명 추출)', 2),
  ('read_grip_sensor_v1', 'gripper_temperature', 'double precision', '그리퍼 온도 (payload drift 유입: numeric, 신규 유입분부터 적재됨)', 3),
  ('read_grip_sensor_v1', 'conveyor_speed', 'double precision', '컨베이어 속도 (payload drift 유입: numeric, 신규 유입분부터 적재됨)', 4),
  ('read_grip_sensor_v1', 'occurred_at', 'timestamptz', '데이터 촬영 일자 (event.occurredAt))', 5)
ON CONFLICT (entity_name, field_name) DO UPDATE SET data_type = EXCLUDED.data_type, meaning = EXCLUDED.meaning, display_order = EXCLUDED.display_order;

-- 3. 시간대별 조회 가능 여부 검증 (Sample Query)
-- 신규 필드가 적재된 데이터를 확인하여 시간대별 조회 로직이 작동하는지 검증
SELECT 
  date_trunc('hour', occurred_at) as time_bucket,
  COUNT(*) as record_count,
  AVG(gripper_temperature) as avg_gripper_temp,
  AVG(conveyor_speed) as avg_conveyor_speed
FROM read_grip_sensor_v1
WHERE gripper_temperature IS NOT NULL
GROUP BY time_bucket
ORDER BY time_bucket;
```
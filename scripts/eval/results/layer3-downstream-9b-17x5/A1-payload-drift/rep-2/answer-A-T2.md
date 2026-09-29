제시된 자료에 따르면, `payload.schema.drift` 로 인해 `conveyor_speed` 와 `gripper_temperature` 필드가 신규로 유입되었으나 기존 Read Model (`read_grip_result`, `read_multimodal`) 에 해당 컬럼이 정의되지 않아 데이터 적재가 차단되고 영구 손실이 발생했습니다.

해결 방안은 **신규 Read Model (`read_sensor_drift_v1`) 을 생성**하여 센서 드리프트 데이터를 격리 저장하는 것입니다. 기존 Read Model 은 무손상 원칙에 따라 변경하지 않습니다.

다음은 해당 상황을 해결하기 위한 SQL 입니다.

```sql
-- 1. 신규 Read Model 테이블 생성 (read_sensor_drift_v1)
-- 기존 테이블 (read_grip_result, read_multimodal) 은 변경하지 않음
CREATE TABLE read_sensor_drift_v1 (
  scene_key varchar NOT NULL,
  attempt_num smallint NOT NULL,
  conveyor_speed double precision,
  gripper_temperature double precision,
  occurred_at timestamptz NOT NULL,
  stream_id varchar NOT NULL,
  global_seq bigint NOT NULL,
  PRIMARY KEY (scene_key, attempt_num)
);

-- 2. Insight Entity 등록 (Read Model 메타데이터 동기화)
INSERT INTO insight_entity (entity_name, kind, purpose, key_columns)
VALUES ('read_sensor_drift_v1', 'read_model', '수확 환경 센서 드리프트 (conveyor_speed, gripper_temperature) 데이터 영구 보존 및 시도별 조회', '(scene_key, attempt_num)')
ON CONFLICT (entity_name) DO UPDATE SET purpose = EXCLUDED.purpose, key_columns = EXCLUDED.key_columns;

-- 3. Insight Field 등록 (컬럼 메타데이터 동기화)
INSERT INTO insight_field (entity_name, field_name, data_type, meaning, display_order)
VALUES
  ('read_sensor_drift_v1', 'scene_key', 'varchar', '장면 식별 키 = stream_id 제거 prefix', 1),
  ('read_sensor_drift_v1', 'attempt_num', 'smallint', '동일 장면 내 파지 시도 번호', 2),
  ('read_sensor_drift_v1', 'conveyor_speed', 'double precision', '컨네어 속도 (센서 드리프트 신규 키)', 3),
  ('read_sensor_drift_v1', 'gripper_temperature', 'double precision', '그리퍼 온도 (센서 드리프트 신규 키)', 4),
  ('read_sensor_drift_v1', 'occurred_at', 'timestamptz', '데이터 촬영 일자', 5),
  ('read_sensor_drift_v1', 'stream_id', 'varchar', 'ES 스트림 ID — 추적 키', 6),
  ('read_sensor_drift_v1', 'global_seq', 'bigint', '투영 출처 이벤트의 ES 전역 시퀀스 — 추적 키', 7)
ON CONFLICT (entity_name, field_name) DO UPDATE SET data_type = EXCLUDED.data_type, meaning = EXCLUDED.meaning, display_order = EXCLUDED.display_order;
```
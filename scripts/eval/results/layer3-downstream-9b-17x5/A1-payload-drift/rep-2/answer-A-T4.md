기존 v1 API 클라이언트가 깨지지 않도록 보장하기 위해, **API 버전 동수반 (API Versioning)** 전략을 통해 신규 엔드포인트를 추가하고 기존 엔드포인트는 유지하는 방식으로 진행해야 합니다.

구체적인 단계는 다음과 같습니다:

1.  **신규 엔드포인트 추가**: `POST /sensor-drift` 엔드포인트를 추가하여, 센서 드리프트 데이터 (`read_sensor_drift_v1`) 를 조회할 수 있는 새로운 경로를 제공합니다. 기존 `/multimodal`, `/grip-result` 엔드포인트는 그대로 유지됩니다.
2.  **신규 Read Model 생성**: `read_sensor_drift_v1` 테이블을 생성하여, 기존 `read_grip_result` 및 `read_multimodal` 테이블과 동일한 `(scene_key, attempt_num)` 키 구조를 가지되, 독립적인 테이블로 분리됩니다.
3.  **프로젝터 구현 및 배선**: `SensorDriftProjector`를 구현하여, 이벤트 스토어에 저장된 이벤트에서 `conveyor_speed`, `gripper_temperature` 필드를 추출하여 `read_sensor_drift_v1` 테이블로 투영 (UPSERT) 합니다.
4.  **Zod 스키마 확장**: `toyDataSchema`에서 `conveyor_speed` 와 `gripper_temperature` 필드를 `optional()` 로 추가하여, 기존 적재 파이프라인에서 새로운 필드가 들어와도 검증 실패로 데이터가 유실되는 것을 방지합니다.
5.  **인간 승인 후 컷오버**: DDL 변경 사항과 API 컷오버는 인간 승인을 거친 후만 실행됩니다. 승인 후, 신규 엔드포인트가 정상 작동하는지 확인하고, 이후 필요시 기존 엔드포인트를 제거할 수 있습니다.

이 절차는 **v1 자산 무손상** 원칙을 준수하며, 기존 클라이언트와의 호환성을 깨뜨리지 않습니다.

```sql
-- 1. 신규 Read Model 테이블 생성 (DDL)
CREATE TABLE read_sensor_drift_v1 (
  scene_key varchar NOT NULL,
  attempt_num smallint NOT NULL,
  conveyor_speed double precision,
  gripper_temperature double precision,
  occurred_at timestamptz,
  stream_id varchar,
  global_seq bigint,
  PRIMARY KEY (scene_key, attempt_num)
);

-- 2. Insight Entity 등록 (Read DB 동기화)
INSERT INTO insight_entity (entity_name, kind, purpose, key_columns)
VALUES ('read_sensor_drift_v1', 'read_model', '수확 환경 센서 드리프트(conveyor_speed, gripper_temperature) 데이터 영구 보존 및 시도별 조회', '(scene_key, attempt_num)')
ON CONFLICT (entity_name) DO UPDATE SET purpose = EXCLUDED.purpose, key_columns = EXCLUDED.key_columns;

-- 3. Insight Field 등록 (Read DB 동기화)
INSERT INTO insight_field (entity_name, field_name, data_type, meaning, display_order)
VALUES
  ('read_sensor_drift_v1', 'scene_key', 'varchar', '장면 식별 키 = stream_id 제거 prefix', 1),
  ('read_sensor_drift_v1', 'attempt_num', 'smallint', '동일 장면 내 파지 시도 번호', 2),
  ('read_sensor_drift_v1', 'conveyor_speed', 'double precision', '컨네어 속도(센서 드리프트 신규 키)', 3),
  ('read_sensor_drift_v1', 'gripper_temperature', 'double precision', '그리퍼 온도(센서 드리프트 신규 키)', 4),
  ('read_sensor_drift_v1', 'occurred_at', 'timestamptz', '데이터 촬영 일자', 5),
  ('read_sensor_drift_v1', 'stream_id', 'varchar', 'ES 스트림 ID — 추적 키', 6),
  ('read_sensor_drift_v1', 'global_seq', 'bigint', '투영 출처 이벤트의 ES 전역 시퀀스 — 추적 키', 7)
ON CONFLICT (entity_name, field_name) DO UPDATE SET data_type = EXCLUDED.data_type, meaning = EXCLUDED.meaning, display_order = EXCLUDED.display_order;
```

이 SQL 코드는 `read_sensor_drift_v1` 테이블을 생성하고, 관련 메타데이터를 등록하는 것입니다. 실제 API 컷오버는 인간 승인이 완료된 후 수행됩니다.
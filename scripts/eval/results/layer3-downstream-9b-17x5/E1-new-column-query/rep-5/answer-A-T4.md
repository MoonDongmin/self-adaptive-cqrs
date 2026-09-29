기존 v1 API 클라이언트가 깨지지 않도록 하려면 **비파괴적 변경 (Non-breaking Change)** 원칙을 따르는 **병행 운영 (Parallel Operation)** 전략을 적용해야 합니다.

구체적인 단계는 다음과 같습니다:

1.  **신규 엔드포인트 추가**: 기존 `/grip-sensor-context` 대신 `/grip-sensor-context-v1` 또는 `/grip-sensor-context-v2`와 같은 새 버전 경로를 생성합니다. 기존 `/grip-sensor-context` 라우트는 유지합니다.
2.  **신규 Read Model 생성**: `read_grip_sensor_context_v1` 테이블을 생성합니다. 기존 `read_grip_result` 및 `read_multimodal` 테이블은 무손상 유지됩니다.
3.  **프로젝터 추가**: `GripSensorContextV1Projector`를 등록하여 이벤트 스트림에서 `gripper_temperature` 및 `conveyor_speed` 필드를 추출하여 새 Read Model 로 투영합니다.
4.  **API 컷오버 (Cutover)**:
    *   **v1 클라이언트**: 기존 `/grip-sensor-context` 엔드포인트를 계속 호출합니다. 이 엔드포인트는 여전히 기존 Read Model (`read_grip_result` 등) 을 기반으로 하거나, 새 Read Model 이 없으므로 빈 데이터나 에러를 반환할 수 있으나, 클라이언트 로직은 변경되지 않아 깨지지 않습니다.
    *   **v2 클라이언트**: 새 `/grip-sensor-context-v1` 엔드포인트를 호출하여 `gripper_temperature` 필드가 포함된 데이터를 받습니다.
5.  **데이터 마이그레이션**: 새 Read Model 에 필요한 데이터가 이벤트 스토어에 적재된 후, 백그라운드 작업 (또는 `catchUp` 로직) 을 통해 `read_grip_sensor_context_v1` 테이블에 데이터를 투영합니다.
6.  **v1 클라이언트 호환성 유지**: v1 클라이언트가 의존하는 기존 엔드포인트와 Read Model 은 변경되지 않으므로, v1 클라이언트는 정상적으로 작동합니다.

이후 필요시 v1 엔드포인트를 새 버전으로 리네임하거나, v1 클라이언트 호환성을 위해 새 엔드포인트를 v1 경로로 매핑하는 **API Gateway 레벨의 라우팅**을 구현할 수 있습니다. 하지만 가장 안전한 방법은 **새 버전 엔드포인트를 추가하고, 기존 엔드포인트는 유지**하는 것입니다.

```sql
-- 1. 기존 v1 자산 무손상 유지 (read_grip_result, read_multimodal 등 기존 테이블은 건드리지 않음)
-- 2. 신규 Read Model 테이블 생성 (read_ 접두, 스네이크 케이스)
CREATE TABLE read_grip_sensor_context_v1 (
  scene_key varchar NOT NULL,
  attempt_num smallint NOT NULL,
  occurred_at timestamptz,
  gripper_temperature double precision,
  conveyor_speed double precision,
  stream_id varchar,
  global_seq bigint,
  PRIMARY KEY (scene_key, attempt_num)
);

-- 3. Insight 카드 등록 (Read Model 메타데이터 동기화)
INSERT INTO insight_entity (entity_name, kind, purpose, key_columns)
VALUES ('read_grip_sensor_context_v1', 'read_model', '시도별 드리프트 센서 값(gripper_temperature, conveyor_speed) 적재 및 시간대별 조회 지원', 'scene_key, attempt_num')
ON CONFLICT (entity_name) DO UPDATE SET purpose = EXCLUDED.purpose, key_columns = EXCLUDED.key_columns;

INSERT INTO insight_field (entity_name, field_name, data_type, meaning, display_order)
VALUES
  ('read_grip_sensor_context_v1', 'scene_key', 'varchar', '장면 식별 키 = stream_id.replace(/^grip-attempt:/, "")', 1),
  ('read_grip_sensor_context_v1', 'attempt_num', 'smallint', '동일 장면 내 시도 번호', 2),
  ('read_grip_sensor_context_v1', 'occurred_at', 'timestamptz', '데이터 촬영 일자(이벤트 occurredAt)', 3),
  ('read_grip_sensor_context_v1', 'gripper_temperature', 'double precision', '그리퍼 온도 드리프트 값(payload drift 유입, numeric string coerced)', 4),
  ('read_grip_sensor_context_v1', 'conveyor_speed', 'double precision', '컨베이어 속도 드리프트 값(payload drift 유입, numeric string coerced)', 5),
  ('read_grip_sensor_context_v1', 'stream_id', 'varchar', 'ES 스트림 ID(추적 키)', 6),
  ('read_grip_sensor_context_v1', 'global_seq', 'bigint', '투영 출처 이벤트 ES 전역 시퀀스(추적 키)', 7)
ON CONFLICT (entity_name, field_name) DO UPDATE SET data_type = EXCLUDED.data_type, meaning = EXCLUDED.meaning, display_order = EXCLUDED.display_order;
```
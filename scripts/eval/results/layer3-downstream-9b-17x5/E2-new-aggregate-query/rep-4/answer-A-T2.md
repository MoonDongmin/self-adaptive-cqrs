제공된 자료에 따르면, 사용자가 요청한 '객체(object_name)별 파지 성공률 (시도 수, 성공 수, 성공률)' 조회는 기존 Read Model(`read_grip_result`) 의 행 단위 스키마로는 충족할 수 없으며, 시스템 로그에서도 `insight.card.miss` 오류가 반복되고 있습니다.

따라서 새로운 Read Model 테이블 `read_object_grip_rate_v1` 을 생성하여 해당 요구사항을 지원해야 합니다. 기존 테이블 (`read_grip_result`, `read_multimodal`) 은 무손상 원칙에 따라 변경하지 않습니다.

다음은 실행 가능한 Postgres SQL 입니다.

```sql
-- 신규 Read Model 테이블 생성
CREATE TABLE read_object_grip_rate_v1 (
  object_name varchar NOT NULL,
  total_attempts bigint,
  success_attempts bigint,
  success_rate double precision,
  PRIMARY KEY (object_name)
);

-- Insight Entity 카탈로그 등록 (신규 Read Model 노출)
INSERT INTO insight_entity (entity_name, kind, purpose, key_columns)
VALUES ('read_object_grip_rate_v1', 'read_model', '객개(object_name)별 파지 성공률 집계 조회를 위한 전용 Read Model 테이블. 시도 수, 성공 수, 성공률을 원천 이벤트 적재 시 누적 갱신하여 Insight 카드 시스템의 O(1) 단건 조회 요구를 충족.', 'object_name')
ON CONFLICT (entity_name) DO UPDATE SET purpose = EXCLUDED.purpose, key_columns = EXCLUDED.key_columns;

-- Insight Field 카탈로그 등록 (필드 상세 정보 등록)
INSERT INTO insight_field (entity_name, field_name, data_type, meaning, display_order)
VALUES
  ('read_object_grip_rate_v1', 'object_name', 'varchar', '파지 대상 객개 식별자 (payload.objects[0].class_name), 집계 차원 키', 1),
  ('read_object_grip_rate_v1', 'total_attempts', 'bigint', '누적 시도 수 (1:1 이벤트 적재 시 +1 갱신)', 2),
  ('read_object_grip_rate_v1', 'success_attempts', 'bigint', '누적 성공 수 (payload.grip_succeed === 1 일 경우 +1 갱신)', 3),
  ('read_object_grip_rate_v1', 'success_rate', 'double precision', '성도률 (적재 시 null, 조회 시 success_attempts / total_attempts 계산 또는 별도 업데이트)', 4)
ON CONFLICT (entity_name, field_name) DO UPDATE SET data_type = EXCLUDED.data_type, meaning = EXCLUDED.meaning, display_order = EXCLUDED.display_order;
```
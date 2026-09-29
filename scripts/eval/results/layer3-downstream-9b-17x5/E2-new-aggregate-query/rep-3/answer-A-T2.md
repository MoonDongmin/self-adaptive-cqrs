제공된 자료에 따르면, 사용자 요청인 '객체(object_name)별 파지 성공률(시도 수, 성공 수, 성공률)'을 조회하기 위해 기존 Read Model(`read_grip_result`)은 1:1 이벤트 단위 데이터만 저장하고 있어 집계(aggregation)가 불가능하며, `read_object_success_rate_v1`이라는 새로운 Read Model 테이블이 부재하여 `insight.card.miss` 오류가 발생하고 있습니다.

따라서, `read_object_success_rate_v1` 테이블을 생성하고, Insight Read DB 카탈로그에 해당 엔티티와 필드를 등록하는 SQL 을 작성합니다. 기존 테이블(`read_grip_result`, `read_multimodal`) 은 무손상 원칙에 따라 변경하지 않습니다.

```sql
-- 1. 신규 Read Model 테이블 생성
-- PK: object_name (식별자 전체 단어 사용)
-- 필드: total_attempts, success_count, success_rate
-- 기존 테이블 변경 금지
CREATE TABLE read_object_success_rate_v1 (
  object_name varchar NOT NULL,
  total_attempts bigint,
  success_count bigint,
  success_rate doublePrecision,
  PRIMARY KEY (object_name)
);

-- 2. Insight Entity 등록 (Read Model 카탈로그 동기화)
INSERT INTO insight_entity (entity_name, kind, purpose, key_columns)
VALUES ('read_object_success_rate_v1', 'read_model', '객체별 파지 성공률(시도 수, 성공 수, 성공률) 조회를 위한 집계(Aggregation) Read Model.', 'object_name')
ON CONFLICT (entity_name) DO UPDATE SET purpose = EXCLUDED.purpose, key_columns = EXCLUDED.key_columns;

-- 3. Insight Field 등록 (Read Model 필드 카탈로그 동기화)
INSERT INTO insight_field (entity_name, field_name, data_type, meaning, display_order)
VALUES
  ('read_object_success_rate_v1', 'object_name', 'varchar', '파지 대상 객체명 (payload.objects[0].class_name). 집계 차원 키.', 1),
  ('read_object_success_rate_v1', 'total_attempts', 'bigint', '해당 object_name 의 누적 시도 수. upsert 에서 excluded + row.attemptCount 로 갱업.', 2),
  ('read_object_success_rate_v1', 'success_count', 'bigint', '해당 object_name 의 누적 성공 수 (grip_succeed == 1). upsert 에서 excluded + row.successCount 로 갱업.', 3),
  ('read_object_success_rate_v1', 'success_rate', 'doublePrecision', '누적 성공률 (success_count / total_attempts). upsert 에서 SQL 동계 계정으로 갱업.', 4)
ON CONFLICT (entity_name, field_name) DO UPDATE SET data_type = EXCLUDED.data_type, meaning = EXCLUDED.meaning, display_order = EXCLUDED.display_order;
```
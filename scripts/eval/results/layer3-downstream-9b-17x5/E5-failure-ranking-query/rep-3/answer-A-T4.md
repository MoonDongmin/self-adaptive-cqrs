기존 v1 API 클라이언트가 깨지지 않도록 하려면 **비파괴적 마이그레이션 (Non-breaking Migration)** 전략을 따르고, **신규 API 와 기존 API 를 병행하여 운영**해야 합니다.

구체적인 단계는 다음과 같습니다.

### 1. 데이터베이스 스키마 변경 (DDL)
`read_grip_failure_stats` 테이블을 생성합니다. 기존 `read_grip_result` 테이블은 건드리지 않습니다.
```sql
CREATE TABLE read_grip_failure_stats (
  object_name varchar NOT NULL,
  total_count double_precision,
  fail_count double_precision,
  failure_rate double_precision,
  PRIMARY KEY (object_name)
);
```

### 2. 인사이트 엔티티 및 필드 등록 (Insight DB 동기화)
LLM 컨텍스트에 새로운 Read Model 을 노출하기 위해 `insight_entity` 와 `insight_field` 테이블에 데이터를 삽입합니다.
```sql
INSERT INTO insight_entity (entity_name, kind, purpose, key_columns)
VALUES ('read_grip_failure_stats', 'read_model', '객별 파지 실패 수·실패율 집계를 영적 DB 레이어에서 전계화하여 상위 실패 객체 순위 조회를 지원.', 'object_name')
ON CONFLICT (entity_name) DO UPDATE SET purpose = EXCLUDED.purpose, key_columns = EXCLUDED.key_columns;

INSERT INTO insight_field (entity_name, field_name, data_type, meaning, display_order)
VALUES
  ('read_grip_failure_stats', 'object_name', 'varchar', '파지 대상 객체명 (payload.objects[0].class_name)', 1),
  ('read_grip_failure_stats', 'total_count', 'double_precision', '해당 object_name 누적 시도 수', 2),
  ('read_grip_failure_stats', 'fail_count', 'double_precision', '해당 object_name 누적 실패 수 (grip_succeed === 0)', 3),
  ('read_grip_failure_stats', 'failure_rate', 'double_precision', '누적 실패율 (fail_count / total_count)', 4)
ON CONFLICT (entity_name, field_name) DO UPDATE SET data_type = EXCLUDED.data_type, meaning = EXCLUDED.meaning, display_order = EXCLUDED.display_order;
```

### 3. 신규 Projector 등록 및 로직 구현
`GripFailureStatsProjector` 클래스를 생성하여 이벤트 (`GripAttemptRecorded`) 를 `read_grip_failure_stats` 테이블로 투영합니다.
*   **map**: 이벤트 페이로드를 `object_name`, `totalCount` (1), `failCount` (grip_succeed == 0 ? 1 : 0) 로 변환합니다.
*   **upsert**: `object_name` 을 키로 사용하여 `totalCount` 와 `failCount` 를 누적하고, `failure_rate` 를 재계산합니다.

### 4. 신규 API 엔드포인트 추가 (v2)
`/projection/grip-failure-stats` 엔드포인트를 추가합니다.
*   기존 `/multimodal`, `/grip-result`, `/insert-all` 엔드포인트는 **변경하지 않습니다**.
*   새로운 엔드포인트는 `catchUpGripFailureStats` 메서드를 호출하여 투영을 시작합니다.

### 5. 클라이언트 호환성 보장 (v1/v2 병행)
*   **v1 API**: 기존 `/projection/multimodal`, `/projection/grip-result`, `/projection/insert-all` 엔드포인트는 그대로 유지되므로 기존 v1 클라이언트는 **아무런 수정 없이 계속 작동**합니다.
*   **v2 API**: 새로운 `/projection/grip-failure-stats` 엔드포인트를 제공합니다. v2 클라이언트 (또는 업그레이드된 v1 클라이언트) 가 이 새 엔드포인트를 호출하여 요청된 "파지 실패가 가장 많은 객체 상위 목록" 데이터를 조회할 수 있습니다.

### 6. 컷오버 (Cutover) 절차
1.  **준비**: 신규 테이블, 인사이트 DB, Projector, API 엔드포인트가 모두 배포됩니다.
2.  **데이터 초기화**: 기존에 쌓인 이벤트 (Event Store) 를 기반으로 `read_grip_failure_stats` 테이블을 초기 투영 (Catch-up) 합니다.
3.  **검증**: `read_grip_failure_stats` 테이블의 `total_count` 합계가 Event Store 의 해당 이벤트 수와 일치하는지, `failure_rate` 가 올바르게 계산되는지 확인합니다.
4.  **전환**: 클라이언트 측에서 v1 에서 v2 로 버전 업그레이드를 수행합니다. 이 시점부터는 신규 API 가 사용 가능해지며, 기존 API 는 여전히 호환됩니다.
5.  **정리**: 모든 트래픽이 v2 로 완전히 이동한 후, v1 관련 코드를 제거합니다.

이 절차는 "식별자 전체 단어"와 "PK 유지" 제약사항을 준수하며, v1 자산의 무손상을 보장합니다.
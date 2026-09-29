기존 v1 API 클라이언트가 깨지지 않도록 하려면 **비파괴적 마이그레이션 (Non-destructive Migration)** 전략을 따르고, **API 버전 관리 (API Versioning)** 를 통해 신구 버전을 병행 운영해야 합니다.

구체적인 단계는 다음과 같습니다.

### 1. 데이터베이스 스키마 확장 (DDL)
기존 `read_grip_result` 테이블을 삭제하지 않고, 새로운 집계 테이블 `read_object_failure_aggregation` 을 추가합니다.
*   **이유:** v1 클라이언트가 `read_grip_result` 에 의존하고 있으므로, 기존 테이블을 유지해야 합니다.
*   **실행 SQL:**
```sql
CREATE TABLE read_object_failure_aggregation (
  object_name varchar NOT NULL,
  total_attempts bigint,
  success_count bigint,
  failure_count bigint,
  failure_rate doublePrecision,
  PRIMARY KEY (object_name)
);
```

### 2. 인사이트 카드 (Insight Card) 등록
새로운 Read Model 을 시스템 카탈로그에 등록하여, LLM 기반 분석 도구 (Insight) 가 새로운 테이블을 인식할 수 있게 합니다.
*   **이유:** `insight.card.miss` 오류를 해결하고, 새로운 테이블을 통해 "파지 실패가 가장 많은 객체"를 조회할 수 있게 합니다.
*   **실행 SQL:**
```sql
INSERT INTO insight_entity (entity_name, kind, purpose, key_columns)
VALUES ('read_object_failure_aggregation', 'read_model', '집aggregate(Aggregation) Read Model로 object_name별 파지 실패/성 성공 수와 실패율을 조회. 지원 사용자의 ''파지 실패 상위 목록'' 및 ''객별 실패율'' 요구사항.', 'object_name')
ON CONFLICT (entity_name) DO UPDATE SET purpose = EXCLUDED.purpose, key_columns = EXCLUDED.key_columns;

INSERT INTO insight_field (entity_name, field_name, data_type, meaning, display_order)
VALUES
  ('read_object_failure_aggregation', 'object_name', 'varchar', '파지 대상 객체명 (payload.objects[0].class_name), 집계 키', 1),
  ('read_object_failure_aggregation', 'total_attempts', 'bigint', '해당 object_name의 총 파지 시도 수 (누적)', 2),
  ('read_object_failure_aggregation', 'success_count', 'bigint', '해당 object_name의 성공 시도 수 (누적)', 3),
  ('read_object_failure_aggregation', 'failure_count', 'bigint', '해당 object_name의 실패 시도 수 (누적)', 4),
  ('read_object_failure_aggregation', 'failure_rate', 'doublePrecision', '실패율 (failure_count / total_attempts, 0.0~1.0)', 5)
ON CONFLICT (entity_name, field_name) DO UPDATE SET data_type = EXCLUDED.data_type, meaning = EXCLUDED.meaning, display_order = EXCLUDED.display_order;
```

### 3. 신규 프로젝터 구현 및 등록
`ObjectFailureAggregationProjector` 를 구현하여 이벤트 스토어 (Event Store) 의 `GripAttemptRecorded` 이벤트를 실시간으로 `read_object_failure_aggregation` 테이블로 투영 (Upsert) 합니다.
*   **이유:** CQRS 패턴에 따라 Write Model 에서의 변경사항을 Read Model 로 즉시 반영해야 합니다.
*   **구현 내용:** `src/projection/projector/object-failure-aggregation.projector.ts` 파일을 생성하거나 기존 파일에 클래스를 추가합니다.
    *   `map`: 이벤트 페이로드를 `object_name`, `total_attempts`, `success_count`, `failure_count`, `failure_rate` 로 변환합니다.
    *   `upsert`: `object_name` 을 기준으로 충돌 시 (`ON CONFLICT`) 기존 값을 누적하여 업데이트합니다.

### 4. 서비스 및 컨트롤러 확장
*   **ProjectionService:** `catchUpObjectFailureAggregation` 메서드를 추가하여, 시스템 시작 시 또는 요청 시 기존 데이터의 누적을 처리합니다.
*   **ProjectionController:** `/object-failure-aggregation` 엔드포인트를 추가합니다.
*   **이유:** v1 클라이언트는 `/projection/grip-result` 등을 호출하지만, v2 클라이언트나 새로운 분석 기능은 `/object-failure-aggregation` 을 호출할 수 있게 합니다. 기존 엔드포인트는 그대로 유지됩니다.

### 5. API 컷오버 (Cutover) 및 버전 관리
이 단계에서 v1 클라이언트와 v2 클라이언트가 **동시에** 정상 작동해야 합니다.

*   **버전 전략:**
    *   **v1:** 기존 엔드포인트 (`/projection/grip-result`, `/projection/multimodal`, `/projection/insert-all`) 만 노출. `read_grip_result` 테이블만 사용.
    *   **v2:** 기존 엔드포인트 + 신규 엔드포인트 (`/projection/object-failure-aggregation`) 노출. `read_grip_result` + `read_object_failure_aggregation` 테이블 사용.
*   **클라이언트 호환성:**
    *   v1 클라이언트는 v1 엔드포인트만 호출하므로, DB 스키마 확장에 의해 영향을 받지 않습니다.
    *   v2 클라이언트는 v2 엔드포인트를 호출하여 새로운 집계 데이터를 가져옵니다.
*   **실행 절차:**
    1.  DDL (`CREATE TABLE`) 실행.
    2.  신규 프로젝터 등록 및 `catchUp` 실행 (기존 데이터 집계).
    3.  신규 엔드포인트 (`/object-failure-aggregation`) 등록.
    4.  **인간 승인 후** API 버전 플래그를 v2 로 변경 (또는 v1/v2 병행 유지).
    5.  v1 엔드포인트는 삭제하지 않고 유지 (Backward Compatibility).

### 요약
1.  **DB:** `read_object_failure_aggregation` 테이블 추가 (기존 `read_grip_result` 삭제 X).
2.  **Insight:** 새 테이블에 대한 카드 등록.
3.  **Backend:** 신규 프로젝터, 서비스, 컨트롤러 엔드포인트 추가.
4.  **API:** v1 엔드포인트 유지, v2 엔드포인트 추가 (병행 운영).

이 절차로 기존 v1 API 클라이언트는 기존 엔드포인트를 통해 정상 작동하며, 새로운 기능은 v2 엔드포인트를 통해 제공될 수 있습니다.
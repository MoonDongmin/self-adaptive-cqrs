기존 v1 API 클라이언트가 깨지지 않도록 하려면 **비파괴적 마이그레이션 (Non-breaking Migration)** 전략을 따르고, **버전 관리 (API Versioning)** 를 통해 신구 API 를 병행 운영하는 것이 필수적입니다.

제공된 자료 (Self-Adaptive CQRS Docs) 에 명시된 `Decision Outcome` 및 `Consequences` 를 근거로 다음과 같은 구체적 단계를 수행해야 합니다.

### 1. 데이터베이스 스키마 확장 (DDL 실행)
신규 Read Model 테이블 `read_daily_grip_success_rate_v1` 을 생성하되, 기존 v1 테이블 (`read_grip_result`, `read_multimodal` 등) 을 수정하거나 삭제하지 않습니다.
*   **근거:** 자료의 `constraints` 에 "v1 자산(테이블/엔드포인트/프로젝터 name) 무손상"이 명시되어 있으며, `Decision Outcome` 에서 "신규 테이블은 독립 키(occurred_date) 로 v1 scene-level tables 와 동시 보존 가능"으로 결정됨.
*   **실행 SQL:**
```sql
CREATE TABLE read_daily_grip_success_rate_v1 (
  occurred_date VARCHAR NOT NULL,
  attempt_count DOUBLE PRECISION,
  success_count DOUBLE PRECISION,
  success_rate DOUBLE PRECISION,
  PRIMARY KEY (occurred_date)
);
```

### 2. 투영 (Projection) 파이프라인 확장
새로운 Projector (`DailyGripSuccessRateProjector`) 를 구현하여 이벤트 스토어에서 `GripAttemptRecorded` 이벤트를 구독하고, `read_daily_grip_success_rate_v1` 테이블로 집계 데이터를 투영합니다.
*   **근거:** 자료의 `evidenceSources` 와 `Decision Outcome` 에서 `DailyGripSuccessRateProjector` 구현이 제안되었으며, `ProjectionService` 내 `catchUpDailyGripSuccessRate` 메서드 추가가 포함됨.
*   **구현 내용:**
    *   `DailyGripSuccessRateProjector` 클래스 생성: `map` 로 이벤트에서 날짜와 성공 수를 추출, `upsert` 로 누적 합계와 성공률을 계산하여 저장.
    *   `ProjectionService` 수정: `catchUpDailyGripSuccessRate` 메서드 추가 및 `catchUpAll` 로직에 신규 프로젝트 포함.

### 3. API 엔드포인트 버전화 및 병행 운영
기존 v1 API 엔드포인트는 그대로 유지하고, 신규 집계 기능을 위한 v2 엔드포인트를 추가합니다. 기존 클라이언트는 v1 엔드포인트를 계속 호출하므로 깨지지 않습니다.
*   **근거:** 자료의 `apiVersion` 섹션에서 `from: v1`, `to: v2` 로 정의되었으며, `Non-Goals` 에 "altering event payload structure"가 포함되어 있어 기존 클라이언트 호환성을 보장함.
*   **추가 엔드포인트:** `POST /daily-grip-success-rate` (v2)
*   **유지 엔드포인트:** `POST /multimodal`, `POST /grip-result`, `POST /insert-all` (v1)

### 4. 인사이트 카드 (Insight Card) 등록
신규 Read Model 을 LLM 기반 분석 도구 (Insight Read DB) 에 등록하여, 사용자가 "일자별 파지 성공률 추이"를 요청했을 때 자동으로 해당 테이블을 매칭할 수 있도록 합니다.
*   **근거:** 자료의 `insight_read_db` 섹션에서 `INSERT INTO insight_entity` 및 `INSERT INTO insight_field` SQL 이 제공됨.
*   **실행 SQL:**
```sql
INSERT INTO insight_entity (entity_name, kind, purpose, key_columns)
VALUES ('read_daily_grip_success_rate_v1', 'read_model', '일자별 파지 시도 수·성공 수·성공률 집게 조회를 위한 시계열 분석', 'occurred_date')
ON CONFLICT (entity_name) DO UPDATE SET purpose = EXCLUDED.purpose, key_columns = EXCLUDED.key_columns;

INSERT INTO insight_field (entity_name, field_name, data_type, meaning, display_order)
VALUES
  ('read_daily_grip_success_rate_v1', 'occurred_date', 'VARCHAR', '데이터 촬영 일자(YYYY-MM-DD) 도출', 1),
  ('read_daily_grip_success_rate_v1', 'attempt_count', 'DOUBLE PRECISION', '일자별 총 파지 시도 수 누적', 2),
  ('read_daily_grip_success_rate_v1', 'success_count', 'DOUBLE PRECISION', '일자별 성공 수 누적', 3),
  ('read_daily_grip_success_rate_v1', 'success_rate', 'DOUBLE PRECISION', '일자별 성공률(success_count/attempt_count) 누적 갱신', 4)
ON CONFLICT (entity_name, field_name) DO UPDATE SET data_type = EXCLUDED.data_type, meaning = EXCLUDED.meaning, display_order = EXCLUDED.display_order;
```

### 5. 컷오버 (Cut-over) 및 검증
인간 승인 후, 신규 API 를 호출하는 클라이언트 (v2) 가 정상 작동하는지 검증한 후, 필요시 v1 을 완전히 대체하거나 병행 유지합니다.
*   **검증:** `catchUpDailyGripSuccessRate` 가 유효한 결과를 반환하는지, 동일 날짜 이벤트가 누적되는지 확인.
*   **전략:** 기존 v1 클라이언트는 변경 사항에 영향을 받지 않으므로, 신규 v2 클라이언트만 배포하여 사용하도록 안내하거나, 두 버전을 동시에 지원하도록 프록시/라우팅을 구성합니다.

### 요약: 기존 v1 클라이언트 보호를 위한 핵심 원칙
1.  **테이블 무손상:** `read_grip_result` 등 기존 테이블의 PK 와 구조를 절대 건드리지 않음.
2.  **엔드포인트 병행:** `/grip-result` (v1) 는 그대로 유지, `/daily-grip-success-rate` (v2) 만 새로 추가.
3.  **데이터 격리:** 집계 데이터는 별도의 `read_daily_grip_success_rate_v1` 테이블에 저장하여, row-level 데이터 (`read_grip_result`) 와 혼동되지 않도록 분리.

이 절차에 따라 기존 v1 API 클라이언트는 기존 엔드포인트를 통해 정상적으로 작동하며, 신규 기능은 v2 엔드포인트를 통해 제공되므로 호환성이 보장됩니다.
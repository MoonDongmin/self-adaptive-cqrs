기존 v1 API 클라이언트가 깨지지 않도록 하려면 **하위 호환성 (Backward Compatibility)** 을 보장하는 전략을 따라야 합니다. 제공된 자료에 따르면 변경 사항은 순수 추가 (additive) 이며, 기존 자산은 무손상이어야 합니다.

구체적인 단계는 다음과 같습니다:

### 1. 버전 경로 분리 (Versioned Endpoint)
기존 `/object-grip-rate` 엔드포인트는 v2 에서만 사용되도록 하거나, 기존 v1 엔드포인트와 충돌을 피하기 위해 **버전 접두사**를 붙여야 합니다.
*   **추천 경로:** `POST /object-grip-rate/v2`
*   **이유:** 기존 v1 클라이언트가 `/object-grip-rate` 를 호출할 때 v2 로직이 실행되지 않도록 막고, v2 클라이언트는 새 경로를 호출하도록 유도합니다.

### 2. 신규 Read Model 병행 운영 (Parallel Operation)
DDL (`read_object_grip_rate_v1` 생성) 이 적용된 직후, 기존 v1 서비스와 v2 서비스는 **동시에** 존재해야 합니다.
*   **v1 서비스:** 기존 `read_grip_result`, `read_multimodal` 테이블만 조회합니다. `/object-grip-rate` 엔드포인트는 아직 없거나 (없음), 있더라도 v1 로직 (없음) 을 반환합니다.
*   **v2 서비스:** 기존 테이블 + 신규 `read_object_grip_rate_v1` 테이블을 모두 조회합니다. `/object-grip-rate/v2` 엔드포인트가 추가됩니다.

### 3. 마이그레이션 및 컷오버 절차 (Migration & Cutover)
인간 승인 후 DDL 실행 시점부터 변경이 시작됩니다.

1.  **DDL 실행:** `read_object_grip_rate_v1` 테이블 생성 SQL 실행.
2.  **Insight 카드 등록:** `insight_entity` 및 `insight_field` 테이블에 신규 카드 정보 INSERT.
3.  **코드 배포:**
    *   `src/projection/projection.service.ts` 에 `ObjectGripRateProjector` 주입 및 `catchUpObjectGripRateV2` 메서드 추가.
    *   `src/projection/projection.controller.ts` 에 `@Post("/object-grip-rate/v2")` 라우트 추가.
    *   기존 `/object-grip-rate` (v1) 엔드포인트는 **유지** (비활성화 또는 빈 응답 반환) 하되, 삭제는 금지.
4.  **데이터 초기화 (Catch-up):**
    *   신규 프로젝터 (`ObjectGripRateProjector`) 를 통해 과거 이벤트 (`GripAttemptRecorded`) 를 재투영하여 `read_object_grip_rate_v1` 테이블에 초기 데이터 적재.
    *   기존 `read_grip_result` 등 v1 모델 데이터는 그대로 유지.

### 4. 클라이언트 전환 (Client Migration)
*   **v1 클라이언트:** 기존 `/object-grip-rate` 엔드포인트를 계속 호출하면 v1 로직 (없음) 이 적용되므로, 해당 API 호출은 무시하거나 빈 데이터만 반환받게 됩니다. 기존 로직은 깨지지 않습니다.
*   **v2 클라이언트:** 새 `/object-grip-rate/v2` 엔드포인트를 호출하여 집계된 데이터를 받습니다.

### 5. 컷오버 (Cutover)
모든 v1 클라이언트가 새 버전으로 업데이트되고, v2 데이터가 충분히 안정화되면:
*   `/object-grip-rate` (v1) 엔드포인트를 **삭제**하거나 **비활성화**.
*   모든 트래픽을 `/object-grip-rate/v2` 로 리디렉션.

### 요약 SQL (DDL 포함)
DDL 실행 시점부터 v2 로직이 활성화되도록 보장하는 핵심 SQL 은 다음과 같습니다.

```sql
-- 1. 신규 Read Model 테이블 생성 (v2 로직의 기반)
CREATE TABLE read_object_grip_rate_v1 (
  object_name varchar NOT NULL,
  total_attempts bigint,
  success_attempts bigint,
  success_rate double precision,
  PRIMARY KEY (object_name)
);

-- 2. Insight 카탈로그 동기화 (LLM 컨텍스트 노출 및 메타데이터 관리)
INSERT INTO insight_entity (entity_name, kind, purpose, key_columns)
VALUES ('read_object_grip_rate_v1', 'read_model', '객개(object_name)별 파지 성공률 집계 조회를 위한 전용 Read Model 테이블. 시도 수, 성공 수, 성공률을 원천 이벤트 적재 시 누적 갱신하여 Insight 카드 시스템의 O(1) 단건 조회 요구를 충족.', 'object_name')
ON CONFLICT (entity_name) DO UPDATE SET purpose = EXCLUDED.purpose, key_columns = EXCLUDED.key_columns;

INSERT INTO insight_field (entity_name, field_name, data_type, meaning, display_order)
VALUES
  ('read_object_grip_rate_v1', 'object_name', 'varchar', '파지 대상 객개 식별자 (payload.objects[0].class_name), 집계 차원 키', 1),
  ('read_object_grip_rate_v1', 'total_attempts', 'bigint', '누적 시도 수 (1:1 이벤트 적재 시 +1 갱신)', 2),
  ('read_object_grip_rate_v1', 'success_attempts', 'bigint', '누적 성공 수 (payload.grip_succeed === 1 일 경우 +1 갱신)', 3),
  ('read_object_grip_rate_v1', 'success_rate', 'double precision', '성도률 (적재 시 null, 조회 시 success_attempts / total_attempts 계산 또는 별도 업데이트)', 4)
ON CONFLICT (entity_name, field_name) DO UPDATE SET data_type = EXCLUDED.data_type, meaning = EXCLUDED.meaning, display_order = EXCLUDED.display_order;
```

이 절차에 따라 기존 v1 API 는 무손상 (무손상: 기존 엔드포인트는 그대로 유지되지만 기능은 v1 로 유지) 이고, v2 기능은 새 경로로 추가되어 기존 클라이언트가 충돌하지 않습니다.
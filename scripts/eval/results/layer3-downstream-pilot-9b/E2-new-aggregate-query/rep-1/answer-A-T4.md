기존 v1 API 클라이언트가 깨지지 않도록 하려면 **비파괴적 마이그레이션 (Non-destructive Migration)** 전략을 따르고, **API 버전 관리 (API Versioning)** 를 통해 신구 버전을 병행 운영해야 합니다.

구체적인 단계는 다음과 같습니다.

### 1. 데이터베이스 스키마 확장 (DDL)
기존 `read_grip_result` 테이블을 삭제하지 않고, 새로운 집계 테이블 `read_object_grip_aggregate_v1`을 추가합니다.
*   **이유:** v1 API 가 `read_grip_result` 를 참조하므로, 해당 테이블을 삭제하면 v1 클라이언트가 즉시 깨집니다.
*   **SQL:**
```sql
CREATE TABLE read_object_grip_aggregate_v1 (
  object_name varchar NOT NULL,
  attempt_count bigint,
  success_count bigint,
  success_rate doublePrecision,
  PRIMARY KEY (object_name)
);
```

### 2. 인프라 코드 수정 (Projector 및 Service)
*   **Projector 추가:** `ObjectGripAggregateProjector` 클래스를 생성하여 이벤트 (`GripAttemptRecorded`) 를 `read_object_grip_aggregate_v1` 테이블로 투영하는 로직을 구현합니다.
*   **Service 확장:** `ProjectionService` 에 `catchUpObjectGripAggregate` 메서드를 추가하고, `catchUpAll` 로직에 이를 포함시킵니다.
*   **Controller 확장:** `ProjectionController` 에 `@Post("/object-grip-aggregate")` 엔드포인트를 추가합니다.
*   **주의:** 기존 `GripResultProjector`, `read_grip_result` 테이블, `/grip-result` 엔드포인트는 **변경 없이 유지**합니다.

### 3. API 컷오버 (Cutover) 절차
클라이언트 측에서 새 API 를 호출할 수 있도록 하되, 기존 v1 호출은 무결성을 유지합니다.

1.  **신규 엔드포인트 배포:** `/projection/object-grip-aggregate` 라우트를 배포합니다.
2.  **버전별 라우트 매핑 (Routing Logic):**
    *   클라이언트가 `/projection/grip-result` (v1) 를 호출하면: 기존 `GripResultProjector` 로 처리된 `read_grip_result` 테이블 데이터를 반환합니다. (기존 로직 유지)
    *   클라이언트가 `/projection/object-grip-aggregate` (v2) 를 호출하면: 새로 추가된 `ObjectGripAggregateProjector` 로 처리된 `read_object_grip_aggregate_v1` 테이블 데이터를 반환합니다.
3.  **데이터 동기화:** `insert-all` 또는 `catch-up` 시 두 테이블 (`read_grip_result` 와 `read_object_grip_aggregate_v1`) 에 동시에 데이터를 적재합니다.

### 4. 클라이언트 호환성 보장 전략
*   **v1 클라이언트:** `/projection/grip-result` 엔드포인트를 계속 호출하므로, 해당 엔드포인트가 정상 작동하는지 확인만 하면 됩니다. 데이터 구조는 `read_grip_result` 스키마에 맞춰져 있으므로 변경되지 않습니다.
*   **v2 클라이언트:** `/projection/object-grip-aggregate` 엔드포인트를 호출하여 새로운 집계 데이터를 받습니다.

### 5. 롤백 계획 (Rollback Plan)
만약 v2 프로젝터 (`ObjectGripAggregateProjector`) 가 성능 저하를 일으키거나 데이터 불일치 (drift) 가 발생하여 문제가 된다면:
1.  `/projection/object-grip-aggregate` 엔드포인트를 제거합니다.
2.  `ObjectGripAggregateProjector` 를 서비스에서 제거합니다.
3.  `read_object_grip_aggregate_v1` 테이블을 `DROP TABLE` 합니다.
4.  시스템은 다시 `read_grip_result` 기반의 v1 로 회귀합니다.

이 절차는 **PK (scene_key, attempt_num) 유지**와 **v1 자산 무손상** 제약 조건을 모두 만족합니다.
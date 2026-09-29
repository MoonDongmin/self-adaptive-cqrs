기존 v1 API 클라이언트가 깨지지 않게 하려면 **비파괴적 마이그레이션 (Non-destructive Migration)** 전략을 따르고, **병행 운영 (Parallel Operation)**을 통해 점진적으로 트래픽을 전환해야 합니다.

구체적인 단계는 다음과 같습니다:

### 1. 데이터 모델 확장 (DDL 실행)
`read_grip_result_v2` 테이블을 생성하되, 기존 `read_grip_result` 테이블을 삭제하지 않습니다.
*   **이유:** 기존 v1 API 가 `read_grip_result` 를 참조하고 있으므로, 기존 테이블이 유지되어야 합니다.
*   **DDL:** 제공된 자료의 `read_grip_result_v2` 생성 SQL 을 실행합니다.

### 2. 투영 로직 확장 (Projector 추가)
`GripResultV2Projector` 를 등록하고, 기존 `GripResultProjector` 를 유지합니다.
*   **이유:** 두 프로젝트어가 동일한 키 (`scene_key`, `attempt_num`) 를 사용하여 `read_grip_result` 와 `read_grip_result_v2` 를 각각 업데이트하므로, 두 테이블에 데이터가 동시에 반영됩니다.
*   **주의:** `GripResultV2Projector` 는 `robot_tf` JSONB 를 파싱하여 `robot_tf_translation_x/y` 와 `grip_outlier_flag` 를 계산하여 `read_grip_result_v2` 에만 적재합니다.

### 3. API 엔드포인트 병행 (Controller 수정)
`POST /grip-result` 와 `POST /grip-result-v2` 두 엔드포인트를 모두 유지합니다.
*   **POST /grip-result:** 기존 `GripResultProjector` 를 실행하여 `read_grip_result` 테이블 업데이트. (기존 v1 클라이언트 호환)
*   **POST /grip-result-v2:** 새로 추가된 `GripResultV2Projector` 를 실행하여 `read_grip_result_v2` 테이블 업데이트. (새로운 v2 클라이언트용)
*   **이유:** v1 클라이언트는 여전히 `/grip-result` 를 호출하면 기존 로직으로 작동하며, v2 클라이언트는 `/grip-result-v2` 를 호출하면 개선된 로직으로 작동합니다.

### 4. 마이그레이션 및 컷오버 절차 (Human-in-the-loop)
인간 승인이 완료된 후, v1 클라이언트 호환성을 보장하며 v2 로 전환합니다.

1.  **v2 데이터 검증:** `read_grip_result_v2` 테이블에 `grip_outlier_flag=1` 로 적재된 이상 데이터 (예: `_02020`, `_02021`) 가 정상적으로 생성되었는지 확인합니다.
2.  **v1 데이터 무손상 확인:** `read_grip_result` 테이블에 `grip_succeed=1` 인 이상 데이터가 여전히 존재하는지 확인합니다. (v1 로직이 여전히 작동해야 하므로)
3.  **v1 API 제거 (Rollback 준비):**
    *   만약 v2 로직이 안정적으로 작동하고, v1 로직이 더 이상 필요 없다면, `read_grip_result` 테이블을 삭제하고 `GripResultProjector` 를 제거합니다.
    *   `POST /grip-result` 엔드포인트를 삭제하고 `POST /grip-result-v2` 만 남깁니다.
    *   **주의:** 이 단계에서 v1 클라이언트가 호출하는 `/grip-result` 가 404 에러를 반환하면 v1 클라이언트가 깨집니다. 따라서 **v1 클라이언트 호환성을 유지하려면 v1 엔드포인트를 삭제하지 않고, v2 로직을 v1 엔드포인트에 적용하거나, v1 엔드포인트를 v2 로직으로 리팩토링하되 v1 클라이언트 호환성을 유지하는 것이 핵심입니다.**

**결론:**
가장 안전한 방법은 **두 엔드포인트를 모두 유지**하는 것입니다.
*   v1 클라이언트는 `POST /grip-result` 를 계속 호출하며, 기존 `read_grip_result` 테이블에 데이터를 적재합니다.
*   v2 클라이언트는 `POST /grip-result-v2` 를 호출하며, 새로 생성된 `read_grip_result_v2` 테이블에 데이터를 적재합니다.
*   시간이 지나 v1 클라이언트가 모두 v2 로 전환되면, `POST /grip-result` 엔드포인트와 `read_grip_result` 테이블을 삭제합니다.

### 적용 SQL (DDL)
```sql
DROP TABLE IF EXISTS read_grip_result_v2;
CREATE TABLE read_grip_result_v2 (
  scene_key varchar NOT NULL,
  attempt_num smallint NOT NULL,
  object_name varchar NOT NULL,
  grip_succeed smallint NOT NULL,
  robot_tf_translation_x double precision,
  robot_tf_translation_y double precision,
  grip_outlier_flag smallint NOT NULL,
  occurred_at timestamptz NOT NULL,
  stream_id varchar NOT NULL,
  global_seq bigint NOT NULL,
  PRIMARY KEY (scene_key, attempt_num)
);
CREATE INDEX idx_grip_result_v2_outlier ON read_grip_result_v2 (grip_outlier_flag, occurred_at);
CREATE INDEX idx_grip_result_v2_time ON read_grip_result_v2 (occurred_at);
```

### 적용 코드 (Controller)
```typescript
// src/projection/projection.controller.ts
@Post("/grip-result")
gripResult(): Promise<ProjectionResult> {
  // 기존 v1 로직 유지
  return this.projectionService.catchUpGripResult();
}

@Post("/grip-result-v2")
gripResultV2(): Promise<ProjectionResult> {
  // 신규 v2 로직 추가
  return this.projectionService.catchUpGripResultV2();
}
```

이렇게 하면 v1 클라이언트는 기존 엔드포인트를 통해 기존 테이블에 데이터를 적재할 수 있고, v2 클라이언트는 새 엔드포인트를 통해 새 테이블에 데이터를 적재할 수 있어 호환성이 보장됩니다.
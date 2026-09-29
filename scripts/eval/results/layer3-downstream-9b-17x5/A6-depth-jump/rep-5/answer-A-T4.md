기존 v1 API 클라이언트가 깨지지 않도록 하려면 **비파괴적 마이그레이션 (Non-destructive Migration)** 전략을 따르고, **병행 운영 (Parallel Operation)**을 통해 점진적으로 트래픽을 전환해야 합니다.

구체적인 단계는 다음과 같습니다:

### 1. 데이터 스키마 확장 (DDL)
`read_grip_result` 테이블을 수정하지 않고, 새로운 `read_grip_result_v2` 테이블을 생성하여 기존 v1 데이터를 무손상 유지합니다.
*   **이유:** v1 클라이언트는 여전히 `read_grip_result` 테이블을 참조하므로, 해당 테이블을 건드리면 즉시 깨집니다.

```sql
CREATE TABLE read_grip_result_v2 (
  scene_key varchar NOT NULL,
  attempt_num smallint NOT NULL,
  object_name varchar,
  grip_succeed smallint,
  occurred_at timestamptz,
  z_avg_m double precision,
  grip_outlier_flag smallint,
  PRIMARY KEY (scene_key, attempt_num)
);
```

### 2. 투영 로직 확장 (Projector & Service)
`GripResultProjector` (v1) 은 그대로 유지하고, `GripResultProjectorV2`를 새로 등록하여 두 프로젝터가 동시에 실행되도록 합니다.
*   **이유:** v1 클라이언트가 `read_grip_result` 데이터를 필요로 할 때, v1 프로젝터가 정상적으로 데이터를 생성하므로 API 응답이 끊기지 않습니다.

### 3. API 엔드포인트 병행 (Controller)
`/grip-result` (v1) 와 `/grip-result-v2` (v2) 두 엔드포인트를 모두 등록합니다.
*   **이유:** 기존 클라이언트는 `/grip-result`를 호출하고, 새 클라이언트는 `/grip-result-v2`를 호출할 수 있어 호환성이 보장됩니다.

```typescript
// src/projection/projection.controller.ts
@Controller("projection")
export class ProjectionController {
  // ... 기존 코드 ...

  @Post("/grip-result")
  // v1 엔드포인트: 기존 로직 유지
  gripResult(): Promise<ProjectionResult> {
    return this.projectionService.catchUpGripResult();
  }

  @Post("/grip-result-v2")
  // v2 엔드포인트: 신규 로직 (z_avg_m, grip_outlier_flag 포함)
  gripResultV2(): Promise<ProjectionResult> {
    return this.projectionService.catchUpGripResultV2();
  }
}
```

### 4. 마이그레이션 및 컷오버 절차 (Human-in-the-loop)
인간 승인이 완료된 후, 점진적으로 트래픽을 v2 로 이동시킵니다.

1.  **v2 데이터 채우기 (Catch-up):**
    *   `POST /grip-result-v2` 엔드포인트를 호출하여 `read_grip_result_v2` 테이블에 모든 과거 이벤트 (v1 데이터 포함) 를 투영합니다.
    *   이때 `GripResultProjectorV2` 로직이 `z_avg_m`과 `grip_outlier_flag`을 계산하여 저장합니다.

2.  **클라이언트 전환:**
    *   기존 v1 클라이언트: `POST /grip-result` 계속 사용 (v1 데이터 정상 조회).
    *   새 v2 클라이언트: `POST /grip-result-v2` 사용 (정성성 플래그 포함 데이터 조회).

3.  **컷오버 (Cutover):**
    *   모든 클라이언트가 v2 로 전환되었음을 확인한 후, `read_grip_result` 테이블의 데이터가 더 이상 필요 없음을 확인합니다.
    *   `read_grip_result` 테이블을 `DROP`합니다.
    *   `/grip-result` 엔드포인트를 주석 처리하거나 제거합니다.

### 요약
*   **버전 경로:** `/grip-result` (v1 유지), `/grip-result-v2` (신규 추가).
*   **신구 병행:** `read_grip_result` (v1) 과 `read_grip_result_v2` (v2) 를 동시에 유지하며, 두 엔드포인트를 모두 노출합니다.
*   **마이그레이션:** v2 프로젝터 추가 → v2 데이터 채우기 → 클라이언트 점진적 전환 → v1 테이블/엔드포인트 제거.
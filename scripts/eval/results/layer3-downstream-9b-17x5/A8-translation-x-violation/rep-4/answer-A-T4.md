기존 v1 API 클라이언트가 깨지지 않도록 하려면 **API 버전을 병행 운영 (Blue-Green Deployment)** 하되, **컷오버 (Cutover) 시점**에 클라이언트 측에서 호출 경로를 변경하는 전략을 따라야 합니다.

구체적인 단계는 다음과 같습니다.

### 1. 신규 엔드포인트 추가 및 병행 운영 (Add & Run-in-Parallel)
*   **동작**: `src/projection/projection.controller.ts` 에 `@Post("/grip-result-v2")` 라우트를 추가합니다.
*   **결과**: 기존 `/grip-result` (v1) 와 새 `/grip-result-v2` (v2) 가 동시에 존재하게 됩니다.
*   **클라이언트 영향**: 기존 v1 클라이언트는 `/grip-result` 를 계속 호출하므로 정상 작동합니다. 새 v2 클라이언트는 `/grip-result-v2` 를 호출하게 됩니다.

### 2. 데이터 마이그레이션 및 재투영 (Migrate & Replay)
*   **동작**: `read_grip_result_v2` 테이블을 생성하고, 이벤트 스토어에 저장된 모든 `GripAttemptRecorded` 이벤트를 새 프로젝터 (`GripResultV2Projector`) 로 재투영 (Replay) 합니다.
*   **결과**: `read_grip_result_v2` 테이블에 모든 과거 데이터 (정상 및 이상 데이터 포함) 가 `grip_outlier_flag` 컬럼과 함께 저장됩니다.
*   **클라이언트 영향**: 아직 컷오버 전이므로 v1 클라이언트는 v1 테이블만 조회하므로 영향이 없습니다.

### 3. 컷오버 전 검증 (Pre-Cutover Validation)
*   **동작**: v2 엔드포인트가 정상적으로 작동하는지, 특히 `grip_outlier_flag=1`인 이상 데이터 (02020, 02021) 가 올바르게 필터링되거나 표시되는지 확인합니다.
*   **목표**: v2 로직이 workspace 한계 규칙을 적용하여 이상 데이터를 적절히 처리 (예: `grip_outlier_flag=1` 반환 또는 필터링) 하는지 검증합니다.

### 4. 컷오버 (Cutover)
*   **동작**:
    1.  v1 관련 리소스 (`read_grip_result`, `GripResultProjector`, `/grip-result` 라우트) 를 **비활성화**하거나 **삭제**합니다.
    2.  v1 클라이언트 호출 경로를 **수동으로 변경**하여 `/grip-result-v2` 로 이동시킵니다.
*   **결과**: 모든 트래픽이 v2 엔드포인트로 이동하며, v2 의 강화된 검증 로직 (workspace range check) 이 적용됩니다.
*   **클라이언트 영향**:
    *   **v1 클라이언트**: 호출 경로가 변경되었으므로 **404 에러**가 발생하거나, 만약 v1 엔드포인트를 삭제하지 않고 병행으로 두었다면 v1 로직이 계속 유지되지만 데이터 정합성 (workspace check) 이 누락된 상태로 노출될 위험이 있습니다.
    *   **권장**: v1 엔드포인트를 완전히下线 (deprecate/remove) 하고, 클라이언트 배포 시 호출 URL 을 `/grip-result-v2` 로 변경해야 합니다.

### 5. 롤백 계획 (Rollback Plan)
*   **동작**: v2 가 예상치 못한 오류 (예: 새로운 필드 타입 호환성 문제) 가 발생하면 즉시 v1 로 회귀합니다.
*   **동작**: `read_grip_result_v2` 테이블을 `DROP` 하고, `read_grip_result` 테이블을 다시 활성화하며, `/grip-result` 라우트를 복구합니다.
*   **클라이언트 영향**: v1 클라이언트는 즉시 정상 작동 상태로 복귀합니다.

### 요약
1.  **새 엔드포인트 (`/grip-result-v2`) 추가**: 기존 v1 (`/grip-result`) 과 병행.
2.  **v2 데이터 재투영**: 과거 데이터 포함 v2 모델 생성.
3.  **검증**: v2 로직이 이상 데이터를 올바르게 처리하는지 확인.
4.  **컷오버**: v1 삭제/비활성화 + **v1 클라이언트 호출 경로 변경** (`/grip-result` → `/grip-result-v2`).
5.  **롤백**: v2 실패 시 v1 복원.

이 절차는 "v1 자산 무손상" 제약 조건을 지키면서, 클라이언트 호환성을 보장하는 안전한 마이그레이션 경로입니다.
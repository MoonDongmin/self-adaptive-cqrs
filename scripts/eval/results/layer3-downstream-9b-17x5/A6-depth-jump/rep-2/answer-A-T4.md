기존 v1 API 클라이언트가 깨지지 않도록 하려면 **파괴적 변경 (Breaking Change) 을 피하는 버전 관리 전략**을 따라야 합니다. 제공된 자료에 따르면 `read_grip_result_v2` 테이블과 `POST /grip-result-v2` 엔드포인트가 새로 추가되며, 기존 v1 자산은 무손상이어야 합니다.

구체적인 단계는 다음과 같습니다:

### 1. 버전 경로 (Versioned Endpoint)
기존 엔드포인트 `POST /grip-result` 는 그대로 유지하고, 새로운 기능은 버전 접두사를 붙인 새 엔드포인트를 추가합니다.
- **기존 (v1):** `POST /grip-result` (기존 클라이언트 호환)
- **신규 (v2):** `POST /grip-result-v2` (신규 기능 사용)

### 2. 신구 병행 운영 (Parallel Operation)
DDL 변경과 코드 변경을 동시에 적용하지 않고, 두 Read Model 을 동시 운영하여 점진적으로 전환합니다.
- **Step 1:** `read_grip_result_v2` 테이블 생성 (DDL).
- **Step 2:** `GripResultV2Projector` 구현 및 `ProjectionService` 에 주입.
- **Step 3:** `POST /grip-result-v2` 라우트 추가.
- **결과:** 이 시점부터는 두 엔드포인트가 모두 작동하며, 기존 클라이언트는 `POST /grip-result` 를 계속 호출하면 됩니다.

### 3. 마이그레이션 및 컷오버 절차 (Migration & Cutover)
신규 v2 가 안정화되고 검증된 후, 기존 v1 을 제거하는 단계를 수행합니다.
- **Step 4 (검증):** `POST /grip-result` (v1) 와 `POST /grip-result-v2` (v2) 의 결과를 비교하여 데이터 일관성 확인.
- **Step 5 (컷오버):**
  - 기존 클라이언트들이 `POST /grip-result-v2` 로 변경됨을 확인.
  - `read_grip_result` 테이블의 불필요한 필드 (예: `grip_3d_pose` jsonb 등 v2 에서 파생되는 필드) 가 더 이상 쓰이지 않음을 확인.
  - `read_grip_result` 테이블 삭제 (DROP).
  - `GripResultProjector` 제거 및 `GripResultV2Projector` 만 남김.
  - `POST /grip-result` 라우트 제거 및 `POST /grip-result-v2` 만 남김.

이 절차는 "v1 자산 무손상" 제약 조건을 만족하며, 기존 클라이언트의 호환성을 보장합니다.
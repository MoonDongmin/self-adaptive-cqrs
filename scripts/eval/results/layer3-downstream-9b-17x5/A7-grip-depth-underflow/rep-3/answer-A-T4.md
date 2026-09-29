기존 v1 API 클라이언트가 깨지지 않도록 하려면 **파괴적 변경 (Breaking Change) 을 피하는 버전 관리 전략**을 적용해야 합니다. 제공된 자료에 따르면 `read_grip_result` 테이블은 무손상 (v1 유지) 이고, 새로운 검증 로직은 별도의 `read_grip_pose_consistency_v2` 테이블로 분리되어 구현됩니다.

따라서 구체적인 단계는 다음과 같습니다.

### 1. 버전 경로 변경 (API Versioning)
기존 클라이언트가 호출하던 엔드포인트 경로에 버전을 명시하여 새 API 를 노출합니다.
*   **기존 v1 경로:** `POST /grip-result` (기존 `read_grip_result` 조회용)
*   **신규 v2 경로:** `POST /grip-pose-consistency-v2` (신규 `read_grip_pose_consistency_v2` 조회용)

### 2. 신구 병행 운영 (Parallel Operation)
DDL 실행 후 즉시 기존 v1 API 를 중단하지 않고, 새 v2 API 를 추가하여 두 버전을 동시에 운영합니다.
*   **v1 API (`/grip-result`):** 기존 `read_grip_result` 테이블을 조회합니다. 이 테이블은 `grip_3d_pose` 가 `jsonb` 로 원형 저장되므로, 물리적 하한 검증 로직이 포함되지 않은 상태입니다. 기존 클라이언트는 이 경로를 계속 호출하므로 정상 작동합니다.
*   **v2 API (`/grip-pose-consistency-v2`):** 새로 생성된 `read_grip_pose_consistency_v2` 테이블을 조회합니다. 이 테이블에는 `grip_outlier_flag` 필드가 추가되어 물리적 모순 (gripSucceed=1 이면서 깊이 < 0.01m) 을 플래그로 식별합니다.

### 3. 마이그레이션 및 컷오버 절차 (Migration & Cutover)
인간 승인 후 다음 순서대로 변경을 적용합니다.

1.  **DDL 실행:** `read_grip_pose_consistency_v2` 테이블 생성 SQL 을 실행합니다. 기존 `read_grip_result` 테이블은 삭제하지 않고 유지합니다.
2.  **프로젝터 추가:** `GripPoseConsistencyProjector` 를 `ProjectionService` 에 등록하고, `catchUpGripPoseConsistencyV2` 메서드를 추가합니다.
3.  **컨트롤러 추가:** `ProjectionController` 에 `POST /grip-pose-consistency-v2` 라우트를 추가합니다.
4.  **컷오버 (Cutover):**
    *   **기존 클라이언트:** `POST /grip-result` 를 계속 호출하므로 영향이 없습니다.
    *   **신규 클라이언트:** `POST /grip-pose-consistency-v2` 를 호출하여 정제된 데이터를 받습니다.
    *   **데이터 동기화:** `catchUpGripPoseConsistencyV2` 를 실행하여 과거 이벤트 (seq:26, seq:27 등) 를 새 Read Model 로 투영합니다.
5.  **v1 API 유지:** `read_grip_result` 테이블과 `/grip-result` 엔드포인트는 무손상으로 유지됩니다.

### 요약
*   **버전 경로:** `POST /grip-result` (v1, 기존), `POST /grip-pose-consistency-v2` (v2, 신규)
*   **실행 전략:** 새 테이블 생성 후 새 엔드포인트 추가, 기존 엔드포인트는 그대로 두어 병행 운영.
*   **결과:** 기존 v1 클라이언트는 경로 변경 없이 계속 작동하며, v2 클라이언트는 새 엔드포인트를 통해 물리적 모순을 필터링한 데이터를 얻을 수 있습니다.
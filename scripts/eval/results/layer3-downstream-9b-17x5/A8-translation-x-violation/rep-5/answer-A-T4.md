기존 v1 API 클라이언트가 깨지지 않게 하려면 **파괴적 변경 (Breaking Change) 을 피하는 버전 관리 전략**을 적용해야 합니다. 제공된 자료에 따르면 `read_grip_result` (v1) 은 무손상 유지되도록 설계되어 있으며, 새로운 필드와 로직은 `read_grip_result_v2` (v2) 에서 처리됩니다.

구체적인 단계는 다음과 같습니다:

1.  **API 경로 분리 (Versioning)**:
    *   기존 v1 클라이언트는 `POST /grip-result` 엔드포인트를 계속 호출합니다. 이 엔드포인트는 `read_grip_result` 테이블을 대상으로 하므로, v1 로직 (물리적 정합성 검증 누락) 이 그대로 유지되어 기존 클라이언트의 동작이 깨지지 않습니다.
    *   새로운 v2 클라이언트 (또는 업데이트된 로직) 는 `POST /grip-result-v2` 엔드포인트를 호출합니다. 이 엔드포인트는 `read_grip_result_v2` 테이블을 대상으로 하며, 물리적 정합성 (`grip_outlier_flag`) 을 검증하는 새로운 로직을 포함합니다.

2.  **신구 병행 운영 (Coexistence)**:
    *   DDL (`read_grip_result_v2` 생성) 과 API 엔드포인트 (`/grip-result-v2`) 를 추가할 때 기존 `read_grip_result` 테이블과 `/grip-result` 엔드포인트를 삭제하지 않습니다.
    *   시스템은 두 버전의 Read Model 을 동시에 지원합니다.

3.  **마이그레이션 및 컷오버 절차**:
    *   **단계 1: DDL 적용**: `read_grip_result_v2` 테이블을 생성합니다. 기존 `read_grip_result` 테이블은 유지됩니다.
    *   **단계 2: 새 프로젝트어 등록**: `GripResultV2Projector` 를 시스템에 등록합니다.
    *   **단계 3: 컷오버 전 검증 (Pre-cutover Validation)**:
        *   `read_grip_result_v2` 테이블에 새 데이터가 투영된 후, 기존 `read_grip_result` 테이블에 투영된 데이터와 비교합니다.
        *   특히 `scene_key` 와 `attempt_num` 을 기준으로 매칭하여, 두 테이블의 핵심 필드 (`grip_succeed`, `object_name` 등) 가 일치하는지 확인합니다.
        *   **중요**: v2 의 `grip_outlier_flag` 가 1 인 경우, v1 의 `grip_succeed` 가 1 인 경우와 비교하여 논리적 일관성을 확인합니다. (자료에 따르면 v1 은 물리적 정합성 검사가 없으므로, v2 가 `grip_outlier_flag=1` 을 기록하면 v1 은 `grip_succeed=1` 로만 기록될 수 있습니다. 이 경우 v1 클라이언트는 `grip_succeed=1` 으로 인식하므로 깨지지 않습니다.)
    *   **단계 4: 컷오버 (Cutover)**: 검증이 성공하면, 새 API 엔드포인트 (`/grip-result-v2`) 를 활성화합니다. 기존 `/grip-result` 엔드포인트는 그대로 유지됩니다.
    *   **단계 5: 클라이언트 전환**: 클라이언트는 필요에 따라 `/grip-result` (v1) 또는 `/grip-result-v2` (v2) 중 하나를 선택하여 호출합니다.

이 절차는 "v1 자산 무손상" 제약 조건을 충족시키며, 기존 v1 클라이언트는 변경 없이 계속 작동하고, v2 클라이언트는 새로운 정합성 검증 기능을 사용할 수 있게 합니다.
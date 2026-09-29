기존 v1 API 클라이언트가 깨지지 않도록 하려면 **파괴적 변경 (Breaking Change) 을 피하는 전략**을 취해야 합니다. 제공된 자료에 따르면, 기존 `read_grip_result`와 `read_multimodal` 테이블 및 엔드포인트는 **무손상 (Unchanged)**으로 유지되며, 새로운 기능은 별도의 엔드포인트와 테이블로 격리됩니다.

구체적인 단계는 다음과 같습니다:

### 1. 버전 경로 분리 (Route Separation)
*   **기존 엔드포인트 유지:** `POST /multimodal`, `POST /grip-result` 는 기존 스키마와 로직을 그대로 사용하여 반환합니다. v1 클라이언트는 이 경로만 호출하므로 영향이 없습니다.
*   **신규 엔드포인트 추가:** `POST /grip-outlier-v2` 를 추가합니다. 이 엔드포인트는 **신규 Read Model (`read_grip_outlier_v2`)** 의 데이터를 반환하며, v1 클라이언트는 이 경로를 모를 수 있으므로 호출하지 않습니다.

### 2. 신규 Read Model 격리 (Read Model Isolation)
*   **신규 테이블 생성:** `read_grip_outlier_v2` 테이블을 생성합니다. 기존 `read_grip_result` 테이블은 삭제하거나 수정하지 않습니다.
*   **데이터 격리:** 센서 이상 (z1 ≤ 0, xl > 1920) 에피소드는 `read_grip_result` 테이블에 **INSERT**되지 않도록 프로젝터 로직을 수정하거나, 이미 INSERT된 데이터는 `read_grip_outlier_v2` 테이블로 **UPSERT**하여 격리합니다.
    *   *주의:* 자료의 `[contain]` 옵션인 `DELETE`는 원본 데이터 손실로 인해 기각되었으며, `[fix]` 옵션인 재투영이 권장됩니다. 따라서 이상 데이터는 `read_grip_result`에 남지 않고 `read_grip_outlier_v2`에 저장되도록 로직을 변경해야 합니다.

### 3. 마이그레이션 및 컷오버 절차 (Migration & Cutover)
인간 승인 후 다음 순서대로 실행합니다:

1.  **DDL 실행:** `read_grip_outlier_v2` 테이블 생성 SQL 실행.
2.  **프로젝터 등록:** `GripOutlierV2Projector` 를 서비스 컨테이너에 등록하고, `/grip-outlier-v2` 라우트를 추가합니다.
3.  **Catch-up 실행:** 기존에 발생했으나 아직 투영되지 않은 이상 이벤트 (Seq 26, 27 등) 를 `GripOutlierV2Projector` 로 처리하여 `read_grip_outlier_v2` 테이블에 적재합니다.
4.  **v1 클라이언트 영향 확인:** v1 클라이언트가 `POST /grip-result` 를 호출하면, 여전히 `read_grip_result` 테이블을 조회하므로 정상적인 데이터만 반환됩니다. 이상 데이터는 `read_grip_outlier_v2` 테이블에 격리되어 있어 v1 클라이언트는 이를 볼 수 없습니다.

### 4. 요약
*   **버전 경로:** `POST /grip-outlier-v2` (신규), `POST /grip-result` (기존 유지).
*   **신구 병행:** `read_grip_result` (v1), `read_grip_outlier_v2` (v2 이상 전용).
*   **마이그레이션:** 신규 테이블 생성 후, 이상 데이터만 신규 테이블로 이동 (UPSERT), 기존 v1 테이블은 건드리지 않음.

이 방식은 **Backward Compatibility (역방향 호환성)**를 완벽하게 보장합니다.
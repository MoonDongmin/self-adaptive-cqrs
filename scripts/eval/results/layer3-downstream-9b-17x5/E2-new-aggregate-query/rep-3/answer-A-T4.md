기존 v1 API 클라이언트가 깨지지 않도록 하려면 **버전 경로 (Versioning) 를 통한 신구 병행 운영** 전략을 적용해야 합니다. 제공된 자료에 따르면 `read_object_success_rate_v1`은 신규 Read Model 이며, 기존 `read_grip_result`는 v1 로 유지됩니다.

구체적 단계는 다음과 같습니다:

1.  **API 엔드포인트 버전 분리**:
    *   기존 `POST /object-success-rate` 엔드포인트를 `POST /v1/object-success-rate`로 변경하거나, 신규 엔드포인트를 `POST /v2/object-success-rate`로 추가합니다.
    *   기존 클라이언트는 `POST /object-success-rate` (v1) 를 계속 호출하므로, 해당 경로가 v1 로 유지되거나 호환되도록 합니다.
    *   신규 기능은 `POST /v2/object-success-rate` 경로로 노출합니다.

2.  **신구 Read Model 동시 유지 (Coexistence)**:
    *   `read_grip_result` (v1) 테이블을 삭제하지 않고 그대로 유지합니다.
    *   `read_object_success_rate_v1` (v2) 테이블을 새로 생성합니다.
    *   두 테이블은 서로 다른 PK 구조 (`scene_key, attempt_num` vs `object_name`) 를 가지므로 충돌이 없습니다.

3.  **투영 서비스 (Projection Service) 로직 수정**:
    *   `ProjectionService.catchUpAll()` 메서드를 수정하여, 기존 `gripResult` 투영과 함께 신규 `objectSuccessRate` 투영을 실행하도록 합니다.
    *   기존 `gripResult` 투영 로직은 변경하지 않습니다.

4.  **클라이언트 호환성 보장**:
    *   기존 클라이언트가 `POST /object-success-rate`를 호출할 때, 이 엔드포인트가 v1 로 동작하도록 합니다.
    *   신규 클라이언트나 업데이트된 클라이언트는 `POST /v2/object-success-rate`를 호출하여 집계된 데이터를 받습니다.

5.  **컷오버 (Cutover) 절차**:
    *   **준비 단계**: `read_object_success_rate_v1` 테이블 생성 및 `insight_entity`, `insight_field` 카탈로그 등록.
    *   **병행 운영**: `read_grip_result` (v1) 와 `read_object_success_rate_v1` (v2) 를 동시에 유지하며, 이벤트가 두 모델 모두에 투영됩니다.
    *   **검증**: 신규 엔드포인트 (`/v2/object-success-rate`) 가 정상 작동하는지, 기존 엔드포인트 (`/object-success-rate`) 가 여전히 작동하는지 확인합니다.
    *   **전환 단계**: 모든 데이터가 안정적으로 v2 로 마이그레이션되고 기존 v1 클라이언트 사용이 종료되면, `read_grip_result` 테이블을 삭제하고 `read_object_success_rate_v1` 만 남깁니다. (단, v1 클라이언트 사용이 완전히 종료될 때까지는 v1 을 유지해야 합니다.)

이 전략은 기존 v1 API 클라이언트의 호환성을 보장하면서, 신규 요구사항을 충족하는 v2 API 를 안전하게 도입할 수 있습니다.
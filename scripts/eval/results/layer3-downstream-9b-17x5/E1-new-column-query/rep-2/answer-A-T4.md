기존 v1 API 클라이언트가 깨지지 않도록 하려면 **비파괴적 변경 (Non-breaking Change)** 을 원칙으로 하되, **버전 관리 (API Versioning)** 를 통해 신구 API 를 병행 운영해야 합니다.

구체적인 단계는 다음과 같습니다.

### 1. API 버전 경로 분리 (Routing Separation)
기존 v1 엔드포인트는 절대 수정하지 않고, 신규 기능은 새로운 v2 버전 경로에 배치합니다.
*   **기존 (v1):** `POST /projection/multimodal`, `POST /projection/grip-result`, `POST /projection/insert-all` (유지)
*   **신규 (v2):** `POST /projection/v2/sensor-drift` (신규 추가)

### 2. 코드 변경 전략 (Code Modification Strategy)
*   **기존 로직 무손상:** `src/projection/projection.controller.ts` 에서 기존 라우트 (`/multimodal`, `/grip-result`, `/insert-all`) 에 대한 핸들러 코드는 **변경하지 않습니다**.
*   **신규 로직 추가:** `src/projection/projection.controller.ts` 에 `@Post("/projection/v2/sensor-drift")` 핸들러를 **추가**합니다.
*   **프로젝터 추가:** `src/projection/projection.service.ts` 에 `SensorDriftProjector` 의존성 주입 및 `catchUpSensorDrift()` 메서드를 **추가**합니다. 기존 `catchUpMultimodal`, `catchUpGripResult` 로직은 건드리지 않습니다.

### 3. 마이그레이션 및 컷오버 절차 (Migration & Cutover)
데이터베이스와 인사이트 카탈로그를 단계적으로 업데이트하여, v1 클라이언트가 실행되는 동안 시스템이 정상 작동하도록 합니다.

1.  **DDL 적용 (Database Migration):**
    *   `read_sensor_drift` 테이블 생성 SQL 을 실행합니다.
    *   기존 `read_grip_result`, `read_multimodal` 테이블 구조는 **변경하지 않습니다**.
    *   `insight_entity` 및 `insight_field` 카탈로그 테이블에 `read_sensor_drift` 관련 레코드를 **INSERT**합니다.

2.  **API 컷오버 (API Cutover):**
    *   **v1 클라이언트:** 기존 엔드포인트 (`/projection/multimodal` 등) 를 계속 호출하면 정상적으로 작동합니다.
    *   **v2 클라이언트:** 신규 엔드포인트 (`/projection/v2/sensor-drift`) 를 호출하여 `gripper_temperature` 데이터 조회를 수행합니다.
    *   **백엔드:** 두 버전의 라우트가 동시에 등록되어 있어, 요청 경로에 따라 적절한 핸들러 (`catchUpMultimodal` 또는 `catchUpSensorDrift`) 가 실행됩니다.

### 4. 요약
*   **경로:** `POST /projection/v2/sensor-drift` (신규)
*   **동작:** 기존 v1 엔드포인트는 그대로 유지, 신규 v2 엔드포인트만 추가.
*   **데이터:** 기존 Read Model 테이블은 건드리지 않고, 새 `read_sensor_drift` 테이블만 생성.

이 방식은 v1 클라이언트의 호환성을 보장하면서, 신규 필드 `gripper_temperature` 를 조회할 수 있는 v2 API 를 제공하는 안전한 변경 사항입니다.
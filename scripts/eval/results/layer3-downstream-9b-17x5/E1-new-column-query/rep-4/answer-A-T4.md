기존 v1 API 클라이언트가 깨지지 않도록 하려면 **비파괴적 마이그레이션 (Non-breaking Migration)** 전략을 따르고, **API 버전을 병행 운영**해야 합니다.

구체적인 단계는 다음과 같습니다.

### 1. 신규 Read Model 생성 및 투영 로직 추가 (v1 자산 무손상)
*   **DDL 실행:** `read_grip_sensor_v1` 테이블을 새로 생성합니다. 기존 `read_grip_result` 및 `read_multimodal` 테이블은 건드리지 않습니다.
*   **Projector 등록:** `GripSensorV1Projector` 클래스를 생성하여 이벤트 스토어에서 `GripAttemptRecorded` 이벤트를 구독하고, `gripper_temperature`, `conveyor_speed` 필드를 추출하여 `read_grip_sensor_v1` 테이블로 업로드합니다.
*   **Insight 카드 등록:** `insight_entity` 및 `insight_field` 테이블에 `read_grip_sensor_v1` 관련 카탈로그 정보를 등록합니다.
*   **결과:** 이 단계에서 기존 v1 API (`/projection/grip-result`, `/projection/multimodal`) 는 완전히 작동하며, 신규 필드가 추가된 기존 테이블은 유지됩니다.

### 2. 신규 API 엔드포인트 추가 (v1 호환성 유지)
*   **라우트 추가:** `POST /projection/grip-sensor` 엔드포인트를 추가합니다.
*   **결과:** 기존 클라이언트가 `/projection/grip-result` 등을 호출하는 것은 여전히 정상 작동합니다. 신규 클라이언트나 새로운 기능은 `/projection/grip-sensor` 를 호출하게 됩니다.

### 3. 데이터 적재 및 투영 (Catch-up)
*   **적재:** 신규 이벤트 (payload 에 `gripper_temperature` 포함) 를 적재합니다.
*   **투영:** `ProjectionService` 의 `catchUpGripSensorV1` 메서드를 실행하여 신규 이벤트를 `read_grip_sensor_v1` 테이블로 매핑합니다.
*   **결과:** `read_grip_sensor_v1` 테이블에 데이터가 채워집니다.

### 4. API 컷오버 (v1 → v2)
*   **버전 변경:** API 엔드포인트 경로를 `/projection/grip-sensor` 에서 `/v2/projection/grip-sensor` 로 변경합니다.
*   **결과:**
    *   **기존 v1 클라이언트:** `/projection/grip-sensor` (v1) 로 요청하면 여전히 `read_grip_sensor_v1` 테이블을 조회하므로, `gripper_temperature` 필드를 포함한 데이터를 정상적으로 받을 수 있습니다.
    *   **신규 v2 클라이언트:** `/v2/projection/grip-sensor` 로 요청하여 최신 데이터를 받습니다.
    *   **기존 v1 클라이언트 (grip-result):** `/projection/grip-result` 로 요청하면 `read_grip_result` 테이블을 조회하므로, 기존 로직은 그대로 유지됩니다.

### 요약
1.  **신규 RM 생성:** `read_grip_sensor_v1` 생성 (기존 RM 건드리지 않음).
2.  **신규 API 추가:** `/projection/grip-sensor` 추가 (기존 API 건드리지 않음).
3.  **데이터 채우기:** 신규 RM 에 드리프트 필드 데이터 투영.
4.  **버전 변경:** `/projection/grip-sensor` → `/v2/projection/grip-sensor`.

이 절차로 기존 v1 클라이언트는 `/projection/grip-sensor` (v1) 경로를 계속 사용하며, 신규 필드가 포함된 데이터를 정상적으로 조회할 수 있습니다.
기존 v1 API 클라이언트가 깨지지 않게 하려면 **하위 호환성 (Backward Compatibility)** 을 유지하면서 **신규 v2 기능**을 병행 운영한 후, 검증이 완료된 후에만 **컷오버 (Cutover)** 를 수행해야 합니다.

구체적인 단계는 다음과 같습니다:

### 1. 병행 운영 단계 (Parallel Operation)
DDL 변경과 API 라우트 추가를 동시에 수행하여, 기존 v1 클라이언트와 새 v2 클라이언트가 모두 정상 작동하도록 합니다.

*   **DB 스키마 변경 (DDL):** `read_grip_result` 테이블을 삭제하지 않고, 새 테이블 `read_grip_result_v2` 를 생성합니다. 기존 v1 클라이언트가 `read_grip_result` 를 참조하므로 기존 테이블은 무손상입니다.
    ```sql
    CREATE TABLE read_grip_result_v2 (
        scene_key varchar NOT NULL,
        attempt_num smallint NOT NULL,
        -- ... 나머지 필드 ...
        CONSTRAINT pk_grip_result_v2 PRIMARY KEY (scene_key, attempt_num)
    );
    ```
*   **API 라우트 추가:** 기존 `/grip-result` (v1) 라우트를 유지하고, 새 `/grip-result-v2` 라우트를 추가합니다.
    ```typescript
    // src/projection/projection.controller.ts
    @Post("/grip-result") // 기존 v1 엔드포인트 유지
    gripResult(): Promise<ProjectionResult> { ... }

    @Post("/grip-result-v2") // 새 v2 엔드포인트 추가
    gripResultV2(): Promise<ProjectionResult> { ... }
    ```
*   **프로젝터 추가:** `GripResultV2Projector` 를 등록하여 이벤트 소싱을 통해 `read_grip_result_v2` 를 업데이트합니다.

### 2. 데이터 정합성 검증 단계 (Validation)
컷오버 전, 두 버전의 데이터가 논리적으로 일치하는지 확인합니다.

*   **Catch-up 실행:** `catchUpGripResultV2()` 를 실행하여 새 Read Model 에 데이터를 투영합니다.
*   **정합성 확인:** `read_grip_result` (v1) 와 `read_grip_result_v2` (v2) 의 `scene_key` 와 `attempt_num` 을 기준으로 조인하여 필드 값을 비교합니다.
    *   v1: `grip3dPose` (JSON)
    *   v2: `z_avg`, `z_min`, `z_max`, `grip_outlier_flag`
    *   **비교 로직:** v2 의 `z_avg` 를 계산하여 v1 의 `grip3dPose` 에서 추출한 평균 Z 값과 `0.005m` 이내인지 확인합니다.
    *   **이상 탐지:** v2 의 `grip_outlier_flag` 가 `1` 인 경우, v1 의 데이터에서 같은 `(scene_key, attempt_num)` 에 대해 `grip3dPose` Z 평균 간 차이가 `0.10m` 를 초과하는지 확인합니다.

### 3. 컷오버 단계 (Cutover)
검증이 완료되면, 기존 v1 자산을 점진적으로 v2 로 대체합니다.

*   **v1 자산 제거:** `read_grip_result` 테이블을 삭제하고, `GripResultProjector` 를 제거합니다.
    ```sql
    DROP TABLE read_grip_result;
    ```
*   **API 변경:** `/grip-result` 라우트를 `/grip-result-v2` 로 리네이밍하거나, 클라이언트 측에서 엔드포인트를 변경하도록 안내합니다. (문맥상 새 엔드포인트만 사용하도록 전환)

### 요약
1.  **새 테이블 생성** (`read_grip_result_v2`) 및 **새 라우트 추가** (`/grip-result-v2`).
2.  **기존 테이블/라우트 유지** (`read_grip_result`, `/grip-result`).
3.  **데이터 동기화 및 정합성 검증** (v1 vs v2 필드 매핑 확인).
4.  **검증 통과 후 기존 자산 삭제** (`DROP TABLE read_grip_result`) 및 **라우트 변경**.

이 절차는 "v1 자산 무손상" 제약 조건을 만족하며, 클라이언트 호환성을 보장합니다.
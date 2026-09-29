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
*   **프로젝터 추가:** `GripResultV2Projector` 를 등록하여 이벤트 소싱 시 새 Read Model 을 생성합니다.

### 2. 데이터 정합성 검증 단계 (Validation)
컷오버 전, 두 버전의 데이터가 논리적으로 일치하는지 확인합니다.

*   **Catch-up 실행:** `catchUpGripResultV2()` 를 실행하여 새 Read Model 에 데이터를 투영합니다.
*   **정합성 확인:** `read_grip_result` (v1) 와 `read_grip_result_v2` (v2) 의 `scene_key` 와 `attempt_num` 을 기준으로 조인하여 필드 값을 비교합니다.
    *   v1: `grip3dPose` (JSON)
    *   v2: `z_avg`, `z_min`, `z_max`, `grip_outlier_flag` (Scalar)
    *   **비교 로직:** v2 의 `z_avg` 를 계산하여 v1 의 `grip3dPose` 에서 추출한 평균 Z 값과 `0.005m` 이내의 오차 범위인지 확인합니다.
    *   **이상 탐지:** v2 의 `grip_outlier_flag` 가 `1` 인 경우, v1 의 데이터에서 같은 `(scene_key, attempt_num)` 에 대해 `suddenJump_withinScene` 규칙이 위반되었는지 (예: 이전 시전 대비 Z 평균 변화량 > 0.10m) 확인합니다.

### 3. 컷오버 단계 (Cutover)
검증이 완료되면, 기존 v1 인프라를 새 v2 로 전환합니다.

*   **v1 자산 제거:** `read_grip_result` 테이블 삭제 및 관련 v1 프로젝트터, 컨트롤러 라우트 제거.
*   **v2 자산 활성화:** `read_grip_result_v2` 가 유일한 Read Model 이 됨. `/grip-result-v2` 가 유일한 엔드포인트가 됨.

### 요약
1.  **DDL:** `read_grip_result_v2` 생성 (기존 `read_grip_result` 유지).
2.  **API:** `/grip-result` (v1) 와 `/grip-result-v2` (v2) 동시 노출.
3.  **검증:** 두 테이블 데이터 정합성 (Z 평균 계산 일치 여부) 확인.
4.  **컷오버:** v1 삭제 및 v2 만 남김.

이 절차는 "v1 자산 무손상" 및 "식별자 전체 단어" 제약 조건을 준수하며, 클라이언트 호환성을 보장합니다.
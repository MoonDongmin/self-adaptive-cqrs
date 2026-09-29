제공된 자료 (로그 및 스키마) 에 따르면, 현재 시스템은 `insert.file.failed` 로직이 존재하며, Zod 검증 실패 시 해당 파일에 대한 이벤트는 생성되지 않고 (또는 실패 로그만 남김), `insert.batch.done` 로 즉시 배치 완료를 기록하고 있습니다.

이 상황에서 **v1 API 클라이언트가 깨지지 않게 하려면**, v1 API 가 기대하는 데이터 (성공된 적재 결과) 가 실패한 파일에 대해 **생성되지 않거나, 기존 로직과 충돌하지 않는 상태**를 유지해야 합니다.

자료에 명시된 사실 (Zod 거부 시 `insert.file.failed` 발생, `insert.batch.done` 즉시 완료) 만 근거로, 다음과 같은 변경 사항이 필요합니다.

### 1. 버전 경로 (Versioning Strategy)
*   **변경 사항**: v1 API 엔드포인트에 버전 파라미터를 추가하거나, 새 엔드포인트를 생성합니다.
*   **구체적 방법**:
    *   기존: `POST /api/v1/batch-insert`
    *   변경: `POST /api/v1/batch-insert` (기존 유지) 와 `POST /api/v2/batch-insert` (신규) 를 운영합니다.
    *   **이유**: v1 API 는 실패한 파일에 대해 `read_grip_result` 또는 `read_multimodal` 테이블에 레코드를 생성하지 않거나, `batch_insert` 응답에서 실패한 파일 목록을 포함하지 않는 것으로 보입니다. v2 API 는 실패한 파일에 대한 상세 에러 리포트를 포함하도록 설계해야 하므로, 클라이언트 호환성을 위해 **병행 운영**이 필수적입니다.

### 2. 신구 병행 운영 (Parallel Operation)
*   **변경 사항**: 두 버전의 API 를 동시에 지원하며, 데이터 저장 전략을 분리합니다.
*   **구체적 방법**:
    *   **v1 API 로직**: 기존 `insert.file.failed` 로직을 그대로 유지합니다. 실패한 파일에 대해서는 이벤트 스토어에 `insert.file.failed` 이벤트만 기록하고, Read Model (`read_grip_result`, `read_multimodal`) 에는 해당 `(scene_key, attempt_num)` 키를 가진 레코드를 **생성하지 않습니다**.
    *   **v2 API 로직**: 실패 처리를 강화합니다. `insert.file.failed` 이벤트가 발생하더라도, 해당 `(scene_key, attempt_num)` 키를 가진 Read Model 레코드를 **`status: 'failed'`** 또는 **`error_reason: 'zod_validation_failed'`** 등의 필드를 포함하여 **생성**합니다.
    *   **이유**: v1 API 클라이언트는 실패한 파일에 대한 데이터 조회를 기대하지 않으므로, v1 경로에서는 데이터가 생성되지 않아도 깨지지 않습니다. v2 API 클라이언트는 실패 원인을 알기 위해 데이터가 생성되기를 원하므로, v2 경로에서는 실패 데이터도 생성해야 합니다.

### 3. 마이그레이션 및 컷오버 절차 (Migration & Cutover)
*   **변경 사항**: v1 클라이언트 사용 기간 동안 v2 로직을 점진적으로 적용하고, 최종적으로 v1 로직을 제거합니다.
*   **구체적 단계**:
    1.  **v2 API 도입**: `POST /api/v2/batch-insert` 엔드포인트를 추가합니다. 이 엔드포인트는 `insert.file.failed` 로직을 실행한 후, 실패한 파일에 대한 Read Model 레코드를 `status='failed'`로 생성하도록 수정합니다.
    2.  **Read Model 스키마 확장**: `read_grip_result` 및 `read_multimodal` 테이블에 `status` (varchar, 예: 'pending', 'succeeded', 'failed') 와 `error_reason` (text, 예: 'zod_validation_failed') 필드를 추가합니다.
    3.  **v1 API 호환성 유지**: `POST /api/v1/batch-insert` 엔드포인트는 v2 로직과 동일하게 동작하되, **실패한 파일에 대한 Read Model 생성을 건너뛰는 로직**을 유지합니다. (또는 v1 전용 로직으로 `status` 필드를 생략하도록 합니다.)
    4.  **데이터 마이그레이션**: 기존 v1 로직으로 인해 생성되지 않았던 실패 파일에 대한 데이터가 필요한 경우, 백업된 로그 (`insert.file.failed`) 를 분석하여 `read_grip_result` 및 `read_multimodal` 테이블에 `status='failed'`로 수동 또는 스크립트로 백필 (backfill) 합니다.
    5.  **v1 API 제거**: v1 클라이언트 사용이 완전히 종료되고, 모든 클라이언트가 v2 API 를 사용하도록 전환된 후, v1 API 엔드포인트와 v1 전용 Read Model 생성 로직을 제거합니다.

### 요약
*   **버전 경로**: `/api/v1` (실패 시 데이터 생성 안 함) 와 `/api/v2` (실패 시 데이터 생성 포함) 병행.
*   **핵심 변경**: v2 API 에서 `insert.file.failed` 발생 시에도 Read Model 에 `status='failed'` 레코드 생성.
*   **절차**: v2 API 추가 -> 스키마 확장 -> v1 로직 수정 (실패 시 생성 생략) -> 데이터 백필 -> v1 제거.

이 절차는 v1 클라이언트가 실패한 파일에 대한 데이터를 기대하지 않으므로 깨지지 않게 하며, v2 클라이언트는 실패 원인을 확인할 수 있게 합니다.
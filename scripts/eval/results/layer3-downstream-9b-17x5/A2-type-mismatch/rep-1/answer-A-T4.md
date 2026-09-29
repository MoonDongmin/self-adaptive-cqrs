제공된 자료에 따르면, 이번 변경은 **Read Model 스키마 수정 (DDL)**이나 **API 엔드포인트 변경**이 아닌, **운영 절차 (Monitoring Alert)**와 **데이터 무해화 검증 (Verification Query)**에 국한됩니다.

자료의 'Decision Outcome'에 따라 "거절 유지 + 원천 데이터 수정 요청"이 선택되었으며, 'Read Model 생성 SQL' 섹션에서는 "신규 Read Model DDL 불필요, 결함 데이터 무해화가 조치다"라고 명시되어 있습니다. 따라서 기존 v1 API 클라이언트가 깨지지 않도록 하려면 **코드 변경 없이 운영 단계의 모니터링 및 검증 로직만 추가**하면 되며, API 버전 경로 변경이나 마이그레이션 절차는 불필요합니다.

구체적 단계는 다음과 같습니다.

### 1. 버전 경로 (Versioning Strategy)
*   **전략**: **Backward Compatibility (기존 호환성 유지)**
*   **이유**: 자료의 'Decision Outcome'에 따라 Read Model 스키마 변경 (DDL) 이나 API 컷오버는 수행하지 않습니다. 기존 `read_grip_result` 및 `read_multimodal` 테이블 구조와 API 응답 형식은 그대로 유지되므로, API 버전 경로 (`/api/v1/...`) 를 변경할 필요가 없습니다.

### 2. 신구 병행 운영 (Parallel Operation)
*   **전략**: **불필요 (No Parallel Operation Needed)**
*   **이유**:
    *   **Read Model**: `read_grip_result` 테이블의 스키마 (DDL) 를 변경하지 않으므로, 기존 테이블 구조를 그대로 사용합니다.
    *   **API**: API 엔드포인트와 스키마가 불변이므로, 새 버전 API 를 병행 구동할 필요가 없습니다.
    *   **프로젝터**: `GripResultProjector` 로직은 `parse` 실패 시 예외를 던져 이벤트 적재를 막는 방식 (격리) 을 유지하므로, 프로젝트 코드를 변경하지 않고도 정상 동작합니다.

### 3. 마이그레이션 및 컷오버 절차 (Migration & Cut-over)
*   **전략**: **데이터 무해화 검증 및 모니터링 알림 (Data Containment & Alerting)**
*   **이유**: 자료의 'Decision Drivers'와 'Considered Options' 중 선택된 "거절 유지 + 원천 데이터 수정 요청"에 따라, DB 마이그레이션 스크립트 실행이나 API 배포 없이도 다음 두 가지 작업을 수행해야 합니다.

#### 단계 A: 무유입 검증 (Verification Query)
적재 실패로 인해 이벤트 스토어 (Event Store) 에 데이터가 유입되지 않았는지 확인하여, Read Model 에 잘못된 데이터가 유입되는지 (Phantom Data) 확인합니다.
*   **실행 시점**: Toy-data 적재 (`insert.batch.done`) 직후 또는 정기적인 건강 상태 체크 (Health Check) 시점.
*   **SQL**: 자료의 'Read Model 생성 SQL' 섹션에 정의된 쿼리를 실행합니다.
    ```sql
    SELECT count(*) AS rejected_event_count 
    FROM event_store 
    WHERE (stream_id, attempt_num) IN (
        ('grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02002', 1), 
        ('grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02003', 1)
    );
    ```
*   **기대 결과**: `rejected_event_count` 가 `0` 이어야 합니다. 만약 `0` 이 아니면, 해당 stream_id 와 attempt_num 에 대한 이벤트가 유입되었음을 의미하므로 **Read Model Corruption**이 발생했음을 뜻합니다.

#### 단계 B: 모니터링 알림 및 소스 수정 요청 (Monitoring & Source Correction)
*   **조건**: `insert.file.failed` 로그가 발생했을 때 (Zod 검증 실패).
*   **동작**:
    1.  **Alert Trigger**: `InsertService` 에서 `insert.file.failed` 를 감지하면, 모니터링 시스템 (예: Prometheus Alertmanager, Slack Webhook 등) 에 "원천 데이터 Zod 거절 감지 → 소스 수정 요청" 알림을 발송합니다.
    2.  **Action**: 운영자가 해당 알림을 확인하여, 원천 데이터 (Toy-data 파일 생성 스크립트 등) 를 수정하고 재적재 (Re-upload) 하도록 요청합니다.
    3.  **격리 유지**: 수정되기 전까지 해당 파일의 데이터는 시스템에 유입되지 않아야 하므로, `insert.file.failed` 로 인해 이벤트 스토어에 적재되지 않도록 격리됩니다.

### 요약
기존 v1 API 클라이언트를 깨치지 않게 하려면 **코드 배포 없이** 다음과 같은 운영 프로세스만 강화하면 됩니다.

1.  **API 변경 없음**: 기존 `/api/v1/read_grip_result` 등 엔드포인트를 그대로 사용.
2.  **DB 스키마 변경 없음**: `read_grip_result` 테이블 구조를 건드리지 않음.
3.  **필수 조치**:
    *   `insert.file.failed` 로그 발생 시 **모니터링 알림** 발송.
    *   적재 완료 후 **SQL 검증 쿼리** 실행하여 이벤트 유입 여부 확인 (0 개여야 함).
    *   검증 실패 시 **인간 승인 후** 원천 데이터 수정 파이프라인 연동.
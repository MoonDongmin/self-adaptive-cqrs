제공된 자료에 따르면, 이번 변경은 **Read Model 생성 SQL**이 필요하지 않으며, 기존 v1 API 클라이언트와 Read Model 스키마에 **변경 사항이 없습니다**.

따라서 API 클라이언트를 깨뜨리지 않기 위해 수행해야 할 절차는 **단순히 변경 사항이 없는 것을 확인하고, 기존 v1 API 를 그대로 유지 (No-op)**하는 것입니다. 구체적인 단계는 다음과 같습니다.

### 1. 변경 사항 확인 (Analysis)
- **Read Model 스키마 변경 여부**: `read_grip_result` 및 `read_multimodal` 테이블 구조는 유지됩니다.
- **API 엔드포인트 변경 여부**: `apiVersion` 필드가 `from: null`, `to: null`로 정의되어 있어, API 버전이 변경되지 않습니다.
- **DDL 실행 필요 여부**: 권고 사항 (Decision Outcome) 에 따라 "격리(containment) SQL — 신규 Read Model DDL 불필요, 결함 데이터 무해화가 조치다"로 결정되었습니다. 따라서 새로운 테이블을 생성하거나 기존 테이블을 수정하는 DDL은 실행하지 않습니다.

### 2. 마이그레이션 및 컷오버 절차 (Migration & Cutover)
기존 v1 API 클라이언트가 깨지지 않게 하려면, **아무런 코드 배포나 데이터베이스 스키마 변경 없이 운영 상태를 유지**해야 합니다.

1.  **코드 배포 (Code Deployment)**:
    - `src/insert/dto/toy-data.dto.ts`의 Zod 스키마 (`cody`, `fx` 필드) 를 수정하거나, `insert.file.failed` 로직을 변경하는 코드는 배포하지 않습니다.
    - `src/projection/projector/multimodal.projector.ts`의 로직도 변경하지 않습니다.
    - 결과적으로 API 응답 구조와 Read Model 조회 결과는 기존 v1 클라이언트와 호환됩니다.

2.  **데이터베이스 변경 (Database Change)**:
    - **DDL 실행 금지**: `CREATE TABLE`, `ALTER TABLE` 등의 DDL 스크립트는 실행하지 않습니다.
    - **데이터 수정**: `INSERT` 또는 `UPDATE`를 통해 결함 데이터를 직접 수정하지 않습니다.
    - **검증 SQL 실행**: 제공된 격리 SQL (`SELECT count(*) ...`) 은 **조회용 쿼리**이므로, 결과를 확인하여 "이벤트가 유입되지 않았음을 확인"하는 단계로만 수행합니다. 이 쿼리는 DDL이 아니므로 v1 API 호환성에 영향을 주지 않습니다.

3.  **인간 승인 (Human-in-the-loop)**:
    - 만약 추후 DDL 실행이 필요하다면 (현재는 필요 없음), 인간 승인을 받아야 합니다.
    - 현재 단계에서는 "변경 없음"이라는 결정을 인간 승인 프로세스에 기록하면 됩니다.

4.  **원천 데이터 수정 요청 (Data Fix Request)**:
    - `insert.file.failed` 로직이 유지되므로, Zod 검증에 실패한 원천 파일 (`..._02024_01_20230923.json`, `..._02025_01_20230923.json`) 에 `cody` 및 `fx` 필드의 값을 수동으로 수정하거나, 해당 파일을 삭제/재적재해야 합니다.
    - 이 작업은 데이터 레이어의 수정이므로, API 클라이언트나 Read Model 스키마에는 영향을 주지 않습니다.

### 3. 결론 (Conclusion)
기존 v1 API 클라이언트를 깨뜨리지 않으려면 **아무런 변경 사항 (Code Change, DDL, Schema Change) 을 적용하지 않고, 현재 상태를 유지**하는 것이 정답입니다.

- **버전 경로**: `v1` 유지
- **신구 병행 운영**: 불필요 (변경 사항 없음)
- **마이그레이션**: 불필요
- **컷오버**: 불필요 (변경 사항 없음)

**실행할 조치**:
1.  격리 SQL 을 실행하여 `event_store` 에 해당 `stream_id` 와 `attempt_num` 의 이벤트가 존재하지 않음을 확인합니다.
2.  "변경 없음 (No Change)"으로 승인합니다.
3.  운영팀에게 원천 데이터 수정을 요청합니다.
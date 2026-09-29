제공된 자료에 따르면, 이번 변경은 **Read Model 생성 (DDL)** 이나 **API 컷오버** 를 포함하지 않으며, 기존 스키마와 구조를 유지하고 결함 데이터를 격리하는 '무유입 검증' 절차만 수행하는 것입니다. 따라서 기존 v1 API 클라이언트는 데이터 구조 변화 없이 정상 작동할 것입니다.

구체적인 단계는 다음과 같습니다.

### 1. 버전 경로 (Versioning Strategy)
*   **전략**: **Backward Compatibility (기존 호환성 유지)**
*   **이유**: 자료의 "Decision Outcome"에 "Zod 스키마 완화 금지", "Read Model 구조 정성성 유지", "API 버전 변경 최소화"가 명시되어 있습니다. 또한 "Non-Goals"에 "신규 추적 테이블 생성"이 포함되어 있어, 새로운 API 엔드포인트를 만들거나 기존 엔드포인트의 응답 스키마를 변경하지 않습니다.
*   **구체적 경로**:
    *   기존 API 엔드포인트 (예: `/api/v1/read-grip-result`, `/api/v1/read-multimodal`) 를 그대로 사용합니다.
    *   응답 스키마 (Response Schema) 에 필드가 추가되거나 타입이 변경되지 않으므로, 클라이언트 측 코드 수정이 불필요합니다.
    *   만약 추후에 `read_grip_result` 또는 `read_multimodal` 테이블의 스키마를 변경해야 한다면, API 경로에 버전을 붙이는 방식 (예: `/api/v1/...` vs `/api/v2/...`) 을 고려해야 하지만, **이번 변경에서는 해당 단계가 필요 없습니다.**

### 2. 신구 병행 운영 (Parallel Operation)
*   **필요 여부**: **불필요**
*   **이유**: 이번 변경은 기존 Read Model (`read_grip_result`, `read_multimodal`) 의 스키마를 변경하거나, 새로운 테이블을 생성하는 것이 아닙니다. 단순히 event_store 에 결함 이벤트가 유입되지 않았음을 확인하는 조회 쿼리만 실행되므로, 읽기 전용 서비스 (Read Side) 와 쓰기 전용 서비스 (Write Side) 간의 데이터 흐름이 기존과 동일하게 유지됩니다.
*   **동작**:
    *   기존 API 호출 시, 결함 파일에 해당하는 `(scene_key, attempt_num)` 조합의 데이터는 event_store 에 존재하지 않으므로, 해당 키로 조회하면 **404 Not Found** 또는 **빈 배열 (Empty List)** 을 반환하게 됩니다.
    *   정상 파일에 해당하는 데이터는 기존과 동일하게 조회됩니다.
    *   클라이언트는 "데이터가 없음"이라는 결과를 기존 로직으로 처리하면 되므로, 별도의 병행 로직이 필요 없습니다.

### 3. 마이그레이션 및 컷오버 절차 (Migration & Cutover)
*   **DDL 실행**: **실행 불필요**
    *   자료의 "Recommendation" 섹션에서 "Read Model DDL 불필요, 결함 데이터 무해화가 조치다"라고 명시되어 있습니다.
    *   "격리 (containment) SQL"은 `SELECT` 쿼리이며, 테이블 생성 (`CREATE TABLE`) 이나 스키마 변경 (`ALTER TABLE`) 을 포함하지 않습니다.
*   **API 컷오버**: **불필요**
    *   "Decision Outcome"에 "API 버전 변경 없음"이 명시되어 있습니다.
    *   API 엔드포인트의 URL 경로와 응답 형식이 변경되지 않으므로, API Gateway 설정 변경이나 클라이언트 재컴파일이 필요 없습니다.
*   **필수 실행 절차**: **무유입 검증 SQL 실행**
    *   제공된 "격리 (containment) SQL"을 실행하여, Zod 검증 실패로 인해 event_store 에 실제로 데이터가 유입되지 않았음을 DB 레벨에서 확인해야 합니다.
    *   **SQL 코드**:
        ```sql
        SELECT count(*) AS rejected_event_count 
        FROM event_store 
        WHERE (stream_id, attempt_num) IN (
            ('grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02024', 1), 
            ('grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02025', 1)
        );
        ```
    *   **검증 기준**: `rejected_event_count` 가 `0` 이어야 합니다. 만약 0 이 아니면, event_store 에 잘못된 데이터가 유입되어 있어 즉시 수정 (Delete) 이 필요하며, 이는 "Human-in-the-loop" 승인이 필요합니다.

### 요약
기존 v1 API 클라이언트를 깨뜨리지 않으려면 **아무것도 변경하지 않고** (No Breaking Changes), 단순히 **결함 파일에 대한 event_store 에의 유입 여부를 확인하는 검증 쿼리만 실행**하면 됩니다. API 응답은 해당 키에 대한 데이터가 없을 때 빈 결과를 반환할 뿐, 스키마 불일치로 인한 에러는 발생하지 않습니다.
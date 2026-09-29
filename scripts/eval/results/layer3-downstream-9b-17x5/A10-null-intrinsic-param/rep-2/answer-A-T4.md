제공된 자료에 따르면, 이번 변경은 **Read Model 생성 SQL**이 필요하지 않으며, 기존 v1 자산 (테이블/엔드포인트/프로젝터) 을 무손상 상태로 유지하는 **격리 (Containment)** 전략을 따릅니다.

자료의 'Decision Outcome'은 "거절 유지 + 원천 데이터 수정 요청"이며, 'Read Model 생성 SQL' 섹션에서는 "신규 Read Model DDL 불필요, 결함 데이터 무해화가 조치다"라고 명시되어 있습니다. 따라서 DDL 실행이나 API 컷오버는 수행하지 않고, **기존 v1 API 클라이언트가 깨지지 않도록 보장하는 절차**는 다음과 같습니다.

### 1. 버전 경로 (Versioning Strategy)
*   **전략**: **Backward Compatibility (기존 호환성 유지)**
*   **이유**: 자료의 'Non-Goals'에 "신규 추적용 테이블 생성"이 명시되어 있고, 'Decision Outcome'이 기존 로직 유지 (Zod 스키마 완화 없음) 이므로, 새로운 API 엔드포인트나 버전 (예: `/v2`) 을 생성하지 않습니다.
*   **절차**:
    1.  기존 v1 API 엔드포인트 (`/api/v1/read_grip_result`, `/api/v1/read_multimodal` 등) 를 **변경하지 않습니다**.
    2.  기존 v1 API 엔드포인트의 **반응 구조 (Response Schema) 를 변경하지 않습니다**.
    3.  결과적으로 기존 클라이언트는 기존 엔드포인트를 호출하여 기존 스키마에 맞는 데이터를 계속 받을 수 있습니다.

### 2. 실행 단계 (Execution Steps)

#### 단계 1: 무유입 검증 (Verification)
*   **목적**: Zod 검증으로 인해 event_store 에 데이터가 유입되지 않았음을 SQL 로 확인하여, Read Model 에 데이터가 추가되지 않았음을 보장합니다.
*   **SQL 실행**:
    ```sql
    SELECT count(*) AS rejected_event_count 
    FROM event_store 
    WHERE (stream_id, attempt_num) IN (('grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02024', 1), ('grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02025', 1));
    ```
*   **기대 결과**: `rejected_event_count` 가 `0` 이어야 합니다. 만약 0 이 아니면, event_store 에 잘못된 데이터가 유입되어 v1 API 가 깨질 수 있으므로 즉시 중단해야 합니다.

#### 단계 2: 원천 데이터 수정 요청 (Human-in-the-loop)
*   **목적**: Zod 검증이 거절된 원천 JSON 파일 (`camera_intrinsic_param.cody`, `camera_intrinsic_param.fx`) 에 null 값이 포함되어 있어, 시스템이 정상적으로 작동하려면 원천 데이터를 수정해야 합니다.
*   **절차**:
    1.  개발팀 (Toy-Data 생성자) 에게 해당 파일 (`반려동물용품_CR01_강아지공룡알장난감_02024_01_20230923.json`, `반려동물용품_CR01_강아지공룡알장난감_02025_01_20230923.json`) 의 `camera_info.camera_intrinsic_param` 필드에서 `cody` 와 `fx` 를 **숫자 (number) 타입**으로 수정하여 다시 제출하도록 요청합니다.
    2.  **DDL 실행 금지**: 자료의 제약 조건 ("DDL 실행·API 컷오버는 인간 승인 후에만") 에 따라, 원천 데이터 수정이 완료되기 전에는 **아무런 DDL (테이블 변경) 도 실행하지 않습니다**.

#### 단계 3: 재투영 (Re-projection) 및 정상화
*   **목적**: 원천 데이터가 수정되어 다시 적재되면, event_store 에 정상 이벤트가 추가되고, Projection 로직이 실행되어 Read Model 에 데이터가 정상적으로 추가됩니다.
*   **절차**:
    1.  수정된 Toy-Data 파일을 다시 `insert.batch.start` 로 적재합니다.
    2.  Zod 검증이 통과하면 이벤트가 event_store 에 추가되고, Projection (`multimodal-projector`) 이 실행되어 `read_grip_result` 및 `read_multimodal` 테이블에 새로운 행이 INSERT 됩니다.
    3.  이 시점부터 v1 API 클라이언트는 수정된 데이터를 정상적으로 조회할 수 있게 됩니다.

### 요약
기존 v1 API 클라이언트를 깨치지 않으려면 **아무런 API 변경도, DDL 실행도 하지 않는 상태**를 유지해야 합니다. 대신 **SQL 로 event_store 에 데이터가 없는지 확인**하고, **인간이 원천 데이터를 수정**하게 한 후, **자연스럽게 데이터가 다시 유입되어 Read Model 이 채워지는 것**이 유일한 안전한 변경 절차입니다.
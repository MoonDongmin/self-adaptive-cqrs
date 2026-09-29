제공된 자료에 따르면, 이번 변경은 **Read Model 테이블 구조나 API 엔드포인트의 명칭을 변경하지 않으며**, 단순히 **Zod 스키마의 엄격성을 유지**하고 **원천 데이터 (JSON 파일) 에 null 값을 보충**하여 적재 성공을 유도하는 '거절 유지 및 원천 데이터 수정' 전략을 선택했습니다.

따라서 기존 v1 API 클라이언트는 현재와 동일한 엔드포인트 (`/api/v1/...`) 와 동일한 요청/응답 스키마를 사용해도 정상적으로 작동하며, 데이터 파싱 오류는 원천 데이터 수정 시점에 해결되므로 API 레벨의 호환성 문제는 발생하지 않습니다.

구체적인 단계별 절차는 다음과 같습니다.

### 1. 버전 경로 전략: v1 유지 (Backward Compatibility)
*   **이유**: 자료의 "Decision Outcome"에 "Read Model 컬럼 추가/수정"과 "API 버전 영향이 발생하지"한다고 명시되어 있습니다. Read Model 테이블명은 `read_` 접두어와 스네이크 케이스를 유지하며, API 엔드포인트 명칭도 변경하지 않으므로, 기존 v1 클라이언트는 추가적인 버전 경로 (`/api/v2/...`) 를 만들 필요가 없습니다.
*   **조치**: 기존 `/api/v1/read_grip_result` 및 `/api/v1/read_multimodal` 경로를 그대로 사용합니다.

### 2. 신구 병행 운영: 불필요
*   **이유**: 데이터 스키마 (Read Model) 와 API 스키마가 변경되지 않으므로, 새 버전 API 를 띄워 병행 운영하는 단계는 생략됩니다.
*   **조치**: 현재 운영 중인 v1 API 를 그대로 유지합니다.

### 3. 마이그레이션 및 컷오버 절차: 원천 데이터 수정 (Human-in-the-loop)
*   **이유**: "DDL 실행·API 컷오버는 인간 승인 후에만"이라는 제약 조건과, "Decision Outcome"이 "원천 데이터 수정 요청"이기 때문입니다. SQL DDL 실행은 불필요합니다 (자료 2. 절 참조).
*   **단계**:
    1.  **검증 (Verification)**:
        *   제공된 자료의 "격리 (containment) SQL"을 실행하여, Zod 가 거절하여 event_store 에 실제로 유입되지 않았음을 확인합니다.
        ```sql
        SELECT count(*) AS rejected_event_count FROM event_store 
        WHERE (stream_id, attempt_num) IN (('grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02024', 1), ('grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02025', 1));
        ```
        *   `rejected_event_count` 가 `0` 이어야 합니다. (자료에 따르면 이미 0 이 예상됨)
    2.  **인간 승인 (Human-in-the-loop)**:
        *   운영팀/데이터 엔지니어에게 "원천 JSON 파일 (`반려동물용품_CR01_강아지공룡알장난감_02024_01_20230923.json`, `...02025_01_20230923.json`) 의 `camera_intrinsic_param.cody` 와 `fx` 필드를 null 이 아닌 숫자 값으로 수정해달라"는 요청서를 제출합니다.
        *   DDL 변경이 없으므로 DB 마이그레이션 승인 절차는 생략됩니다.
    3.  **원천 데이터 수정 (Data Fix)**:
        *   승인 후, 해당 toy-data JSON 파일들을 수정하여 Zod 스키마 (`z.number()`) 를 통과할 수 있도록 `cody` 와 `fx` 필드에 유효한 숫자 값을 채웁니다.
    4.  **재적재 (Re-load)**:
        *   수정된 파일을 다시 적재 프로세스 (`insert.batch.start`) 를 통해 시스템에 로드합니다.
        *   이번에는 `insert.file.failed` 로그가 발생하지 않고 `insert.file.ok` 로 정상적으로 이벤트가 event_store 에 append 됩니다.
    5.  **자동 복구 (Auto-Recovery)**:
        *   Projection (multimodal-projector) 은 event_store 에 이벤트가 유입되자마자 자동으로 catch-up 을 재시작하여 Read Model (`read_grip_result`, `read_multimodal`) 을 최신 상태로 업데이트합니다.
        *   결과적으로, 해당 scene_key/attempt_num 에 대한 Read Model 행이 정상적으로 생성됩니다.

### 요약
기존 v1 API 클라이언트를 깨뜨리지 않으려면 **API 버전 경로를 변경하지 않고**, **SQL DDL 변경 없이**, **인간 승인을 거쳐 원천 JSON 파일을 수정하고 재적재**하는 과정만 수행하면 됩니다.
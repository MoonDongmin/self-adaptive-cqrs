제공된 자료에 따르면, 이번 변경은 **Read Model 스키마 수정**이나 **DDL 실행**이 아닌, **원천 데이터 (Toy-Data) 의 Zod 검증 실패로 인한 적재 차단**을 유지하는 것입니다.

자료의 'Decision Outcome' 섹션에서 "Zod 스키마 완화 금지", "기본값/더미값 주입 금지", "Read Model 컬럼 추가/수정 금지"가 명시되어 있으며, 'Decision Drivers'에서도 "Read Model 구조는 무변"으로 결정되었습니다. 따라서 Read Model 테이블 (`read_grip_result`, `read_multimodal`) 의 스키마나 구조를 변경하는 SQL 은 생성할 수 없습니다.

API 버전 변경이 필요 없는 이유와 구체적인 절차는 다음과 같습니다.

### 1. 버전 경로 전략: 변경 없음 (No Version Change)
*   **근거**: 자료의 'Decision Outcome'에 따라 "Zod 스키마 완화"와 "Read Model 스키마·엔드포인트 무변 유지"가 최종 결정입니다.
*   **결과**: 기존 v1 API 클라이언트는 현재 스키마와 엔드포인트 구조를 그대로 사용하므로, API 버전 (예: `/api/v1/...`) 을 올릴 필요가 없습니다.

### 2. 신구 병행 운영: 불필요함
*   **근거**: Read Model 구조가 변경되지 않으므로, 새로운 스키마를 위한 새 엔드포인트를 만들거나 기존 엔드포인트를 병행하는 작업이 없습니다.
*   **결과**: 기존 v1 엔드포인트를 그대로 유지합니다.

### 3. 마이그레이션 및 컷오버 절차: 원천 데이터 수정 요청
*   **근거**: 'Decision Outcome'의 트레이드오프 "(−) 원천 데이터 수리 지연 시 해당 scene/attempt 투영 가용이 발생"과 "거절 유지 + 원천 데이터 수정 요청 (권장)"에 따릅니다.
*   **절차**:
    1.  **격리 확인**: 제공된 자료의 'Containment SQL'을 실행하여 Zod 거절로 인해 `event_store` 에 해당 이벤트가 유입되지 않았음을 확인합니다.
        ```sql
        SELECT count(*) AS rejected_event_count FROM event_store WHERE (stream_id, attempt_num) IN (('grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02024', 1), ('grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02025', 1));
        ```
        *기대값: 0 (이벤트가 유입되지 않았음을 증명)*
    2.  **Human-in-the-loop 승인**: 위 SQL 쿼리 결과가 기대값과 일치함을 확인한 후, DDL 실행이나 API 컷오버를 승인합니다. (이 단계에서 실제 DDL은 없으므로 승인 절차만 수행)
    3.  **원천 데이터 수정 요청**: 개발팀에 `src/insert/dto/toy-data.dto.ts` 의 `toyDataSchema` 에서 `cody` 와 `fx` 필드를 `z.number()` 에서 `z.number().nullable()` 또는 `z.number().default(0)` 등으로 변경하거나, Toy-Data 생성 스크립트를 수정하여 해당 필드가 null 이 아닌 유효한 숫자 값으로 생성되도록 요청합니다.
    4.  **재적재 (Re-load)**: 수정된 Toy-Data 파일을 다시 적재하여 `event_store` 에 정상 이벤트가 유입되도록 합니다.
    5.  **투영 재실행**: `projection.start` 로직을 통해 수정된 이벤트를 감지하여 `read_grip_result` 와 `read_multimodal` 테이블에 정상 데이터를 적재합니다.

### 요약
기존 v1 API 클라이언트를 깨뜨리지 않으려면 **API 버전을 변경하지 않고**, **Read Model 스키마를 변경하지 않고**, **원천 데이터 (Toy-Data) 에만 수정을 요청하여 재적재**하는 방식으로 진행해야 합니다. SQL 은 위와 같은 '격리 확인' 쿼리만 작성하며, DDL 변경은 인간 승인을 기다린 후 실행하지 않습니다.
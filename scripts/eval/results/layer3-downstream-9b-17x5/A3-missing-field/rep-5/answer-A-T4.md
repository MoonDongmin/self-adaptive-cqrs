제공된 자료에 따르면, 이번 변경은 **Read Model 스키마 변경**이나 **DDL 실행**이 아닌, **무유입 검증 절차 (Verification Query)** 를 추가하는 것입니다.

자료의 'Decision Outcome'와 'Non-Goals' 섹션에서 명시적으로 "Read Model schema alteration", "DDL 실행", "API 컷오버"는 금지 사항 (Non-Goals) 으로 정의되어 있으며, 대신 "무유입 검증 절차"를 통해 시스템 내 정합성을 보장하는 것이 선택된 전략입니다.

따라서 기존 v1 API 클라이언트가 깨지지 않게 하려면 **코드 레벨의 로직 추가**만 수행하면 되며, 데이터베이스 스키마나 API 엔드포인트 경로의 변경은 전혀 필요 없습니다.

구체적 단계는 다음과 같습니다:

### 1. 버전 경로 (Versioning Strategy)
*   **전략**: **버전 경로 변경 없음 (No Path Change)**.
*   **이유**: 이번 변경은 기존 API 엔드포인트의 응답 구조를 바꾸거나 새 엔드포인트를 만드는 것이 아닙니다. 기존 API 로직 내부에 검증 로직을 추가하는 것이므로, 클라이언트가 호출하는 URL (`/api/v1/...`) 은 동일하게 유지됩니다.

### 2. 신구 병행 운영 (Parallel Operation)
*   **전략**: **불필요 (Not Applicable)**.
*   **이유**: 기존 v1 API 로직을 수정하거나 새 API 를 배포하여 병행하지 않습니다. 기존 API 코드를 수정하여 내부적으로 검증 로직을 포함시킵니다.

### 3. 마이그레이션 및 컷오버 절차 (Migration & Cutover Procedure)
*   **전략**: **인라인 로직 추가 및 즉시 적용 (Inline Logic Addition & Immediate Application)**.
*   **단계**:
    1.  **코드 수정**: `src/insert/service/insert.service.ts` (또는 해당 배치 처리 서비스) 의 `insert.batch.done` 후 처리 로직에 다음 SQL 쿼리를 실행하는 코드를 추가합니다.
    2.  **검증 로직**: 제공된 '격리 (containment) SQL'을 그대로 사용하되, `stream_id` 와 `attempt_num` 을 실패한 파일 목록 (_02004, _02005 등) 에 맞게 동적으로 구성하여 실행합니다.
        ```sql
        SELECT count(*) AS rejected_event_count 
        FROM event_store 
        WHERE (stream_id, attempt_num) IN (
            ('grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02004', 1), 
            ('grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02005', 1)
        );
        ```
    3.  **결과 처리**: 쿼리 결과 `rejected_event_count` 가 `0` 이어야 정상입니다. 만약 `0` 이 아니면 (이론상 불가능하지만 방어용), 에러를 로깅하거나 알람을 발생시킵니다.
    4.  **API 응답**: 기존 API 로직이 정상적으로 완료되면, 해당 API 응답은 **변경되지 않습니다**. 클라이언트는 기존에 기대하던 응답 구조를 그대로 받습니다.
    5.  **배포**: 수정된 코드를 배포합니다. DDL 실행이나 API 컷오버는 수행하지 않습니다.

### 요약
기존 v1 API 클라이언트는 **URL, 쿼리 파라미터, 응답 스키마**가 모두 동일하게 유지되므로, **어떠한 마이그레이션 스크립트나 컷오버 절차 없이** 수정된 서비스 코드만 배포하면 기존 클라이언트와 호환됩니다.

```sql
-- [참고용] 실제 적용 시 코드 내에서 실행될 검증 쿼리 (DDL 은 아님)
SELECT count(*) AS rejected_event_count 
FROM event_store 
WHERE (stream_id, attempt_num) IN (
    ('grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02004', 1), 
    ('grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02005', 1)
);
```
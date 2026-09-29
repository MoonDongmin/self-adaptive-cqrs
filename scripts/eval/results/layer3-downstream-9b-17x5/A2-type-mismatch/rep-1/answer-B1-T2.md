제공된 로그와 스키마 정보를 바탕으로, **Zod 거부 (Validation Error)** 로 인해 적재가 실패한 파일들의 `stream_id` 를 추출하고, 해당 `stream_id` 를 기반으로 `read_grip_result` 테이블에 존재하는 레코드를 **삭제 (Rollback)** 하는 SQL 을 작성합니다.

CQRS 패턴에서 이벤트 소싱의 핵심 원칙인 "불일치 해결 (Event Sourcing Consistency)"과 "영속성 보장 (Durability)"에 따라, 검증에 실패한 데이터는 저장소에 영구적으로 남는 것이 아니라 즉시 제거되어야 합니다.

### 분석 과정
1.  **실패 원인 식별**: 로그에서 `insert.file.failed` 레벨 40 로그를 확인합니다.
    *   파일 1: `..._02002_01_...` -> `grip_succeed` 필드가 문자열 ("string") 이지만 숫자 ("number") 를 기대함 (`invalid_type`).
    *   파일 2: `..._02003_01_...` -> `grip_succeed` 필드가 숫자이지만 값이 2 로서 최대값 1 을 초과함 (`too_big`).
2.  **영향받는 데이터 식별**: 실패한 파일들의 `stream_id` 를 추출합니다.
    *   `grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02002`
    *   `grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02003`
3.  **영향받는 Read Model 식별**: `stream_id` 를 `read_grip_result` 테이블의 `stream_id` 컬럼과 매칭하여 해당 레코드를 찾습니다.
4.  **조치**: 해당 `stream_id` 를 가진 `read_grip_result` 레코드를 `DELETE` 합니다. `read_multimodal` 테이블은 이미 실패한 파일에 대한 매핑이 완료되지 않았거나 (로그에 `insert.file.failed` 직후 `projection` 이 시작되어 매핑이 중단됨), 명시적인 실패 로그가 `insert.file.failed` 단계에서 발생했으므로, 데이터 일관성을 위해 `read_grip_result` 만 삭제하는 것이 안전하며, `read_multimodal` 에 해당 레코드가 이미 존재할 경우에도 `stream_id` 기준으로 삭제해야 합니다. 하지만 로그 흐름상 `insert.file.failed`가 발생하면 해당 시도의 모든 파생 데이터가 무효화되므로, 두 테이블 모두 `stream_id` 기준으로 삭제하는 것이 가장 확실한 복구 조치입니다.

### SQL 코드

```sql
-- 실패한 파일들의 stream_id 추출 (Zod 거부 로그 기반)
WITH failed_streams AS (
    SELECT 
        'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02002' AS stream_id,
        'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02003' AS stream_id
    UNION ALL
    SELECT 
        'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02002' AS stream_id,
        'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02003' AS stream_id
)
-- Read Model 에서 해당 stream_id 를 가진 레코드들을 삭제 (Rollback)
DELETE FROM read_grip_result
WHERE stream_id IN (SELECT stream_id FROM failed_streams)
AND stream_id LIKE 'grip-attempt:%';

DELETE FROM read_multimodal
WHERE stream_id IN (SELECT stream_id FROM failed_streams)
AND stream_id LIKE 'grip-attempt:%';
```
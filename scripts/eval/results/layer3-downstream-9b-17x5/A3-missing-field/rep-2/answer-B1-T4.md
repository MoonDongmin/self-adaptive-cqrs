제공된 자료 (로그 및 스키마) 에 따르면, 현재 시스템은 `insert.file.failed` 로직이 **전체 배치 (Batch) 를 중단**하고 해당 배치의 처리를 마치는 것으로 보입니다. 구체적으로, `02:06:57.578` 에서 첫 번째 파일 (`...002004...`) 에 Zod 오류가 발생했고, `02:06:57.579` 에서 두 번째 파일 (`...002005...`) 에도 오류가 발생했으며, 바로 `insert.batch.done` 로 상태가 전환되었습니다.

이러한 동작은 **CQRS 의 Event Store 에 해당 배치의 모든 이벤트가 기록되지 않음**을 의미합니다. 만약 v1 API 클라이언트가 특정 시나리오 (예: `attempt_num` 2004, 2005) 의 데이터를 강요하거나, 배치 내 일부만 성공했음에도 불구하고 전체 배치 결과를 기대하는 경우, 기존 API 가 예상한 데이터 불일치 (Missing Data) 를 일으켜 깨질 수 있습니다.

기존 v1 API 클라이언트가 깨지지 않게 하려면, **배치 내 일부 파일만 실패했을 때에도 해당 배치의 성공된 파일들에 대한 Read Model 은 정상적으로 생성되어야 하며, API 응답은 성공된 항목들만 포함하거나, 배치 전체를 '부분 성공' 상태로 처리하는 로직**으로 변경해야 합니다.

구체적인 변경 단계는 다음과 같습니다.

### 1. 버전 경로 전략 (Versioning Strategy)
기존 API 엔드포인트의 URL 에 버전 접두사를 추가하여 새 API 를 노출합니다. 기존 클라이언트는 변경 없이 v1 을 계속 호출하고, 새 클라이언트 (또는 업데이트된 로직) 는 v2 를 호출합니다.

*   **기존 API:** `GET /api/v1/batch-results/{batch_id}`
*   **신규 API:** `GET /api/v2/batch-results/{batch_id}`

### 2. 데이터 모델 및 로직 변경 사항 (Schema & Logic Change)
제공된 `read_grip_result` 및 `read_multimodal` 스키마는 **Primary Key 가 `(scene_key, attempt_num)`**로 정의되어 있습니다. 현재 로그 로직은 `insert.file.failed` 발생 시 배치 전체를 중단하므로, `attempt_num` 2004 와 2005 에 대한 레코드가 DB 에 저장되지 않습니다.

v2 API 는 **부분 성공 (Partial Success)**을 지원하도록 수정해야 합니다.

*   **Read Model 수정:**
    *   `read_grip_result` 테이블에 `batch_status` 또는 `is_batch_complete` 같은 플래그 필드를 추가하거나, 기존 Primary Key 구조를 유지하되 **실패한 `attempt_num` 에 대한 레코드만 누락**되도록 허용하는 전략을 취합니다.
    *   **핵심:** v2 API 는 `(scene_key, attempt_num)` 조합으로 조회할 때, 해당 `attempt_num` 이 존재하지 않으면 **404 Not Found**를 반환하거나, **200 OK + 빈 배열/빈 객체**를 반환하는 명확한 계약을 정의해야 합니다. v1 API 는 현재 "배치 내 모든 시도가 성공해야 전체가 성공"하는 전제 (All-or-Nothing) 하에 동작하고 있다면, 이는 v1 로직의 변경이 필요합니다.

*   **API 응답 구조 변경:**
    *   **v1 응답:** `{"status": "failed", "reason": "..."}` (전체 배치 실패 시)
    *   **v2 응답:** `{"status": "partial_success", "results": [{"attempt_num": 2001, ...}, {"attempt_num": 2002, ...}], "failed_attempts": [2004, 2005]}`
    *   **주의:** 만약 v1 API 가 `results` 배열을 순회하며 모든 항목을 처리하는 로직을 가진다면, v2 에서 누락된 항목 (2004, 2005) 이 있으면 v1 클라이언트가 `undefined` 에러를 낼 수 있습니다. 따라서 v1 클라이언트는 v2 응답의 `failed_attempts` 리스트를 확인하여 해당 시도는 스킵하거나, `status` 가 `failed` 인 경우에만 에러 처리하도록 로직을 수정해야 합니다.

### 3. 마이그레이션 및 컷오버 절차 (Migration & Cutover)

#### 단계 1: 병행 운영 (Parallel Operation)
*   **v1 API:** 기존 스키마 (`read_grip_result`, `read_multimodal`) 와 "전체 배치 성공 여부"를 기준으로 하는 로직을 유지합니다.
*   **v2 API:** 새로운 스키마 (필요시 `batch_status` 필드 추가) 와 "부분 성공" 로직을 구현합니다.
    *   **중요:** v2 API 는 `insert.file.failed` 로직을 수정하여, 실패한 파일만 해당 `stream_id` (또는 `scene_key` + `attempt_num`) 에 대한 이벤트를 기록하지 않거나, 별도의 `read_failed_file` 테이블에 기록하도록 변경해야 합니다.
    *   **Read Model Update:** `read_grip_result` 테이블에 `batch_status` (enum: 'success', 'partial', 'failed') 필드를 추가합니다.
    *   **Index Update:** `(scene_key, attempt_num)` 인덱스를 유지하되, `batch_status` 에 대한 인덱스도 고려합니다.

#### 단계 2: 데이터 마이그레이션 (Data Migration)
*   **기존 데이터:** v1 에서는 `batch_status` 필드가 없으므로, 기존 데이터는 v2 로직에 의해 `partial` 또는 `failed` 로 간주될 수 있습니다. 마이그레이션 스크립트를 작성하여 기존 배치의 성공/실패 상태를 분석하고, `batch_status` 필드를 채웁니다.
    *   SQL 예시:
        ```sql
        UPDATE read_grip_result
        SET batch_status = 'partial'
        WHERE scene_key = '반려동물용품_CR01_강아지공룡알장난감_002004'
        AND batch_status IS NULL; -- 예: 해당 scene_key 의 모든 레코드가 성공해야만 'success'로 설정
        ```
        *(참고: 실제 로직은 해당 scene_key 의 모든 attempt_num 이 성공했는지 확인하는 서브쿼리가 필요할 수 있습니다.)*

#### 단계 3: 컷오버 (Cutover)
*   **v1 API Deprecation:** v1 API 엔드포인트를 `Deprecation: Sun, 01 Jan 2024 00:00:00 GMT` 헤더를 추가합니다.
*   **v1 로직 제거:** v1 API 구현체에서 "배치 내 모든 시도가 성공해야 200 OK"하는 로직을 제거하고, v2 로직 (부분 성공 허용) 으로 통합합니다.
*   **v2 API 활성화:** v2 API 를 공식 엔드포인트로 설정합니다.

### 4. SQL 코드 (Postgres)

`read_grip_result` 테이블에 `batch_status` 필드를 추가하고, 기존 데이터를 마이그레이션하는 쿼리입니다.

```sql
-- 1. batch_status 컬럼 추가 (필드 타입: smallint, 0=failed, 1=partial, 2=success)
ALTER TABLE read_grip_result 
ADD COLUMN batch_status smallint DEFAULT 0;

-- 2. read_multimodal 테이블에도 동일한 컬럼 추가 (일관성 유지)
ALTER TABLE read_multimodal 
ADD COLUMN batch_status smallint DEFAULT 0;

-- 3. 마이그레이션: 해당 scene_key 의 모든 attempt_num 이 성공 (1) 이라면 batch_status 를 2(success) 로 설정
--    만약 하나라도 실패 (0) 이 있다면 batch_status 를 1(partial) 로 설정
--    (기존 데이터는 batch_status 가 NULL 이거나 0 일 것으로 가정)
UPDATE read_grip_result r
SET batch_status = (
    SELECT MAX(m.batch_status)
    FROM read_grip_result m
    WHERE m.scene_key = r.scene_key
)
WHERE r.batch_status IS NULL;

-- 4. (선택사항) batch_status 가 0 인 레코드는 1 로 변경 (실패한 시도는 partial 로 간주)
--    만약 scene_key 가 'partial' 상태라면, 그 scene_key 의 모든 레코드를 'partial'로 변경
UPDATE read_grip_result r
SET batch_status = 1
WHERE r.batch_status = 0
AND EXISTS (
    SELECT 1 FROM read_grip_result m 
    WHERE m.scene_key = r.scene_key 
    AND m.batch_status = 1
);

-- 5. 인덱스 생성 (필요시)
CREATE INDEX IF NOT EXISTS idx_read_grip_result_scene_batch ON read_grip_result(scene_key, batch_status);
```

### 요약
1.  **API 버전화:** `/api/v1/...` 와 `/api/v2/...` 로 분리.
2.  **로직 변경:** v2 는 `insert.file.failed` 발생 시 해당 `attempt` 만 누락되고, 나머지 `attempt` 는 정상적으로 `read_model` 에 저장되도록 수정. API 응답은 `partial_success` 상태 반환.
3.  **DB 스키마 확장:** `read_grip_result` 및 `read_multimodal` 에 `batch_status` 필드 추가.
4.  **데이터 마이그레이션:** 기존 데이터의 성공/실패 상태를 분석하여 `batch_status` 필드 값 채우기.
5.  **컷오버:** v1 은 Deprecation 헤더로 표시 후下线, v2 로 통합.
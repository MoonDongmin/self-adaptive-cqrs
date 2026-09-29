제공된 자료 (로그 컨텍스트, Read Model 스키마) 에 따르면, 요청하신 "객체별 파지 성공률 (시도 수, 성공 수, 성공률)" 조회는 현재 `read_grip_result` 테이블의 구조상 **단일 쿼리로는 불가능**합니다.

**이유:**
1.  **Join 불가:** `read_grip_result` (성공 여부 포함) 와 `read_multimodal` (시도 번호 포함) 은 `(scene_key, attempt_num)` 키를 공유하지만, `object_name` 필드는 `read_grip_result`에만 존재합니다. `read_multimodal` 에는 `object_name`이 없으므로, 두 테이블을 `object_name` 기준으로 조인할 수 없습니다.
2.  **필터링 불가:** `read_grip_result` 에 `object_name` 필드가 있지만, 이를 기준으로 집계하려면 `scene_key` 와 `attempt_num` 을 그룹화해야 합니다. 만약 `read_multimodal` 과 조인하여 시도 수를 세려면, `object_name` 이 없는 테이블과 조인 시 `object_name` 이 NULL 이 되어 모든 행이 NULL 이나 조인 조건에 의해 필터링이 깨질 수 있습니다.
3.  **계산 로직의 불일치:** "시도 수"는 보통 `read_multimodal` 의 `attempt_num` 범위 (또는 별도 카운팅) 로 정의될 수 있으나, "성공 수"는 `read_grip_result` 의 `sum(grip_succeed)` 로 정의됩니다. 두 지표의 기준 (시도 단위 vs 객체 단위) 을 하나의 SQL 쿼리에서 동시적으로 만족시키기 위해 `object_name` 을 기준으로 `read_grip_result` 만을 집계하거나, `read_multimodal` 만을 집계하는 방식은 서로 다른 결과를 내게 됩니다.

따라서 **기존 Read Model 구조를 변경하지 않고는** 요청된 뷰를 생성할 수 없습니다.

---

### 기존 v1 API 클라이언트 호환성을 유지하는 변경 절차

기존 API 가 `GET /api/v1/insights/{object_name}/grip_stats` 와 같은 경로를 통해 `read_grip_result` 만을 조회하거나, 혹은 내부 로직에서 직접 두 테이블을 조인하여 결과를 계산하고 있다면, **API 엔드포인트의 버전 호환성**이 핵심입니다.

#### 1. 버전 경로 전략 (Versioning Strategy)
*   **기존 API 유지:** `GET /api/v1/insights/{object_name}/grip_stats` 는 **변경 없이 그대로 유지**합니다. 이 엔드포인트는 기존 클라이언트가 호출하는 곳이며, 응답 형식도 동일하게 유지해야 합니다.
*   **신규 API 추가:** 새로운 기능은 별도의 버전 경로에 노출합니다.
    *   예: `GET /api/v2/insights/object_stats` 또는 `GET /api/v1/insights/{object_name}/grip_stats?include_attempt_count=true` (Query Param 방식).
    *   **권장:** `GET /api/v2/insights/object_stats` 를 새로 생성하여, "객체별 파지 성공률 (시도 수 포함)"이라는 새로운 리소스를 제공합니다.

#### 2. 신구 병행 운영 (Parallel Operation)
*   **Read Model 확장:** `read_grip_result` 테이블을 확장하거나, 새로운 Read Model (`read_grip_object_stats`) 을 생성합니다.
    *   *옵션 A (확장):* `read_grip_result` 에 `object_name` 필드가 이미 있으므로, 새로운 뷰 (View) 를 생성하여 `object_name` 기준으로 집계하는 로직을 추가합니다.
    *   *옵션 B (새 테이블):* `read_grip_object_stats` 테이블을 새로 생성하여 `(object_name, attempt_count, success_count, success_rate)` 컬럼을 가집니다.
*   **API Gateway/Router 로직:**
    *   클라이언트 요청의 `Accept-Version` 헤더나 URL 경로 (`/v1` vs `/v2`) 에 따라 응답을 분기합니다.
    *   `/v1` 요청: 기존 `read_grip_result` 기반 쿼리 실행 (시도 수 없음).
    *   `/v2` 요청: 새로운 집계 쿼리 실행 (시도 수 포함).

#### 3. 마이그레이션 및 컷오버 절차 (Migration & Cutover)

**Step 1: 데이터 모델링 (Schema Change)**
*   새로운 Read Model (`read_grip_object_stats`) 을 정의합니다.
    ```sql
    CREATE TABLE read_grip_object_stats (
        object_name VARCHAR PRIMARY KEY,
        total_attempts INT,
        success_count INT,
        success_rate NUMERIC(5, 2)
    );
    ```
*   기존 `read_grip_result` 는 변경하지 않습니다.

**Step 2: 이벤트 소싱 (Event Sourcing) 로 동기화**
*   기존에 쌓인 이벤트 (Stream) 를 새 Read Model 로 동기화하는 백그라운드 잡 (Job) 을 작성합니다.
*   **SQL 로직 (Postgres):**
    ```sql
    -- 기존 Read Model 에서 새 Read Model 로의 일괄 동기화 (Backfill)
    INSERT INTO read_grip_object_stats (object_name, total_attempts, success_count, success_rate)
    SELECT 
        object_name,
        COUNT(*) as total_attempts,
        SUM(grip_succeed) as success_count,
        ROUND(CAST(SUM(grip_succeed) AS FLOAT) / COUNT(*), 2) as success_rate
    FROM read_grip_result
    GROUP BY object_name;
    ```
*   **실시간 동기화:** `insert.batch.done` 이벤트가 발생하면, 해당 이벤트의 `stream_id` 에서 `object_name` 을 추출하여 새 Read Model 을 업데이트하는 이벤트 핸들러를 구현합니다.

**Step 3: API 구현 및 테스트**
*   `/api/v2/insights/object_stats` 엔드포인트를 구현합니다.
    *   이 엔드포인트는 `read_grip_object_stats` 테이블을 직접 조회합니다.
    *   `total_attempts`, `success_count`, `success_rate` 를 반환합니다.
*   `/api/v1/insights/{object_name}/grip_stats` 엔드포인트는 기존 로직 (`read_grip_result` 조회 후 프론트엔드/클라이언트 측에서 시도 수를 계산하거나, 시도 수 필드를 생략) 을 유지합니다.

**Step 4: 클라이언트 배포 및 컷오버**
*   **Phase 1 (Parallel):** v1 API 와 v2 API 를 동시에 운영합니다. v1 은 기존 클라이언트용, v2 는 새 클라이언트용입니다.
*   **Phase 2 (Deprecation):** v1 API 문서에 "v2 에서 시도 수 필드가 추가됨" 또는 "v1 은 곧 폐지됨"이라는 주석을 달아둡니다.
*   **Phase 3 (Cutover):**
    *   새 클라이언트들이 v2 로 마이그레이션되면, v1 트래픽이 줄어듭니다.
    *   v1 API 를 완전히 제거하거나, v1 은 "시도 수 없음"으로 동작하도록 유지하되, v2 가 표준이 되도록 변경합니다.
    *   만약 v1 API 를 완전히 제거하려면, v1 API 가 더 이상 호출되지 않는 시점에 `/api/v1` 경로를 Gateway 에서 차단하거나, 해당 엔드포인트를 삭제합니다.

**Step 5: 모니터링**
*   v1 API 호출량과 v2 API 호출량의 비율을 모니터링합니다.
*   새 Read Model (`read_grip_object_stats`) 의 데이터 일관성 (Event 가 들어오면 즉시 반영되는지) 을 체크합니다.

### 요약
1.  **URL:** `GET /api/v2/insights/object_stats` (신규), `GET /api/v1/...` (기존 유지).
2.  **DB:** `read_grip_object_stats` 테이블 생성 및 이벤트 기반 동기화.
3.  **호환성:** v1 은 기존 로직 유지, v2 는 새 로직 제공. 클라이언트 측에서 버전 선택을 유도하거나 Gateway 에서 라우팅.
제공된 자료 (로그 컨텍스트, Read Model 스키마) 에 따르면, 요청하신 "객체별 파지 성공률 (시도 수, 성공 수, 성공률)" 조회는 현재 `read_grip_result` 테이블의 구조상 **단건 조회 (Primary Key: scene_key, attempt_num)** 기반의 데이터만 존재하므로, 객체 (`object_name`) 를 기준으로 집계된 결과를 직접 쿼리하여 반환할 수 없습니다.

따라서 기존 v1 API 클라이언트가 깨지지 않도록 하려면 **신구 API 병행 운영** 전략을 취해야 합니다.

### 1. 버전 경로 전략 (Versioning Strategy)
기존 클라이언트가 깨지지 않게 하려면 URL 경로에 버전을 명시하는 방식을 권장합니다.

*   **기존 v1 API:** `/api/v1/insights/cards/{scene_key}` (또는 유사한 경로)
    *   이 경로는 기존 로직 (Read Model 직접 조회) 을 그대로 유지합니다.
*   **신규 v2 API:** `/api/v2/insights/cards/{scene_key}` 또는 `/api/v2/insights/objects/{object_name}/stats`
    *   이 경로에는 새로운 집계 로직을 적용합니다.
    *   클라이언트 호환성을 위해 `Accept-Version` 헤더나 URL 파라미터 (`?version=2`) 를 지원할 수도 있으나, URL 경로 변경이 가장 명확합니다.

### 2. 데이터 모델 확장 (Schema Change)
`read_grip_result` 테이블은 Primary Key 가 `(scene_key, attempt_num)` 이므로, `object_name` 을 기준으로 그룹화된 집계 데이터를 저장할 수 없습니다. 별도의 Read Model 을 생성하거나 기존 테이블에 새로운 컬럼을 추가해야 합니다.

*   **추천:** `read_grip_result` 테이블에 새로운 컬럼을 추가하는 것보다, **새로운 Read Model** (`read_grip_object_stats`) 을 생성하는 것이 안전하고 유지보수가 용이합니다.
*   **필요한 필드:**
    *   `object_name`: varchar (파지 대상 객체명)
    *   `total_attempts`: bigint (총 시도 수)
    *   `succeeded_attempts`: bigint (성공 수)
    *   `success_rate`: numeric (성공률, 예: 0.85)
    *   `scene_key`: varchar (필요시 참조용)
    *   `updated_at`: timestamptz (최종 업데이트 시간)

### 3. 마이그레이션 및 컷오버 절차 (Migration & Cutover Steps)

#### 단계 1: 신규 Read Model 생성 및 이벤트 리스너 개발
1.  **테이블 생성:** `read_grip_object_stats` 테이블을 생성합니다.
2.  **이벤트 리스너 (Projector) 개발:**
    *   `read_grip_result` 테이블에 `insert.batch` 이벤트가 들어올 때마다, 해당 이벤트의 `object_name`, `attempt_num`, `grip_succeed` 값을 추출합니다.
    *   **집계 로직:** `object_name` 을 기준으로 `attempt_num` 과 `grip_succeed` 를 그룹화하여 `total_attempts` 와 `succeeded_attempts` 를 계산하고, `success_rate` 를 계산합니다.
    *   **업데이트:** 계산된 결과를 `read_grip_object_stats` 테이블에 `INSERT` 또는 `UPSERT` (ON CONFLICT DO UPDATE) 합니다.
    *   **필터링:** 로그 컨텍스트에서 `insight.card.miss` 와 같은 에러 로그가 발생하면, 해당 `correlation_id` 와 관련된 `stream_id` 를 기반으로 해당 객체의 통계 업데이트를 취소하거나 롤백할 수 있는 로직을 고려해야 합니다. (단, 로그는 ±N 윈도우이므로 정확한 실시간 롤백은 어려울 수 있어, 이벤트 소싱의 '최종 상태' 원칙에 따라 이벤트가 성공적으로 `insert.batch` 되었을 때만 업데이트하는 것이 안전합니다.)

#### 단계 2: 데이터 초기화 (Backfill)
*   기존에 쌓여있는 `read_grip_result` 데이터를 스캔하여, `object_name` 기준으로 미리 집계된 데이터를 `read_grip_object_stats` 테이블에 초기 로드합니다.
    ```sql
    INSERT INTO read_grip_object_stats (object_name, total_attempts, succeeded_attempts, success_rate, updated_at)
    SELECT 
        object_name,
        COUNT(*) as total_attempts,
        SUM(grip_succeed) as succeeded_attempts,
        ROUND(CAST(SUM(grip_succeed) AS FLOAT) / COUNT(*), 2) as success_rate,
        MAX(occurred_at) as updated_at
    FROM read_grip_result
    GROUP BY object_name;
    ```

#### 단계 3: API 레이어 변경 (Parallel Operation)
1.  **v1 API 유지:** 기존 `/api/v1/...` 엔드포인트는 `read_grip_result` 를 직접 조회하는 로직을 그대로 유지합니다. 기존 클라이언트는 이 경로를 계속 호출하므로 깨지지 않습니다.
2.  **v2 API 추가:** `/api/v2/insights/objects/{object_name}/stats` 엔드포인트를 추가합니다.
    *   이 엔드포인트는 `read_grip_object_stats` 테이블을 조회합니다.
    *   **SQL 쿼리 예시:**
        ```sql
        SELECT 
            object_name,
            total_attempts,
            succeeded_attempts,
            success_rate
        FROM read_grip_object_stats
        WHERE object_name = :requested_object_name;
        ```

#### 단계 4: 클라이언트 마이그레이션 및 컷오버
1.  **클라이언트 배포:** 새로운 v2 API 를 사용하는 클라이언트 버전을 배포합니다.
2.  **트래픽 분할:**
    *   기존 클라이언트: v1 API 호출.
    *   새 클라이언트: v2 API 호출.
    *   두 버전이 동시에 운영됩니다.
3.  **데이터 동기화 확인:** v1 API 가 정상 작동하는지, v2 API 가 정상 응답하는지 모니터링합니다.
4.  **v1 API 제거 (선택 사항):** 모든 클라이언트가 v2 로 마이그레이션된 후, v1 API 에 대한 의존성을 없애고 v1 엔드포인트를 삭제합니다.

### 요약
*   **핵심:** 기존 API (v1) 은 **변경하지 않고 유지**합니다.
*   **해결책:** 새로운 API (v2) 를 만들어, 별도의 `read_grip_object_stats` 테이블을 통해 `object_name` 기준 집계 데이터를 제공합니다.
*   **데이터 흐름:** `read_grip_result` 이벤트 -> `read_grip_object_stats` 업데이트 (프로젝터).
*   **결과:** 기존 클라이언트는 v1 로, 새 기능은 v2 로 접속하여 충돌 없이 병행 운영됩니다.
제공된 자료 (로그 컨텍스트, Read Model 스키마) 에 따르면, 요청하신 "파지 실패가 가장 많은 객체 상위 목록 (객체별 실패 수, 실패율, 순위)"을 조회하기 위한 **Read Model 은 현재 존재하지 않습니다**.

*   `read_grip_result` 는 `(scene_key, attempt_num)` 단위로 파지 성공/실패 여부를 저장하며, `object_name` 은 필드가 있지만, **객체별 집계 (Group By object_name)** 로 실패 수와 실패율을 계산할 수 있는 구조가 아닙니다.
*   `read_multimodal` 은 이미지/비디오 링크만 저장하며 실패 정보와 무관합니다.
*   로그 컨텍스트에는 `insight.card.miss` 로그가 있으나, 이는 실시간 이벤트 로그이며, 이를 기반으로 **Read Model 을 즉시 생성하여 기존 API 에 응답을 반환할 수는 없습니다**.

따라서 **기존 v1 API 클라이언트가 깨지지 않게 하려면**, 새로운 기능 (파지 실패 객체 순위 조회) 을 제공하는 별도의 API 엔드포인트를 추가해야 하며, 기존 API 는 그대로 유지해야 합니다.

구체적인 단계별 절차는 다음과 같습니다.

### 1. 버전 경로 전략 (Versioning Strategy)
기존 클라이언트가 깨지지 않게 하려면 **URL 버저닝 (URL Versioning)** 을 적용해야 합니다.
*   **기존 API:** `GET /api/v1/insights/cards/{id}` (또는 해당 리소스 경로)
*   **신규 API:** `GET /api/v2/insights/cards/{id}` 또는 `GET /api/v1/insights/cards/{id}?include_failure_stats=true` (추천: 파라미터 기반은 버저닝 시 충돌 위험이 있으므로, 별도의 `/v2` 경로나 `/insights/failure-stats` 같은 별도 리소스 경로를 만드는 것이 안전함)

**추천 경로:**
*   기존: `GET /api/v1/insights/cards/{scene_key}`
*   신규: `GET /api/v2/insights/cards/{scene_key}` (또는 `GET /api/v1/insights/failure-stats`)

### 2. 신구 병행 운영 (Parallel Operation)
버전 1과 버전 2 (또는 새 엔드포인트) 를 동시에 운영합니다.
*   **기존 클라이언트:** `v1` 엔드포인트 (또는 새 엔드포인트가 없는 경우) 를 호출하여 정상 작동.
*   **신규 클라이언트:** `v2` 엔드포인트를 호출하여 새로운 기능 사용.
*   **백엔드:** 두 가지 엔드포인트에 대한 핸들러를 모두 구현.

### 3. 마이그레이션 및 컷오버 절차 (Migration & Cutover)

#### 단계 1: Read Model 생성 (Event Sourcing 반영)
기존 Read Model (`read_grip_result`) 에는 집계된 실패 통계가 없으므로, 새로운 Read Model 을 생성해야 합니다.
*   **새 Read Model:** `read_insight_object_failure_stats` (또는 `read_insight_object_failure_ranking`)
*   **스키마 설계:**
    *   `object_name`: varchar (파지 대상 객체명)
    *   `total_attempts`: bigint (해당 객체 전체 시도 횟수)
    *   `failed_attempts`: bigint (해당 객체 실패 횟수)
    *   `failure_rate`: numeric (실패율, e.g., 0.5)
    *   `scene_key`: varchar (필요시)
    *   `updated_at`: timestamptz
    *   `stream_id`: varchar (추적용)
    *   `global_seq`: bigint (최신 시퀀스)
*   **이벤트 처리 로직:**
    *   `insight.card.miss` 이벤트가 발생하면, 해당 이벤트의 `detail` 에서 "파지 실패가 가장 많은 객체..."라는 텍스트를 추출하거나, `correlation_id` 를 통해 해당 `scene_key` 와 `object_name` 을 매핑하여 `read_insight_object_failure_stats` 테이블에 `failed_attempts` 를 +1 하고 `total_attempts` 를 +1 하는 이벤트를 발행하거나 직접 처리해야 합니다.
    *   *주의:* 제공된 로그에는 `insight.card.miss` 이벤트의 `object_name` 필드가 명시적으로 포함되어 있지 않습니다. (`detail` 필드에는 "insight 카드 없음: 파지 실패가 가장 많은 객체..."라는 텍스트만 있음). 따라서 **이벤트 스키마 정의**가 추가로 필요하거나, `insight.card.miss` 이벤트의 `payload` 에 `object_name` 이 포함되어야 이 Read Model 을 구축할 수 있습니다. 만약 payload 에 없다면, `read_grip_result` 테이블의 `object_name` 과 `scene_key` 를 조인하여 역산해야 합니다.

#### 단계 2: View 또는 Aggregation Job 구축
Postgres 에서 직접 쿼리하는 것보다, 이벤트 소싱의 일관성을 위해 **Materialized View** 또는 **Background Worker** 를 사용하는 것이 좋습니다.
*   **방안 A (Materialized View):** `read_insight_object_failure_stats` 테이블을 `read_grip_result` 테이블을 기반으로 `GROUP BY object_name` 쿼리로 생성된 View 로 만듭니다.
    ```sql
    CREATE VIEW read_insight_object_failure_stats AS
    SELECT
        object_name,
        COUNT(*) as total_attempts,
        SUM(1 - grip_succeed) as failed_attempts, -- 0 이면 실패, 1 이면 성공. 실패 수 = 총수 - 성공수
        ROUND(CAST(SUM(1 - grip_succeed) AS FLOAT) / COUNT(*) * 100, 2) as failure_rate
    FROM read_grip_result
    GROUP BY object_name;
    ```
*   **방안 B (CDC Trigger / Worker):** `read_grip_result` 테이블에 INSERT/UPDATE 가 발생하면, 백그라운드 작업이 `read_insight_object_failure_stats` 테이블을 실시간으로 업데이트합니다.

#### 단계 3: API 핸들러 구현 (CQRS Command/Query)
*   **Query Handler:** `GET /api/v2/insights/failure-stats` 엔드포인트를 만듭니다.
    ```sql
    -- v2 API 의 Query SQL 예시
    SELECT
        object_name,
        failed_attempts,
        failure_rate,
        ROW_NUMBER() OVER (ORDER BY failed_attempts DESC) as rank
    FROM read_insight_object_failure_stats
    ORDER BY failed_attempts DESC
    LIMIT 10; -- 상위 목록
    ```
*   **기존 API 핸들러:** `GET /api/v1/insights/cards/{id}` 는 변경 없이 `read_grip_result` 를 조회하는 로직을 그대로 유지합니다.

#### 단계 4: 배포 및 검증
1.  **Read Model 스키마 마이그레이레이션:** `read_insight_object_failure_stats` 테이블 생성.
2.  **백그라운드 작업 배포:** 이벤트 리스너 또는 View Refresh Job 배포.
3.  **API 배포:** `v2` 엔드포인트 추가 (또는 새 경로 추가).
4.  **검증:**
    *   `v1` API 호출 시 기존 응답 구조 확인 (클라이언트 호환성 확인).
    *   `v2` API 호출 시 새로운 "파지 실패 순위" 응답 구조 확인.
    *   데이터 일관성 확인: `read_grip_result` 에 직접 쿼리한 결과와 `read_insight_object_failure_stats` 결과 비교.

#### 단계 5: 컷오버 (Cutover)
*   **완전 호환성 유지:** `v1` API 를 완전히 제거하지 않고, `v1` 은 유지하고 `v2` 를 배포합니다.
*   **클라이언트 업데이트:** 신규 클라이언트는 `v2` 를 사용하도록 업데이트.
*   **기존 클라이언트:** `v1` 을 계속 사용.
*   **최종 단계:** 일정 기간 후, `v1` API 를 제거하고 모든 트래픽을 `v2` 로 유도하거나, `v1` 을 `v2` 로 리디렉션 (302/301) 합니다.

### 요약: SQL 코드 (Read Model 생성용)

기존 `read_grip_result` 를 기반으로 `read_insight_object_failure_stats` 뷰를 생성하는 SQL 입니다.

```sql
CREATE OR REPLACE VIEW read_insight_object_failure_stats AS
SELECT
    object_name,
    COUNT(*) AS total_attempts,
    SUM(1 - grip_succeed) AS failed_attempts,
    ROUND(
        CAST(SUM(1 - grip_succeed) AS FLOAT) / NULLIF(COUNT(*), 0) * 100, 
        2
    ) AS failure_rate
FROM read_grip_result
GROUP BY object_name
ORDER BY failed_attempts DESC;
```

### 요약: API 응답 구조 변경 사항

*   **기존 v1 API 응답:** `scene_key`, `attempt_num`, `grip_succeed`, `object_name` 등 개별 시도 정보.
*   **신규 v2 API 응답:** `object_name`, `failed_attempts`, `failure_rate`, `rank` 등 집계 정보.

이 방식은 기존 클라이언트가 `v1` 경로를 계속 호출하므로 깨지지 않으며, 신규 클라이언트는 `v2` 경로를 통해 요청된 기능을 사용할 수 있습니다.
제공된 자료 (로그 컨텍스트 및 Read Model 스키마) 를 분석한 결과, 요청하신 **"일자별 파지 성공률 추이 (날짜별 시도 수, 성공 수, 성공률)"** 조회는 **현재 Read Model 로 불가능**합니다.

**이유:**
1.  **필터링 기준 부재:** `read_grip_result` 테이블의 `occurred_at` 필드는 `timestamptz` 형식입니다. 이를 기준으로 날짜 (`DATE`) 로 그룹화하려면 `EXTRACT` 함수나 `DATE_TRUNC` 함수를 사용해야 합니다.
2.  **집계 기능 부재:** Read Model 은 개별 파지 시도 (Attempt) 에 대한 원자적 데이터 (시도 수, 성공 여부) 만 저장하고 있습니다. "시도 수", "성공 수", "성공률"과 같은 **집계된 통계 데이터**는 저장되어 있지 않습니다.
3.  **Join 의 복잡성:** 시도 수와 성공 수를 구하려면 `read_grip_result` 테이블을 `attempt_num` 키로 그룹화하여 집계해야 하므로, 단순 조회가 아닌 복잡한 `GROUP BY` 쿼리가 필요합니다.

따라서 이 요청을 처리하기 위해서는 **Read Model 을 확장하거나, 별도의 집계용 Read Model 을 생성**해야 합니다.

---

### 기존 v1 API 클라이언트 호환성을 위한 변경 절차

기존 v1 API 가 `insight.card` 엔드포인트를 통해 "일자별 파지 성공률" 데이터를 반환하도록 기대하고 있다면, 클라이언트 코드를 수정하지 않고서도 새 데이터를 제공하려면 **버전 관리 전략**이 필수적입니다.

#### 1. API 버전 경로 변경 (Versioning)
가장 안전하고 권장되는 방법은 API 경로에 버전을 명시하는 것입니다.
*   **기존 v1:** `/api/v1/insights/cards` (단건 조회 또는 기본 통계)
*   **신규 v2:** `/api/v2/insights/cards` (일자별 파지 성공률 추이 포함)

#### 2. 신구 병행 운영 (Parallel Operation)
버전 변경 시 기존 클라이언트가 즉시 깨지지 않도록 합니다.
*   **라우팅 로직:** API Gateway 또는 Backend 라우터에서 요청 헤더 (`Accept-Version` 또는 `X-API-Version`) 또는 쿼리 파라미터 (`version=2`) 를 확인합니다.
    *   `version=1` 또는 헤더가 없을 경우: 기존 `read_grip_result` 기반의 로직 (또는 빈 데이터 반환) 실행.
    *   `version=2` 또는 헤더가 `v2` 일 경우: 새로 생성된 집계 로직 실행.

#### 3. 마이그레이션 및 컷오버 절차 (Migration & Cutover)

**Step 1: 새 Read Model 생성 및 이벤트 소싱 (Schema Evolution)**
*   `read_grip_result` 테이블을 변경하지 않고, 새로운 테이블 `read_daily_grip_stats` 를 생성합니다.
*   **스키마:**
    ```sql
    CREATE TABLE read_daily_grip_stats (
        date DATE PRIMARY KEY,
        scene_key VARCHAR,
        total_attempts INT,
        success_attempts INT,
        success_rate NUMERIC(5, 2),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    ```
*   **이벤트 소싱:** `grip-attempt` 이벤트가 발행될 때마다 (또는 배치 처리 시), `occurred_at` 필드를 추출하여 `date` 로 그룹화하고 `total_attempts`, `success_attempts` 를 카운트하는 **새로운 Projection**을 정의합니다.
    *   *주의:* 기존 `read_grip_result` 를 그대로 유지하되, 새 테이블은 빈 상태로 시작합니다.

**Step 2: 새 Projection 실행 (Backfill)**
*   과거 데이터에 대한 새 Read Model 을 채우기 위해, `read_daily_grip_stats` 를 초기화하고, `read_grip_result` 테이블의 과거 데이터를 `INSERT INTO ... SELECT ... GROUP BY` 쿼리로 새 테이블로 마이그레이션합니다.
    ```sql
    INSERT INTO read_daily_grip_stats (date, scene_key, total_attempts, success_attempts, success_rate)
    SELECT 
        DATE(occurred_at) as date,
        scene_key,
        COUNT(*) as total_attempts,
        SUM(grip_succeed) as success_attempts,
        ROUND(CAST(SUM(grip_succeed) AS FLOAT) / COUNT(*), 2) as success_rate
    FROM read_grip_result
    WHERE occurred_at < NOW() -- 과거 데이터만 처리
    GROUP BY date, scene_key;
    ```

**Step 3: API 로직 업데이트 (v2 구현)**
*   v2 API 핸들러를 작성하여, 요청 시 `version=2` 라면 `read_daily_grip_stats` 를 쿼리합니다.
    ```sql
    -- v2 API 쿼리 예시
    SELECT date, scene_key, total_attempts, success_attempts, success_rate
    FROM read_daily_grip_stats
    WHERE date BETWEEN :start_date AND :end_date
    ORDER BY date ASC, scene_key ASC;
    ```
*   v1 API 핸들러는 변경 없이 `read_grip_result` 를 직접 쿼리하거나, 빈 객체를 반환하도록 유지합니다.

**Step 4: 컷오버 (Cutover)**
*   새 Read Model (`read_daily_grip_stats`) 이 충분히 채워지고 안정화되면, API Gateway 에서 v1 요청을 v2 로 리디렉션하거나, v1 엔드포인트를 새 로직으로 점진적으로 교체합니다.
*   **중요:** v1 클라이언트가 아직 v2 로 업그레이드되지 않았을 때, v1 요청은 기존 로직 (또는 에러) 을 수행해야 하므로 **반응성 저하**가 발생할 수 있습니다. 이를 감수하거나, v1 클라이언트 호환성을 위해 v1 엔드포인트가 새 데이터를 반환하도록 **Backward Compatibility Layer**를 추가할 수 있습니다.
    *   *Backward Compatibility Layer:* v1 요청이 들어오면, `read_daily_grip_stats` 가 있으면 그 데이터를 `read_grip_result` 기반의 응답 포맷으로 변환하여 반환합니다. (이 경우 v1 클라이언트도 새 데이터를 볼 수 있음)

**Step 5: 모니터링 및 롤백**
*   새 Projection 의 처리 속도와 `read_daily_grip_stats` 의 데이터 일관성을 모니터링합니다.
*   문제가 발생하면 즉시 새 Projection 을 중지하고 `read_grip_result` 만 사용하는 상태로 롤백합니다.

---

### 결론

1.  **현재 Read Model 로 가능 여부:** **불가능**합니다. (필터링은 가능하나, 집계된 통계 값은 저장되어 있지 않음)
2.  **변경 사항:** `read_daily_grip_stats` 라는 새로운 Read Model 을 생성하고, `grip-attempt` 이벤트를 소싱하여 집계 데이터를 생성해야 합니다.
3.  **v1 API 호환성:** API 버전을 분리 (`/v1` vs `/v2`) 하거나, v1 요청에 대해 새 데이터를 변환하여 반환하는 **Backward Compatibility Layer**를 구축해야 합니다.
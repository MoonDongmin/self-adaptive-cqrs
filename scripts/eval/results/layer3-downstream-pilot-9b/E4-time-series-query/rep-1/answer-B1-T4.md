제공된 자료 (로그 컨텍스트 및 Read Model 스키마) 를 분석한 결과, 요청하신 **"일자별 파지 성공률 추이 (날짜별 시도 수, 성공 수, 성공률)"** 조회는 **현재 Read Model 로 불가능**합니다.

### 불가능한 이유
1.  **필터링 기준 부재**: `read_grip_result` 테이블의 `occurred_at` 필드는 `timestamptz` 형식입니다. 이를 기준으로 날짜 (`DATE`) 로 그룹화하려면 `EXTRACT` 함수나 `DATE_TRUNC` 함수를 사용해야 합니다.
2.  **집계 기능 부재**: Read Model 은 개별 파지 시도 (Attempt) 에 대한 원자적 데이터 (시도 수, 성공 여부) 를 저장할 뿐, 특정 기간 (일자) 에 대한 **집계된 통계 (SUM, COUNT, AVG)** 를 저장하지 않습니다.
3.  **데이터 구조**: 각 행은 `(scene_key, attempt_num)` 조합의 개별 결과입니다. "일자별" 데이터를 얻으려면 모든 `read_grip_result` 행을 JOIN 하여 날짜별로 그룹화하고, 시도 수와 성공 수를 계산해야 하므로, 단순 SELECT 쿼리로는 원하는 형식의 결과를 즉시 제공하기 어렵습니다.

따라서 이 요청을 처리하기 위해서는 **Read Model 에 새로운 집계 테이블 (예: `read_daily_parsing_stats`) 을 생성**하거나, **SQL 쿼리를 통해 실시간으로 집계하는 새로운 Read Model 로직 (Projection)** 을 추가해야 합니다.

---

### 기존 v1 API 클라이언트 호환성을 위한 변경 절차

기존 v1 API 클라이언트가 깨지지 않도록 하려면 **Backward Compatibility (역호환성)** 를 최우선으로 해야 합니다. 이를 위해 다음과 같은 단계를 수행해야 합니다.

#### 1. 버전 경로 전략 (Versioning Strategy)
*   **새 API 엔드포인트 생성**: 기존 `/api/v1/insights/cards` 와 같은 경로는 유지하되, 새로운 기능은 `/api/v2/insights/cards` 또는 `/api/v1/insights/cards/stats` 와 같이 별도의 버전 또는 서브-경로를 사용합니다.
*   **Response Envelope**: 만약 경로를 변경할 수 없는 경우, 기존 API 응답 구조를 유지하되, 새로운 데이터는 `data` 필드 내부의 `meta` 또는 `statistics` 하위 객체로 포함하거나, `data` 배열에 기존 데이터와 새 데이터를 구분하여 반환하는 방식을 고려해야 합니다. (권장: 경로 변경)

#### 2. 신구 병행 운영 (Parallel Operation)
*   **Read Model 분리**:
    *   기존 `read_grip_result` 테이블은 그대로 유지합니다.
    *   새로운 집계 데이터가 필요한 경우, 별도의 테이블 (예: `read_daily_parsing_stats`) 을 생성하거나, 기존 테이블에 새로운 컬럼을 추가하는 대신 **새로운 Projection 로직**을 구축하여 별도의 Read Model 을 만듭니다.
    *   **중요**: 기존 `read_grip_result` 테이블의 스키마를 변경하지 마십시오. 이는 v1 API 가 의존하는 데이터 구조를 깨뜨릴 수 있습니다.

#### 3. 마이그레이션 및 컷오버 절차 (Migration & Cutover)

**Step 1: 새로운 Projection 로직 구현 (Event Sourcing Side)**
*   `grip-attempt` 이벤트 스트림을 구독하는 Projector (`grip-result-projector`) 에 새로운 로직을 추가합니다.
*   이벤트가 들어올 때마다 `occurred_at` 을 추출하여 `DATE` 로 변환하고, `scene_key` 와 `attempt_num` 을 기반으로 `daily_stats` 라는 새로운 Read Model 에 데이터를 `INSERT` 합니다.
*   **SQL 예시 (새로운 Projection 로직)**:
    ```sql
    -- 이 쿼리는 Event Stream 에서 직접 실행되는 로직이 아니라, 
    -- 각 이벤트 발생 시점에 호출될 수 있는 INSERT 로직의 예시입니다.
    INSERT INTO read_daily_parsing_stats (date, scene_key, attempt_num, total_attempts, success_count)
    VALUES (
        DATE_TRUNC('day', :occurred_at),
        :scene_key,
        :attempt_num,
        1, -- 현재는 1 회 시도만 기록되므로 1, 추후 여러 시도가 오면 SUM 로 처리 필요
        CASE WHEN :grip_succeed = 1 THEN 1 ELSE 0 END
    )
    ON CONFLICT (date, scene_key, attempt_num) DO NOTHING; -- 중복 방지
    ```
    *(참고: 실제 이벤트 소싱에서는 각 이벤트마다 INSERT 하거나, 배치 처리 시 집계 로직을 적용해야 합니다.)*

**Step 2: 새로운 Read Model 테이블 생성**
*   `read_daily_parsing_stats` 테이블을 생성합니다.
    ```sql
    CREATE TABLE read_daily_parsing_stats (
        date DATE NOT NULL,
        scene_key VARCHAR NOT NULL,
        attempt_num SMALLINT NOT NULL,
        total_attempts INTEGER NOT NULL DEFAULT 0,
        success_count INTEGER NOT NULL DEFAULT 0,
        success_rate NUMERIC(5, 2) GENERATED ALWAYS AS (ROUND(success_count::numeric / NULLIF(total_attempts, 0) * 100, 2)) STORED,
        PRIMARY KEY (date, scene_key, attempt_num)
    );
    ```

**Step 3: v1 API 유지 (Backward Compatibility)**
*   v1 API 는 `read_grip_result` 테이블을 쿼리하여 개별 시도 데이터를 반환하도록 유지합니다.
*   v1 API 의 쿼리 로직은 변경되지 않으므로, 기존 클라이언트는 정상 작동합니다.

**Step 4: v2 API (또는 새 엔드포인트) 구현**
*   새로운 API 엔드포인트 (예: `/api/v2/insights/cards/daily-stats`) 를 만듭니다.
*   이 API 는 `read_daily_parsing_stats` 테이블을 쿼리하여 날짜별, 장면별, 시도별 집계 데이터를 반환합니다.
    ```sql
    SELECT 
        date,
        scene_key,
        attempt_num,
        total_attempts,
        success_count,
        success_rate
    FROM read_daily_parsing_stats
    WHERE date BETWEEN :start_date AND :end_date
    ORDER BY date, scene_key, attempt_num;
    ```

**Step 5: 데이터 동기화 (Sync)**
*   새로운 Projection 로직을 배포하여 과거 이벤트 (Backfill) 를 처리하거나, 실시간으로 새로운 데이터를 `read_daily_parsing_stats` 에 채워 넣습니다.

**Step 6: 컷오버 (Cutover)**
*   **Gradual Rollout**: 새로운 API 엔드포인트를 일부 트래픽에 노출하거나, A/B 테스트를 통해 검증합니다.
*   **Feature Flag**: 프론트엔드 또는 API 라우팅에서 `X-API-Version: v2` 헤더 등을 통해 요청을 라우팅합니다.
*   **Deprecation**: v1 API 가 더 이상 새로운 집계 데이터를 지원하지 않는다는 것을 문서화합니다. (v1 은 여전히 개별 데이터 조회는 가능하지만, 집계는 불가능하므로 클라이언트가 v2 로 마이그레이션하도록 유도)

**Step 7: 정리 (Cleanup)**
*   v1 API 가 완전히 폐기된 후, `read_daily_parsing_stats` 테이블과 관련 Projection 로직만 유지합니다.
*   `read_grip_result` 테이블은 v1 API 가 필요할 때까지 유지합니다.

### 요약
1.  **현재 상태**: 불가능 (Read Model 에 집계 없음).
2.  **해결책**: 새로운 Read Model (`read_daily_parsing_stats`) 생성 및 Projection 로직 추가.
3.  **호환성**: v1 API 는 기존 `read_grip_result` 기반 로직으로 유지, v2 API 로 새 기능 제공.
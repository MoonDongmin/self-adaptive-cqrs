제공된 자료 (로그 컨텍스트 및 Read Model 스키마) 를 분석한 결과, 요청하신 **'일자별 파지 성공률 추이 (날짜별 시도 수, 성공 수, 성공률)'** 조회는 **현재 Read Model 로 제공 불가능**합니다.

**이유:**
1.  **필터링 기준 부재:** `read_grip_result` 테이블의 `occurred_at` 필드는 `timestamptz` 형식입니다. 이를 기준으로 날짜 (`DATE`) 로 그룹화하려면 SQL 에서 `DATE_TRUNC` 또는 `DATE` 함수를 사용해야 합니다.
2.  **집계 기능 부재:** 요청은 '시도 수', '성공 수'를 집계하고 '성공률'을 계산하는 **GROUP BY** 쿼리가 필요합니다. 제공된 Read Model 스키마는 개별 파지 시도 (Row) 에 대한 데이터만 정의하고 있으며, 어떤 뷰 (View) 나 집계 테이블도 정의되어 있지 않습니다.
3.  **결론:** 기존 Read Model 은 단건 조회용 (Insight Card) 에 최적화되어 있어, 시간대별 집계 데이터를 직접 쿼리하여 결과를 반환할 수 없습니다.

---

### 기존 v1 API 클라이언트 호환성을 유지하는 변경 절차

기존 클라이언트가 깨지지 않도록 하려면 **Backward Compatibility (역호환성)** 를 최우선으로 해야 합니다. 즉, 기존 API 엔드포인트와 응답 스키마를 유지하면서, 새로운 기능은 별도의 엔드포인트나 파라미터로 제공해야 합니다.

#### 1. 버전 경로 전략 (URL Versioning)
가장 안전하고 명확한 방법은 URL 에 버전을 명시하는 것입니다.
*   **기존 API:** `/api/v1/insights/cards` (또는 해당 엔드포인트)
*   **신규 API:** `/api/v2/insights/cards` 또는 `/api/v1/insights/cards/stats` (기능 확장용)
*   **추천:** `/api/v2/insights/cards` 를 새로 생성하고, `/api/v1` 은 기존 로직만 유지합니다. 클라이언트 업데이트 시에만 v2 를 호출하도록 가이드합니다.

#### 2. 신구 병행 운영 (Parallel Operation)
*   **Read Model 유지:** 기존 `read_grip_result` 와 `read_multimodal` 테이블은 삭제하지 않고 그대로 유지합니다.
*   **신규 Read Model 생성:** 새로운 집계 데이터를 저장할 별도의 테이블 (예: `read_daily_parsing_stats`) 을 생성합니다.
    *   **필드:** `date` (DATE), `total_attempts` (INT), `success_count` (INT), `success_rate` (DECIMAL).
    *   **Primary Key:** `date`.
*   **API 응답 구조:**
    *   v1 API: 기존 스키마 그대로 반환 (데이터가 없으면 빈 배열 또는 빈 객체 반환).
    *   v2 API: 기존 스키마 + 새로운 필드 (선택적) 또는 완전히 새로운 스키마 반환.

#### 3. 마이그레이션 및 컷오버 절차

**Step 1: 신규 Read Model 스키마 정의 및 생성**
Postgres 에 새로운 테이블을 생성합니다.
```sql
CREATE TABLE read_daily_parsing_stats (
    date DATE NOT NULL,
    total_attempts INT NOT NULL DEFAULT 0,
    success_count INT NOT NULL DEFAULT 0,
    success_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    PRIMARY KEY (date)
);
```

**Step 2: Event Projection 로직 추가 (CQRS Side)**
기존 이벤트 소싱 파이프라인 (`grip-result-projector`) 에 새로운 Projection 을 추가하거나, 기존 Projection 을 확장하여 `parse_event` 시 신규 Read Model 을 업데이트하도록 코드를 수정합니다.
*   **Trigger:** `parse_event` 이벤트 (파지 결과 이벤트) 가 발생하면 실행.
*   **Logic:**
    1.  `occurred_at` 에서 날짜 (`DATE`) 를 추출.
    2.  해당 날짜의 `total_attempts` 와 `success_count` 를 카운트.
    3.  `success_rate` 계산: `(success_count * 100.0) / total_attempts`.
    4.  `read_daily_parsing_stats` 테이블에 INSERT 또는 UPSERT.

**Step 3: 백그라운드 작업 (Batch Processing) 설정**
실시간으로 모든 이벤트를 집계하면 성능 저하가 올 수 있으므로, 배치 처리를 권장합니다.
*   **SQL:** `read_grip_result` 테이블에서 날짜별 합계를 구하여 `read_daily_parsing_stats` 에 동기화.
```sql
INSERT INTO read_daily_parsing_stats (date, total_attempts, success_count, success_rate)
SELECT 
    DATE(occurred_at) as date,
    COUNT(*) as total_attempts,
    SUM(grip_succeed) as success_count,
    ROUND((SUM(grip_succeed)::numeric * 100.0) / COUNT(*), 2) as success_rate
FROM read_grip_result
WHERE DATE(occurred_at) = '2023-10-27' -- 요청된 날짜 필터링
ON CONFLICT (date) DO UPDATE SET
    total_attempts = EXCLUDED.total_attempts,
    success_count = EXCLUDED.success_count,
    success_rate = EXCLUDED.success_rate;
```
*   **자동화:** 이 쿼리를 Cron Job 으로 매일 밤 실행하거나, 실시간 Projection 에서 `ON CONFLICT DO UPDATE` 를 사용하여 즉시 반영하도록 구현합니다.

**Step 4: API 엔드포인트 확장**
*   **v1 API:** 기존 코드 그대로 유지. (기존 클라이언트 호환)
*   **v2 API:** 새로운 엔드포인트 생성.
    ```sql
    -- 예시: v2 API 의 SQL 로직 (필요시)
    SELECT 
        date,
        total_attempts,
        success_count,
        success_rate
    FROM read_daily_parsing_stats
    WHERE date BETWEEN '2023-10-20' AND '2023-10-27'
    ORDER BY date ASC;
    ```

**Step 5: 컷오버 (Cutover)**
*   **병행 기간:** v1 API 와 v2 API 를 동시에 운영. 클라이언트 측에서 새 버전 배포 후 v2 엔드포인트 호출 로직을 추가.
*   **데이터 정합성:** v2 API 가 정상 작동하는지 확인 (단순히 테이블이 있는지, 데이터가 있는지 확인).
*   **v1 API 유지:** v1 API 는 최소 1 개월 이상 유지하여 기존 클라이언트 호환성 보장. 이후 필요시 v1 을 deprecated 처리.

**Step 6: 기존 Read Model 최적화 (선택 사항)**
만약 `read_grip_result` 테이블이 너무 커져 성능 이슈가 발생하면, `occurred_at` 필드를 인덱싱하거나, `date` 기반의 별도 인덱스를 생성하여 향후 직접 쿼리 시 성능을 개선할 수 있습니다.
```sql
CREATE INDEX idx_read_grip_result_date ON read_grip_result (DATE(occurred_at));
```
*(이 단계는 즉시 수행하지 않고, 데이터 양이 충분히 쌓인 후 고려)*

### 요약
1.  **불가능:** 현재 Read Model 로는 불가능 (집계 로직 부재).
2.  **해결책:** 신규 Read Model (`read_daily_parsing_stats`) 생성 및 Projection 로직 추가.
3.  **호환성:** URL 버전 (`/v2`) 을 사용하여 기존 v1 API 를 건드리지 않음.
4.  **실행:** 신규 테이블 생성 -> Projection 로직 구현 (UPSERT) -> v2 API 개발 -> 병행 운영 -> v1 유지 후 단계적 전환.
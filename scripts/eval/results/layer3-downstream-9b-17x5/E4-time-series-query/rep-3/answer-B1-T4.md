제공된 자료 (Read Model 스키마 및 로그) 를 근거로 분석한 결과, **현재 Read Model 로 요청한 조회 (일자별 파지 성공률 추이) 를 제공할 수 없습니다.**

### 1. 불가능한 이유 분석
요청된 데이터는 **시간 (일자) 에 따른 집계 (Attempt 수, Success 수, Rate)** 입니다. 반면, 기존 Read Model (`read_grip_result`, `read_multimodal`) 은 **단건 조회용 (Denormalized)** 구조로 설계되어 있습니다.

*   **키 구조의 불일치:** Read Model 의 키는 `(scene_key, attempt_num)` 입니다. 이는 특정 장면과 특정 시도 번호를 찾는 데 최적화되어 있으며, `occurred_at` (일자) 를 키로 사용하지 않습니다.
*   **집계 기능 부재:** 테이블 구조상 `attempt_num` 이 Primary Key 중 하나이므로, 같은 `scene_key` 와 같은 `occurred_at` 을 가진 여러 행을 그룹화하여 `COUNT` 와 `SUM` 을 수행하는 SQL 쿼리 (`GROUP BY`) 가 효율적으로 실행되지 않습니다.
    *   만약 `occurred_at` 을 키로 포함시켜 `(scene_key, occurred_at, attempt_num)` 으로 변경하더라도, `scene_key` 가 너무 구체적 (카테고리~장면번호) 이므로, 모든 장면을 합쳐서 일별 총계를 구하려면 `scene_key` 를 `GROUP BY` 하거나 `UNION ALL` 하여 처리해야 하므로, 기존 Read Model 의 설계 목적 (단건 조회 성능) 과 배치 처리 (Projection) 로부터의 데이터 흐름이 맞지 않습니다.
*   **데이터 부재:** 로그를 보면 `insight.card.miss` 가 발생하여 해당 인사이트 카드 조회가 실패했습니다. 이는 해당 Read Model 에 필요한 데이터가 현재 저장되어 있지 않거나, Projection 이 완료되지 않았음을 시사합니다.

### 2. 해결 방안 (Read Model 변경)
요청을 지원하려면 새로운 Read Model 을 생성하거나 기존 Read Model 을 대폭 변경해야 합니다.
*   **새 Read Model 제안:** `read_daily_parsing_stats` 생성.
    *   키: `(date: date)`
    *   필드: `total_attempts: bigint`, `success_attempts: bigint`, `success_rate: numeric`.
*   **이벤트 소싱 프로세스:**
    1.  `grip-attempt` 이벤트 (또는 `read_grip_result` 업데이트 이벤트) 를 구독.
    2.  이벤트의 `occurred_at` 을 추출하여 `date` 로 변환.
    3.  `date` 를 기준으로 `total_attempts` 와 `success_attempts` 를 카운팅하여 새 Read Model 에 `INSERT` 또는 `UPSERT` 수행.

### 3. 기존 v1 API 클라이언트 호환성 유지 절차
기존 API 가 `read_grip_result` 를 기반으로 작동하고 있다면, 새 Read Model 을 즉시 도입하면 기존 API 가 깨질 수 있습니다. 따라서 **신구 병행 운영 (Dual Write / Dual Read)** 전략을 따르는 것이 안전합니다.

#### 구체적 단계

**Step 1: 새 Read Model 스키마 정의 및 생성**
*   `read_daily_parsing_stats` 테이블 생성.
*   필드: `date (date)`, `total_attempts (bigint)`, `success_attempts (bigint)`, `success_rate (numeric)`.
*   Primary Key: `date`.

**Step 2: Projection 로직 추가 (Event Handler)**
*   기존 `grip-result-projector` 로직을 확장하거나 새 Projector 를 생성.
*   `grip-attempt` 이벤트 (또는 `read_grip_result` 변경 이벤트) 를 구독.
*   **집계 로직:**
    ```sql
    -- Pseudo-code for Event Handler logic
    SELECT 
        DATE(occurred_at) as date,
        COUNT(*) as total_attempts,
        SUM(grip_succeed) as success_attempts
    FROM read_grip_result
    WHERE occurred_at >= :start_date AND occurred_at < :end_date
    GROUP BY DATE(occurred_at);
    ```
*   결과를 `read_daily_parsing_stats` 에 `INSERT` 또는 `UPSERT` (ON CONFLICT DO UPDATE) 로 저장.

**Step 3: API 레이어 수정 (Backward Compatibility)**
*   **v1 API (기존):** `read_grip_result` 테이블을 계속 쿼리하여 기존 응답 형식 유지.
*   **v2 API (신규):** `read_daily_parsing_stats` 테이블을 쿼리하여 새로운 응답 형식 제공.
*   **Client Side:** 클라이언트 코드 변경 없이, API 엔드포인트를 `GET /api/v1/...` 와 `GET /api/v2/...` 로 분리하여 호출하도록 안내 또는 자동 라우팅 구현.

**Step 4: 마이그레이션 및 컷오버 (Cutover)**
1.  **병행 운영 기간:** v1 API 와 v2 API 를 동시에 운영.
    *   v1 API 는 `read_grip_result` 쿼리 계속 사용.
    *   v2 API 는 `read_daily_parsing_stats` 쿼리 사용.
    *   데이터 불일치 발생 시 (예: v1 에는 데이터가 있다가 v2 에는 없는 경우 등), Projection 로직의 지연이나 불일치를 모니터링.
2.  **데이터 동기화 확인:** 일정 기간 (예: 1 주일) 동안 두 Read Model 의 데이터가 일정하게 유지되는지, Projection 이 정상적으로 새 테이블로 데이터를 채우고 있는지 모니터링.
3.  **v1 API下线:**
    *   `read_grip_result` 가 더 이상 필요 없거나, v2 API 가 모든 시나리오를 커버할 수 있음을 확인.
    *   `read_grip_result` 테이블의 `scene_key` 기반 쿼리가 `read_daily_parsing_stats` 기반 쿼리로 완전히 대체될 수 있는지 확인.
    *   v1 API 엔드포인트를 `GET /api/v1/...` 에서 `GET /api/v2/...` 로 변경 (URL 경로 변경).
    *   v1 API 서버를下线.

**Step 5: 최종 상태**
*   모든 트래픽이 `read_daily_parsing_stats` 를 통해 처리되는 v2 API 만 남음.
*   `read_grip_result` 테이블은 유지 (필요시 다른 용도) 또는 아카이빙.

### SQL 코드 (새 Read Model 생성 및 Projection 로직 예시)

```sql
-- 1. 새 Read Model 생성
CREATE TABLE read_daily_parsing_stats (
    date DATE PRIMARY KEY,
    total_attempts BIGINT NOT NULL DEFAULT 0,
    success_attempts BIGINT NOT NULL DEFAULT 0,
    success_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.00
);

-- 2. Projection 로직 (Event Handler 내 실행될 SQL)
-- 주석: 실제 이벤트 소싱 프레임워크 (예: Debezium, Kafka Connect, 또는 직접 구현된 Consumer) 에서 
--      read_grip_result 테이블의 변경 사항 (INSERT/UPDATE) 을 감지하고 이 쿼리를 실행해야 함.
--      여기서는 read_grip_result 테이블을 스캔하여 집계하는 쿼리 예시.
--      실제 구현 시에는 'grip-attempt' 스트림 이벤트를 직접 구독하여 처리하는 것이 효율적임.

-- 만약 read_grip_result 테이블을 스캔하여 집계하는 경우 (비효율적일 수 있으나 예시용):
-- WHERE 조건은 Projection 의 윈도우 (예: 최근 1h) 나 특정 기간에 따라 달라짐.
-- 일별 집계용 쿼리:
SELECT 
    DATE(occurred_at) as date,
    COUNT(*) as total_attempts,
    SUM(grip_succeed) as success_attempts
FROM read_grip_result
WHERE occurred_at >= '2023-09-23' AND occurred_at < '2023-09-24'
GROUP BY DATE(occurred_at);

-- 3. Upsert 로직 (예시: Python/Pseudo-code 로 표현된 SQL 연산)
-- INSERT INTO read_daily_parsing_stats (date, total_attempts, success_attempts, success_rate)
-- SELECT date, total_attempts, success_attempts, ROUND(CAST(success_attempts AS NUMERIC) / NULLIF(total_attempts, 0) * 100, 2)
-- FROM (
--     SELECT 
--         DATE(occurred_at) as date,
--         COUNT(*) as total_attempts,
--         SUM(grip_succeed) as success_attempts
--     FROM read_grip_result
--     WHERE occurred_at >= '2023-09-23' AND occurred_at < '2023-09-24'
--     GROUP BY DATE(occurred_at)
-- ) sub
-- ON CONFLICT (date) DO UPDATE SET
--     total_attempts = EXCLUDED.total_attempts,
--     success_attempts = EXCLUDED.success_attempts,
--     success_rate = EXCLUDED.success_rate;
```

**주의:** 위 SQL 은 `read_grip_result` 테이블 전체를 스캔하여 일별 집계를 구하는 방식입니다. 이벤트 소싱 환경에서는 **각 `grip-attempt` 이벤트 발생 시점에 즉시 집계**하는 것이 좋습니다.

```sql
-- 4. 이벤트 기반 Upsert 로직 (추천)
-- 이벤트: { "stream_id": "grip-attempt:...", "occurred_at": "2023-09-23T...", "grip_succeed": 1 }
-- SQL:
INSERT INTO read_daily_parsing_stats (date, total_attempts, success_attempts, success_rate)
VALUES (
    DATE('2023-09-23T00:00:00Z'), -- occurred_at 에서 추출
    COALESCE((SELECT total_attempts FROM read_daily_parsing_stats WHERE date = DATE('2023-09-23T00:00:00Z')), 0),
    COALESCE((SELECT success_attempts FROM read_daily_parsing_stats WHERE date = DATE('2023-09-23T00:00:00Z')), 0) + CASE WHEN 'grip_succeed'::smallint = 1 THEN 1 ELSE 0 END,
    0.00 -- 비율은 재계산 필요
)
ON CONFLICT (date) DO UPDATE SET
    total_attempts = read_daily_parsing_stats.total_attempts + 1, -- 단순 예시, 실제는 기존 값 유지 후 증가
    success_attempts = read_daily_parsing_stats.success_attempts + CASE WHEN 'grip_succeed'::smallint = 1 THEN 1 ELSE 0 END,
    success_rate = ROUND(
        (read_daily_parsing_stats.success_attempts + CASE WHEN 'grip_succeed'::smallint = 1 THEN 1 ELSE 0 END)::numeric / 
        NULLIF(read_daily_parsing_stats.total_attempts + 1, 0) * 100, 
        2
    );
```
*(참고: 위 SQL 은 트랜잭션 내에서의 로직을 단순화한 예시이며, 실제 구현 시 `total_attempts` 증가 시 `success_rate` 를 즉시 재계산하는 로직이 필요합니다.)*
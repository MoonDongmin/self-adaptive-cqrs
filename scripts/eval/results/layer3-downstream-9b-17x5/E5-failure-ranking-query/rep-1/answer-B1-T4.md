제공된 자료 (로그 컨텍스트, Read Model 스키마) 에 따르면, 요청하신 "파지 실패가 가장 많은 객체 상위 목록 (객체별 실패 수, 실패율, 순위)"을 조회하기 위한 **Read Model 은 현재 존재하지 않습니다**.

*   `read_grip_result` 는 `(scene_key, attempt_num)` 단위로 파지 성공/실패 여부를 저장하며, `object_name` 은 개별 시도당 하나의 값만 가집니다.
*   `read_multimodal` 은 미디어 링크만 저장합니다.
*   로그에는 `insight.card.miss` 이벤트가 발생하고 있으나, 이를 집계하여 "객체별" 통계로 변환하는 Read Model (`read_insight_card_failure_stats` 등) 은 정의되어 있지 않습니다.

따라서 **기존 v1 API 클라이언트가 깨지지 않게 하려면, 새로운 Read Model 을 생성하지 않고 기존 API 응답 구조를 유지하는 'Backward Compatibility(역호환)' 전략**을 취해야 합니다.

구체적인 단계는 다음과 같습니다.

### 1. 버전 경로 전략 (Versioning Strategy)
기존 클라이언트가 `GET /api/v1/...` 엔드포인트를 호출하고 있으므로, 새 API 를 추가할 때 **메서드 (Method)** 나 **URL 경로**를 변경하지 않고, **Response Body**의 구조를 확장하거나 **새로운 엔드포인트**를 만드는 방식을 선택해야 합니다.

*   **추천 방식: 새 엔드포인트 사용 (`/api/v1/insight-card-failure-stats`)**
    *   기존 `/api/v1/insight-card` (단건 조회) 엔드포인트를 건드리지 않습니다.
    *   새로운 엔드포인트를 통해 요청을 처리하므로, 기존 클라이언트는 영향을 받지 않습니다.
    *   *주의:* 만약 요청이 `/api/v1/insight-card`로 오고, 이 엔드포인트가 "상위 목록"을 반환해야 한다면, Response Body 에 `data` 와 `meta` (또는 `error`) 필드를 분리하여 반환해야 합니다.

### 2. 신구 병행 운영 (Parallel Operation)
Read Model 이 없으므로, 백엔드는 **On-the-fly(실시간) 계산** 또는 **임시 Read Model**을 사용해야 합니다.

*   **전략 A: 실시간 집계 (Real-time Aggregation) - 추천**
    *   요청이 들어오면 `read_grip_result` 테이블을 직접 쿼리하여 `object_name` 을 그룹화하고, `SUM(grip_succeed = 0)` 과 `COUNT(*)` 을 계산하여 실패율과 실패 수를 실시간으로 구한 뒤, JSON 포맷으로 반환합니다.
    *   장점: 별도의 DB 스키마 변경 없이 즉시 구현 가능.
    *   단점: 데이터 양이 많을 경우 성능 저하.
*   **전략 B: 임시 Read Model 생성 (Temporary Read Model)**
    *   `read_grip_result` 데이터를 기반으로 `read_insight_card_failure_stats`라는 새 테이블을 생성합니다.
    *   `insert.batch` 이벤트가 들어올 때마다 이 테이블을 업데이트합니다.
    *   API 는 이 새 테이블을 조회합니다.
    *   *주의:* 기존 v1 API 가 이 새 테이블을 참조하지 않으므로, 이 단계는 **새로운 API 엔드포인트**에 적용되어야 합니다.

### 3. 마이그레이션 및 컷오버 절차 (Migration & Cutover)

#### 단계 1: 새 Read Model 스키마 정의 및 생성
`read_insight_card_failure_stats` 테이블을 생성합니다.
*   **Key:** `(object_name)`
*   **Fields:** `failure_count` (int), `total_count` (int), `failure_rate` (numeric), `last_updated_at` (timestamptz).
*   **Index:** `object_name` 에 인덱스 생성.

```sql
CREATE TABLE read_insight_card_failure_stats (
    object_name VARCHAR PRIMARY KEY,
    failure_count INT DEFAULT 0,
    total_count INT DEFAULT 0,
    failure_rate NUMERIC(5, 2) DEFAULT 0.00,
    last_updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 단계 2: 이벤트 소싱 로직 추가 (Event Handler)
`insert.batch` 이벤트가 `read_grip_result` 를 업데이트할 때, 동시에 `read_insight_card_failure_stats` 를 업데이트하는 핸들러를 추가합니다.
*   `insert.batch` 이벤트의 `payload` 에서 `objects` 배열을 확인.
*   각 `object` 에 대해 `read_grip_result` 에 `insert` 가 될 때마다 `read_insight_card_failure_stats` 의 `total_count` 를 증가시키고, `read_grip_result` 의 `grip_succeed` 가 0 이라면 `failure_count` 를 증가시킵니다.
*   `failure_rate` 는 `(failure_count * 100.0) / total_count` 로 계산하여 저장합니다.

#### 단계 3: API 응답 구조 설계 (Backward Compatibility)
기존 v1 API 클라이언트가 깨지지 않게 하려면, **기존 엔드포인트의 응답 스키마를 변경하지 않는 것**이 핵심입니다.

*   **시나리오 1: 새 엔드포인트 사용**
    *   새 API: `GET /api/v1/insight-card-failure-stats`
    *   기존 API: `GET /api/v1/insight-card` (변경 없음)
    *   클라이언트 영향: 없음.

*   **시나리오 2: 기존 엔드포인트 확장 (Response Envelope)**
    *   기존 API: `GET /api/v1/insight-card`
    *   기존 응답: `{ "data": { "scene_key": "...", "object_name": "..." } }`
    *   새 응답: `{ "data": { "scene_key": "...", "object_name": "..." }, "meta": { "top_failure_objects": [ { "object_name": "...", "failure_count": 10, "failure_rate": 0.50 } ] } }`
    *   클라이언트 영향: 기존 클라이언트는 `data` 만 파싱하므로 깨지지 않음. 새 클라이언트는 `meta` 를 파싱하여 목록을 볼 수 있음.

#### 단계 4: 데이터 마이그레이션 (Data Migration)
새 Read Model 을 생성하고, 기존에 쌓인 `read_grip_result` 데이터를 새 테이블로 이관합니다.

```sql
INSERT INTO read_insight_card_failure_stats (object_name, failure_count, total_count, last_updated_at)
SELECT 
    object_name,
    SUM(1 - grip_succeed) as failure_count, -- 0 이면 1, 1 이면 0 으로 계산 (가정: 0=실패, 1=성공)
    COUNT(*) as total_count,
    NOW()
FROM read_grip_result
GROUP BY object_name;

-- 실패율 계산 (Postgres 함수 활용)
UPDATE read_insight_card_failure_stats
SET failure_rate = ROUND((failure_count * 100.0) / NULLIF(total_count, 0), 2);
```

#### 단계 5: 컷오버 (Cutover)
1.  **Rollout:** 새 API 엔드포인트 (또는 확장된 응답) 를 배포합니다.
2.  **Verification:** 새 Read Model 이 정상 작동하는지, 실시간 집계 로직이 맞는지 확인합니다.
3.  **Traffic Switch:**
    *   **방식 A (새 엔드포인트):** 새 엔드포인트만 트래픽을 받도록 라우팅 규칙 변경. 기존 v1 API 는 그대로 유지.
    *   **방식 B (응답 확장):** 기존 v1 API 응답에 `meta` 필드를 추가. 기존 클라이언트는 `data` 만 읽으므로 무방. 새 클라이언트는 `meta` 를 읽음.
4.  **Decommission:** 모든 트래픽이 새 방식 (또는 확장된 응답) 으로 이동하고 안정화되면, 필요시 기존 로직 (On-the-fly 계산) 을下线하거나, 새 Read Model 을 Primary 로 사용하도록 전환합니다.

### 요약: 기존 v1 API 를 깨치지 않는 핵심 원칙
1.  **URL/Method 변경 금지:** 기존 `/api/v1/...` 경로는 그대로 둡니다.
2.  **Response Schema 변경 금지:** 기존 필드 (`data`) 는 그대로 유지합니다.
3.  **새 필드 추가 허용:** Response 에 `meta` 또는 `additional_data` 같은 새 필드를 추가하되, 기존 필드 구조는 유지합니다.
4.  **Read Model 부재 해결:** 새 Read Model 을 만들지 못하면, API 핸들러 내부에서 `read_grip_result` 를 직접 JOIN/AGGREGATE 하여 응답을 생성합니다.

**SQL 코드 (새 Read Model 생성 및 초기화):**

```sql
-- 1. 새 Read Model 테이블 생성
CREATE TABLE IF NOT EXISTS read_insight_card_failure_stats (
    object_name VARCHAR PRIMARY KEY,
    failure_count INT DEFAULT 0,
    total_count INT DEFAULT 0,
    failure_rate NUMERIC(5, 2) DEFAULT 0.00,
    last_updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 기존 데이터로 초기화 (Migration)
-- 가정: grip_succeed=0 이 실패, 1 이 성공
INSERT INTO read_insight_card_failure_stats (object_name, failure_count, total_count, last_updated_at)
SELECT 
    object_name,
    SUM(1 - grip_succeed) as failure_count,
    COUNT(*) as total_count,
    NOW()
FROM read_grip_result
GROUP BY object_name;

-- 3. 실패율 계산
UPDATE read_insight_card_failure_stats
SET failure_rate = ROUND((failure_count * 100.0) / NULLIF(total_count, 0), 2);

-- 4. 성능 최적화 (인덱스)
CREATE INDEX IF NOT EXISTS idx_read_insight_card_failure_stats_object_name ON read_insight_card_failure_stats(object_name);
```

이후 API 핸들러는 `read_insight_card_failure_stats` 테이블을 `ORDER BY failure_rate DESC` 로 정렬하여 상위 N 개를 반환하도록 구현하면 됩니다.
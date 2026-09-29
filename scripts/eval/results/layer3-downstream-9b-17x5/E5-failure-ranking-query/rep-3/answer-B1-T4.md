제공된 자료 (로그 컨텍스트, Read Model 스키마) 에 따르면, 요청하신 "파지 실패가 가장 많은 객체 상위 목록 (객체별 실패 수, 실패율, 순위)"을 조회하기 위한 **Read Model 은 현재 존재하지 않습니다**.

*   `read_grip_result` 는 `(scene_key, attempt_num)` 단위로 파지 성공/실패 여부를 저장하며, `object_name` 은 필드가 있지만, **객체별 집계 (Group By)** 로 실패 수나 실패율을 계산할 수 있는 구조가 아닙니다.
*   `read_multimodal` 은 미디어 링크만 저장하며 실패 정보와 무관합니다.
*   로그에는 `insight.card.miss` 이벤트가 발생하고 있으나, 이를 기반으로 객체별 집계 Read Model 을 즉시 생성할 수 있는 데이터 (예: `object_name` 과 `miss` 상태의 연관성) 가 명시적으로 정의되어 있지 않습니다.

따라서 **기존 v1 API 클라이언트가 깨지지 않게 하려면**, 새로운 기능 (객체별 실패율 조회) 을 제공하는 **새로운 API 엔드포인트 (v2)** 를 추가하고, 기존 API (v1) 는 현재 Read Model (`read_grip_result`) 을 그대로 사용하여 응답하는 **버전 병행 전략**을 적용해야 합니다.

구체적 단계는 다음과 같습니다.

### 1. 버전 경로 설계 (Versioning Strategy)
기존 클라이언트 호환성을 위해 URL 에 버전을 명시하는 방식을 권장합니다.
*   **기존 API (v1):** `/api/v1/insights/cards/{card_id}` (또는 현재 사용 중인 경로)
    *   **응답:** `read_grip_result` 를 기반으로 한 기존 형식 (단건 조회 등).
*   **신규 API (v2):** `/api/v2/insights/objects/failure-rank` (예상 경로)
    *   **응답:** 요청하신 "객체별 실패 수, 실패율, 순위"를 포함하는 새로운 JSON 형식.

### 2. 신구 병행 운영 (Parallel Operation)
*   **클라이언트 측:** v1 API 를 계속 호출하는 기존 클라이언트와, 새로운 기능을 테스트하거나 사용하는 v2 API 를 호출하는 새 클라이언트 (또는 기존 클라이언트의 새 엔드포인트 호출) 를 동시에 운영합니다.
*   **서버 측:** 두 버전의 API 로직을 별도의 핸들러로 분리합니다. v1 요청은 기존 Read Model 로 처리하고, v2 요청은 새로 구현할 로직으로 처리합니다.

### 3. 마이그레이션 및 컷오버 절차 (Migration & Cutover)

#### 단계 1: 새로운 Read Model 생성 및 이벤트 소싱 로직 구현
*   **새 Read Model 정의:** `read_object_failure_stats` (또는 유사한 이름) 테이블 생성.
    *   필드: `object_name` (varchar), `total_attempts` (int), `failed_attempts` (int), `failure_rate` (numeric), `rank` (int).
    *   Primary Key: `object_name`.
*   **이벤트 소싱 로직 추가:**
    *   `insight.card.miss` 이벤트가 발행될 때마다, 해당 이벤트의 `detail` (로그에서 확인: "파지 실패가 가장 많은 객체...") 에 포함된 `object_name` 을 추출합니다.
    *   `read_grip_result` 의 `object_name` 과 `stream_id` 를 통해 해당 객체의 전체 시도 수 (`total_attempts`) 와 실패 시도 수 (`failed_attempts`) 를 실시간으로 집계합니다.
    *   **주의:** 제공된 자료에는 `insight.card.miss` 이벤트의 `detail` 필드에 구체적인 `object_name` 값이 포함되어 있지 않습니다. 따라서 이 단계에서는 `insight.card.miss` 이벤트가 `object_name` 을 포함하도록 이벤트 스키마를 변경하거나, `read_grip_result` 에서 `object_name` 을 추출하여 `miss` 상태인 경우에만 카운트하는 로직을 구현해야 합니다. (자료에 명시된 `detail` 값만으로는 객체명을 추출할 수 없으므로, 이 부분이 구현의 핵심 전제 조건입니다.)

#### 단계 2: v2 API 구현 및 테스트
*   **SQL 쿼리 작성:** `read_object_failure_stats` 테이블에서 `object_name` 을 기준으로 `failed_attempts` 와 `total_attempts` 를 그룹화하고, `failure_rate` 를 계산하며, `ORDER BY failure_rate DESC` 로 정렬하는 쿼리를 작성합니다.
*   **API 엔드포인트 구현:** v2 경로를 통해 이 데이터를 JSON 형식으로 반환합니다.

#### 단계 3: 병행 운영 기간 (Coexistence)
*   v1 API 와 v2 API 를 동시에 노출합니다.
*   기존 클라이언트는 v1 을 계속 호출하므로 서비스 중단 없이 운영됩니다.
*   새로운 기능은 v2 를 통해 제공되며, 필요시 A/B 테스트를 통해 v1 을 v2 로 점진적으로 전환할 수 있습니다.

#### 단계 4: 컷오버 (Cutover)
*   v2 API 가 안정적으로 작동하고, v1 API 의 성능이나 데이터 정확도 이슈가 발생하지 않을 때, 기존 클라이언트 배포를 중단합니다.
*   기존 클라이언트 코드베이스를 v2 API 호출 로직으로 업데이트합니다.
*   v1 API 엔드포인트를 비활성화하거나 (Deprecation) 유지합니다.

### 4. SQL 코드 (Postgres)

요청하신 "파지 실패가 가장 많은 객체 상위 목록"을 조회하기 위한 SQL 쿼리입니다.
**가정:** `read_grip_result` 테이블에 `object_name` 필드가 있고, `stream_id` 에는 `grip-attempt:` 접두사가 포함되어 있으며, `insight.card.miss` 이벤트의 `detail` 필드에서 `object_name` 을 추출할 수 있는 로직이 있다고 가정합니다.
**주의:** 제공된 자료의 `insight.card.miss` 로그 `detail` 필드에는 "파지 실패가 가장 많은 객체..."라는 텍스트만 있고, 실제 `object_name` 값이 없습니다. 따라서 이 쿼리는 **가상의 `read_object_failure_stats` 테이블**을 기준으로 작성되었으며, 실제 구현 시에는 `object_name` 추출 로직이 필요합니다.

```sql
-- 가상의 집계 Read Model: read_object_failure_stats
-- 필드: object_name, total_attempts, failed_attempts, failure_rate
-- 목적: 파지 실패가 가장 많은 객체 상위 목록 (실패 수, 실패율 순위)

SELECT 
    object_name,
    failed_attempts,
    ROUND((failed_attempts::numeric / NULLIF(total_attempts, 0)) * 100, 2) AS failure_rate,
    RANK() OVER (ORDER BY (failed_attempts::numeric / NULLIF(total_attempts, 0)) DESC) AS rank
FROM 
    read_object_failure_stats
WHERE 
    total_attempts > 0
ORDER BY 
    rank ASC
LIMIT 100;
```

**참고:** 만약 `read_object_failure_stats` 테이블이 아직 없다면, `read_grip_result` 테이블을 직접 쿼리하여 실시간으로 집계해야 합니다. 그 경우 SQL 은 다음과 같이 복잡해지며, 성능 이슈가 발생할 수 있습니다.

```sql
-- read_grip_result 를 직접 집계하는 경우 (실시간 쿼리)
-- 주의: 대용량 데이터일 경우 성능 저하가 예상됨
SELECT 
    object_name,
    COUNT(*) FILTER (WHERE grip_succeed = 0) AS failed_attempts,
    COUNT(*) AS total_attempts,
    ROUND((COUNT(*) FILTER (WHERE grip_succeed = 0)::numeric / NULLIF(COUNT(*), 0)) * 100, 2) AS failure_rate
FROM 
    read_grip_result
WHERE 
    -- 시간 범위 제한 (예: 최근 1h) 또는 전체 데이터
    -- (로그에서 확인한 시간대 08:47:24 기준 필터링 필요)
    occurred_at >= NOW() - INTERVAL '1 hour'
GROUP BY 
    object_name
ORDER BY 
    (COUNT(*) FILTER (WHERE grip_succeed = 0)::numeric / NULLIF(COUNT(*), 0)) DESC
LIMIT 100;
```

**결론:** 자료에 명시된 `read_grip_result` 만으로는 "객체별" 실패율 순위 조회가 불가능하므로, **새로운 Read Model (`read_object_failure_stats`) 을 생성**하고, **v2 API 를 추가**하여 기존 v1 클라이언트와 병행 운영하는 것이 유일한 해결책입니다.
제공된 자료 (로그 컨텍스트, Read Model 스키마) 에 따르면, 요청하신 "파지 실패가 가장 많은 객체 상위 목록 (객체별 실패 수, 실패율, 순위)"을 조회하기 위한 **Read Model 은 현재 존재하지 않습니다**.

*   `read_grip_result` 는 `(scene_key, attempt_num)` 단위로 파지 성공/실패 여부를 저장하며, `object_name` 은 개별 시도당 하나의 값만 가집니다.
*   `read_multimodal` 은 미디어 링크만 저장합니다.
*   로그에는 `insight.card.miss` 이벤트가 발생하고 있으나, 이를 집계하여 '객체별' 통계로 변환하는 Read Model 은 정의되어 있지 않습니다.

따라서 **기존 v1 API 클라이언트가 깨지지 않게 하려면, 새로운 기능 구현 시 기존 API 엔드포인트의 응답 구조를 유지하면서, 새로운 기능은 별도의 엔드포인트 (버전) 로 제공해야 합니다.**

구체적인 단계별 절차는 다음과 같습니다.

### 1. 버전 경로 설계 (Versioning Strategy)
기존 클라이언트가 `GET /api/v1/insights/cards/{id}` 와 같은 경로를 호출하고 있다면, 새 기능은 URL 에 버전을 명시하여 분리해야 합니다.

*   **기존 API:** `GET /api/v1/insights/cards/{card_id}` (단건 조회, 기존 로직 유지)
*   **신규 API:** `GET /api/v2/insights/cards/top-failure-objects` (또는 `GET /api/v1/insights/cards/top-failure-objects?_v=2`)
    *   *권장:* `GET /api/v2/insights/cards/top-failure-objects`
    *   이유: CQRS 아키텍처에서 Read Model 을 변경할 때, 기존 Write Model 로 생성된 데이터와 새로운 Read Model 을 혼용하면 데이터 불일치가 발생할 수 있습니다. 새로운 집계 로직은 별도의 Read Model (`read_insight_object_failure_stats`) 을 생성하고, 이를 사용하는 API 는 v2 버전을 사용하여 기존 클라이언트와의 호환성을 보장합니다.

### 2. 신구 병행 운영 (Parallel Operation)
버전 변경을 즉시 적용하지 않고, 두 버전을 동시에 운영하여 점진적으로 전환합니다.

*   **기존 Read Model (`read_grip_result`, `read_multimodal`) 유지:**
    *   기존 v1 API 는 `read_grip_result` 테이블을 쿼리하여 `(scene_key, attempt_num)` 단위의 상세 정보를 반환합니다.
    *   기존 클라이언트는 이 엔드포인트를 계속 호출하므로, 기존 기능은 정상 작동합니다.
*   **신규 Read Model (`read_insight_object_failure_stats`) 생성:**
    *   **스키마 정의:** `read_insight_object_failure_stats` 테이블 생성.
        *   `object_name`: varchar (객체명)
        *   `failure_count`: bigint (실패 횟수)
        *   `total_count`: bigint (총 시도 횟수)
        *   `failure_rate`: numeric (실패율, 예: 0.5)
        *   `last_updated_at`: timestamptz
        *   `stream_id`: varchar (추적용, `read_grip_result` 의 stream_id 와 매핑)
    *   **프로젝터 (Projector) 구현:**
        *   `insight.card.miss` 이벤트 (파지 실패) 와 `insight.card.hit` (또는 성공 이벤트, 만약 있다면) 또는 `read_grip_result` 의 `grip_succeed=0` 을 감지하여, `object_name` 을 키로 그룹화하여 집계하는 로직을 구현합니다.
        *   제공된 로그에서는 `insight.card.miss` 이벤트가 `detail` 필드에 "파지 실패가 가장 많은 객체..."라는 텍스트가 포함되어 있으나, 실제 비즈니스 로직은 `grip_succeed=0` 인 경우를 '실패'로 간주하는 것이 일반적입니다. 만약 `insight.card.miss` 이벤트 자체가 '객체 없음'을 의미한다면, 해당 이벤트의 `detail` 필드에서 `object_name` 을 추출하여 집계해야 합니다. (자료상 `detail` 에 "insight 카드 없음: ...를 조회하고 싶다"라고 되어 있어, 이 이벤트가 '사용자 요청'을 기록한 로그일 가능성이 높으므로, 실제 파지 실패 이벤트 (예: `grip.fail` 등) 가 있는지 확인이 필요합니다. **하지만 주어진 자료만 근거로 할 때**, `insight.card.miss` 이벤트가 발생했을 때 `detail` 에 포함된 `object_name` 을 추출하여 `read_insight_object_failure_stats` 를 업데이트하는 로직을 가정해야 합니다.)
    *   **프로젝터 구현 시 주의사항:**
        *   `read_grip_result` 가 `grip_succeed` 를 가지고 있다면, `grip_succeed=0` 인 레코드를 `object_name` 으로 그룹화하여 `read_insight_object_failure_stats` 를 업데이트합니다.
        *   만약 `insight.card.miss` 이벤트가 '객체 파지 실패'를 의미하는 이벤트라면, 해당 이벤트의 `detail` 에서 `object_name` 을 파싱하여 집계합니다. (자료상 `detail` 에 "insight 카드 없음: 파지 실패가 가장 많은 객체..."라는 문구가 있는데, 이는 사용자 요청 내용일 수 있으므로, 실제 이벤트 데이터 구조가 `object_name` 을 포함하는지 확인해야 합니다. **가정:** `insight.card.miss` 이벤트의 `detail` 필드가 JSON 이거나, `object_name` 이 별도 필드로 존재한다고 가정하거나, `read_grip_result` 의 `grip_succeed=0` 을 기준으로 합니다.)
        *   **가장 안전한 접근 (자료 기반):** `read_grip_result` 테이블의 `grip_succeed=0` 인 데이터를 `object_name` 으로 GROUP BY 하여 `read_insight_object_failure_stats` 를 업데이트하는 프로젝터를 만듭니다.

### 3. 마이그레이션 및 컷오버 절차

#### 단계 1: 신규 Read Model 스키마 생성 및 마이그레이션
*   `read_insight_object_failure_stats` 테이블을 생성합니다.
*   초기 데이터는 빈 값으로 시작합니다.

#### 단계 2: 신규 프로젝터 배포 및 검증
*   신규 프로젝터 코드를 배포합니다.
*   이벤트 소싱 엔진 (예: Kafka, RabbitMQ 등) 에서 `insight.card.miss` 또는 `grip.fail` (가정) 이벤트를 구독하여 `read_insight_object_failure_stats` 를 업데이트합니다.
*   **검증:** 신규 API (`/api/v2/...`) 를 호출하여 데이터가 정상적으로 집계되는지 확인합니다.

#### 단계 3: 기존 API (v1) 유지
*   기존 v1 API 는 `read_grip_result` 를 계속 쿼리합니다.
*   기존 클라이언트는 v1 엔드포인트를 계속 호출하므로, **아무런 영향 없이 정상 작동**합니다.

#### 단계 4: 클라이언트 업데이트 및 컷오버 (Gradual Rollout)
*   **옵션 A (추천):** 신규 클라이언트 (v2) 를 배포하고, 기존 클라이언트 (v1) 는 그대로 두는 상태로 병행 운영합니다.
    *   신규 클라이언트는 `/api/v2/insights/cards/top-failure-objects` 를 호출합니다.
    *   기존 클라이언트는 `/api/v1/insights/cards/{id}` 를 호출합니다.
*   **옵션 B (API Response Versioning):** 만약 클라이언트 변경 없이 API 응답 구조만 확장해야 한다면 (권장하지 않음, CQRS 원칙 위배 가능성), API 응답에 `version` 필드를 추가하거나, `data` 필드 안에 `legacy` 와 `new` 서브 객체를 포함하는 방식으로 변경해야 합니다. 하지만 질문의 전제인 "기존 v1 API 클라이언트가 깨지지 않게 하려면"은 **엔드포인트 분리**가 가장 확실한 방법입니다.

#### 단계 5: 컷오버 (Cutover)
*   신규 Read Model (`read_insight_object_failure_stats`) 이 충분히 안정적으로 데이터를 유지하고, v2 API 가 정상 응답하는 것을 확인합니다.
*   기존 v1 API 에서 해당 기능 (상위 목록 조회) 을 제거하거나, v1 API 를 완전히 v2 로 변경합니다.
*   **주의:** 만약 v1 API 가 "상위 목록 조회"를 지원해야 하는 경우, v1 API 로도 해당 기능을 지원하려면 `read_grip_result` 데이터를 실시간으로 집계하는 로직을 v1 API 내부 쿼리로 구현해야 합니다. 하지만 이는 CQRS 원칙 (Read Model 전용) 을 위배할 수 있으므로, **v1 API 는 기존 기능 (단건 조회 등) 만 지원하고, 새 기능은 v2 API 에서 제공하는 것이 안전합니다.**

### 요약: SQL 코드 (신규 Read Model 생성용)

```sql
-- 신규 Read Model: read_insight_object_failure_stats 생성
-- 용도: 객체별 파지 실패 수 및 실패율 집계
CREATE TABLE IF NOT EXISTS read_insight_object_failure_stats (
    object_name VARCHAR(255) NOT NULL,
    failure_count BIGINT NOT NULL DEFAULT 0,
    total_count BIGINT NOT NULL DEFAULT 0,
    failure_rate NUMERIC(5, 4) NOT NULL DEFAULT 0.0,
    last_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    stream_id VARCHAR(255),
    global_seq BIGINT,
    PRIMARY KEY (object_name)
);

-- 인덱스 생성 (필요시)
CREATE INDEX IF NOT EXISTS idx_read_insight_object_failure_stats_stream_id ON read_insight_object_failure_stats (stream_id);
CREATE INDEX IF NOT EXISTS idx_read_insight_object_failure_stats_global_seq ON read_insight_object_failure_stats (global_seq);
```

### 요약: API 변경 사항

1.  **기존 API (`/api/v1/insights/cards/{card_id}`):**
    *   `read_grip_result` 테이블을 쿼리하여 `(scene_key, attempt_num)` 단위의 상세 정보를 반환.
    *   기존 클라이언트 호환성 유지.
2.  **신규 API (`/api/v2/insights/cards/top-failure-objects`):**
    *   `read_insight_object_failure_stats` 테이블을 쿼리하여 `object_name`, `failure_count`, `failure_rate` 를 순위대로 반환.
    *   기존 클라이언트는 이 엔드포인트를 호출하지 않으므로 깨지지 않음.

### 결론
기존 v1 API 클라이언트를 보호하기 위해 **엔드포인트 버전을 분리 (`/api/v1/...` vs `/api/v2/...`)** 하여, 새 기능은 v2 버전을 통해 제공하고, 기존 기능은 v1 버전을 통해 계속 제공하는 것이 정답입니다.
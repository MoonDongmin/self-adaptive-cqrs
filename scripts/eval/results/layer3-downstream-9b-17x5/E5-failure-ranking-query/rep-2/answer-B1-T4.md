제공된 자료 (로그 컨텍스트, Read Model 스키마) 에 따르면, 요청하신 "파지 실패가 가장 많은 객체 상위 목록 (Ranking)"을 조회하기 위한 **Read Model 은 현재 존재하지 않습니다**.

*   `read_grip_result` 는 `(scene_key, attempt_num)` 단위로 파지 성공/실패 여부를 저장하며, `object_name` 은 필드가 있지만, **객체별 집계 (Group By)** 로 실패 수나 실패율을 계산할 수 있는 구조가 아닙니다.
*   `read_multimodal` 은 미디어 링크만 저장하며 집계 정보가 없습니다.
*   로그 컨텍스트에는 `insight.card.miss` 로그가 있으나, 이는 특정 요청 (`correlation_id`) 에 대한 개별 실패 기록일 뿐, 객체별 누적 통계가 아닙니다.

따라서 **기존 v1 API 클라이언트가 깨지지 않게 하려면, 새로운 기능 (Ranking 조회) 을 구현하는 과정에서 기존 API 의 응답 구조와 동작을 완전히 유지 (Backward Compatibility) 해야 합니다.**

구체적인 단계별 절차는 다음과 같습니다.

### 1. 버전 경로 전략 (Versioning Strategy)
기존 클라이언트가 깨지지 않게 하려면 **URL 경로에 버전을 명시**하는 방식을 채택해야 합니다.
*   **기존 API:** `/api/v1/insight/card/{scene_key}` (또는 유사한 경로)
*   **신규 API:** `/api/v2/insight/card/ranking` 또는 `/api/v1/insight/card/ranking`
    *   **권장:** `/api/v2/...` 로 새 경로를 생성하여 기존 `/api/v1/...` 는 그대로 유지합니다.
    *   **이유:** 클라이언트 코드 수정 없이 새 기능을 호출할 수 있으며, 기존 요청은 기존 엔드포인트로 그대로 처리되므로 호환성이 보장됩니다.

### 2. 신구 병행 운영 (Parallel Operation)
데이터 플랫폼 (Event Sourcing + CQRS) 의 아키텍처상, 변경 사항이 즉시 전파되지 않으므로 병행 운영이 필수적입니다.

*   **Read Model 확장:**
    *   기존 `read_grip_result` 테이블을 수정하지 않고, **새로운 Read Model**을 추가합니다.
    *   예: `read_grip_object_failure_stats` (또는 `read_insight_card_ranking`) 테이블 생성.
    *   이 테이블은 `object_name`, `failure_count`, `success_count`, `failure_rate` 등을 저장하며, `object_name` 을 Primary Key 로 사용합니다.
*   **Write Side (Event Handler) 추가:**
    *   `insight.card.miss` 이벤트 (파지 실패) 와 `insight.card.hit` (또는 성공 로그) 이벤트를 구독하는 새로운 Event Handler 를 작성합니다.
    *   이 핸들러는 `read_grip_object_failure_stats` 테이블을 업데이트합니다.
    *   **주의:** 기존 `insight.card.miss` 로그의 `detail` 필드에 "파지 실패가 가장 많은 객체..."라는 텍스트가 포함되어 있지만, 이는 로그 메시지 자체이며, 실제 비즈니스 로직은 `insight.card.miss` 이벤트의 존재 여부로 판단해야 합니다. (자료상 `level 40` 인 `insight.card.miss` 가 실패를 의미함).

### 3. 마이그레이션 및 컷오버 절차 (Migration & Cutover)

#### 단계 1: 새 Read Model 및 Handler 배포 (Blue-Green 또는 Canary)
*   새 Read Model (`read_grip_object_failure_stats`) 을 데이터베이스에 생성합니다.
*   새 Event Handler 를 배포합니다.
*   **중요:** 기존 v1 API 엔드포인트는 **수정하지 않습니다**. 새 기능은 v2 엔드포인트에서 처리합니다.

#### 단계 2: 데이터 초기화 (Seeding)
*   새 Read Model 에는 초기 데이터가 없습니다.
*   기존 `read_grip_result` 테이블의 데이터를 기반으로 백그라운드 잡 (Job) 을 실행하여 초기 집계 데이터를 `read_grip_object_failure_stats` 로 마이그레이션합니다.
    *   SQL 예시: `read_grip_result` 를 `object_name` 과 `grip_succeed` 로 Group By 하여 새 테이블에 로드.

#### 단계 3: API Gateway 라우팅 설정
*   API Gateway 에서 `/api/v2/insight/card/ranking` 요청을 새 컨트롤러 (또는 새 Read Model 조회 로직) 로 라우팅하도록 설정합니다.
*   `/api/v1/insight/card/{scene_key}` 요청은 기존 컨트롤러로 라우팅되도록 유지합니다.

#### 단계 4: 클라이언트 배포 (비동기적)
*   **v1 클라이언트:** 변경 없음. 기존 `/api/v1/...` 호출로 정상 작동.
*   **v2 클라이언트 (또는 새 기능):** `/api/v2/insight/card/ranking` 호출로 새 기능 사용.

#### 단계 5: 컷오버 (Cutover) 및 검증
*   **검증:** 새 Read Model (`read_grip_object_failure_stats`) 에서 조회된 데이터가 `read_grip_result` 와 일치하는지, 그리고 로그 (`insight.card.miss`) 와의 상관관계가 맞는지를 확인합니다.
*   **트래픽 전환:**
    *   v1 클라이언트 사용자는 계속 v1 엔드포인트를 사용하므로 영향 없음.
    *   v2 클라이언트 (또는 새 기능 필요 시) 가 v2 엔드포인트를 사용하게 됨.
    *   만약 v1 클라이언트도 Ranking 기능을 필요로 한다면, **v1 API 응답 구조를 확장**해야 하지만, 이는 "기존 클라이언트가 깨지지 않게" 하는 원칙에 위배될 수 있습니다. 따라서 **기능은 v2 로 분리**하는 것이 가장 안전합니다.
    *   만약 v1 API 응답 구조를 유지하면서 Ranking 을 추가해야 한다면, v1 API 응답에 `ranking` 필드를 추가하는 것은 클라이언트 파싱 오류를 유발할 수 있으므로, **새로운 엔드포인트 사용**을 강력히 권장합니다.

### 4. SQL 구현 예시 (새 Read Model 생성 및 초기화)

기존 `read_grip_result` 를 기반으로 `read_grip_object_failure_stats` 를 생성하고 초기 데이터를 로드하는 SQL 입니다.

```sql
-- 1. 새 Read Model 테이블 생성
-- 키: object_name (단일 객체별 통계)
CREATE TABLE IF NOT EXISTS read_grip_object_failure_stats (
    object_name VARCHAR PRIMARY KEY,
    total_attempts INT DEFAULT 0,
    success_count INT DEFAULT 0,
    failure_count INT DEFAULT 0,
    failure_rate NUMERIC(5, 4) DEFAULT 0.0000,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 초기 데이터 로드 (기존 read_grip_result 기반)
-- object_name 으로 그룹화하여 실패 수와 실패율 계산
INSERT INTO read_grip_object_failure_stats (object_name, total_attempts, success_count, failure_count, failure_rate, updated_at)
SELECT 
    object_name,
    COUNT(*) as total_attempts,
    SUM(grip_succeed) as success_count,
    COUNT(*) - SUM(grip_succeed) as failure_count,
    ROUND((COUNT(*) - SUM(grip_succeed))::NUMERIC / NULLIF(COUNT(*), 0) * 100, 4) as failure_rate,
    NOW() as updated_at
FROM read_grip_result
GROUP BY object_name;

-- 3. (선택사항) 순위 조회용 뷰 생성 (API 응답을 위해)
CREATE VIEW IF NOT EXISTS v_grip_object_failure_ranking AS
SELECT 
    object_name,
    failure_count,
    failure_rate,
    RANK() OVER (ORDER BY failure_count DESC) as rank
FROM read_grip_object_failure_stats
ORDER BY failure_count DESC;
```

### 요약
1.  **기존 API (`/v1`) 는 수정하지 않음.**
2.  **새 API (`/v2`) 를 생성**하여 Ranking 조회 기능을 구현.
3.  **새 Read Model (`read_grip_object_failure_stats`)** 을 추가하고, 기존 `read_grip_result` 데이터를 마이그레이션하여 초기화.
4.  **Event Handler** 를 추가하여 `insight.card.miss` 이벤트를 감지하고 새 Read Model 을 실시간 업데이트.
5.  **v1 클라이언트는 기존 경로로 계속 작동**하므로 호환성 유지.
제공된 자료 (로그 컨텍스트 및 Read Model 스키마) 를 분석한 결과, 요청하신 **"일자별 파지 성공률 추이 (날짜별 시도 수, 성공 수, 성공률)"** 조회는 **현재 Read Model 로 불가능**합니다.

### 불가능한 이유
1.  **필터링 기준 부재**: `read_grip_result` 테이블의 `occurred_at` 필드는 `timestamptz` 형식입니다. 이를 기준으로 날짜 (`DATE`) 로 그룹화하려면 `EXTRACT` 함수나 `DATE_TRUNC` 함수를 사용해야 합니다.
2.  **집계 기능 부재**: 요청은 특정 날짜의 **시도 수 (COUNT)** 와 **성공 수 (SUM)** 를 집계하고, 이를 나누어 **성공률**을 계산하는 것입니다. 현재 Read Model 은 개별 파지 시도 (Attempt) 단위의 원자 데이터 (Row) 만 저장하고 있으며, 날짜별 집계된 뷰나 테이블은 정의되어 있지 않습니다.
3.  **Join 의 복잡성**: 시도 수와 성공 수는 같은 `scene_key` 와 `attempt_num` 조합에 대한 `read_grip_result` 전체를 스캔해야 계산할 수 있습니다. 만약 특정 날짜의 모든 시도를 조회하려면 `scene_key` 에 대한 인덱스가 없다면 성능상 비효율적이며, 단순히 `occurred_at` 만 필터링하면 같은 날짜의 다른 장면 (Scene) 들을 모두 포함해야 하므로, 단순한 `read_grip_result` 쿼리로는 원하는 "추이" 형태의 결과를 직접 생성할 수 없습니다.

따라서 **Read Model 에 추가적인 집계 테이블 (예: `read_daily_parsing_stats`) 을 생성하거나, 기존 테이블에 인덱스를 추가하여 뷰를 만드는 등의 변경**이 필요합니다.

---

### v1 API 클라이언트 호환성을 유지하는 변경 절차

기존 v1 API 클라이언트가 깨지지 않도록 하려면 **Backward Compatibility (역호환성)** 를 최우선으로 해야 합니다. CQRS 아키텍처에서 Write Model 변경은 즉시 Read Model 을 갱신하므로, Read Model 구조가 바뀌면 기존 API 가 새로운 필드를 찾지 못해 에러가 날 수 있습니다.

다음 단계로 진행해야 합니다.

#### 1. 버전 경로 (Versioning Strategy)
*   **새 API 엔드포인트 생성**: 기존 `/api/v1/...` 경로 대신 `/api/v2/...` 경로를 사용합니다.
*   **헤더 기반 버전**: 만약 엔드포인트를 변경할 수 없다면, 요청 헤더 `Accept: application/vnd.company.parsing-stats.v2+json` 와 같은 미디어 타입을 통해 버전을 구분합니다.
*   **추천**: 새로운 집계 데이터 (일자별 추이) 는 데이터 구조가 완전히 다르므로, **새로운 엔드포인트 (예: `/api/v2/daily-parsing-stats`)** 를 만드는 것이 가장 안전합니다.

#### 2. 신구 병행 운영 (Parallel Operation)
*   **Read Model 분리**:
    *   기존 `read_grip_result` 테이블은 **변경하지 않습니다**. v1 API 가 사용하는 필드와 구조를 그대로 유지합니다.
    *   새로운 집계 데이터가 필요하므로, **새로운 테이블 (예: `read_daily_parsing_stats`)** 을 생성합니다. 이 테이블은 `date`, `total_attempts`, `success_attempts`, `success_rate` 등의 컬럼을 가집니다.
*   **Projection Logic 분리**:
    *   기존 `grip-result-projector` 는 `read_grip_result` 를 계속 업데이트합니다.
    *   새로운 **`daily-stats-projector`** 를 추가하여, `read_grip_result` 테이블을 스캔하거나 별도의 이벤트 (예: `ParsingEvent` 의 특정 필드) 를 구독하여 `read_daily_parsing_stats` 를 업데이트하는 로직을 구현합니다.

#### 3. 마이그레이션 및 컷오버 절차 (Migration & Cutover)

**Step 1: 새 Read Model 테이블 생성 및 인덱싱**
```sql
CREATE TABLE read_daily_parsing_stats (
    date DATE NOT NULL,
    total_attempts BIGINT NOT NULL DEFAULT 0,
    success_attempts BIGINT NOT NULL DEFAULT 0,
    success_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    PRIMARY KEY (date)
);
-- 성능 향상을 위해 발생 시간 인덱스도 고려 (필요시)
CREATE INDEX idx_read_daily_parsing_stats_date ON read_daily_parsing_stats(date);
```

**Step 2: 새 Projection Logic 구현**
*   기존 `grip-result-projector` 로직은 유지합니다.
*   새로운 프로젝터 (`daily-stats-projector`) 를 작성합니다. 이 프로젝터는 `read_grip_result` 테이블을 직접 쿼리하여 집계하거나, 이벤트 스트림을 실시간으로 집계하여 `read_daily_parsing_stats` 를 업데이트합니다.
    *   *주의*: `read_grip_result` 를 스캔하는 방식은 대용량일 경우 느릴 수 있으므로, 이벤트 기반 집계 (Event Sourcing) 로 처리하는 것이 이벤트 소싱 원칙에 부합합니다.

**Step 3: v2 API 개발 및 배포**
*   새로운 API 엔드포인트 (`/api/v2/daily-parsing-stats`) 를 개발합니다.
*   이 API 는 `read_daily_parsing_stats` 테이블을 쿼리하여 결과를 반환합니다.
*   기존 v1 API (`/api/v1/...`) 는 `read_grip_result` 를 계속 사용하여 정상 작동합니다.

**Step 4: 클라이언트 배포 및 전환**
*   **v1 클라이언트**: 기존 로직 그대로 사용 (변경 없음).
*   **v2 클라이언트**: 새 엔드포인트 호출 로직 추가.
*   **Gradual Rollout**:
    1.  새 프로젝터와 새 테이블을 배포합니다.
    2.  v2 API 를 트래픽의 일부 (예: 10%) 로 라우팅합니다.
    3.  v2 API 가 정상 작동하는지 모니터링합니다.
    4.  모든 트래픽을 v2 로 이동합니다.

**Step 5: 컷오버 (Cutover) 및 정리**
*   모든 클라이언트가 v2 로 전환되었음을 확인합니다.
*   v1 API 엔드포인트를 비활성화하거나, 새 엔드포인트로 리디렉션합니다.
*   (선택 사항) `read_grip_result` 테이블의 불필요한 데이터 정리 또는 최적화 작업을 수행합니다.

### 요약
1.  **현재 상태**: 불가능 (필터링 및 집계 로직 부재).
2.  **해결책**: 새 Read Model (`read_daily_parsing_stats`) 생성 및 새 Projection 로직 추가.
3.  **호환성**: 새 API (`/v2`) 를 만들어 기존 `/v1` 을 건드리지 않음.
4.  **절차**: 새 테이블 생성 -> 새 프로젝터 배포 -> v2 API 배포 -> 점진적 전환 -> v1 정리.
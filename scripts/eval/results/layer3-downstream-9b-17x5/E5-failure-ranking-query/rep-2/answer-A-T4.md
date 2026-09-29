기존 v1 API 클라이언트가 깨지지 않도록 하려면 **비파괴적 마이그레이션 (Non-breaking Migration)** 전략을 따르고, **병행 운영 (Parallel Operation)**을 통해 점진적으로 새 API 를 도입해야 합니다.

구체적인 단계는 다음과 같습니다.

### 1. 데이터베이스 스키마 확장 (DDL)
기존 `read_grip_result` 테이블을 건드리지 않고, 새로운 집계 테이블 `read_object_failure_stats_v1` 을 추가합니다.
*   **주의:** `read_grip_result` 의 Primary Key (`scene_key`, `attempt_num`) 는 유지합니다.
*   **주의:** `read_object_failure_stats_v1` 의 Primary Key 는 `object_name` 으로 설정합니다.

```sql
CREATE TABLE read_object_failure_stats_v1 (
  object_name varchar NOT NULL,
  failure_count double precision,
  success_count double precision,
  total_attempts double precision,
  failure_rate double precision,
  PRIMARY KEY (object_name)
);
```

### 2. 신규 프로젝터 등록 및 초기화
`ObjectFailureStatsV1Projector` 를 생성하여 이벤트 스토어 (Event Store) 의 과거 이벤트를 `read_object_failure_stats_v1` 로 투영합니다.
*   **초기화:** 투영 시작 시 (cursor 초기화) 테이블을 비우거나 `object_name` 에 대한 모든 행을 `0` 값으로 초기화하여, 첫 번째 이벤트가 들어올 때부터 합산이 시작되도록 합니다.
*   **업데이트 로직:** `GripAttemptRecorded` 이벤트가 들어올 때마다 `object_name` 을 키로 하여 `failure_count`, `success_count`, `total_attempts` 를 원자적으로 합산 (UPSERT) 합니다. `failure_rate` 는 합산된 값에서 실시간으로 계산합니다.

### 3. API 엔드포인트 병행 운영 (Dual Routing)
클라이언트 호환성을 위해 기존 라우트와 새 라우트를 **동시에** 제공합니다.

*   **기존 라우트 유지:** `POST /object-failure-stats` (v1) 는 기존 `GripResultProjector` 기반의 로직을 그대로 사용합니다.
    *   *반응:* `read_grip_result` 테이블을 JOIN 하여 객체별 실패 수를 계산하거나, row-level 데이터에서 필터링하여 반환합니다. (기존 클라이언트 호환)
*   **신규 라우트 추가:** `POST /object-failure-stats-v1` (v2) 를 추가합니다.
    *   *반응:* 새로 생성된 `ObjectFailureStatsV1Projector` 가 관리하는 `read_object_failure_stats_v1` 테이블을 직접 쿼리하여, 미리 집계된 통계 (실패 수, 실패율) 를 순위대로 반환합니다.

### 4. 클라이언트 측 전략 (Client-Side Strategy)
*   **기존 클라이언트:** `POST /object-failure-stats` 엔드포인트를 계속 호출하면 기존 로직이 그대로 작동하므로 깨지지 않습니다.
*   **신규 클라이언트:** `POST /object-failure-stats-v1` 엔드포인트를 호출하여 최적화된 집계 결과를 받을 수 있습니다.

### 5. 컷오버 (Cutover) 절차
인간 승인 후, 모든 이벤트가 새 프로젝터로 투영되었음을 확인한 후, 기존 v1 로직을 제거합니다.

1.  **검증:** `read_object_failure_stats_v1` 테이블에 데이터가 정상적으로 채워졌는지 확인합니다.
2.  **라우트 교체:** `POST /object-failure-stats` 엔드포인트의 구현을 `read_object_failure_stats_v1` 테이블 조회 로직으로 변경합니다.
    *   *주의:* 이 단계에서 기존 `read_grip_result` 기반 로직을 완전히 삭제하지는 않습니다. 대신 새 테이블을 사용하는 로직으로 대체합니다.
3.  **프로젝터 정리:** `ObjectFailureStatsV1Projector` 가 정상적으로 동작함을 확인 후, 필요에 따라 `GripResultProjector` 와의 중복 로직을 정리합니다. (단, `read_grip_result` 는 유지)

### 요약
**"새로운 테이블을 추가하고, 새로운 프로젝터를 등록한 뒤, API 엔드포인트를 두 개 (`/object-failure-stats` 와 `/object-failure-stats-v1`) 로 동시에 노출한다. 클라이언트 호환성을 위해 기존 엔드포인트는 기존 로직으로 유지하고, 새 엔드포인트는 새 로직으로 제공한다. 검증 후 기존 엔드포인트를 새 로직으로 교체한다."**
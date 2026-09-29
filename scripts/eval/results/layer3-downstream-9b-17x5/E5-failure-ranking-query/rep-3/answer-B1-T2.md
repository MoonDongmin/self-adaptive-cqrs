제공된 자료 (로그 컨텍스트 및 Read Model 스키마) 를 분석한 결과, 요청하신 "객체별 실패 수와 실패율 순위" 조회를 수행하기 위해 **새로운 Read Model**이 필요합니다.

**이유:**
1.  **필요한 데이터:** "객체명 (object_name)"과 "파지 성공 여부 (grip_succeed)"가 필요합니다. 이는 `read_grip_result` 테이블에 존재합니다.
2.  **결핍된 데이터:** "실패율"을 계산하려면 "총 시도 수"와 "실패 수"가 필요합니다. `read_grip_result`는 `(scene_key, attempt_num)` 조합을 Primary Key로 가지므로, 같은 장면 (scene_key) 내의 모든 시도 (attempt_num) 를 한 번에 집계할 수 없습니다.
3.  **해결책:** `read_grip_result` 테이블에 `scene_key` 만 Group By 하여, 각 장면별 총 시도 수 (`total_attempts`) 와 실패 수 (`failed_attempts`) 를 먼저 집계한 후, 이를 `object_name` 기준으로 다시 집계해야 합니다.

따라서, `read_grip_result` 테이블의 구조를 그대로 활용하여 중간 집계 결과를 저장할 **새로운 Read Model**을 생성하고, 이를 통해 최종 결과를 조회하는 SQL 을 작성합니다.

### 1. 새 Read Model 생성 (DDL)

`read_grip_result` 테이블의 `scene_key` 에 대한 집계 결과를 저장하기 위한 테이블입니다.

```sql
CREATE TABLE read_grip_result_object_stats (
    object_name VARCHAR(255) NOT NULL,
    total_attempts BIGINT NOT NULL,
    failed_attempts BIGINT NOT NULL,
    failure_rate NUMERIC(5, 4) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (object_name)
);
```

### 2. 새 Read Model 채우기 및 최종 조회 SQL

`read_grip_result` 테이블에 저장된 원본 데이터를 기반으로 `read_grip_result_object_stats` 테이블을 업데이트하고, 이를 통해 요청된 결과를 조회합니다.

**가정:** `read_grip_result` 테이블에는 `scene_key`, `attempt_num`, `grip_succeed` 컬럼이 존재하며, `read_grip_result_object_stats` 테이블은 처음에 빈 상태이거나 이전 데이터가 있을 수 있습니다.

```sql
-- 1. 새 Read Model 테이블에 집계 데이터 로드 및 업데이트
INSERT INTO read_grip_result_object_stats (object_name, total_attempts, failed_attempts, failure_rate)
SELECT 
    gr.object_name,
    COUNT(*) AS total_attempts,
    SUM(CASE WHEN gr.grip_succeed = 0 THEN 1 ELSE 0 END) AS failed_attempts,
    ROUND(
        CAST(SUM(CASE WHEN gr.grip_succeed = 0 THEN 1 ELSE 0 END) AS NUMERIC) * 100.0 / COUNT(*), 
        4
    ) AS failure_rate
FROM read_grip_result gr
GROUP BY gr.object_name
ON CONFLICT (object_name) DO UPDATE SET
    total_attempts = EXCLUDED.total_attempts,
    failed_attempts = EXCLUDED.failed_attempts,
    failure_rate = EXCLUDED.failure_rate,
    updated_at = NOW();

-- 2. 사용자 요청에 따른 최종 조회 SQL
SELECT 
    object_name,
    failed_attempts,
    failure_rate,
    ROW_NUMBER() OVER (ORDER BY failed_attempts DESC, failure_rate DESC) AS rank
FROM read_grip_result_object_stats
ORDER BY failed_attempts DESC, failure_rate DESC;
```

**설명:**
*   **INSERT ... ON CONFLICT:** 이벤트 소싱 환경에서 Read Model 을 업데이트할 때 일반적으로 사용하는 패턴입니다. `object_name` 이 이미 존재하는 경우 (UPDATE) 하거나, 처음 생성되는 경우 (INSERT) 를 처리합니다. `read_grip_result` 테이블의 모든 행을 스캔하여 `object_name` 기준으로 `total_attempts` (행의 개수) 와 `failed_attempts` (`grip_succeed` 가 0 인 행의 개수) 를 계산합니다.
*   **ORDER BY:** 실패 수 (`failed_attempts`) 가 가장 많은 순으로 정렬하고, 실패 수가 같다면 실패율 (`failure_rate`) 이 높은 순으로 정렬하여 순위 (`rank`) 를 매깁니다.
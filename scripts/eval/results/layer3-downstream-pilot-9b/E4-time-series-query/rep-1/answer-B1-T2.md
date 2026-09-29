제공된 자료에 따르면, 요청한 조회 ("일자별 파지 성공률 추이: 날짜별 시도 수, 성공 수, 성공률") 를 수행하기 위해 **새로운 Read Model**이 필요합니다.

**이유:**
1.  **필요한 필드 부재:** `read_grip_result` 테이블에는 `occurred_at`(일자), `attempt_num`(시도 수), `grip_succeed`(성공 여부) 이 존재하지만, **일자별 집계 (GROUP BY)** 를 위한 `occurred_at` 필드만으로는 "시도 수"와 "성공 수"를 구별하여 집계할 수 없습니다. `attempt_num` 은 개별 시도 번호이므로, 특정 날짜에 총 몇 번의 시도가 있었는지, 그 중 몇 번이 성공했는지를 구하기 위해서는 `attempt_num` 을 그룹화하거나, `grip_succeed` 값을 합산해야 합니다.
2.  **기존 Read Model 의 한계:** `read_grip_result` 테이블은 `(scene_key, attempt_num)` 을 Primary Key 로 하고 있어, 같은 날짜 (`occurred_at`) 에 다른 `scene_key` 가 있거나 같은 `scene_key` 에 다른 `attempt_num` 이 있는 경우를 하나의 레코드씩 저장합니다. 따라서 "일자별 시도 수"를 구하려면 `attempt_num` 을 `COUNT` 하고, "일자별 성공 수"를 구하려면 `grip_succeed` 를 `SUM` 해야 합니다. 기존 테이블 구조 그대로 `GROUP BY occurred_at` 만 하면 시도 번호 (`attempt_num`) 를 무시하고 전체 행을 카운트하게 되거나, 시도 번호를 그룹화해야 하므로 `occurred_at` 과 `attempt_num` 을 동시에 그룹화해야 하는 복잡한 쿼리가 필요하며, 이는 일반적인 "일자별 요약" 조회 패턴과 맞지 않을 수 있습니다.
3.  **최적화:** "일자별" 추이를 보고 싶으므로, `occurred_at` 을 기준으로 그룹화된 집계 테이블이 필요합니다.

따라서 `read_grip_daily_stats` 라는 새 Read Model 을 생성하여, `occurred_at` 을 기준으로 시도 수와 성공 수를 미리 집계해 두는 것이 가장 효율적입니다.

### 1. 새 Read Model 생성 (DDL)

```sql
CREATE TABLE read_grip_daily_stats (
    occurred_at DATE NOT NULL,
    total_attempts INT NOT NULL DEFAULT 0,
    successful_attempts INT NOT NULL DEFAULT 0,
    success_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    stream_id VARCHAR(255),
    global_seq BIGINT,
    PRIMARY KEY (occurred_at, stream_id, global_seq)
);
```

### 2. 새 Read Model 을 채우는 SQL (Projection Logic)

기존 `read_grip_result` 테이블을 스캔하여, `occurred_at` 에 따라 시도 수와 성공 수를 집계하고, `success_rate` 를 계산하여 새 테이블에 로드합니다.

```sql
INSERT INTO read_grip_daily_stats (occurred_at, total_attempts, successful_attempts, success_rate, stream_id, global_seq)
SELECT 
    DATE(occurred_at) AS occurred_at,
    COUNT(*) AS total_attempts,
    SUM(grip_succeed) AS successful_attempts,
    ROUND(CAST(SUM(grip_succeed) AS NUMERIC) / COUNT(*) * 100, 2) AS success_rate,
    MIN(stream_id) AS stream_id, -- 같은 날짜에 여러 stream_id 가 있을 수 있으므로 대표값 또는 NULL 처리 필요 (여기서는 최소값 사용)
    MIN(global_seq) AS global_seq -- 같은 날짜에 여러 global_seq 가 있을 수 있으므로 대표값 또는 NULL 처리 필요
FROM read_grip_result
WHERE occurred_at IS NOT NULL
GROUP BY DATE(occurred_at)
ON CONFLICT (occurred_at, stream_id, global_seq) DO NOTHING;
```

### 3. 조회 SQL (사용자 요청 충족)

생성된 `read_grip_daily_stats` 테이블을 사용하여 일자별 추이를 시간 순으로 조회합니다.

```sql
SELECT 
    occurred_at,
    total_attempts,
    successful_attempts,
    success_rate
FROM read_grip_daily_stats
ORDER BY occurred_at ASC;
```
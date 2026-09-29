제공된 자료와 상황 분석에 따라, 요청하신 "일자별 파지 성공률 추이 (시도 수, 성공 수, 성공률)"를 충족시키기 위해 먼저 새 Read Model 을 채우는 백필 SQL 을 작성하고, 그 다음 조회 SQL 을 작성합니다.

### 1. 새 Read Model (`read_grip_daily_stats`) 채우기 (백필 SQL)

기존 `read_grip_result` 테이블의 데이터를 스캔하여 `occurred_at` 기준으로 시도 수와 성공 수를 집계하고, `success_rate` 를 계산하여 새 테이블에 로드합니다.

```sql
INSERT INTO read_grip_daily_stats (occurred_at, total_attempts, successful_attempts, success_rate, stream_id, global_seq)
SELECT 
    DATE(occurred_at) AS occurred_at,
    COUNT(*) AS total_attempts,
    SUM(grip_succeed) AS successful_attempts,
    ROUND(CAST(SUM(grip_succeed) AS NUMERIC) / COUNT(*) * 100, 2) AS success_rate,
    MIN(stream_id) AS stream_id,
    MIN(global_seq) AS global_seq
FROM read_grip_result
WHERE occurred_at IS NOT NULL
GROUP BY DATE(occurred_at)
ON CONFLICT (occurred_at, stream_id, global_seq) DO NOTHING;
```

### 2. 조회 SQL (사용자 요청 충족)

생성된 `read_grip_daily_stats` 테이블을 사용하여 일자별 파지 성공률을 날짜 오름차순으로, 시도 수·성공 수·성공률과 함께 조회합니다.

```sql
SELECT 
    occurred_at,
    total_attempts,
    successful_attempts,
    success_rate
FROM read_grip_daily_stats
ORDER BY occurred_at ASC;
```
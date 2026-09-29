제공된 자료와 상황 분석에 따라, 먼저 `read_grip_result_object_stats` 테이블을 채우는 백필 SQL 을 작성한 후, 요청한 상위 3 개 객체 조회 SELECT 문을 작성합니다.

### 1. 새 Read Model 채우기 (Backfill SQL)

기존 `read_grip_result` 테이블의 데이터를 기반으로 `object_name` 에 따라 시도 수와 성공 수를 집계하여 새 테이블에 로드합니다.

```sql
INSERT INTO read_grip_result_object_stats (object_name, total_attempts, success_attempts, success_rate)
SELECT 
    object_name,
    COUNT(*) AS total_attempts,
    SUM(grip_succeed) AS success_attempts,
    ROUND(CAST(SUM(grip_succeed) AS NUMERIC) / COUNT(*) * 100, 2) AS success_rate
FROM read_grip_result
GROUP BY object_name;
```

### 2. 객체별 파지 성공률 상위 3 개 조회 (SELECT SQL)

```sql
SELECT 
    object_name,
    total_attempts,
    success_attempts,
    success_rate
FROM read_grip_result_object_stats
ORDER BY success_rate DESC
LIMIT 3;
```
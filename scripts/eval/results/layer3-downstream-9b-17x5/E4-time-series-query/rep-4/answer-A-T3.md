제공된 자료에 따르면, 사용자가 요청한 '일자별 파지 성공률 추이'를 조회하기 위한 Read Model(`read_daily_grip_stats_v1`)은 아직 생성되지 않았으며, 기존 Read Model(`read_grip_result`)은 원천 데이터만 저장하고 있어 집계된 일일 통계를 제공하지 못합니다.

따라서 먼저 `read_daily_grip_stats_v1` 테이블을 생성하는 DDL SQL 을 작성하고, 이후 해당 테이블을 사용하여 사용자가 요청한 조회를 수행하는 SELECT 문을 작성합니다.

### 1. 백필 SQL (새 Read Model 생성)

```sql
CREATE TABLE read_daily_grip_stats_v1 (
  occurred_date varchar(10) NOT NULL,
  total_attempts smallint,
  success_count smallint,
  success_rate doublePrecision(6),
  PRIMARY KEY (occurred_date)
);
```

### 2. 조회 SQL (일자별 파지 성공률 추이)

```sql
SELECT 
  occurred_date,
  total_attempts,
  success_count,
  success_rate
FROM read_daily_grip_stats_v1
ORDER BY occurred_date ASC;
```
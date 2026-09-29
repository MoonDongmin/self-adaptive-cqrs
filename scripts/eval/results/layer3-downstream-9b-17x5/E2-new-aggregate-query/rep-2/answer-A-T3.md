제공된 자료에 따르면, `read_object_grip_stats` 테이블은 아직 생성되지 않았으며, 기존 `read_grip_result` 테이블만 존재합니다. 따라서 먼저 `read_object_grip_stats` 테이블을 생성하고, `GripAttemptRecorded` 이벤트 (또는 `read_grip_result` 테이블) 를 기반으로 `object_name` 에 대한 시도 수, 성공 수, 성공률을 집계하여 백필해야 합니다.

다음은 백필을 위한 SQL 코드입니다.

```sql
-- 1. 신규 Read Model 테이블 생성
CREATE TABLE read_object_grip_stats (
  object_name VARCHAR DEFAULT NULL,
  attempt_count DOUBLE PRECISION DEFAULT NULL,
  success_count DOUBLE PRECISION DEFAULT NULL,
  success_rate DOUBLE PRECISION DEFAULT NULL,
  PRIMARY KEY (object_name)
);

CREATE INDEX idx_object_grip_stats ON read_object_grip_stats(object_name);

-- 2. 백필: read_grip_result 에서 object_name, attempt_count, success_count, success_rate 집계
INSERT INTO read_object_grip_stats (object_name, attempt_count, success_count, success_rate)
SELECT 
  object_name,
  COUNT(*)::DOUBLE PRECISION AS attempt_count,
  SUM(grip_succeed)::DOUBLE PRECISION AS success_count,
  CASE 
    WHEN COUNT(*) = 0 THEN NULL
    ELSE ROUND(SUM(grip_succeed)::DOUBLE PRECISION / COUNT(*), 4)
  END AS success_rate
FROM read_grip_result
GROUP BY object_name;
```

```sql
SELECT 
  object_name,
  attempt_count,
  success_count,
  success_rate
FROM read_object_grip_stats
ORDER BY success_rate DESC
LIMIT 3;
```
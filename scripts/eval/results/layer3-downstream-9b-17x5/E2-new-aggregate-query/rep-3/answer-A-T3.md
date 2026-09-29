제공된 자료에 따르면, `read_object_success_rate_v1` 테이블은 아직 생성되지 않았으며, 기존 `read_grip_result` 테이블만 존재하여 집계된 데이터 (시도 수, 성공 수, 성공률) 를 조회할 수 없습니다. 따라서 먼저 `read_grip_result` 테이블의 원시 데이터를 기반으로 `read_object_success_rate_v1` 테이블을 백필 (백업 채우기) 하고, 이후 사용자 요청에 맞는 SELECT 문을 작성해야 합니다.

### 1. 백필 SQL (Backfill)
`read_object_success_rate_v1` 테이블을 생성하고, 기존 `read_grip_result` 테이블의 데이터를 `object_name` 기준으로 집계하여 채웁니다.

```sql
-- 1. 신규 Read Model 테이블 생성 및 백필
CREATE TABLE IF NOT EXISTS read_object_success_rate_v1 (
  object_name varchar NOT NULL,
  total_attempts bigint,
  success_count bigint,
  success_rate doublePrecision,
  PRIMARY KEY (object_name)
);

-- 기존 read_grip_result 데이터를 기반으로 집계하여 새 테이블 채우기
INSERT INTO read_object_success_rate_v1 (object_name, total_attempts, success_count, success_rate)
SELECT 
  object_name,
  COUNT(*) as total_attempts,
  SUM(grip_succeed) as success_count,
  CASE 
    WHEN COUNT(*) > 0 THEN CAST(SUM(grip_succeed) AS doublePrecision) / COUNT(*)
    ELSE NULL
  END as success_rate
FROM read_grip_result
GROUP BY object_name;
```

### 2. 조회 SQL (Query)
사용자 요청인 '객체별 파지 성공률이 높은 순으로 상위 3 개 객체'를 `total_attempts`, `success_count`, `success_rate` 와 함께 조회합니다.

```sql
SELECT 
  object_name,
  total_attempts,
  success_count,
  success_rate
FROM read_object_success_rate_v1
ORDER BY success_rate DESC
LIMIT 3;
```
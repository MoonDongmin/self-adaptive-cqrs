제공된 자료에 따르면, `read_object_grip_rate_v1` 테이블은 아직 생성되지 않았으며, 기존 `read_grip_result` 테이블만 존재합니다. 사용자가 요청한 '객체별 파지 성공률'은 `read_grip_result` 테이블의 행 단위 데이터를 `object_name` 과 `grip_succeed` 를 기준으로 집계해야만 계산할 수 있습니다.

따라서 먼저 기존 데이터 (`read_grip_result`) 를 기반으로 `read_object_grip_rate_v1` 테이블을 백필 (백업 채우기) 하는 SQL 을 작성하고, 그 후 해당 테이블을 사용하여 상위 3 개 객체를 조회하는 SQL 을 작성합니다.

```sql
-- 1. 백필: 기존 read_grip_result 데이터를 기반으로 read_object_grip_rate_v1 테이블 생성 및 초기 데이터 적재
-- 기존 테이블의 object_name, attempt_num, grip_succeed 를 그룹화하여 신규 테이블의 total_attempts 와 success_attempts 를 계산합니다.
-- success_rate 는 조회 시 계산되므로 초기 적재 시 NULL 로 설정합니다.
INSERT INTO read_object_grip_rate_v1 (object_name, total_attempts, success_attempts, success_rate)
SELECT 
    object_name,
    COUNT(*) as total_attempts,
    SUM(grip_succeed) as success_attempts,
    NULL as success_rate
FROM read_grip_result
GROUP BY object_name
ON CONFLICT (object_name) DO NOTHING;

-- 2. 조회: 객체별 파지 성공률이 높은 순으로 상위 3 개 객체 조회
SELECT 
    object_name,
    total_attempts,
    success_attempts,
    ROUND(CAST(success_attempts AS DOUBLE PRECISION) / NULLIF(total_attempts, 0) * 100, 2) as success_rate
FROM read_object_grip_rate_v1
WHERE total_attempts > 0
ORDER BY success_rate DESC
LIMIT 3;
```
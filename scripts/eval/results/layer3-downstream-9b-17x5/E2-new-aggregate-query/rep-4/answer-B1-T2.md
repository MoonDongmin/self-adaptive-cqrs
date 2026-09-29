제공된 자료 (Read Model 스키마) 를 분석한 결과, `object_name` 별 파지 성공률 (시도 수, 성공 수, 성공률) 을 조회하기 위해 **새로운 Read Model 테이블**이 필요합니다.

기존 `read_grip_result` 테이블은 `(scene_key, attempt_num)` 조합을 기본 키로 가지며, `object_name` 과 `attempt_num` 이 분리되어 저장되어 있어, `object_name` 기준으로 집계하는 쿼리 시 `attempt_num` 을 그룹화해야 하므로 성능 저하와 복잡한 조인이 발생합니다. 또한, `object_name` 을 직접적인 키로 사용하는 구조로 변경해야 조회 성능이 보장됩니다.

따라서 `read_grip_result` 테이블을 그대로 유지하고, `object_name` 을 기준으로 집계된 결과를 저장할 `read_grip_result_object_stats` 테이블을 생성하고, 해당 테이블을 채우는 SQL 을 작성합니다.

### 1. 새 Read Model 생성 (DDL)

```sql
CREATE TABLE read_grip_result_object_stats (
    object_name VARCHAR PRIMARY KEY,
    total_attempts INT,
    success_attempts INT,
    success_rate NUMERIC(5, 2)
);
```

### 2. 새 Read Model 채우기 (Insert SQL)

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
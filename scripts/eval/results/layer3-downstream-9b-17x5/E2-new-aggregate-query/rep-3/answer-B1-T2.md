제공된 자료에 따르면, `object_name` 별 파지 성공률 (시도 수, 성공 수, 성공률) 을 조회하기 위해 **새로운 Read Model 테이블**이 필요합니다.

기존 Read Model (`read_grip_result`) 은 `(scene_key, attempt_num)` 을 기본 키로 가지며, `object_name` 과 `attempt_num` 이 결합된 형태로 저장되어 있어, `object_name` 만으로 그룹화하여 집계하는 쿼리를 작성하려면 `attempt_num` 을 JOIN 하거나 `read_grip_result` 테이블을 직접 사용해야 합니다. 하지만 요청사항은 "객체별" 일괄 조회이므로, `object_name` 을 기준으로 `attempt_num` 을 합산하고 `sum(grip_succeed)` 을 계산하는 **새로운 집계용 Read Model**을 생성하는 것이 가장 효율적이고 안전한 접근법입니다.

기존 테이블 구조를 변경하지 않고, 새로운 테이블 `read_grip_result_object_stats` 를 생성하여 `object_name` 에 대한 통계 정보를 저장하도록 합니다.

### 1. 새 Read Model 생성 (DDL)

```sql
CREATE TABLE read_grip_result_object_stats (
    object_name varchar PRIMARY KEY,
    total_attempts bigint NOT NULL,
    success_count bigint NOT NULL,
    success_rate numeric(5, 2) NOT NULL,
    updated_at timestamptz DEFAULT now()
);
```

### 2. 새 Read Model 을 채우는 SQL (Insert)

기존 `read_grip_result` 테이블의 데이터를 기반으로 `object_name` 에 따라 `attempt_num` 을 그룹화하여 집계한 후, 새 테이블에 삽입합니다.

```sql
INSERT INTO read_grip_result_object_stats (object_name, total_attempts, success_count, success_rate, updated_at)
SELECT 
    object_name,
    COUNT(*) AS total_attempts,
    SUM(grip_succeed) AS success_count,
    ROUND(CAST(SUM(grip_succeed) AS numeric) / COUNT(*) * 100, 2) AS success_rate,
    now() AS updated_at
FROM read_grip_result
GROUP BY object_name;
```

### 3. 검증 및 조회 SQL

생성된 새 Read Model 을 사용하여 사용자가 요청한 대로 `object_name` 별 파지 성공률을 조회합니다.

```sql
SELECT 
    object_name,
    total_attempts AS attempt_count,
    success_count,
    success_rate
FROM read_grip_result_object_stats
ORDER BY object_name;
```
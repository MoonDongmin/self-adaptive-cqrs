제공된 자료 (Read Model 스키마) 를 분석한 결과, `object_name` 별 파지 성공률 (시도 수, 성공 수, 성공률) 을 조회하기 위해 **새로운 Read Model 테이블**이 필요합니다.

기존 `read_grip_result` 테이블은 `(scene_key, attempt_num)` 조합을 기본 키로 가지며, `object_name` 과 `attempt_num` 이 분리되어 저장되어 있어, `object_name` 기준으로 집계하는 쿼리가 복잡하고 비효율적입니다. 또한, `object_name` 이 `scene_key` 에 포함되지만, `scene_key` 에는 `object_name` 만으로는 필터링이 불가능하므로 (카테고리, 카메라코드 등 포함됨), `object_name` 을 기준으로 직접 집계하는 것은 불가능합니다.

따라서 `object_name` 을 기본 키로 하는 새로운 Read Model `read_grip_result_by_object` 를 생성하여, `object_name` 에 대한 성공/실패 카운트를 미리 집계 (Pre-aggregation) 해두는 것이 가장 효율적인 해결책입니다.

### 1. 새 Read Model 생성 (DDL)

`read_grip_result` 테이블의 데이터를 기반으로 `object_name` 단위로 집계된 결과를 저장하는 테이블을 생성합니다.

```sql
CREATE TABLE read_grip_result_by_object (
    object_name VARCHAR PRIMARY KEY,
    total_attempts INT,
    success_attempts INT,
    success_rate NUMERIC(5, 2)
);
```

### 2. 새 Read Model 을 채우는 SQL (Migration/Refresh)

기존 `read_grip_result` 테이블의 데이터를 읽어 `object_name` 기준으로 집계하여 새 테이블에 로드합니다. `success_rate` 는 성공 수를 시도 수로 나눈 값 (소수점 2 자리) 으로 계산합니다.

```sql
INSERT INTO read_grip_result_by_object (object_name, total_attempts, success_attempts, success_rate)
SELECT 
    object_name,
    COUNT(*) AS total_attempts,
    SUM(grip_succeed) AS success_attempts,
    ROUND(CAST(SUM(grip_succeed) AS NUMERIC) / COUNT(*), 2) AS success_rate
FROM read_grip_result
GROUP BY object_name;
```

### 3. 사용자 요청 조회 SQL

생성된 `read_grip_result_by_object` 테이블을 조회하여 사용자가 요청한 데이터 (객체별 시도 수, 성공 수, 성공률) 를 반환합니다.

```sql
SELECT 
    object_name,
    total_attempts AS attempt_count,
    success_attempts AS success_count,
    success_rate AS success_rate
FROM read_grip_result_by_object
ORDER BY object_name;
```
제공된 자료 (Read Model 스키마) 를 분석한 결과, `object_name` 에 따른 파지 성공률 (시도 수, 성공 수, 성공률) 을 **기존 Read Model (`read_grip_result`) 만으로는 직접 조회할 수 없습니다**.

**이유:**
1.  **Primary Key 충돌:** `read_grip_result` 테이블의 Primary Key 는 `(scene_key, attempt_num)` 입니다. `object_name` 은 필드 하나에 불과하며, 같은 `scene_key` 와 `attempt_num` 에 대해 여러 개의 `object_name` 이 존재할 수 있습니다 (예: 한 장면에서 여러 객체를 동시에 파지 시도). 따라서 `object_name` 을 기준으로 그룹화하려면 Primary Key 의 일부인 `attempt_num` 을 그룹화 기준으로 포함해야 하거나, `object_name` 이 Primary Key 에 포함되지 않아 `object_name` 으로 직접 그룹화하는 것이 불가능합니다.
2.  **필드 구조:** `object_name` 필드가 존재하지만, 이를 `object_name` 기준으로 `GROUP BY` 하려면 `scene_key` 와 `attempt_num` 을 함께 그룹화해야 데이터가 중복되지 않습니다. 하지만 질문의 의도는 "각 객체별 총 시도 수"를 묻는 것으로 보이므로, `scene_key` 를 기준으로 먼저 집계한 후 `object_name` 으로 다시 집계해야 하는 다단계 쿼리 (Subquery 또는 CTE) 가 필요합니다.

따라서 **새 Read Model 테이블 (`read_object_parsing_stats`) 을 생성**하여, `object_name` 을 기준으로 집계된 통계 정보를 저장하는 것이 가장 효율적이고 올바른 해결책입니다.

### 1. 새 Read Model 생성 (DDL)

`read_object_parsing_stats` 테이블을 생성합니다.
*   **Key:** `(object_name)`
*   **필드:** `total_attempts` (총 시도 수), `success_count` (성공 수), `success_rate` (성공률, float8)
*   **Primary Key:** `object_name`

```sql
CREATE TABLE IF NOT EXISTS read_object_parsing_stats (
    object_name VARCHAR PRIMARY KEY,
    total_attempts INTEGER NOT NULL,
    success_count INTEGER NOT NULL,
    success_rate NUMERIC(5, 2) NOT NULL
);
```

### 2. 새 Read Model 을 채우는 SQL (Projection Logic)

기존 `read_grip_result` 테이블을 스캔하여, `object_name` 기준으로 시도 수와 성공 수를 집계하고, 이를 새 테이블에 `INSERT` 합니다.

*   **계산 로직:**
    1.  `read_grip_result` 에서 `object_name` 과 `scene_key` 로 그룹화하여 각 장면별 시도당 결과를 합칩니다.
    2.  그 결과를 `object_name` 으로 다시 그룹화하여 총 시도 수와 성공 수를 계산합니다.
    3.  `success_rate` 는 `(success_count * 100.0) / total_attempts` 로 계산합니다.
    4.  기존에 존재하는 `object_name` 은 업데이트하고, 없는 것은 `INSERT` 합니다.

```sql
INSERT INTO read_object_parsing_stats (object_name, total_attempts, success_count, success_rate)
WITH object_level_stats AS (
    SELECT 
        object_name,
        COUNT(*) AS total_attempts,
        SUM(grip_succeed) AS success_count
    FROM read_grip_result
    GROUP BY object_name
),
final_stats AS (
    SELECT 
        object_name,
        SUM(total_attempts) AS total_attempts,
        SUM(success_count) AS success_count
    FROM object_level_stats
    GROUP BY object_name
)
SELECT 
    fs.object_name,
    fs.total_attempts,
    fs.success_count,
    ROUND((fs.success_count::numeric * 100.0) / fs.total_attempts, 2) AS success_rate
FROM final_stats fs
ON CONFLICT (object_name) DO UPDATE SET
    total_attempts = EXCLUDED.total_attempts,
    success_count = EXCLUDED.success_count,
    success_rate = EXCLUDED.success_rate;
```

### 3. 검증 SQL

생성된 새 Read Model 에서 요청한 조회 (객체별 파지 성공률) 를 수행하여 결과를 확인합니다.

```sql
SELECT 
    object_name,
    total_attempts AS 시도_수,
    success_count AS 성공_수,
    success_rate AS 성공률
FROM read_object_parsing_stats
ORDER BY object_name;
```
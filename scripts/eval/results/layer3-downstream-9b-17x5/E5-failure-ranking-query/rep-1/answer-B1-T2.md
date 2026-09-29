제공된 자료 (로그 컨텍스트 및 Read Model 스키마) 를 분석한 결과, 요청하신 "객체별 실패 수와 실패율 순위" 조회를 수행하기 위해 **새로운 Read Model**이 필요합니다.

**이유:**
1.  **필요한 데이터:** "객체명 (object_name)"과 "파지 성공 여부 (grip_succeed)"가 필요합니다. 이는 `read_grip_result` 테이블에 존재합니다.
2.  **결핍된 데이터:** "객체명"은 `read_grip_result`의 `object_name` 컬럼에 있지만, "실패율"을 계산하려면 **총 시도 횟수**와 **실패 횟수**가 필요합니다.
    *   현재 `read_grip_result` 테이블은 `(scene_key, attempt_num)`을 Primary Key로 하여 **각 시도 (attempt) 에 대한 개별 결과**만 저장하고 있습니다.
    *   따라서 특정 객체 (예: '강아지공룡알장난감') 에 대한 총 시도 횟수와 실패 횟수를 구하려면, `object_name` 기준으로 `read_grip_result` 테이블을 그룹화 (GROUP BY) 하여 집계해야 합니다.
3.  **결론:** 기존 Read Model (`read_grip_result`) 만으로는 객체 단위의 집계 (Count, Sum) 를 직접 수행할 수 없으므로, 객체별 집계 결과를 저장하는 새로운 Read Model (`read_object_failure_stats`) 을 생성해야 합니다.

아래는 새 Read Model 생성 DDL 과, 해당 테이블을 통해 요청된 조회를 수행하는 SQL 입니다.

```sql
-- 1. 새 Read Model 생성 (객체별 파지 실패 통계 집계용)
CREATE TABLE read_object_failure_stats (
    object_name VARCHAR(255) NOT NULL,
    total_attempts INT NOT NULL,
    failed_attempts INT NOT NULL,
    failure_rate NUMERIC(5, 2) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (object_name)
);

-- 2. 새 Read Model 을 채울 데이터 변환 SQL (백엔드 서비스에서 실행)
-- 기존 read_grip_result 테이블의 데이터를 기반으로 object_name, total_attempts, failed_attempts 를 계산하여 새 테이블에 로드합니다.
INSERT INTO read_object_failure_stats (object_name, total_attempts, failed_attempts, failure_rate)
SELECT 
    object_name,
    COUNT(*) AS total_attempts,
    SUM(1 - grip_succeed) AS failed_attempts, -- grip_succeed: 1(성공), 0(실패) 이므로 1-값으로 실패 여부 변환 후 합산
    ROUND(
        (SUM(1 - grip_succeed)::NUMERIC / COUNT(*)) * 100, 
        2
    ) AS failure_rate
FROM read_grip_result
GROUP BY object_name;

-- 3. 요청된 조회 SQL (객체별 실패 수와 실패율 순위대로 조회)
SELECT 
    object_name,
    failed_attempts AS failure_count,
    failure_rate AS failure_rate_percent,
    RANK() OVER (ORDER BY failure_rate DESC) AS rank
FROM read_object_failure_stats
ORDER BY failure_rate DESC;
```
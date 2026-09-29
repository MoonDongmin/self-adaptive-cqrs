제공된 자료 (Read Model 스키마) 를 분석한 결과, **일자별 파지 성공률 추이**를 조회하는 데 필요한 데이터가 **read_grip_result** 테이블에 존재합니다.

**근거:**
1.  **필요한 필드:**
    *   `occurred_at`: 날짜별 집계 기준이 됩니다.
    *   `attempt_num`: 시도 수 (Count) 를 세는 기준이 됩니다.
    *   `grip_succeed`: 성공 수 (Sum) 를 세는 기준이 됩니다.
2.  **데이터 구조:** `read_grip_result` 테이블은 `(scene_key, attempt_num)` 의 복합 주석을 가지며, `occurred_at` 필드가 `timestamptz` 타입으로 저장되어 있어 날짜별 그룹화가 가능합니다.
3.  **결론:** 별도의 새 테이블 생성 없이, 기존 `read_grip_result` 테이블을 활용하여 `occurred_at` 기준으로 그룹화하고 `attempt_num` 과 `grip_succeed` 를 집계하여 성공률을 계산할 수 있습니다.

따라서 새 테이블 생성 DDL 대신, 요청된 조회를 수행할 수 있는 SQL 을 작성합니다.

```sql
SELECT
    DATE(occurred_at) AS report_date,
    COUNT(*) AS attempt_count,
    SUM(grip_succeed) AS success_count,
    ROUND(CAST(SUM(grip_succeed) AS FLOAT) / COUNT(*) * 100, 2) AS success_rate
FROM
    read_grip_result
WHERE
    occurred_at IS NOT NULL
GROUP BY
    DATE(occurred_at)
ORDER BY
    report_date ASC;
```
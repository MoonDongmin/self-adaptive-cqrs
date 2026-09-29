제공된 자료 (Read Model 스키마) 를 분석한 결과, **일자별 파지 성공률 추이**를 조회하는 데 필요한 필드가 Read Model 에 존재합니다.

**이유:**
1.  **필요 필드:** `occurred_at` (일자 추출용), `attempt_num` (시도 수 집계용), `grip_succeed` (성공 수 집계용).
2.  **현황:** `read_grip_result` 테이블에는 `occurred_at`, `attempt_num`, `grip_succeed` 필드가 모두 존재합니다.
3.  **결론:** 필드는 존재하므로, 별도의 새 테이블 생성 없이 기존 `read_grip_result` 테이블을 활용하여 SQL 을 작성할 수 있습니다.
    *   `occurred_at` 필드가 `timestamptz` 형식이며, 사용자가 "일자별" (날짜 단위) 추이를 원하므로 `DATE_TRUNC` 또는 `DATE` 함수를 사용하여 일자를 추출해야 합니다.

```sql
SELECT 
    DATE_TRUNC('day', occurred_at) AS date,
    COUNT(*) AS attempt_count,
    SUM(grip_succeed) AS success_count,
    ROUND(CAST(SUM(grip_succeed) AS FLOAT) / COUNT(*) * 100, 2) AS success_rate
FROM 
    read_grip_result
GROUP BY 
    DATE_TRUNC('day', occurred_at)
ORDER BY 
    date ASC;
```
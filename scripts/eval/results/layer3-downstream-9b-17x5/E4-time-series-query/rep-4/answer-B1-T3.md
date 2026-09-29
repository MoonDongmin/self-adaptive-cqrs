제공된 자료 (Read Model 스키마) 를 분석한 결과, **일자별 파지 성공률 추이**를 조회하는 데 필요한 필드가 `read_grip_result` 테이블에 존재합니다.

**이유:**
1.  **필수 필드 존재:** '일자별' 집계와 '시간 순' 정렬을 위해 `occurred_at` 필드가 `timestamptz` 타입으로 정의되어 있으며, 이를 `DATE()` 함수로 변환하여 날짜별로 그룹화할 수 있습니다.
2.  **주요 필드 존재:** `read_grip_result` 테이블에는 `attempt_num` (시도 수), `object_name` (객체명), `grip_succeed` (성공 여부, 0 또는 1) 가 정의되어 있습니다.
3.  **결론:** 기존 `read_grip_result` 테이블만으로도 `attempt_num` 과 `grip_succeed` 를 `occurred_at` 에 따라 그룹화하여 집계할 수 있습니다. 별도의 새 테이블 생성은 필요 없으며, 기존 `read_grip_result` 테이블을 활용하여 SQL 을 작성하면 됩니다.

다음은 요청된 조회 (일자별 시도 수, 성공 수, 성공률, 시간 순) 를 수행할 SQL 입니다.

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
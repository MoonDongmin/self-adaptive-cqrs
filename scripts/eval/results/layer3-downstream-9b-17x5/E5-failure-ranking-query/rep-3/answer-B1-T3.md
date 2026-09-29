제공된 자료와 앞서 작성된 SQL 로부터, `read_grip_result_object_stats` 테이블이 생성된 후 해당 테이블을 기반으로 **객체별 실패 수와 실패율을 실패 수 내림차순으로 상위 3 개**를 조회하는 SQL 은 다음과 같습니다.

```sql
SELECT 
    object_name,
    failed_attempts,
    failure_rate,
    ROW_NUMBER() OVER (ORDER BY failed_attempts DESC, failure_rate DESC) AS rank
FROM read_grip_result_object_stats
WHERE rank <= 3
ORDER BY failed_attempts DESC, failure_rate DESC;
```
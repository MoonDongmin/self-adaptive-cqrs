제공된 자료와 상황 (새 Read Model `read_object_parsing_stats` 생성 및 백필 로직 포함) 를 바탕으로, 요청하신 "객체별 파지 성공률이 높은 순으로 상위 3 개 객체"를 조회하는 SQL 입니다.

```sql
SELECT 
    object_name,
    total_attempts AS 시도_수,
    success_count AS 성공_수,
    success_rate AS 성공률
FROM read_object_parsing_stats
ORDER BY success_rate DESC
LIMIT 3;
```
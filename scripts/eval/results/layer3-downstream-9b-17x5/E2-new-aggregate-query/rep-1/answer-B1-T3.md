제공된 자료와 상황 (이벤트 소싱 + CQRS 아키텍처) 을 고려할 때, 사용자가 요청한 "객체별 파지 성공률 상위 3 개" 조회는 **새로 생성된 `read_grip_result_by_object` 테이블**을 사용하여 수행해야 합니다.

이벤트 소싱 시스템의 특성상, 백엔드 서비스는 실시간으로 이벤트를 처리하여 Read Model 을 갱신하는 것이 아니라, **Read Model 을 직접 조회**하여 응답을 반환합니다. 따라서 `read_grip_result` 테이블을 직접 집계하는 SQL 을 작성하거나, 백필 (Backfill) SQL 을 먼저 실행하는 것은 CQRS 의 "조회 (Query)" 단계에서는 해당되지 않습니다.

요청하신 "상위 3 개" 조건을 만족하는 조회 SQL 은 다음과 같습니다.

```sql
SELECT 
    object_name,
    total_attempts AS attempt_count,
    success_attempts AS success_count,
    success_rate AS success_rate
FROM read_grip_result_by_object
ORDER BY success_rate DESC
LIMIT 3;
```
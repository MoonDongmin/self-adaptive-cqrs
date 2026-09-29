사용자가 '파지 실패가 가장 많은 객체 상위 목록'을 조회했으나, 기존 Read Model 은 `read_grip_result` 의 `object_name` 과 `attempt_num` 을 기본 키로 하여 개별 시도별 성공/실패만 저장하고 있어, 객체 단위의 집계 데이터가 존재하지 않습니다.

구체적으로 `insight.card.miss` 로그에서 "파지 실패가 가장 많은 객체 상위 목록을 조회하고 싶다"는 요청이 발생했으나, 이를 처리할 수 있는 뷰나 집계 테이블이 정의되어 있지 않습니다.

`read_grip_result` 테이블에는 `object_name` 과 `attempt_num` 이며, `stream_id` 는 `grip-attempt:object_name` 형식이지만, 객체별 총 실패 수나 실패율을 계산하기 위한 `object_name` 과 `attempt_num` 조합의 그룹화 구조가 없습니다.

따라서 `read_grip_result` 테이블의 `object_name` 과 `attempt_num` 을 기준으로 `grip_succeed=0`인 행을 필터링하고 `object_name` 에 따라 `COUNT(*)` 및 `SUM(grip_succeed)`를 계산하여 실패율을 도출하는 SQL 을 작성해야 합니다.

```sql
SELECT 
    object_name,
    COUNT(*) AS fail_count,
    ROUND(100.0 * (COUNT(*) - SUM(grip_succeed)) / COUNT(*), 2) AS fail_rate
FROM read_grip_result
WHERE grip_succeed = 0
GROUP BY object_name
ORDER BY fail_count DESC
LIMIT 10;
```
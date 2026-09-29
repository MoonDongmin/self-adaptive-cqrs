제공된 자료에 따르면, 사용자가 요청한 '일자별 파지 성공률 추이'를 조회하기 위해서는 새로 생성된 `read_daily_grip_stats_v2` 테이블을 사용해야 합니다. 기존 `read_grip_result` 테이블은 장면별·시도별 (Row-level) 데이터만 보유하고 있어, 날짜별 집계 (시도 수, 성공 수, 성공률) 를 직접 조회할 수 없으므로 백필 (Backfill) SQL 은 필요하지 않습니다.

요청하신 조건 (일자별, 시도 수, 성공 수, 성공률, 날짜 오름차순) 에 맞춰 작성한 SELECT 문은 다음과 같습니다.

```sql
SELECT
  occurred_date,
  total_attempts,
  success_count,
  ROUND((success_count * 100.0 / NULLIF(total_attempts, 0)), 2) AS success_rate
FROM
  read_daily_grip_stats_v2
ORDER BY
  occurred_date ASC;
```
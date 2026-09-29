제공된 자료에 따르면, 사용자 요청인 '일자별 파지 성공률 추이'를 충족시키기 위해 새로운 Read Model 테이블 `read_daily_grip_success_rate_v1`이 필요합니다. 기존 Read Model(`read_grip_result`, `read_multimodal`)은 시나리오별(row-level) 데이터만 저장하고 있어 일별 집계 (Aggregation) 를 지원하지 않으며, 자료 내의 `insight.card.miss` 로그가 이를 증명합니다.

따라서 요구사항에 따라 새 테이블을 생성하는 DDL SQL 을 작성합니다.

```sql
CREATE TABLE read_daily_grip_success_rate_v1 (
  occurred_date VARCHAR NOT NULL,
  attempt_count DOUBLE PRECISION,
  success_count DOUBLE PRECISION,
  success_rate DOUBLE PRECISION,
  PRIMARY KEY (occurred_date)
);
```

이제 다음 질문에 답하는 SELECT 문을 작성하라: 일자별 파지 성공률을 날짜 오름차순으로, 시도 수·성공 수·성공률과 함께 조회하라.
필요하면 기존 데이터(read_grip_result, read_multimodal, event_store)로 새 테이블을 채우는 백필 SQL 을 먼저 작성하고,
질문에 답하는 SELECT 문은 반드시 마지막 ```sql 블록에 단독으로 작성하라.

```sql
SELECT 
  occurred_date,
  attempt_count,
  success_count,
  success_rate
FROM read_daily_grip_success_rate_v1
ORDER BY occurred_date ASC;
```
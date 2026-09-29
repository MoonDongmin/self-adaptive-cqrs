제공된 자료에 따르면, 사용자 요청인 '일자별 파지 성공률 추이'를 충족시키기 위해 신규 Read Model `read_grip_daily_success_rate`를 생성해야 합니다. 기존 Read Model(`read_grip_result`) 은 원천 시도 기록 (1:1) 만 저장하므로 집계 (GROUP BY 일자) 를 수행할 수 없으며, 자료 내의 권고안 (Recommendation) 에 따라 신규 테이블 생성이 결정되었습니다.

따라서 실행해야 할 SQL 은 신규 테이블 생성 DDL 입니다.

```sql
CREATE TABLE read_grip_daily_success_rate (
  occurred_date date NOT NULL,
  attempt_count double_precision,
  success_count double_precision,
  success_rate double_precision,
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
FROM read_grip_daily_success_rate
ORDER BY occurred_date ASC;
```
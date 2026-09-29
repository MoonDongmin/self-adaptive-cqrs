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
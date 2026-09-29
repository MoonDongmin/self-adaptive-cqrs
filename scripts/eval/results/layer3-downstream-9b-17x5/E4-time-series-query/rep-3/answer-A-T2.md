현재 제공된 자료에 따르면, 사용자 요청인 '일자별 파지 성공률 추이'를 충족시키기 위해 **신규 Read Model 테이블 `read_grip_daily_success_rate`**를 생성해야 합니다. 기존 Read Model(`read_grip_result`, `read_multimodal`) 은 원천 시도 기록 (1:1) 만 저장하므로 집계 (GROUP BY 일자) 를 수행할 수 없으며, 자료 내의 권고안 (Recommendation) 에 따라 신규 테이블 생성이 결정되었습니다.

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
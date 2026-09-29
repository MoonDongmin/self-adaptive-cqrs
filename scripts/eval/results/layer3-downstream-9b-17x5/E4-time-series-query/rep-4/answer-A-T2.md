현재 제공된 자료에 따르면, 사용자가 요청한 '일자별 파지 성공률 추이'를 조회하기 위한 Read Model(`read_daily_grip_stats_v1`)은 아직 생성되지 않았습니다. 기존 Read Model(`read_grip_result`)은 원천 데이터 (시도 단위) 만 저장하고 있으며, 집계된 일일 통계 (총 시도 수, 성공 수, 성공률) 를 제공하는 테이블이 누락되어 있습니다.

따라서 새로운 Read Model 테이블 `read_daily_grip_stats_v1`을 생성하는 DDL SQL 을 작성합니다. 기존 테이블 (`read_grip_result`, `read_multimodal`) 은 무손상 원칙에 따라 변경하지 않습니다.

```sql
CREATE TABLE read_daily_grip_stats_v1 (
  occurred_date varchar(10) NOT NULL,
  total_attempts smallint,
  success_count smallint,
  success_rate doublePrecision(6),
  PRIMARY KEY (occurred_date)
);
```
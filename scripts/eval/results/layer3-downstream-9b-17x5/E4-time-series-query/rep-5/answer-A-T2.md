현재 시스템의 Read Model(`read_grip_result`, `read_multimodal`) 은 장면별·시도별 (Row-level) 데이터만 보유하고 있으며, 사용자가 요청한 '일자별' 집계 (Aggregation) 데이터 (시도 수, 성공 수, 성공률) 를 직접 조회할 수 없습니다. 따라서 새로운 Read Model 테이블 `read_daily_grip_stats_v2` 를 생성해야 합니다.

```sql
CREATE TABLE public.read_daily_grip_stats_v2 (
  occurred_date varchar NOT NULL,
  total_attempts double precision,
  success_count double precision,
  CONSTRAINT pk_read_daily_grip_stats_v2 PRIMARY KEY (occurred_date)
);

CREATE INDEX idx_daily_stats_occurred_date ON public.read_daily_grip_stats_v2 (occurred_date);
```
제공된 자료에 따르면, 사용자가 요청한 '파지 실패가 가장 많은 객체 상위 목록'과 '객체별 실패 수와 실패율'은 기존 Read Model(`read_grip_result`) 의 구조 (시도별 1:1 매핑) 로는 조회할 수 없으며, 새로운 집계 카드인 `read_object_failure_stats` 가 부재하여 `insight.card.miss` 오류가 발생하고 있습니다.

따라서 새로운 Read Model 테이블 `read_object_failure_stats` 를 생성하는 DDL SQL 을 작성합니다. 기존 테이블 (`read_grip_result`, `read_multimodal`) 은 무손상 원칙에 따라 변경하지 않습니다.

```sql
CREATE TABLE public.read_object_failure_stats (
  object_name varchar NOT NULL,
  total_attempts double precision NOT NULL,
  success_count double precision NOT NULL,
  failure_count double precision NOT NULL
);

ALTER TABLE public.read_object_failure_stats ADD CONSTRAINT read_object_failure_stats_pk PRIMARY KEY (object_name);

CREATE INDEX idx_object_failure_stats_name ON public.read_object_failure_stats(object_name);
```
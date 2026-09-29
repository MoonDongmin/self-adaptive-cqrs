제공된 자료에 따르면, 사용자가 요청한 '파지 실패가 가장 많은 객체 상위 목록' 조회는 기존 `read_grip_result` 테이블의 행 단위 (row-level) 구조로는 GROUP BY 와 집계 (COUNT, SUM) 로직을 수행할 수 없으며, 이는 `insight.card.miss` 로 이어지는 결재 (miss) 원인입니다.

따라서 새로운 집계 전용 Read Model (`read_object_failure_stats_v1`) 을 생성하여, `object_name` 을 키로 하고 `failure_count`, `success_count`, `total_attempts`, `failure_rate` 필드를 포함하는 테이블을 생성해야 합니다. 기존 테이블 (`read_grip_result`, `read_multimodal`) 은 무손상 원칙에 따라 변경하지 않습니다.

다음은 해당 새 Read Model 을 생성하기 위한 SQL 입니다.

```sql
CREATE TABLE read_object_failure_stats_v1 (
  object_name varchar NOT NULL,
  failure_count double precision,
  success_count double precision,
  total_attempts double precision,
  failure_rate double precision,
  PRIMARY KEY (object_name)
);
```
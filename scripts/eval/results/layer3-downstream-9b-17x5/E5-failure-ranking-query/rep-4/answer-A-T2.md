제공된 자료에 따르면, 사용자가 요청한 '파지 실패가 가장 많은 객체 상위 목록 (실패 수/실패율)'은 기존 Read Model (`read_grip_result`, `read_multimodal`) 에 존재하지 않으며, 이를 지원하기 위해 새로운 집계 Read Model `read_grip_object_failures` 를 생성해야 합니다.

따라서 실행해야 할 SQL 은 새 테이블을 생성하는 DDL 입니다.

```sql
CREATE TABLE read_grip_object_failures (
  object_name varchar NOT NULL,
  total_attempts bigint,
  success_count bigint,
  failure_count bigint,
  failure_rate doublePrecision,
  PRIMARY KEY (object_name)
);
```
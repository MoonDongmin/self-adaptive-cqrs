제공된 자료에 따르면, 사용자가 요청한 '파지 실패가 가장 많은 객체 상위 목록 (실패 수/실패율)'은 기존 Read Model 에 존재하지 않으며, 이를 지원하기 위해 새로운 집계 Read Model `read_grip_object_failures` 를 생성해야 합니다.

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

이제 다음 질문에 답하는 SELECT 문을 작성하라: 객체(object_name)별 실패 수와 실패율을 실패 수 내림차순으로 상위 3 개 조회하라.
필요하면 기존 데이터(read_grip_result, read_multimodal, event_store) 로 새 테이블을 채우는 백필 SQL 을 먼저 작성하고,
질문에 답하는 SELECT 문은 반드시 마지막 ```sql 블록에 단독으로 작성하라.

```sql
SELECT 
  object_name,
  failure_count,
  failure_rate
FROM read_grip_object_failures
ORDER BY failure_count DESC
LIMIT 3;
```
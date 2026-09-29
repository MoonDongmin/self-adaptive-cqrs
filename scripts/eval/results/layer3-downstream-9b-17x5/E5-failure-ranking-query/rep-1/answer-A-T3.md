제공된 자료에 따르면, 사용자의 요청인 '파지 실패가 가장 많은 객체 상위 목록'과 '객별 실패 수와 실패율'을 조회하는 데 필요한 Read Model(`read_object_failure_aggregation`)은 현재 시스템에 등록되어 있지 않습니다. 기존 Read Model(`read_grip_result`, `read_multimodal`) 은 행 단위 (시도별) 데이터만 저장하고 있으며, 객체별 집계 (총 시도 수, 성공 수, 실패 수, 실패율) 로 변환된 데이터는 없습니다.

따라서 요청을 충족시키기 위해 새 Read Model 테이블 `read_object_failure_aggregation` 을 생성해야 합니다. 기존 테이블은 무손상 원칙에 따라 변경하지 않습니다.

```sql
CREATE TABLE read_object_failure_aggregation (
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
FROM read_object_failure_aggregation
ORDER BY failure_count DESC
LIMIT 3;
```
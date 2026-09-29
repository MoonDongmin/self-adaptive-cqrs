제공된 자료에 따르면, 사용자가 요청한 '객체(object_name)별 파지 성공률' 조회는 기존 Read Model (`read_grip_result`) 의 행 단위 구조로는 직접 수행할 수 없으며, `insight.card.miss` 로 인해 조회가 실패하고 있습니다.

따라서 **신규 Read Model 테이블 `read_object_success_rate_v1`** 을 생성하여, `object_name` 을 Primary Key 로 하고 `total_attempts`, `success_count`, `success_rate` 필드를 가진 누적 집계 (cumulative upsert) 구조를 도입해야 합니다.

다음은 해당 상황을 해결하기 위해 실행해야 할 SQL 입니다.

```sql
CREATE TABLE read_object_success_rate_v1 (
  object_name varchar NOT NULL,
  total_attempts bigint,
  success_count bigint,
  success_rate doublePrecision,
  PRIMARY KEY (object_name)
);
```

이제 다음 질문에 답하는 SELECT 문을 작성하라: 객체(object_name)별 파지 성공률이 높은 순으로 상위 3 개 객체를 시도 수·성공 수·성공률과 함께 조회하라.
필요하면 기존 데이터(read_grip_result, read_multimodal, event_store) 로 새 테이블을 채우는 백필 SQL 을 먼저 작성하고,
질문에 답하는 SELECT 문은 반드시 마지막 ```sql 블록에 단독으로 작성하라.
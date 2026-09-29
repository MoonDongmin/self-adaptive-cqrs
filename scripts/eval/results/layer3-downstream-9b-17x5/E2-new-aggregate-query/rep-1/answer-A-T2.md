제공된 자료에 따르면, `object_name`별 파지 성공률(시도 수, 성공 수, 성공률) 을 조회하기 위해 **새로운 Read Model 테이블 `read_object_grip_aggregate_v1`**이 필요합니다. 기존 `read_grip_result` 테이블은 `(scene_key, attempt_num)` 키를 사용하여 1:1 상세 데이터를 저장하므로, `object_name`으로 그룹화된 집계 데이터를 직접 조회할 수 없습니다.

따라서 요구사항을 충족시키기 위해 `read_object_grip_aggregate_v1` 테이블을 생성하는 DDL SQL 을 작성합니다.

```sql
CREATE TABLE read_object_grip_aggregate_v1 (
  object_name varchar NOT NULL,
  attempt_count bigint,
  success_count bigint,
  success_rate doublePrecision,
  PRIMARY KEY (object_name)
);
```
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
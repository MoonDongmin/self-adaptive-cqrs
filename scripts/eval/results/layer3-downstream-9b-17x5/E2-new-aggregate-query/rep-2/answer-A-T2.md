제공된 자료에 따르면, 사용자가 요청한 'object_name별 파지 성공률 (시도 수, 성공 수, 성공률)'을 조회하기 위해 기존 Read Model(`read_grip_result`)은 부적합하며, 신규 Read Model 테이블 `read_object_grip_stats`를 생성해야 합니다.

기존 테이블 (`read_grip_result`, `read_multimodal`) 은 변경 금지 (무손상) 여건 하에, 신규 테이블만 생성하는 DDL SQL 입니다.

```sql
CREATE TABLE read_object_grip_stats (
  object_name VARCHAR DEFAULT NULL,
  attempt_count DOUBLE PRECISION DEFAULT NULL,
  success_count DOUBLE PRECISION DEFAULT NULL,
  success_rate DOUBLE PRECISION DEFAULT NULL,
  PRIMARY KEY (object_name)
);

CREATE INDEX idx_object_grip_stats ON read_object_grip_stats(object_name);
```
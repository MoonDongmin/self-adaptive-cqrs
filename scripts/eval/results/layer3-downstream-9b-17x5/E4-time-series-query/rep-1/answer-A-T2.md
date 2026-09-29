현재 제공된 자료에 따르면, 사용자가 요청한 '일자별 파지 성공률 추이 (시도 수, 성공 수, 성공률)'를 조회하기 위한 Read Model 은 존재하지 않습니다.

자료의 `insight.card.miss` 로그와 `read_daily_grip_stats_v1` 테이블 정의 부재 (Drizzle 스키마에 미등재됨) 로 확인됩니다. 따라서 기존 Read Model (`read_grip_result`, `read_multimodal`) 을 수정하거나 집계 쿼리를 실행하는 것이 아니라, **새로운 Read Model 테이블 `read_daily_grip_stats_v1` 을 생성**해야 합니다.

기존 테이블 (`read_grip_result`, `read_multimodal`) 은 무손상해야 하므로, 새 테이블만 생성하는 DDL 을 작성합니다.

```sql
CREATE TABLE read_daily_grip_stats_v1 (
  occurred_at timestamptz NOT NULL,
  total_attempts bigint,
  success_count bigint,
  success_rate double precision,
  PRIMARY KEY (occurred_at)
);
```
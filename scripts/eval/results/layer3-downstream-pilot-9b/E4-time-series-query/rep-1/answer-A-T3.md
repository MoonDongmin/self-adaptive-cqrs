사용자가 요청한 '일자별 파지 성공률 추이'를 조회하기 위해, 먼저 제공된 자료에 정의된 `read_daily_grip_stats_v1` 테이블이 존재하지 않으므로 해당 테이블을 백필 (Backfill) 하는 SQL 을 작성한 후, 최종 조회를 위한 SELECT 문을 작성합니다.

### 1. 백필 SQL (새 Read Model 생성 및 초기화)
제공된 자료의 `read_daily_grip_stats_v1` 스키마 정의와 `GripAttemptRecorded` 이벤트 소스를 기반으로, `read_grip_result` 테이블에 저장된 원본 데이터를 집계하여 `read_daily_grip_stats_v1` 테이블을 생성하고 채웁니다.

```sql
-- 1. Read Model 테이블 생성
CREATE TABLE read_daily_grip_stats_v1 (
  occurred_at timestamptz NOT NULL,
  total_attempts bigint,
  success_count bigint,
  success_rate double precision,
  PRIMARY KEY (occurred_at)
);

-- 2. 기존 원본 데이터 (read_grip_result) 를 기반으로 집계하여 새 Read Model 채우기
-- 이벤트 소스 (GripAttemptRecorded) 가 아닌, 이미 투영된 read_grip_result 테이블을 사용하여 백필 수행
-- occurred_at: timestamptz 형식이므로 DATE_TRUNC 를 사용하여 날짜 단위 그룹화
INSERT INTO read_daily_grip_stats_v1 (occurred_at, total_attempts, success_count, success_rate)
SELECT 
  DATE_TRUNC('day', occurred_at) as occurred_at,
  COUNT(*) as total_attempts,
  SUM(grip_succeed) as success_count,
  -- 성공률이 0 일 경우 나눗셈 오류 방지 (total_attempts > 0 일 때만 계산)
  CASE 
    WHEN COUNT(*) > 0 THEN ROUND(CAST(SUM(grip_succeed) AS DOUBLE PRECISION) / COUNT(*), 4)
    ELSE 0.0
  END as success_rate
FROM read_grip_result
GROUP BY DATE_TRUNC('day', occurred_at)
ON CONFLICT (occurred_at) DO NOTHING; -- 이미 존재하는 날짜는 덮어쓰지 않음 (백필용)
```

### 2. 조회 SQL (사용자 요청 충족)
일자별 파지 성공률 추이 (시도 수, 성공 수, 성공률) 를 시간 순으로 조회합니다.

```sql
SELECT 
  occurred_at,
  total_attempts,
  success_count,
  success_rate
FROM read_daily_grip_stats_v1
ORDER BY occurred_at ASC;
```
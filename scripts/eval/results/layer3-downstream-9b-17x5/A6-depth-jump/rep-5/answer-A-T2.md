제공된 자료에 따르면, 현재 `read_grip_result` 테이블은 시계열 일관성 (jump rule) 을 검증할 수 있는 필드 (`z_avg_m`, `grip_outlier_flag`) 를 가지고 있지 않습니다. 따라서 즉시 실행 가능한 SQL 로는 **새로운 Read Model (`read_grip_result_v2`) 을 생성하는 DDL**과, **오염된 행을 격리하는 DELETE**가 필요합니다.

자료의 "권고" 섹션에서 `[fix]` 전략이 채택되었으며, "Read Model 생성 SQL" 섹션에 `read_grip_result_v2` 테이블의 스키마 정의가 포함되어 있습니다.

```sql
-- 1. 새 Read Model (read_grip_result_v2) 생성
-- 용도: 동장 scene 내 attempt 간 Z 좌표 평균 (z_avg_m) 과 정성성 플래그 (grip_outlier_flag) 를 저장하여 시계열 급변 (jump) 검증 가능
CREATE TABLE read_grip_result_v2 (
  scene_key varchar NOT NULL,
  attempt_num smallint NOT NULL,
  object_name varchar,
  grip_succeed smallint,
  occurred_at timestamptz,
  z_avg_m double precision,
  grip_outlier_flag smallint,
  PRIMARY KEY (scene_key, attempt_num)
);

-- 2. 오염된 행 격리 (DELETE)
-- 사유: Attempt 2 의 grip3dPoseZ 평균이 직전 Attempt 1 대비 임계값 (0.10m) 을 초과하여 물리적 일관성 위배
-- 조치: 해당 시나리오 (scene_key: '반려동물용품_CR01_강아지공룡알장난감_02010', attempt_num: 2) 의 오염 행을 제거
-- 참고: 원본 이벤트는 event_store 에 보존되므로 v2 재투영 시 복원 가능
DELETE FROM read_grip_result_v2 
WHERE (scene_key, attempt_num) = ('반려동물용품_CR01_강아지공룡알장난감_02010', 2);
```
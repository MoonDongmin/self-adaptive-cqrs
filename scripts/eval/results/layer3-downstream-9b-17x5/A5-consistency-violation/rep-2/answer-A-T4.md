기존 v1 API 클라이언트가 깨지지 않게 하려면 **신규 v2 엔드포인트를 추가하되, 기존 v1 엔드포인트와 로직을 무손상 (Unchanged) 으로 유지**해야 합니다.

구체적인 단계는 다음과 같습니다:

1.  **신규 엔드포인트 추가**: `POST /grip-result-v2` 라우트를 추가하여 v2 Read Model (`read_grip_result_v2`) 을 조회할 수 있게 합니다.
2.  **기존 엔드포인트 유지**: `POST /grip-result` (v1) 라우트와 `read_grip_result` 테이블을 삭제하지 않고 그대로 둡니다.
3.  **병행 운영**: v1과 v2를 동시에 운영하여, 클라이언트가 v1 API 를 호출하면 v1 로직이, v2 API 를 호출하면 v2 로직이 각각 처리됩니다.
4.  **컷오버 (Cutover) 절차**: v1 API 를 완전히 제거하기 전까지, v1 API 가 반환하는 데이터가 v2 로직의 정합성 규칙 (`grip_outlier_flag`) 을 만족하는지 검증합니다. 검증이 완료되면 v1 API 를 제거하고 v2 API 만 남깁니다.

```sql
-- 1. 신규 v2 엔드포인트 배선 및 서비스 등록 (DDL 및 코드 수정)
-- 이 단계는 기존 v1 자산에 영향을 주지 않습니다.
-- src/projection/projection.service.ts 에 catchUpGripResultV2 메서드 추가
-- src/projection/projection.controller.ts 에 @Post("/grip-result-v2") 라우트 추가
-- src/shared/database/schema/index.ts 에 read_grip_result_v2 스키마 export 추가

-- 2. 신규 Read Model 테이블 생성 (DDL)
-- read_grip_result_v2 테이블 생성 시 기존 read_grip_result 테이블은 건드리지 않습니다.
CREATE TABLE read_grip_result_v2 (
  scene_key varchar NOT NULL,
  attempt_num smallint NOT NULL,
  object_name varchar NOT NULL,
  grip_succeed smallint NOT NULL,
  occurred_at timestamptz NOT NULL,
  robot_tf_translation_z double precision,
  grip_3d_pose_z_max double precision,
  grip_outlier_flag smallint NOT NULL CHECK (grip_outlier_flag IN (0, 1)),
  stream_id varchar NOT NULL,
  global_seq bigint NOT NULL,
  PRIMARY KEY (scene_key, attempt_num)
);

CREATE INDEX idx_grip_result_v2_outlier ON read_grip_result_v2 (grip_outlier_flag, occurred_at);

-- 3. Insight 카드 등록 (DB 메타데이터 동기화)
-- 신규 Read Model 을 분석 엔진에 등록합니다.
INSERT INTO insight_entity (entity_name, kind, purpose, key_columns)
VALUES ('read_grip_result_v2', 'read_model', '장별 로봇 파지 결과와 물리적 좌석 정합성 플래그를 직접 적재하여 DB-level SQL 조회/집게 가능.', '(scene_key, attempt_num)')
ON CONFLICT (entity_name) DO UPDATE SET purpose = EXCLUDED.purpose, key_columns = EXCLUDED.key_columns;

INSERT INTO insight_field (entity_name, field_name, data_type, meaning, display_order)
VALUES
  ('read_grip_result_v2', 'scene_key', 'varchar', '장면 식별 키', 1),
  ('read_grip_result_v2', 'attempt_num', 'smallint', '동장 내 파지 시도 번호', 2),
  ('read_grip_result_v2', 'object_name', 'varchar', '파지 대상 객체명', 3),
  ('read_grip_result_v2', 'grip_succeed', 'smallint', '파지 성공 여부', 4),
  ('read_grip_result_v2', 'occurred_at', 'timestamptz', '데이터 촬영 일자', 5),
  ('read_grip_result_v2', 'robot_tf_translation_z', 'double precision', '로봇 평행이동 Z좌석', 6),
  ('read_grip_result_v2', 'grip_3d_pose_z_max', 'double precision', '3D 파지점 Z좌석 최댓값', 7),
  ('read_grip_result_v2', 'grip_outlier_flag', 'smallint', '정합성 플래그', 8),
  ('read_grip_result_v2', 'stream_id', 'varchar', 'ES 스트림 ID', 9),
  ('read_grip_result_v2', 'global_seq', 'bigint', '투영 출처 이벤트의 ES 전역 시퀀스', 10)
ON CONFLICT (entity_name, field_name) DO UPDATE SET data_type = EXCLUDED.data_type, meaning = EXCLUDED.meaning, display_order = EXCLUDED.display_order;

-- 4. 컷오버 전 검증 (Human-in-the-loop)
-- v1 API (/grip-result) 가 반환하는 모든 행이 v2 로직의 정합성 규칙을 만족하는지 확인합니다.
-- 만약 v1 의 grip_succeed=1 인 행이 v2 의 grip_outlier_flag=1 이라면, v1 API 를 계속 호출하면 모순된 데이터를 반환하므로 컷오버를 보류합니다.
-- 검증 쿼리 예시:
SELECT 
  v1.scene_key, 
  v1.attempt_num, 
  v1.grip_succeed,
  v2.grip_outlier_flag
FROM read_grip_result v1
JOIN read_grip_result_v2 v2 
  ON v1.scene_key = v2.scene_key 
  AND v1.attempt_num = v2.attempt_num
WHERE v1.grip_succeed = 1 
  AND v2.grip_outlier_flag = 1;

-- 위 쿼리가 결과를 반환하면 (즉, 모순된 행이 존재하면), 컷오버를 진행할 수 없습니다.
-- 해당 모순 행들을 v1 Read Model 에서 격리 (DELETE) 하거나, v1 로직을 수정하여 모순 행을 필터링해야 합니다.

-- 5. 컷오버 실행 (모순 행이 없는 경우)
-- v1 API 를 제거하고 v2 API 만 남깁니다.
-- src/projection/projection.controller.ts 에서 @Post("/grip-result") 라우트를 삭제합니다.
-- src/shared/database/schema/index.ts 에서 read_grip_result 스키마 export 를 제거합니다.
-- read_grip_result 테이블을 DROP 합니다.
DROP TABLE IF EXISTS read_grip_result;
```

**주의사항**:
- 위 SQL 은 `read_grip_result_v2` 생성 및 `read_grip_result` 삭제까지 포함합니다.
- 실제 운영 환경에서는 **4 단계 (검증)** 에서 모순 행이 발견되면, 먼저 **4 단계의 격리 SQL** 을 실행하여 `read_grip_result` 테이블의 오염 행을 삭제해야 합니다.
- 오염 행이 제거된 후, 다시 **5 단계** 를 실행하여 v1 테이블을 삭제하고 v2 로직으로 전환해야 합니다.
- v1 API 클라이언트는 컷오버 전까지 `POST /grip-result` 를 계속 호출할 수 있으며, 이는 무손상입니다.
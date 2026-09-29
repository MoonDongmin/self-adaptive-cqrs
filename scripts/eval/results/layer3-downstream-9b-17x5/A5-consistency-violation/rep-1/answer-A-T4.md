기존 v1 API 클라이언트가 깨지지 않도록 하려면 **신규 v2 엔드포인트를 추가하되, 기존 v1 엔드포인트는 그대로 유지 (Backward Compatibility)**해야 합니다.

구체적인 단계는 다음과 같습니다:

1.  **신규 엔드포인트 추가**: `POST /grip-result-v2` 라우트를 추가하여 v2 Read Model (`read_grip_result_v2`) 을 조회할 수 있게 합니다.
2.  **기존 엔드포인트 유지**: `POST /grip-result` (v1) 라우트를 삭제하지 않고 그대로 둡니다. 이는 v1 스키마 (`read_grip_result`) 와 `GripResultProjector` 를 계속 작동시키기 위함입니다.
3.  **병행 운영**: v1과 v2 Read Model 을 동시에 유지하며, 데이터가 들어오면 두 모델 모두에 투영 (Upsert) 됩니다.
4.  **컷오버 (Cut-over) 절차**:
    *   v2 모델이 안정적으로 작동하고, v1 데이터의 물리적 정합성 (Physical Consistency) 이 v2 로직으로 검증되었을 때 (예: `grip_outlier_flag` 가 0 인 경우만 통과), v1 엔드포인트를 삭제하고 v2 엔드포인트로만 전환합니다.

```sql
-- 1. 신규 엔드포인트 배선을 위한 DDL (read_grip_result_v2 테이블 생성 및 인덱스)
-- 이 SQL 은 이미 제공된 자료의 'Read Model 생성 SQL' 섹션에 포함되어 있으며, 
-- human-in-the-loop 승인 후 실행됩니다.
DROP TABLE IF EXISTS read_grip_result_v2;

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

-- 2. 기존 v1 엔드포인트 (/grip-result) 를 유지하기 위해 기존 테이블 삭제 금지
-- 자료에 명시된 대로 "v1 자산(테이블/엔드포인트/프로젝터 name) 무손상"이므로,
-- read_grip_result 테이블을 DROP 하지 않고 그대로 둡니다.

-- 3. 신규 프로젝터 (GripResultV2Projector) 와 컨트롤러 라우트 추가
-- 자료의 '신규 Read Model — 배선' 섹션에 포함된 코드를 적용합니다.
-- src/projection/projection.service.ts 에 catchUpGripResultV2 메서드 추가
-- src/projection/projection.controller.ts 에 @Post("/grip-result-v2") 라우트 추가
-- src/projection/projection.module.ts 에 GripResultV2Projector 등록

-- 4. 컷오버 전 검증 (Human-in-the-loop 승인 기준)
-- v1 엔드포인트를 삭제하기 전, 모든 v1 데이터가 v2 로직과 호환되는지 확인해야 합니다.
-- v1 read_grip_result 에서 grip_succeed=1 인 행에 대해, 
-- 해당 scene_key/attempt_num 으로 조회된 v2 read_grip_result_v2 의 grip_outlier_flag 가 0 이어야 합니다.
-- 만약 outlier_flag=1 이라면 물리적 모순이므로 컷오버를 보류합니다.

-- 5. 컷오버 실행 (인간 승인 후)
-- v1 엔드포인트 (/grip-result) 를 DELETE 합니다.
-- v1 테이블 (read_grip_result) 은 유지하되, 해당 엔드포인트의 라우팅만 제거하거나 비활성화합니다.
-- v2 엔드포인트 (/grip-result-v2) 만 활성화합니다.

-- 예시: v1 엔드포인트 삭제 (PostgreSQL 함수나 애플리케이션 코드 수정을 통해 수행)
-- 만약 DB 레벨에서 뷰나 시퀀스 등을 통해 엔드포인트를 매핑하고 있다면, 해당 매핑을 제거하는 SQL:
-- (가상의 예시: 만약 엔드포인트가 특정 뷰를 통해 매핑된다면)
-- DROP VIEW IF EXISTS view_grip_result_v1; -- 실제 매핑 구조에 따라 다름

-- 6. v1 테이블 데이터 정리 (선택 사항)
-- 컷오버 후 v1 엔드포인트가 완전히 제거되면, 더 이상 쓰이지 않는 v1 테이블 데이터를 
-- 주기적으로 아카이빙하거나 삭제할 수 있습니다. 하지만 즉시 삭제하지는 않는 것이 안전합니다.
-- DELETE FROM read_grip_result WHERE scene_key IN ('...v1 전용 키...'); -- v1 전용 키만 삭제
```

**요약:**
*   **버전 경로**: `/grip-result` (v1, 유지) 와 `/grip-result-v2` (신규, 추가) 를 병행합니다.
*   **마이그레이션**: 신규 테이블 `read_grip_result_v2` 생성 후, 신규 프로젝터 `GripResultV2Projector` 를 통해 데이터를 투영합니다.
*   **컷오버**: v1 데이터가 v2 로직 (정합성 플래그) 과 호환되는지 전수 검증 후, `/grip-result` 엔드포인트를 제거하고 `/grip-result-v2` 로만 전환합니다.
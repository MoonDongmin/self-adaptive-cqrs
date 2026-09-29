기존 v1 API 클라이언트가 깨지지 않도록 하려면 **파괴적 변경 (Breaking Change) 을 피하는 전략**을 따라야 합니다. 제공된 자료에 따르면, 기존 `read_grip_result` 테이블과 엔드포인트는 무손상 유지되며, 새로운 기능은 별도의 v2 버전으로 제공된다는 명시된 제약 사항이 있습니다.

구체적인 단계는 다음과 같습니다:

1.  **버전 경로 변경 (Versioned Endpoint)**
    *   기존 API 엔드포인트 (`/grip-result`) 는 그대로 유지합니다.
    *   새로운 기능 (Z 평균, 이상 플래그 포함) 을 제공하는 새 엔드포인트를 `/grip-result-v2` 로 정의합니다.
    *   클라이언트는 필요에 따라 `/grip-result` (기존 데이터) 또는 `/grip-result-v2` (신규 데이터) 로 요청을 보냅니다.

2.  **신구 병행 운영 (Parallel Operation)**
    *   `read_grip_result` (v1) 와 `read_grip_result_v2` (v2) 테이블을 동시에 유지합니다.
    *   기존 `GripResultProjector` 는 `read_grip_result` 를 계속 업데이트합니다.
    *   신규 `GripResultV2Projector` 는 `read_grip_result_v2` 를 업데이트합니다.
    *   두 테이블의 키 (`scene_key`, `attempt_num`) 는 동일하므로, 같은 시나리오에 대한 데이터가 두 테이블에 중복 저장됩니다.

3.  **마이그레이션 및 컷오버 절차 (Migration & Cutover)**
    *   **Step 1: DDL 실행**: `read_grip_result_v2` 테이블을 생성합니다.
    *   **Step 2: 초기 데이터 로드**: 기존 `read_grip_result` 테이블의 데이터를 `read_grip_result_v2` 로 복사하거나, 이벤트 소스를 통해 `read_grip_result_v2` 를 재투영합니다.
    *   **Step 3: 클라이언트 전환**: 클라이언트가 `/grip-result-v2` 엔드포인트를 사용하도록 점진적으로 전환합니다.
    *   **Step 4: v1 데이터 정리 (선택 사항)**: v2 가 안정적으로 운영되고 모든 클라이언트가 v2 로 전환된 후, `read_grip_result` 테이블을 삭제합니다.

이 절차는 "v1 자산 무손상" 및 "DDL 실행·API 컷오버는 인간 승인 후에만"이라는 제약 조건을 충족합니다.

```sql
-- 1. 신규 Read Model 테이블 생성 (DDL)
-- 이 단계는 인간 승인 후 실행됩니다.
CREATE TABLE read_grip_result_v2 (
  scene_key varchar NOT NULL,
  attempt_num smallint NOT NULL,
  object_name varchar,
  grip_succeed smallint,
  occurred_at timestamp,
  stream_id varchar,
  global_seq bigint,
  grip3d_pose_z_avg doublePrecision,
  grip_outlier_flag smallint,
  PRIMARY KEY (scene_key, attempt_num)
);

-- 2. 기존 v1 데이터에서 v2 로 초기 복사 (Backfill)
-- 기존 read_grip_result 의 데이터를 v2 테이블로 복사하여 초기화합니다.
-- v1 의 grip_3d_pose 는 jsonb 이므로, v2 의 grip3d_pose_z_avg 를 계산하기 위해 
-- 임시로 v1 데이터를 v2 에 로드한 후, v2 프로젝트어가 이를 덮어쓰거나 재계산해야 합니다.
-- 하지만 이벤트 소싱 방식에서는 원본 이벤트 (event_store) 를 재투영하는 것이 원칙입니다.
-- 따라서 v2 테이블 생성 후, v2 프로젝트어 (GripResultV2Projector) 가 event_store 의 이벤트를 
-- 읽어 `read_grip_result_v2` 를 재투영 (Upsert) 하도록 설정합니다.
-- 별도의 복사 SQL 은 event_store 기반 재투영 로직이 완성되면 불필요합니다.
-- 만약 즉시 백필이 필요하다면:
INSERT INTO read_grip_result_v2 (
  scene_key, attempt_num, object_name, grip_succeed, occurred_at, stream_id, global_seq,
  grip3d_pose_z_avg, grip_outlier_flag
)
SELECT 
  scene_key, attempt_num, object_name, grip_succeed, occurred_at, stream_id, global_seq,
  -- v1 에는 grip3d_pose_z_avg 가 없으므로 NULL 또는 기본값 처리 필요 (v1 스키마에 해당 컬럼이 없다면)
  -- 만약 v1 스키마에 해당 컬럼이 optional 로 추가되었다면:
  NULL, 
  0 
FROM read_grip_result;

-- 3. v1 자산 무손상 보장 확인
-- read_grip_result 테이블 구조 변경 없음.
-- read_grip_result_v2 는 완전히 새로운 테이블.
-- PK (scene_key, attempt_num) 은 두 테이블 모두 유지.

-- 4. API 컷오버 시나리오 (Human-in-the-loop 승인 후)
-- 기존 API 엔드포인트: POST /grip-result -> read_grip_result 조회
-- 신규 API 엔드포인트: POST /grip-result-v2 -> read_grip_result_v2 조회
-- 클라이언트는 /grip-result-v2 를 호출하여 최신 데이터를 얻습니다.
-- v1 엔드포인트는 그대로 유지되므로 기존 클라이언트는 깨지지 않습니다.
```
기존 v1 API 클라이언트가 깨지지 않게 하려면 **파괴적 변경 (Breaking Change) 을 피하는 Additive Migration 전략**을 따라야 합니다. 제공된 자료에 따르면 v1 자산은 무손상 유지되며, v2 는 신규 엔드포인트로 동시 운영됩니다.

구체적 단계는 다음과 같습니다:

1.  **신규 엔드포인트 추가**: 기존 `/grip-result` 라우트와 병행하여 `/grip-result-v2` 엔드포인트를 추가합니다.
2.  **신규 프로젝트어 등록**: `GripResultV2Projector` 를 Projection Service 에 등록하여, 이벤트가 들어오면 v1 로직과 v2 로직을 **동시에** 실행합니다.
3.  **클라이언트 호환성**: 기존 클라이언트는 `/grip-result` 를 호출하여 v1 데이터를 계속 사용합니다. 새 클라이언트나 업데이트된 클라이언트는 `/grip-result-v2` 를 호출하여 temporal consistency 가 검증된 데이터를 사용합니다.
4.  **컷오버 (Cutover)**: v2 로직이 안정적으로 작동하고, v1 의 한계점 (예: jump 검증 누락) 을 v2 가 완전히 대체할 수 있음을 확인한 후, `/grip-result` 엔드포인트를 삭제하고 `/grip-result-v2` 로만 라우팅을 변경합니다.

```sql
-- 단계 1: 신규 Read Model 테이블 생성 (DDL)
-- 이 단계는 v1 테이블 (read_grip_result) 을 건드리지 않습니다.
DROP TABLE IF EXISTS read_grip_result_v2;
CREATE TABLE read_grip_result_v2 (
    scene_key varchar NOT NULL,
    attempt_num smallint NOT NULL,
    object_name varchar NOT NULL,
    grip_succeed smallint NOT NULL,
    occurred_at timestamptz NOT NULL,
    z_avg_current double precision,
    jump_delta_m double precision,
    grip_outlier_flag smallint NOT NULL,
    stream_id varchar NOT NULL,
    global_seq bigint NOT NULL,
    CONSTRAINT pk_grip_result_v2 PRIMARY KEY (scene_key, attempt_num)
);
CREATE INDEX idx_v2_scene_attempt_time ON read_grip_result_v2 (scene_key, attempt_num, occurred_at);
CREATE INDEX idx_v2_outlier_flag_time ON read_grip_result_v2 (grip_outlier_flag, occurred_at);

-- 단계 2: Insight 카드 등록 (LLM 컨텍스트 동기화)
-- 이 단계는 메타데이터 테이블만 변경하며, 실제 데이터 테이블은 건드리지 않습니다.
INSERT INTO insight_entity (entity_name, kind, purpose, key_columns)
VALUES ('read_grip_result_v2', 'read_model', '장면별 시도 단 Z축 평균 포즈·이전 시도 대비 점프 거리·센서 이상 플래그 적재. 기존 read_grip_result 만 Raw Pose JSON 저장이지만 본 모델은 temporal consistency(jump) 검증과 physical bounds enforcement(Δz > 0.1m) 를 직접 계산·저장하여 LLM 관찰자 및 downstream anomaly detector 가 시계열 비교를 수행할 수 있도록 지원.', '(scene_key, attempt_num)')
ON CONFLICT (entity_name) DO UPDATE SET purpose = EXCLUDED.purpose, key_columns = EXCLUDED.key_columns;

INSERT INTO insight_field (entity_name, field_name, data_type, meaning, display_order)
VALUES
  ('read_grip_result_v2', 'scene_key', 'varchar', '장면 식별 키 = stream_id 제거 prefix', 1),
  ('read_grip_result_v2', 'attempt_num', 'smallint', '동일 장면 내 시도 번호', 2),
  ('read_grip_result_v2', 'object_name', 'varchar', 'payload.objects[0].class_name', 3),
  ('read_grip_result_v2', 'grip_succeed', 'smallint', 'payload.grip_succeed (0/1)', 4),
  ('read_grip_result_v2', 'occurred_at', 'timestamptz', '이벤트 occurredAt', 5),
  ('read_grip_result_v2', 'z_avg_current', 'double precision', 'payload.grip_3d_pose.z1..z8 평균 (m)', 6),
  ('read_grip_result_v2', 'jump_delta_m', 'double precision', '이전 시도 z_avg_current 대비 Δz 절대값 (m). null if prev row absent', 7),
  ('read_grip_result_v2', 'grip_outlier_flag', 'smallint', 'Δz > 0.1m 일 경우 1, else 0', 8),
  ('read_grip_result_v2', 'stream_id', 'varchar', 'ES streamId 추적 키', 9),
  ('read_grip_result_v2', 'global_seq', 'bigint', 'ES globalSeq 추적 키', 10)
ON CONFLICT (entity_name, field_name) DO UPDATE SET data_type = EXCLUDED.data_type, meaning = EXCLUDED.meaning, display_order = EXCLUDED.display_order;

-- 단계 3: v1 자산 무손상 확인 및 신규 로직 추가 (코드 변경)
-- read_grip_result 테이블은 삭제되지 않고 그대로 유지됩니다.
-- src/projection/projection.service.ts 에 GripResultV2Projector 를 추가하여 기존 GripResultProjector 와 병행 실행됩니다.
-- src/projection/projection.controller.ts 에 /grip-result-v2 라우트를 추가합니다.
-- 기존 /grip-result, /multimodal, /insert-all 엔드포인트는 그대로 유지됩니다.

-- 단계 4: 데이터 적재 및 병행 검증
-- insert-all 엔드포인트를 호출하여 ToyData 를 DB 에 적재하고, ProjectionService 의 catchUpAll 을 실행합니다.
-- 이 과정에서 read_grip_result (v1) 와 read_grip_result_v2 (v2) 가 모두 생성됩니다.
-- 기존 클라이언트는 /grip-result 를 호출하여 v1 데이터를 조회합니다.
-- 새 클라이언트는 /grip-result-v2 를 호출하여 v2 데이터를 조회합니다.

-- 단계 5: 컷오버 (Human-in-the-loop 승인 후)
-- v2 로직이 안정화되고, v1 의 한계점 (jump 검증 누락) 을 v2 가 완전히 대체할 수 있음을 확인 후,
-- API 라우팅을 /grip-result 에서 /grip-result-v2 로 변경합니다.
-- read_grip_result 테이블을 삭제합니다.
DROP TABLE IF EXISTS read_grip_result;
```
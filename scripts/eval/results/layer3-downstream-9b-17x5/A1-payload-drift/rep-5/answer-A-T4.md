기존 v1 API 클라이언트가 깨지지 않게 하려면 **비파괴적 마이그레이션 (Non-destructive Migration)** 전략을 따르고, **버전별 API 엔드포인트 병행 운영**을 통해 클라이언트 측 변경 없이 서버 측만 점진적으로 전환해야 합니다.

제약 조건 (v1 자산 무손상, Read Model 테이블명 규칙 등) 을 준수하는 구체적 단계는 다음과 같습니다.

### 1. DDL 변경 (새 Read Model 생성)
기존 `read_grip_result` 테이블을 삭제하거나 수정하지 않고, 새로운 환경 변수를 저장할 전용 테이블을 생성합니다.
*   **행동**: `read_environmental_context_v2` 테이블 생성.
*   **이유**: PK (`scene_key`, `attempt_num`) 를 유지하며, 기존 v1 데이터는 `read_grip_result` 에, 신규 필드는 `read_environmental_context_v2` 에 분리 저장되므로 기존 쿼리가 무결성을 유지합니다.

### 2. 코드 수정 (프로젝터 및 서비스 확장)
*   **행동**: `EnvironmentalContextV2Projector` 클래스를 생성하여 `conveyor_speed`, `gripper_temperature` 필드를 추출하고 DB 에 업로드하는 로직을 추가합니다.
*   **이유**: 기존 `GripResultProjector` 로직은 수정하지 않아 v1 데이터 투영은 그대로 유지됩니다.

### 3. API 엔드포인트 추가 (버전화)
*   **행동**: `POST /environmental-context` 엔드포인트를 추가합니다.
*   **이유**: 기존 `/multimodal`, `/grip-result` 엔드포인트는 삭제하지 않고 유지합니다. v1 클라이언트는 기존 엔드포인트를 계속 호출하므로 깨지지 않습니다.

### 4. 마이그레이션 및 컷오버 절차 (Human-in-the-loop)
인간 승인이 완료된 후 다음 순서로 실행합니다.

1.  **준비 단계**:
    *   `read_environmental_context_v2` 테이블 생성 DDL 실행.
    *   `EnvironmentalContextV2Projector` 등록 및 `ProjectionService` 내 `catchUpEnvironmentalContextV2` 메서드 추가.
    *   `POST /environmental-context` 라우트 추가.
    *   **검증**: `POST /environmental-context` 를 호출하여 신규 필드가 정상적으로 투영되는지 확인.

2.  **컷오버 (Cutover)**:
    *   **v1 클라이언트 영향**: 없음 (기존 엔드포인트 유지).
    *   **v2 클라이언트 영향**: `POST /environmental-context` 를 호출하여 환경 변수 데이터가 `read_environmental_context_v2` 에 저장되도록 변경.
    *   **데이터 동기화**: 기존에 v1 로 투영된 데이터 중 신규 필드가 누락된 경우, 해당 이벤트만 `EnvironmentalContextV2Projector` 로 재투영 (Catch-up) 하여 `read_environmental_context_v2` 에 병합.

### 5. 결과 확인 및 v1 자산 무손상 보장
*   `read_grip_result` 테이블 구조 변경 없음.
*   `read_grip_result` 엔드포인트 (`POST /grip-result`) 동작 변경 없음.
*   `read_grip_result` 프로젝트 (`GripResultProjector`) 로직 변경 없음.
*   신규 필드가 필요할 때만 `read_environmental_context_v2` 를 JOIN 하거나 별도 조회하여 사용.

---

### 적용 SQL

```sql
-- 1. 새 Read Model 테이블 생성 (read_ 접두, 스네이크 케이스, PK 유지)
CREATE TABLE read_environmental_context_v2 (
  scene_key varchar NOT NULL,
  attempt_num smallint NOT NULL,
  occurred_at timestamptz,
  conveyor_speed double precision,
  gripper_temperature double precision,
  stream_id varchar,
  global_seq bigint,
  PRIMARY KEY (scene_key, attempt_num)
);

-- 2. Insight 카드 등록 (Read DB 동기화)
INSERT INTO insight_entity (entity_name, kind, purpose, key_columns)
VALUES ('read_environmental_context_v2', 'read_model', '시도별 환경 변수 이력 추적(conveyor_speed, gripper_temperature)로 기존 Read Model 미적응 필드 유실 해결 및 조인/통합 조회 호환성 유지', 'scene_key, attempt_num')
ON CONFLICT (entity_name) DO UPDATE SET purpose = EXCLUDED.purpose, key_columns = EXCLUDED.key_columns;

INSERT INTO insight_field (entity_name, field_name, data_type, meaning, display_order)
VALUES
  ('read_environmental_context_v2', 'scene_key', 'varchar', '장면 식별 키 = stream_id 제거 prefix', 1),
  ('read_environmental_context_v2', 'attempt_num', 'smallint', '동장 내 시도 번호', 2),
  ('read_environmental_context_v2', 'occurred_at', 'timestamptz', '데이터 촬영 일자', 3),
  ('read_environmental_context_v2', 'conveyor_speed', 'double precision', '컨베어 벨트 속도(환경 드리프트)', 4),
  ('read_environmental_context_v2', 'gripper_temperature', 'double precision', '그리퍼 작동 온도(환경 드리프트)', 5),
  ('read_environmental_context_v2', 'stream_id', 'varchar', 'ES 스트림 ID', 6),
  ('read_environmental_context_v2', 'global_seq', 'bigint', '투영 출처 ES 전역 시퀀스', 7)
ON CONFLICT (entity_name, field_name) DO UPDATE SET data_type = EXCLUDED.data_type, meaning = EXCLUDED.meaning, display_order = EXCLUDED.display_order;
```
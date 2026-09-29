기존 v1 API 클라이언트가 깨지지 않도록 하려면 **비파괴적 마이그레이션 (Non-breaking Migration)** 전략을 따르고, **신규 v2 엔드포인트를 병행 운영**해야 합니다.

구체적인 단계는 다음과 같습니다:

1.  **DDL 실행 (신규 테이블 생성)**
    *   `read_grip_outlier_v2` 테이블을 생성합니다.
    *   기존 `read_grip_result` 테이블은 삭제하지 않고 그대로 유지합니다.
    *   PK 제약조건 `(scene_key, attempt_num)` 을 유지합니다.

2.  **프로젝터 추가 및 배선**
    *   `GripOutlierV2Projector` 클래스를 생성하여 이벤트 소싱 로직에 추가합니다.
    *   `ProjectionService` 에 `GripOutlierV2Projector` 를 주입하고, `catchUpOutlierV2` 메서드를 구현합니다.
    *   기존 `GripResultProjector` 로직은 변경하지 않습니다.

3.  **API 컨트롤러 확장**
    *   `ProjectionController` 에 `POST /grip-outlier-v2` 엔드포인트를 추가합니다.
    *   기존 엔드포인트 (`/multimodal`, `/grip-result`) 는 코드 수정 없이 그대로 유지됩니다.

4.  **컷오버 (Cutover) 및 클라이언트 전환**
    *   신규 엔드포인트 `/grip-outlier-v2` 가 정상 작동하는지 확인합니다.
    *   클라이언트 측에서 `/grip-outlier-v2` 를 호출하여 이상 데이터만 조회하도록 변경합니다.
    *   기존 `/grip-result` 호출은 그대로 유지하여 정상 데이터 조회는 계속 가능합니다.

이 과정에서 기존 v1 API 호출 경로는 영향을 받지 않으므로 클라이언트 호환성이 보장됩니다.

```sql
-- 1. 신규 Read Model 테이블 생성 (DDL)
-- 기존 read_grip_result 테이블은 삭제하지 않고 유지합니다.
DROP TABLE IF EXISTS read_grip_outlier_v2;

CREATE TABLE read_grip_outlier_v2 (
  scene_key VARCHAR NOT NULL,
  attempt_num SMALLINT NOT NULL,
  object_name VARCHAR NOT NULL,
  grip_succeed SMALLINT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL,
  z1_raw DOUBLE PRECISION,
  xl_raw DOUBLE PRECISION,
  depth_negative_flag SMALLINT NOT NULL DEFAULT 0,
  pixel_xl_out_of_bounds_flag SMALLINT NOT NULL DEFAULT 0
);

CREATE UNIQUE INDEX idx_grip_outlier_v2_pk ON read_grip_outlier_v2 (scene_key, attempt_num);

-- 2. Insight 카드 등록 (LLM 컨텍스트 동기화)
-- 이 SQL 은 DDL 실행 후 함께 실행되어야 합니다.
INSERT INTO insight_entity (entity_name, kind, purpose, key_columns)
VALUES ('read_grip_outlier_v2', 'read_model', '전용 정합성 플래그 및 원치 측정값 추출 테이블로, 기존 JSONB 포즈 저장이 아닌 z1(깊이)와 xl(픽셀) 수치 열과 위반 플래그 열을 제공하여 센서 베이스라인 편만 분석과 SQL 필터링을 효율하게 지원.', 'scene_key, attempt_num')
ON CONFLICT (entity_name) DO UPDATE SET purpose = EXCLUDED.purpose, key_columns = EXCLUDED.key_columns;

INSERT INTO insight_field (entity_name, field_name, data_type, meaning, display_order)
VALUES
  ('read_grip_outlier_v2', 'scene_key', 'varchar', '장면 식별 키', 1),
  ('read_grip_outlier_v2', 'attempt_num', 'smallint', '시도 번호', 2),
  ('read_grip_outlier_v2', 'object_name', 'varchar', '객체명', 3),
  ('read_grip_outlier_v2', 'grip_succeed', 'smallint', '성공여부 (0/1)', 4),
  ('read_grip_outlier_v2', 'occurred_at', 'timestamp', '데이터 촬영 일자', 5),
  ('read_grip_outlier_v2', 'z1_raw', 'doublePrecision', '3D 좌표 z1 원치 측정값', 6),
  ('read_grip_outlier_v2', 'xl_raw', 'doublePrecision', '2D 좌표 xl 원치 측정값', 7),
  ('read_grip_outlier_v2', 'depth_negative_flag', 'smallint', 'z1 ≤ 0 위반 플래그 (1:위반, 0:양호)', 8),
  ('read_grip_outlier_v2', 'pixel_xl_out_of_bounds_flag', 'smallint', 'xl > 1920 위반 플래그 (1:위반, 0:양호)', 9)
ON CONFLICT (entity_name, field_name) DO UPDATE SET data_type = EXCLUDED.data_type, meaning = EXCLUDED.meaning, display_order = EXCLUDED.display_order;
```

**코드 변경 사항 (TypeScript):**

*   **Schema:** `src/shared/database/schema/index.ts` 에 `export * from "./service/read-grip-outlier-v2";` 추가.
*   **Projector:** `src/projection/projection.service.ts` 에 `GripOutlierV2Projector` 주입 및 `catchUpOutlierV2` 메서드 추가. 기존 `GripResultProjector` 로직은 건드리지 않음.
*   **Controller:** `src/projection/projection.controller.ts` 에 `@Post("/grip-outlier-v2")` 엔드포인트 추가. 기존 `/multimodal`, `/grip-result` 는 건드리지 않음.

**마이그레이션 및 컷오버 절차:**

1.  **준비:** 위 SQL 스크립트와 TS 코드 변경사항을 적용합니다.
2.  **테스트:**
    *   `POST /grip-outlier-v2` 호출 시, Seq 26, 27 에 대한 이상 데이터가 반환되는지 확인합니다.
    *   `POST /grip-result` 호출 시, 기존 v1 로직대로 정상 데이터만 반환되는지 확인합니다.
3.  **컷오버:**
    *   신규 엔드포인트 `/grip-outlier-v2` 가 안정적으로 작동함을 확인합니다.
    *   클라이언트 측에서 `POST /grip-outlier-v2` 로 이상 데이터만 조회하도록 변경합니다.
    *   기존 `POST /grip-result` 호출은 그대로 유지합니다.
4.  **최종 정리:** (선택 사항) 이상 데이터가 완전히 해결되고 안정화되면, 향후 `read_grip_result` 테이블의 이상 데이터를 처리하는 로직을 제거하거나, `read_grip_result` 테이블을 `read_grip_outlier_v2` 로 대체할 수 있습니다. 하지만 현재는 병행 운영이 안전합니다.
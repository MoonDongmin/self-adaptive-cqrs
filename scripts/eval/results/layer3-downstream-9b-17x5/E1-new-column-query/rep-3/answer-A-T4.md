기존 v1 API 클라이언트가 깨지지 않도록 보장하기 위한 구체적인 마이그레이션 및 컷오버 절차는 다음과 같습니다.

### 1. 버전 경로 전략 (Versioning Strategy)
신규 기능은 기존 API 경로 (`/multimodal`, `/grip-result`) 에 영향을 주지 않는 별도의 버전 경로를 사용하여 제공해야 합니다.
*   **신규 엔드포인트:** `POST /projection/grip-environmental-data` (또는 `/grip-environmental-data`)
*   **기존 엔드포인트:** `POST /projection/multimodal`, `POST /projection/grip-result` (변경 없음)

### 2. 마이그레이션 및 컷오버 절차 (Migration & Cutover Steps)

#### 단계 1: 개발 및 로컬 검증 (Development & Local Validation)
*   **코드 변경:** `src/shared/database/schema/service/read-grip-environmental-data.ts` 에 새로운 테이블 스키마를 정의하고, `src/projection/projection.service.ts` 에 `GripEnvironmentalDataProjector` 를 등록합니다.
*   **Zod 스키마 확장:** `src/insert/dto/toy-data.dto.ts` 에서 `conveyor_speed` 와 `gripper_temperature` 필드를 `z.coerce.number().optional()` 로 추가하여, 기존 적재 시 데이터 유실을 방지합니다.
*   **로컬 테스트:** 로컬 환경에서 `POST /projection/grip-environmental-data` 엔드포인트를 호출하여, `read_grip_environmental_data` 테이블에 `conveyor_speed`, `gripper_temperature` 필드가 정상적으로 투영되는지 확인합니다.

#### 단계 2: 인간 승인 (Human-in-the-loop Approval)
*   **DDL 검토:** 생성된 `CREATE TABLE read_grip_environmental_data` SQL 을 검토하여, 기존 테이블 (`read_grip_result`, `read_multimodal`) 과 충돌이 없고, PK 제약 조건이 맞는지 확인합니다.
*   **API 변경 사항 승인:** 새로운 엔드포인트 추가가 기존 API 계약 (Contract) 을 변경하지 않고, 단순히 기능을 확장하는지 확인합니다.
*   **승인:** 개발팀 리더나 아키텍트가 변경 사항을 승인합니다.

#### 단계 3: 프로덕션 DDL 적용 (Schema Migration)
*   승인 후, 프로덕션 Postgres 데이터베이스에 다음 SQL 을 실행합니다.
    ```sql
    CREATE TABLE read_grip_environmental_data (
      scene_key VARCHAR NOT NULL,
      attempt_num SMALLINT NOT NULL,
      occurred_at TIMESTAMPTZ,
      conveyor_speed DOUBLE PRECISION,
      gripper_temperature DOUBLE PRECISION,
      stream_id VARCHAR,
      global_seq BIGINT,
      PRIMARY KEY (scene_key, attempt_num)
    );
    ```
*   **주의:** 이 단계는 기존 테이블을 건드리지 않으므로 `read_grip_result` 나 `read_multimodal` 테이블의 구조나 데이터에 영향을 주지 않습니다.

#### 단계 4: Insight DB 동기화 (Metadata Sync)
*   프로덕션 Insight DB 에 새로운 엔티티와 필드를 등록합니다.
    ```sql
    INSERT INTO insight_entity (entity_name, kind, purpose, key_columns)
    VALUES ('read_grip_environmental_data', 'read_model', 'Capture payload drift keys (conveyor_speed, gripper_temperature) per attempt to support time-of-day/time-series queries alongside existing scene/attempt context.', 'scene_key, attempt_num')
    ON CONFLICT (entity_name) DO UPDATE SET purpose = EXCLUDED.purpose, key_columns = EXCLUDED.key_columns;

    INSERT INTO insight_field (entity_name, field_name, data_type, meaning, display_order)
    VALUES
      ('read_grip_environmental_data', 'scene_key', 'VARCHAR', '장면 식별 키', 1),
      ('read_grip_environmental_data', 'attempt_num', 'SMALLINT', '동장 내 파지 시도 번호', 2),
      ('read_grip_environmental_data', 'occurred_at', 'TIMESTAMPTZ', '데이터 촬영 일자/시간', 3),
      ('read_grip_environmental_data', 'conveyor_speed', 'DOUBLE PRECISION', '컨베이 벨트 속도 (드프트)', 4),
      ('read_grip_environmental_data', 'gripper_temperature', 'DOUBLE PRECISION', '그리퍼 온도 (드프트)', 5),
      ('read_grip_environmental_data', 'stream_id', 'VARCHAR', 'ES 스트림 ID', 6),
      ('read_grip_environmental_data', 'global_seq', 'BIGINT', '투영 출처 이벤트의 ES 전역 시퀀스', 7)
    ON CONFLICT (entity_name, field_name) DO UPDATE SET data_type = EXCLUDED.data_type, meaning = EXCLUDED.meaning, display_order = EXCLUDED.display_order;
    ```

#### 단계 5: 서비스 재시작 및 초기 투영 (Service Restart & Initial Projection)
*   애플리케이션을 재시작하여 새로운 `GripEnvironmentalDataProjector` 가 등록되고, `catchUpEnvironmentalData` 로직이 실행되도록 합니다.
*   기존에 적재된 이벤트 (이벤트 스토어에 있는 과거 데이터) 에 대해 초기 투영 (Catch-up) 을 수행하여 `read_grip_environmental_data` 테이블에 데이터를 채웁니다.

#### 단계 6: 컷오버 및 클라이언트 전환 (Cutover & Client Switch)
*   **클라이언트 전환:** 클라이언트 측 코드에서 API 호출 경로를 `POST /projection/grip-environmental-data` 로 변경합니다.
*   **검증:** 변경된 API 를 호출하여 `conveyor_speed` 와 `gripper_temperature` 필드가 포함된 응답을 받는지 확인합니다.
*   **기존 API 유지:** `POST /projection/multimodal` 과 `POST /projection/grip-result` 는 그대로 유지되므로, v1 클라이언트가 이 두 엔드포인트를 호출하는 기능은 깨지지 않습니다.

#### 단계 7: 모니터링 및 롤백 계획 (Monitoring & Rollback Plan)
*   **모니터링:** `insight.card.miss` 로그가 사라지고, `insert.file.ok` 후 `projection.event.mapped` 로 정상적인 흐름이 이어지는지 모니터링합니다.
*   **롤백:** 만약 새로운 투영 로직에 치명적인 버그가 발견되어 전체 시스템이 마비될 위험이 있다면, `read_grip_environmental_data` 테이블을 `DROP TABLE` 하고, 관련 서비스 DI 를 제거하여 즉시 롤백할 수 있어야 합니다. (하지만 v1 API 는 이미 영향을 받지 않으므로, 클라이언트 측만 롤백하면 됩니다.)

### 요약
핵심은 **새로운 엔드포인트를 추가하는 것**이며, 기존 엔드포인트 (`/multimodal`, `/grip-result`) 의 구조와 동작을 절대 변경하지 않는 것입니다. 따라서 v1 API 클라이언트는 기존 엔드포인트를 계속 호출하면 정상적으로 작동하며, 새로운 필드가 필요한 경우에만 새 엔드포인트를 호출하면 됩니다.
기존 v1 API 클라이언트가 깨지지 않도록 보장하기 위해 **비파괴적 마이그레이션 (Non-destructive Migration)** 전략을 따르고, **버전별 API 경로 분리**를 통해 신규 v2 리소스를 기존 v1 리소스와 병행해야 합니다.

제안된 `newReadModel` 전략과 Guardrails (v1 자산 무손상, PK 유지) 을 준수하는 구체적 단계는 다음과 같습니다.

### 1. 데이터베이스 스키마 변경 (DDL)
신규 Read Model 테이블 `read_grip_sensor_drift` 을 생성하되, 기존 `read_grip_result` 및 `read_multimodal` 테이블은 **절대 수정하거나 삭제하지 않습니다**.

```sql
CREATE TABLE read_grip_sensor_drift (
  scene_key varchar NOT NULL,
  attempt_num smallint NOT NULL,
  occurred_at timestamptz,
  conveyor_speed double precision,
  gripper_temperature double precision,
  stream_id varchar,
  global_seq bigint,
  PRIMARY KEY (scene_key, attempt_num)
);
```

### 2. 투영 파이프라인 확장 (Backend Logic)
기존 `GripResultProjector` 와 `MultiModalProjector` 로직은 **변경하지 않습니다**. 대신 신규 `GripSensorDriftProjector` 를 등록하여, 동일한 이벤트 스트림 (`grip-attempt:xxx`) 에서 데이터를 읽어 `read_grip_sensor_drift` 테이블로만 적재되도록 합니다.

*   **기존 동작 유지:** `POST /multimodal` -> `MultiModalProjector` -> `read_multimodal`
*   **기존 동작 유지:** `POST /grip-result` -> `GripResultProjector` -> `read_grip_result`
*   **신규 동작 추가:** `POST /grip-sensor-drift` -> `GripSensorDriftProjector` -> `read_grip_sensor_drift`

### 3. API 엔드포인트 버전화 (Routing)
클라이언트 호환성을 위해 API 응답 구조를 물리적으로 분리합니다. 기존 v1 엔드포인트는 기존 Read Model 을 반환하고, 신규 v2 엔드포인트는 신규 Read Model 을 반환합니다.

*   **v1 경로 (기존):**
    *   `GET /api/v1/multimodal` -> `read_multimodal` 쿼리 실행
    *   `GET /api/v1/grip-result` -> `read_grip_result` 쿼리 실행
*   **v2 경로 (신규):**
    *   `GET /api/v2/multimodal` -> `read_multimodal` 쿼리 실행 (v1 과 동일)
    *   `GET /api/v2/grip-result` -> `read_grip_result` 쿼리 실행 (v1 과 동일)
    *   `GET /api/v2/grip-sensor-drift` -> `read_grip_sensor_drift` 쿼리 실행 (신규)

### 4. 마이그레이션 및 컷오버 절차 (Human-in-the-loop)

1.  **준비 단계 (Preparation):**
    *   DDL (`CREATE TABLE read_grip_sensor_drift`) 을 실행하여 DB 에 테이블 생성.
    *   신규 `GripSensorDriftProjector` 를 코드에 등록 및 DI 설정.
    *   신규 API 라우트 (`/api/v2/grip-sensor-drift`) 추가.
    *   **검증:** Toy-Data 적재 (`POST /insert-all`) 후, 신규 테이블에 `conveyor_speed`, `gripper_temperature` 가 정상적으로 적재되었는지 확인. 기존 테이블 (`read_grip_result`) 에는 해당 필드가 없음을 확인.

2.  **컷오버 단계 (Cutover):**
    *   **v1 클라이언트:** 기존 `/api/v1` 엔드포인트를 계속 사용. 데이터는 `read_grip_result` 등 기존 테이블에서 조회되므로 **영향 없음**.
    *   **v2 클라이언트:** `/api/v2` 엔드포인트를 사용. `read_grip_sensor_drift` 테이블에서 `conveyor_speed`, `gripper_temperature` 를 포함한 데이터를 조회.
    *   **병행 운영:** v1/v2 엔드포인트가 동시에 존재하므로, 클라이언트 측에서 API 버전을 명시적으로 선택 (`/v1` 또는 `/v2`) 하거나, 클라이언트 코드 업데이트 시점까지 v1 을 계속 사용 가능.

3.  **회귀 테스트 (Regression Test):**
    *   v1 엔드포인트 호출 시, 기존 필드 (`object_name`, `grip_succeed` 등) 가 정상 반환되는지 확인.
    *   v2 엔드포인트 호출 시, 기존 필드 + 신규 필드 (`conveyor_speed`, `gripper_temperature`) 가 모두 반환되는지 확인.
    *   기존 `read_grip_result` 테이블 구조가 변경되지 않았는지 확인.

### 5. 롤백 계획 (Rollback Plan)
만약 v2 성능 저하나 데이터 불일치가 발생하여 회귀할 경우:

1.  `read_grip_sensor_drift` 테이블 `DROP`.
2.  신규 `GripSensorDriftProjector` 코드 제거 및 재시작.
3.  신규 API 라우트 (`/api/v2/grip-sensor-drift`) 제거.
4.  v1 클라이언트는 그대로 작동하며, v2 클라이언트는 404 에러를 반환하게 됨 (기존 v1 로 전환 필요).

이 절차는 **PK 유지**, **v1 자산 무손상**, **TypeScript any 금지**, **Read Model 명명 규칙**을 모두 준수하며, 신규 필드가 기존 도메인 모델에 섞이지 않도록 격리하는 안전한 변경 사항입니다.
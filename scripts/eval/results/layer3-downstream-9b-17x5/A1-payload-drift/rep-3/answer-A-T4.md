기존 v1 API 클라이언트가 깨지지 않도록 하려면 **비파괴적 변경 (Non-breaking Change)** 을 통해 **신규 Read Model (`read_sensor_drift_v1`) 을 기존 v1 자산과 완전히 분리하여 병행 운영**해야 합니다.

구체적인 단계는 다음과 같습니다.

### 1. 버전 경로 분리 (API Versioning)
기존 엔드포인트는 v1 경로를 유지하고, 신규 기능은 v2 경로를 사용하여 제공합니다.
- **기존 v1 엔드포인트 유지**: `POST /multimodal`, `POST /grip-result` (기존 클라이언트 호환)
- **신규 v2 엔드포인트 추가**: `POST /sensor-drift` (신규 Read Model 조회용)

### 2. 데이터베이스 스키마 확장 (DDL)
기존 `read_grip_result` 및 `read_multimodal` 테이블을 건드리지 않고, **새로운 테이블 `read_sensor_drift_v1`** 만 생성합니다.
- **Primary Key**: `(scene_key, attempt_num)` 유지 (기존 PK 규칙 준수)
- **컬럼**: `conveyor_speed`, `gripper_temperature` 등 신규 필드 추가 시 기존 테이블에는 영향 없음.

### 3. 투영 로직 확장 (Projector)
기존 `GripResultProjector` 와 `MultiModalProjector` 로직은 변경하지 않습니다.
- **신규 Projector 추가**: `SensorDriftV1Projector` 를 구현하여 `payload` 의 신규 키 (`conveyor_speed`, `gripper_temperature`) 를 `read_sensor_drift_v1` 테이블로 매핑합니다.
- **Catch-up 로직 확장**: `ProjectionService` 에 `catchUpSensorDrift()` 메서드를 추가하여, 신규 이벤트가 이벤트 스토어에 저장되면 자동으로 `read_sensor_drift_v1` 을 업데이트합니다.

### 4. 마이그레이션 및 컷오버 절차 (Human-in-the-loop)
인간 승인이 완료된 후 다음 순서대로 적용합니다.

1.  **DDL 실행**: `read_sensor_drift_v1` 테이블 생성 SQL 실행.
2.  **Insight 카드 등록**: `insight_entity` 및 `insight_field` 테이블에 `read_sensor_drift_v1` 관련 레코드 삽입 (LLM 컨텍스트 동기화).
3.  **프로젝터 등록**: `SensorDriftV1Projector` 를 DI 컨테이너에 등록.
4.  **Catch-up 실행**: 기존에 적재된 54 건의 이벤트에 대해 `catchUpSensorDrift()` 를 실행하여 DB 에 데이터 적재.
5.  **API 컷오버**:
    - `/sensor-drift` 엔드포인트 추가 (v2).
    - 기존 `/multimodal`, `/grip-result` 엔드포인트는 그대로 유지 (v1).
    - 클라이언트는 `/sensor-drift` 를 호출하여 신규 데이터를 조회하면 되며, 기존 `/multimodal`, `/grip-result` 호출은 그대로 작동합니다.

### 5. 롤백 계획 (Rollback Plan)
필요시 즉시 이전 상태로 복구할 수 있도록 준비합니다.
- `read_sensor_drift_v1` 테이블 DROP.
- `SensorDriftV1Projector` DI 제거.
- `catchUpSensorDrift()` 메서드 제거 및 `catchUpAll()` 로직 revert.
- `/sensor-drift` 엔드포인트 삭제.

이 절차는 **v1 자산 무손상**, **PK 유지**, **TypeScript any 금지**, **Read Model 명명 규칙 (`read_` 접두어)** 을 모두 준수합니다.
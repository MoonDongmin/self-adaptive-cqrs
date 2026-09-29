기존 v1 API 클라이언트가 깨지지 않게 하려면 **비파괴적 마이그레이션 (Non-breaking Migration)** 전략을 따르고, **버전별 API 엔드포인트 병행 운영**을 통해 점진적으로 전환해야 합니다.

제약 조건인 "v1 자산 무손상"과 "식별자 전체 단어"를 준수하며, 구체적인 단계는 다음과 같습니다.

### 1. 데이터베이스 스키마 변경 (DDL)
신규 Read Model `read_sensor_drift_v2` 테이블을 생성하되, 기존 `read_grip_result` 및 `read_multimodal` 테이블은 절대 건드리지 않습니다.

```sql
CREATE TABLE read_sensor_drift_v2 (
  scene_key varchar NOT NULL,
  attempt_num smallint NOT NULL,
  conveyor_speed double precision,
  gripper_temperature double precision,
  occurred_at timestamptz,
  stream_id varchar,
  global_seq bigint,
  PRIMARY KEY (scene_key, attempt_num)
);
```

### 2. 코드 변경 및 서비스 확장
기존 v1 로직 (`GripResultProjector`, `MultiModalProjector`) 은 수정하지 않고, 새로운 `SensorDriftV2Projector` 클래스를 추가하여 `CatchUpRunner` 에 등록합니다.

*   **프로젝터 추가:** `src/projection/projection.service.ts` 에 `SensorDriftV2Projector` 를 주입하고 `catchUpSensorDriftV2` 메서드를 구현합니다.
*   **라우트 추가:** `src/projection/projection.controller.ts` 에 `POST /sensor-drift-v2` 엔드포인트를 추가합니다.

### 3. API 컷오버 절차 (Human-in-the-loop)
v1 클라이언트 호환성을 보장하기 위해, 기존 엔드포인트 (`/multimodal`, `/grip-result`) 는 그대로 유지하고, 신규 데이터만 `/sensor-drift-v2` 경로로 제공합니다.

1.  **준비 단계:**
    *   DB 에 `read_sensor_drift_v2` 테이블 생성 SQL 실행.
    *   코드 배포 후, `POST /sensor-drift-v2` 엔드포인트가 정상 작동하는지 확인 (Catch-up 로직 검증).
    *   기존 v1 엔드포인트 (`/multimodal`, `/grip-result`) 가 여전히 정상 작동하는지 확인 (무손상 검증).

2.  **컷오버 승인:**
    *   운영팀이 "v1 자산 무손상" 및 "신규 v2 엔드포인트 정상 동작"을 확인하여 승인.

3.  **전환 단계:**
    *   클라이언트 측에서 `/sensor-drift-v2` 엔드포인트를 호출하여 센서 드리프트 데이터를 조회하도록 변경.
    *   기존 v1 엔드포인트는 유지 (필요시 백업용 또는 점진적 전환).

### 4. 마이그레이션 완료 및 v1 정리 (선택 사항)
v2 데이터가 안정적으로 수집되고 검증된 후, 필요시 v1 엔드포인트를 삭제할 수 있으나, **v1 자산 무손상** 제약이 있으므로 즉시 삭제하지 않고 병행 운영을 유지하거나, 별도의 마이그레이션 윈도우를 설정해야 합니다.

```sql
-- v1 자산 무손상 확인을 위한 예시 쿼리 (DDL 적용 후 실행)
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'read_%';
-- 결과: read_grip_result, read_multimodal, read_sensor_drift_v2 가 모두 존재해야 함
```

이 절차는 v1 클라이언트가 기존 엔드포인트를 계속 사용할 수 있게 보장하며, 신규 데이터는 v2 엔드포인트를 통해 제공되므로 데이터 유실 없이 스키마 드리프트를 해결합니다.
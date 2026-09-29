제공된 자료에 따르면, `payload.schema.drift` 로그에서 `gripper_temperature` 필드가 신규로 유입되었음을 알 수 있습니다. 그러나 기존 Read Model (`read_grip_result`, `read_multimodal`) 의 스키마 정의에는 해당 필드가 포함되어 있지 않으며, CQRS 아키텍처의 원칙에 따라 Read Model 은 이벤트 스토어에 저장된 데이터의 특정 필드만 추출하여 저장하는 것이므로, 새로운 필드가 추가된 이벤트가 기존 Read Model 에 반영되지는 않습니다.

따라서 `gripper_temperature` 필드를 시간대별로 조회하기 위해서는 새로운 Read Model 을 생성해야 합니다.

### 해결 방안
1.  **새 Read Model 생성**: `read_gripper_temperature` 테이블을 생성합니다.
    *   **키**: `(stream_id, occurred_at)` 또는 `(stream_id, attempt_num)` 중 시간대별 조회가 필요하므로 `stream_id` 와 `occurred_at` 을 복합 키로 설정하거나, `stream_id` 만으로도 고유성을 보장할 수 있는지 확인해야 합니다. 기존 `read_grip_result` 의 `stream_id` 는 `grip-attempt:scene_key` 형식입니다. `occurred_at` 은 파일명에서 파생된 `timestamptz` 입니다. 시간대별 조회를 위해 `occurred_at` 을 인덱싱하는 것이 효율적입니다.
    *   **필드**: `stream_id` (추적 키), `occurred_at` (시간), `gripper_temperature` (새 필드).
    *   **데이터 소스**: 이벤트 스토어의 `grip-attempt` 스트림에서 `gripper_temperature` 필드가 포함된 이벤트만 추출하여 매핑합니다.

2.  **SQL 작성**:
    *   새 테이블 `read_gripper_temperature` 생성 DDL.
    *   (선택 사항) 시간대별 조회를 위한 인덱스 생성 SQL.

```sql
-- 새 Read Model 생성: read_gripper_temperature
-- 용도: 적재 데이터의 gripper_temperature 필드 시간대별 조회
-- 키: (stream_id, occurred_at) -> stream_id 는 고유 식별자, occurred_at 은 시간 정보
-- 참고: 기존 read_grip_result, read_multimodal 테이블은 변경하지 않음
CREATE TABLE IF NOT EXISTS read_gripper_temperature (
    stream_id VARCHAR PRIMARY KEY,
    occurred_at TIMESTAMPTZ NOT NULL,
    gripper_temperature NUMERIC(5, 2)
);

-- 시간대별 조회 성능 향상을 위한 인덱스 생성 (occurred_at 기준)
CREATE INDEX IF NOT EXISTS idx_read_gripper_temperature_occurred_at ON read_gripper_temperature (occurred_at);
```

### 추가 설명 (비고)
*   **데이터 매핑 로직**: 위 SQL 만으로는 데이터가 채워지지 않습니다. 백엔드 코드 (Projection Processor) 에서 `grip-attempt` 스트림을 구독할 때, 이벤트 파싱 로직을 수정하여 `payload.gripper_temperature` 값을 추출하고, `stream_id` 와 `occurred_at` 을 계산하여 위 `read_gripper_temperature` 테이블에 `INSERT` 하도록 구현해야 합니다.
*   **기존 Read Model 영향**: `read_grip_result` 와 `read_multimodal` 테이블은 기존 스키마를 유지하므로 변경하지 않습니다.
*   **자료 기반 근거**: `payload.schema.drift` 로그에서 `newKeys={"conveyor_speed": "1.2", "gripper_temperature": "36.5"}`로 신규 키가 유입되었음을 확인했고, 기존 Read Model 스키마에는 `gripper_temperature` 가 없으므로 새 테이블이 필요합니다.
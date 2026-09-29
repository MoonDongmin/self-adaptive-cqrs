기존 v1 API 클라이언트가 깨지지 않게 하려면 **비파괴적 마이그레이션 (Non-destructive Migration)** 전략을 따르고, **버전별 API 엔드포인트 병행 운영**을 통해 점진적으로 전환해야 합니다.

구체적 단계는 다음과 같습니다:

### 1. DDL 적용 및 신규 Read Model 생성
`read_grip_result_v2` 테이블을 생성하고, 기존 `read_grip_result` 테이블은 건드리지 않습니다.
- `grip_outlier_flag` 컬럼을 포함하여 물리적 정합성 (z 좌표 하한) 을 검증하는 로직을 포함합니다.
- 기존 v1 테이블의 PK 구조 (`scene_key`, `attempt_num`) 는 유지합니다.

### 2. 신규 Projector 등록 및 구현
`GripResultV2Projector` 를 등록하여, 이벤트 투영 시 `grip_outlier_flag` 를 계산합니다.
- `z1`~`z8` 중 하나라도 `0.01` 미만이면 `1`, 아니면 `0` 로 설정합니다.
- 기존 `GripResultProjector` (v1) 는 수정하지 않습니다.

### 3. API 엔드포인트 병행 운영 (Dual-Write)
클라이언트 호환성을 위해 두 가지 엔드포인트를 동시에 노출합니다.
- **v1 엔드포인트 (`POST /grip-result`)**: 기존 `read_grip_result` 테이블로 투영합니다. 기존 클라이언트는 이 엔드포인트를 계속 호출하며, 데이터는 v1 스키마 그대로 유지됩니다.
- **v2 엔드포인트 (`POST /v2/grip-result`)**: 신규 `read_grip_result_v2` 테이블로 투영합니다. 신규 클라이언트 또는 업그레이드된 클라이언트가 이 엔드포인트를 호출하면 `grip_outlier_flag` 를 포함한 v2 스키마 데이터를 받습니다.

### 4. 마이그레이션 및 컷오버 (Cutover)
신규 Read Model 이 안정적으로 운영되고, v1 데이터의 정합성 문제를 v2 로 해결된 후, v1 을 서서히下线합니다.
- **단계 A**: `read_grip_result_v2` 가 정상 작동하는지 확인합니다.
- **단계 B**: v1 클라이언트 호환성을 위해 `/grip-result` 엔드포인트를 유지합니다.
- **단계 C**: 신규 클라이언트가 `/v2/grip-result` 를 사용하도록 안내합니다.
- **단계 D**: v1 데이터에 `grip_outlier_flag` 가 없는 경우, v1 쿼리에서 해당 필드가 NULL 이거나 기본값으로 처리되도록 하거나, v1 테이블을 `read_grip_result` 로 계속 유지합니다.
- **단계 E**: v1 클라이언트가 v2 스키마 필드 (`grip_outlier_flag`) 를 지원하지 않는 경우, v1 엔드포인트는 v1 스키마만 반환하도록 유지합니다.

### 5. v1下线 (Rollback/Deprecation)
모든 트래픽이 v2 로 이동하고, v1 데이터의 정합성 문제가 v2 로 완전히 해결된 후, v1 엔드포인트를下线합니다.
- `read_grip_result` 테이블의 `grip_outlier_flag` 필드를 제거하지 않습니다. v1 클라이언트가 이 필드를 읽지 않아도 되므로, v1 테이블은 그대로 유지합니다.
- `/grip-result` 엔드포인트를下线하고, `/v2/grip-result` 만 사용합니다.

### 요약
- **버전 경로**: `/grip-result` (v1), `/v2/grip-result` (v2)
- **신구 병행 운영**: 두 엔드포인트를 동시에 유지하며, 각자 다른 Read Model (`read_grip_result`, `read_grip_result_v2`) 로 투영합니다.
- **마이그레이션**: 신규 클라이언트가 v2 엔드포인트를 사용하도록 유도합니다.
- **컷오버**: v1 클라이언트 사용이 완전히 종료된 후, v1 엔드포인트를下线합니다.

이 전략을 따르면, 기존 v1 API 클라이언트는 `/grip-result` 엔드포인트를 계속 호출하며, 기존 v1 스키마 (`read_grip_result`) 를 그대로 사용하므로 깨지지 않습니다.
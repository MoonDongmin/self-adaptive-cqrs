기존 v1 API 클라이언트가 깨지지 않게 하려면 **비파괴적 마이그레이션 (Non-destructive Migration)** 전략을 따르고, **버전별 API 엔드포인트 분리**를 통해 신구 버전을 병행 운영해야 합니다.

구체적 단계는 다음과 같습니다.

### 1. 새 Read Model 테이블 생성 (`read_grip_result_v2`)
기존 `read_grip_result` 테이블을 건드리지 않고, 새로운 스키마를 가진 `read_grip_result_v2` 테이블을 생성합니다. 이 테이블에는 `depth_min_meters` 와 `pose_consistency_valid` 필드가 추가되어 물리적 정합성 규칙을 준수하도록 설계됩니다.

```sql
CREATE TABLE read_grip_result_v2 (
    scene_key VARCHAR NOT NULL,
    attempt_num SMALLINT NOT NULL,
    object_name VARCHAR NOT NULL,
    grip_succeed SMALLINT NOT NULL,
    gripper_type VARCHAR(16) NOT NULL,
    occurred_at TIMESTAMPTZ NOT NULL,
    grip_2d_pose JSONB,
    grip_3d_pose JSONB,
    robot_tf JSONB,
    human_annotation_grasp JSONB,
    stream_id VARCHAR NOT NULL,
    global_seq BIGINT NOT NULL,
    depth_min_meters NUMERIC(6, 3),
    pose_consistency_valid SMALLINT NOT NULL,
    PRIMARY KEY (scene_key, attempt_num)
);
```

### 2. 새 프로젝터 추가 (`GripResultProjectorV2`)
기존 `GripResultProjector` 로직을 수정하지 않고, 새로운 `GripResultProjectorV2` 클래스를 생성하여 이벤트 소싱 이벤트를 `read_grip_result_v2` 로 투영합니다. 이 프로젝터 내부에서 `checkIntegrity` 로직을 구현하여 `grip_succeed=1` 인 경우 `depth_min_meters` 가 `[0.01, 0.3]` 범위 내에 있는지 검증하고, 위반 시 `pose_consistency_valid=0` 로 설정합니다.

### 3. 새 API 엔드포인트 추가 (`POST /v2/grip-result`)
기존 `/grip-result` 엔드포인트를 삭제하지 않고, 새 버전의 엔드포인트인 `/v2/grip-result` 를 추가합니다. 이 엔드포인트는 `GripResultProjectorV2` 를 호출하여 최신 정합성 규칙이 적용된 데이터를 반환합니다.

```typescript
// src/projection/projection.controller.ts 에 추가
@Post("/v2/grip-result")
gripResultV2(): Promise<ProjectionResult> {
    // ... 로직 구현 (GripResultProjectorV2 호출)
}
```

### 4. 마이그레이션 및 컷오버 절차 (Human-in-the-loop)
클라이언트 측 변경 없이 시스템이 안정적으로 전환되도록 다음 단계를 수행합니다.

1.  **준비 단계**: 새 테이블 (`read_grip_result_v2`) 과 새 프로젝터 (`GripResultProjectorV2`) 를 배포합니다.
2.  **병행 운영**: 기존 `/grip-result` (v1) 와 새 `/v2/grip-result` (v2) 엔드포인트가 동시에 작동합니다. 클라이언트는 필요에 따라 새 엔드포인트를 호출하거나, 기존 엔드포인트를 계속 사용할 수 있습니다.
3.  **데이터 복제 (Catch-up)**: 새 프로젝터가 시작되면, 이벤트 스토어에 축적된 이벤트들을 `read_grip_result_v2` 로 투영하는 `CatchUpRunner` 가 실행됩니다. 이때 `checkIntegrity` 로직이 적용되어 오염된 데이터 (v1 로 생성된 모순 데이터) 는 `pose_consistency_valid=0` 로 기록됩니다.
4.  **검증**: 새 엔드포인트 `/v2/grip-result` 가 정상적으로 작동하고, 오염된 데이터가 `pose_consistency_valid=0` 로 필터링되는지 확인합니다.
5.  **컷오버 (Cut-over)**:
    *   모든 이벤트가 새 모델로 투영되었음을 확인합니다.
    *   **중요**: 기존 `read_grip_result` 테이블에 남아있는 오염된 데이터를 삭제합니다.
    ```sql
    DELETE FROM read_grip_result WHERE scene_key = '반려동물용품_CR01_강아지공룡알장난감_02018' AND attempt_num = 1;
    DELETE FROM read_grip_result WHERE scene_key = '반려동물용품_CR01_강아지공룡알장난감_02019' AND attempt_num = 1;
    ```
    *   (선택 사항) 기존 `/grip-result` 엔드포인트를 새 `/v2/grip-result` 로 리디렉션하거나, 기존 엔드포인트를 삭제합니다. 하지만 클라이언트 호환성을 위해 기존 엔드포인트를 유지하고, 새 엔드포인트를 권장하는 것이 안전합니다.

### 요약
*   **기존 v1 API**: `read_grip_result` 테이블을 계속 사용하므로 **깨지지 않습니다**.
*   **새 v2 API**: `read_grip_result_v2` 테이블을 사용하며, **정합성 규칙이 적용된 깨끗한 데이터**를 제공합니다.
*   **클라이언트 영향**: 클라이언트는 새 엔드포인트 (`/v2/grip-result`) 를 호출하면 즉시 정합성 검증된 데이터를 받을 수 있으며, 기존 엔드포인트를 계속 사용해도 문제가 없습니다.
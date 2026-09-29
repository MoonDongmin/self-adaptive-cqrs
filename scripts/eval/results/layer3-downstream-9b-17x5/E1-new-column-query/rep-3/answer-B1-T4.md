제공된 자료 (로그 컨텍스트 및 Read Model 스키마) 에 따르면, `gripper_temperature` 필드는 최신 이벤트 스키마 (`payload.schema.drift`) 에만 존재하며, 기존 Read Model (`read_grip_result`, `read_multimodal`) 에는 해당 필드가 포함되지 않았습니다. 따라서 **현재 Read Model 로는 조회가 불가능**합니다.

기존 v1 API 클라이언트가 깨지지 않도록 하려면 **버전 관리 전략 (API Versioning)** 을 적용해야 합니다. 구체적 단계는 다음과 같습니다.

### 1. 버전 경로 정의 (API Versioning)
기존 클라이언트가 사용하는 `/api/v1` 경로는 변경하지 않고, 새로운 필드를 포함하는 조회 API 는 **`/api/v2`** (또는 `/api/v1/gripper-temp`) 같은 별도 버전 경로를 생성합니다.
*   **v1 API**: 기존 스키마 기반 조회 (변경 없음)
*   **v2 API**: `gripper_temperature` 필드 포함 조회

### 2. Read Model 확장 및 마이그레이션
기존 Read Model 을 즉시 수정하면 v1 API 가 깨지므로, **신구 병행 운영**을 위해 별도의 Read Model 을 생성하거나 기존 테이블에 새 컬럼을 추가하되, v1 쿼리는 새 컬럼을 참조하지 않도록 설계해야 합니다.

**추천 전략: 새 Read Model 생성 (`read_grip_result_v2`)**
기존 `read_grip_result` 테이블을 건드리지 않고, 새 필드를 포함하는 별도 테이블을 생성하여 v2 API 가 이를 참조하도록 합니다.

```sql
-- 새 Read Model 생성 (기존 read_grip_result 는 건드리지 않음)
CREATE TABLE read_grip_result_v2 (
    scene_key varchar PRIMARY KEY,
    attempt_num smallint,
    object_name varchar,
    grip_succeed smallint,
    gripper_type varchar(16),
    occurred_at timestamptz,
    grip_2d_pose jsonb,
    grip_3d_pose jsonb,
    robot_tf jsonb,
    human_annotation_grasp jsonb,
    stream_id varchar,
    global_seq bigint,
    gripper_temperature numeric, -- 신규 필드 추가
    -- 기존 필드들은 그대로 유지하여 v1/v2 공유 가능 (필요시)
);
```

### 3. 이벤트 투영 (Projection) 로직 수정
새 Read Model (`read_grip_result_v2`) 을 채우기 위해 이벤트 소싱 프로세스를 수정해야 합니다.

*   **기존 로직**: `grip-attempt` 이벤트의 `payload` 에서 필드를 추출하여 `read_grip_result` 에 저장.
*   **수정 로직**:
    1.  `grip-attempt` 이벤트가 들어오면, `payload` 에 `gripper_temperature` 키가 있는지 확인.
    2.  **존재하는 경우**: `read_grip_result_v2` 에 `gripper_temperature` 값을 저장.
    3.  **존재하지 않는 경우**: `read_grip_result_v2` 에 `gripper_temperature` 값을 `NULL` 또는 `0` (필드에 따라 결정) 로 저장하여 NULL 값이 발생하지 않도록 보장 (데이터 무결성).
    4.  `read_grip_result` (v1) 에는 `gripper_temperature` 필드를 저장하지 않음 (또는 NULL 로 저장하되 v1 쿼리가 이를 참조하지 않도록 하거나, 별도 컬럼으로 관리).

**프로젝터 (Projector) 로직 예시 (Pseudo-code):**
```python
def project_grip_event(event):
    payload = event.payload
    scene_key = extract_scene_key(event.stream_id)
    attempt_num = extract_attempt_num(event.stream_id)
    
    # v1 Read Model 로직 (변경 없음)
    read_grip_result.insert({
        "scene_key": scene_key,
        "attempt_num": attempt_num,
        "gripper_temperature": payload.get("gripper_temperature", None) # v1 은 이 필드를 무시하거나 NULL 처리
    })
    
    # v2 Read Model 로직 (신규 필드 포함)
    read_grip_result_v2.insert({
        "scene_key": scene_key,
        "attempt_num": attempt_num,
        "gripper_temperature": payload.get("gripper_temperature", 0.0) # v2 는 필드가 없으면 기본값 처리
    })
```

### 4. 마이그레이션 및 컷오버 절차
1.  **준비 단계**: `read_grip_result_v2` 테이블 생성 및 투영 로직 수정 후 테스트.
2.  **병행 운영**:
    *   v1 API: `read_grip_result` 테이블 조회 (기존 로직 유지).
    *   v2 API: `read_grip_result_v2` 테이블 조회 (신규 필드 포함).
    *   기존 클라이언트 (`/api/v1`) 는 계속 `read_grip_result` 를 참조하므로 깨지지 않음.
    *   새 클라이언트 (`/api/v2`) 는 `read_grip_result_v2` 를 참조하여 `gripper_temperature` 를 조회 가능.
3.  **데이터 마이그레이션**: 기존 `read_grip_result` 테이블에 `gripper_temperature` 컬럼을 추가하고, 과거 데이터에 대해 백업된 이벤트 로그를 재프로젝션하여 해당 컬럼을 채움 (선택 사항, 즉시 필요시).
4.  **컷오버**:
    *   v1 API 에서 `gripper_temperature` 필드가 필요 없는 경우, 해당 필드 참조를 제거.
    *   v2 API 가 안정적으로 작동하고 기존 클라이언트와 충돌이 없는 것을 확인.
    *   필요시 `read_grip_result` 테이블의 `gripper_temperature` 컬럼을 `NOT NULL` 제약조건으로 변경하거나, v1 API 를 완전히 `/api/v2` 로 변경하여 새 Read Model 만 사용하도록 전환.

### 요약
*   **가능 여부**: 현재 Read Model 로는 불가능 (필드 누락).
*   **해결 방법**: 새 Read Model (`read_grip_result_v2`) 생성 및 투영 로직 수정.
*   **API 안정성**: API 버전을 분리 (`/v1` vs `/v2`) 하여 기존 클라이언트 영향 최소화.
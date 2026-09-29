제공된 자료에 따르면, `payload.schema.drift` 로그에서 `gripper_temperature` 필드가 신규로 유입되었음을 알 수 있습니다. 그러나 기존 Read Model (`read_grip_result`, `read_multimodal`) 의 스키마 정의에는 해당 필드가 포함되어 있지 않으며, 로그에 명시된 대로 "적재 시 유실됨(Read Model 후보)"으로 기록되어 있습니다.

따라서 **현재 Read Model 로는 `gripper_temperature` 값을 조회할 수 없습니다.**

기존 v1 API 클라이언트가 깨지지 않도록 하려면, **신구 버전 API 를 병행 운영 (Dual Write / Dual Read)** 하되, 마이그레이션 시기를 신중하게 조절해야 합니다. 구체적인 단계는 다음과 같습니다.

### 1. 데이터 스키마 확장 (Schema Migration)
가장 먼저 이벤트 스토어 (Event Store) 에 저장된 이벤트의 스키마를 업데이트해야 합니다.
*   **동작:** `gripper_temperature` 필드를 포함하는 새로운 스키마를 이벤트 스토어에 적용합니다.
*   **주의:** 기존에 저장된 이벤트에는 해당 필드가 없으므로, 스키마 변경 시 기존 데이터를 덮어쓰거나 (Overwrite) 새 필드를 빈 값으로 채우는 (Upsert) 전략을 선택해야 합니다. 보통은 새 필드가 없는 기존 이벤트를 새 스키마에 맞게 `null` 또는 기본값으로 업데이트하는 것이 안전합니다.

### 2. Read Model 생성 및 마이그레이션 (Backfill)
이벤트 스토어에 `gripper_temperature` 필드가 포함된 이벤트들이 저장된 후, 이를 반영하여 새로운 Read Model 을 생성해야 합니다.
*   **새 테이블 생성:** `read_grip_result` 테이블에 `gripper_temperature` 컬럼을 추가하고, `read_multimodal` 테이블에도 해당 컬럼을 추가합니다.
*   **Backfill (역사적 데이터 처리):**
    *   **새로운 이벤트:** 스키마 변경 후 들어오는 이벤트는 새 Read Model 로 즉시 매핑됩니다.
    *   **기존 이벤트:** 스키마 변경 전의 이벤트에는 `gripper_temperature` 값이 없습니다. 이 경우 새 Read Model 에 해당 필드를 `NULL` 또는 `0` (필요한 경우) 로 채워 넣어야 합니다.
    *   **SQL 예시 (Backfill 쿼리):**
        ```sql
        -- read_grip_result 에 gripper_temperature 컬럼 추가 및 NULL 채우기
        ALTER TABLE read_grip_result ADD COLUMN gripper_temperature numeric;
        UPDATE read_grip_result SET gripper_temperature = NULL WHERE gripper_temperature IS NULL;

        -- read_multimodal 에 gripper_temperature 컬럼 추가 및 NULL 채우기
        ALTER TABLE read_multimodal ADD COLUMN gripper_temperature numeric;
        UPDATE read_multimodal SET gripper_temperature = NULL WHERE gripper_temperature IS NULL;
        ```
    *   **프로젝터 (Projector) 수정:** `multimodal-projector` 로직을 수정하여, 이벤트 파싱 시 `gripper_temperature` 키가 존재하면 해당 값을 DB 에 업데이트하도록 합니다.

### 3. API 버전 관리 및 병행 운영 (Versioning & Parallel Operation)
v1 API 클라이언트가 깨지지 않게 하려면, 새 필드가 없는 상태에서는 새 필드를 반환하지 않거나 기본값을 반환하는 전략을 취해야 합니다.

*   **API 엔드포인트 버전화:**
    *   기존: `GET /api/v1/loadings` (또는 해당 엔드포인트)
    *   새 버전: `GET /api/v2/loadings`
*   **v1 API 응답 전략:**
    *   v1 API 는 `gripper_temperature` 필드를 응답에 포함시키지 않습니다.
    *   만약 v1 API 가 `gripper_temperature` 필드를 기대하고 있다면, 해당 필드가 없으면 `null` 을 반환해야 합니다.
    *   **추천:** v1 API 는 변경 사항에 무관하게 기존 스키마대로 응답합니다. `gripper_temperature` 필드가 없으므로 클라이언트는 해당 필드를 받지 못합니다.
*   **v2 API 응답 전략:**
    *   `gripper_temperature` 필드를 포함하여 응답합니다.
    *   Backfill 로 인해 DB 에 `NULL` 값이 채워져 있다면, v2 API 는 `null` 을 반환합니다.

### 4. 마이그레이션 및 컷오버 절차 (Cutover)
사용자에게는 점진적인 전환을 제공해야 합니다.

1.  **준비 단계:**
    *   새 스키마 적용 및 Backfill 쿼리 실행 완료.
    *   v2 API 구현 및 테스트 완료.
    *   v1 API 는 `gripper_temperature` 필드를 포함하지 않는 스키마로 유지.

2.  **병행 운영 단계:**
    *   v1 API 와 v2 API 를 동시에 노출합니다.
    *   **v1 API:** `gripper_temperature` 필드 없이 기존 응답 구조를 유지합니다. (기존 클라이언트 영향 없음)
    *   **v2 API:** `gripper_temperature` 필드가 포함된 응답을 반환합니다. (신규 클라이언트 사용)
    *   **DB:** 두 API 가 동일한 DB 를 공유하므로, v2 API 가 `gripper_temperature` 값을 읽을 수 있게 됩니다.

3.  **컷오버 (Cutover) 단계:**
    *   모든 클라이언트가 v2 API 로 마이그레이션되었음을 확인합니다.
    *   v1 API 엔드포인트를下线하거나, v1 API 응답에 `gripper_temperature` 필드를 포함하도록 패치합니다.
    *   v1 API 가 `gripper_temperature` 필드를 포함하도록 패치할 경우, DB 에 `NULL` 값이 있는 레코드에 대해 v1 API 가 `null` 을 반환해야 합니다.

### 5. SQL 코드 (Postgres)

```sql
-- 1. read_grip_result 테이블에 gripper_temperature 컬럼 추가
ALTER TABLE read_grip_result ADD COLUMN IF NOT EXISTS gripper_temperature NUMERIC;

-- 2. read_grip_result 에 기존 데이터에서 해당 필드가 없는 경우 NULL 로 채우기 (Backfill)
-- 주의: 해당 필드가 이벤트 스토어에 없다면, INSERT 시 NULL 이 들어오거나 UPDATE 시 NULL 이 될 수 있음
UPDATE read_grip_result 
SET gripper_temperature = NULL 
WHERE gripper_temperature IS NULL;

-- 3. read_multimodal 테이블에 gripper_temperature 컬럼 추가
ALTER TABLE read_multimodal ADD COLUMN IF NOT EXISTS gripper_temperature NUMERIC;

-- 4. read_multimodal 에 기존 데이터에서 해당 필드가 없는 경우 NULL 로 채우기 (Backfill)
UPDATE read_multimodal 
SET gripper_temperature = NULL 
WHERE gripper_temperature IS NULL;
```

### 요약
*   **현재 상태:** 불가능 (Read Model 에 필드 없음).
*   **해결책:**
    1.  이벤트 스토어 스키마 업데이트 (`gripper_temperature` 추가).
    2.  Read Model (`read_grip_result`, `read_multimodal`) 에 해당 컬럼 추가 및 Backfill (`NULL` 채우기).
    3.  API 버전화 (`/v1` 은 필드 없음, `/v2` 는 필드 포함).
    4.  v1/v2 병행 운영 후, 클라이언트 마이그레이션 완료 시 v1 을 업데이트하거나下线.
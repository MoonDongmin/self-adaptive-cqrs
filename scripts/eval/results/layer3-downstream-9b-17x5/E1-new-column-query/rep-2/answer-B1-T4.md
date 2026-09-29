제공된 자료에 따르면, `payload.schema.drift` 로그가 `gripper_temperature` 필드가 신규로 유입되었음을 나타내며, 기존 Read Model (`read_grip_result`, `read_multimodal`) 에 해당 필드가 정의되어 있지 않습니다. 따라서 기존 Read Model 로는 이 값을 조회할 수 없습니다.

기존 v1 API 클라이언트가 깨지지 않도록 하려면 **버전 관리 전략 (API Versioning)** 을 적용해야 합니다. 구체적 단계는 다음과 같습니다.

### 1. 버전 경로 정의 (API Versioning)
기존 클라이언트가 의존하는 `/api/v1` 경로는 변경하지 않고, 새로운 필드를 포함하는 조회 API 는 **`/api/v2`** (또는 `/api/v1/gripper-temp`) 와 같은 새로운 버전 경로를 생성합니다.
*   **이유:** 기존 클라이언트는 `/api/v1` 을 호출하므로 응답 구조가 바뀌지 않아 깨지지 않습니다.

### 2. Read Model 확장 및 마이그레이션
`gripper_temperature` 필드를 포함하는 새로운 Read Model 을 생성하고, 기존 Read Model 과 병행하여 운영합니다.

*   **새 Read Model 생성:** `read_gripper_temp` 테이블 생성.
    *   키: `(scene_key, attempt_num)` (기존 Read Model 과 동일하여 Join 이 가능)
    *   필드: `gripper_temperature` (float/numeric), `occurred_at` (필수), `scene_key`, `attempt_num`
*   **이벤트 소싱 로직 수정:**
    *   `payload.schema.drift` 로 감지된 `gripper_temperature` 필드를 이벤트 스토어에 `gripper_temperature` 이벤트 타입으로 발행하거나, 기존 `grip_result` 이벤트에 필드를 추가하는 프로토콜을 정의합니다.
    *   **중요:** 기존 Read Model (`read_grip_result`) 에는 `gripper_temperature` 필드를 **추가하지 않습니다.** 기존 테이블 스키마를 유지하여 기존 API 응답이 깨지지 않도록 합니다.

### 3. 투영 (Projection) 로직 구현
새로운 Read Model (`read_gripper_temp`) 을 구축하는 프로젝터를 구현합니다.
*   **Catch-up:** 기존에 쌓여있는 이벤트 스토어에서 `gripper_temperature` 필드가 포함된 이벤트를 찾아 `read_gripper_temp` 테이블에 초기 데이터를 로드합니다.
*   **Real-time:** 새로운 이벤트가 들어오면 `read_gripper_temp` 테이블에 실시간으로 INSERT 합니다.

### 4. API 응답 전략 (Sharding/Response Composition)
백엔드 API 서버는 요청된 버전에 따라 다른 Read Model 을 조회하여 응답을 구성합니다.

*   **`/api/v1` 요청 (기존 클라이언트):**
    *   `read_grip_result` 테이블만 조회.
    *   응답: `{ "grip_succeed": ..., "gripper_type": ..., "gripper_temperature": null }` (필드가 없거나 null 반환)
*   **`/api/v2` 요청 (새 클라이언트):**
    *   `read_gripper_temp` 테이블 조회.
    *   응답: `{ "scene_key": ..., "gripper_temperature": 36.5, ... }`

### 5. 마이그레이션 및 컷오버 절차
모든 클라이언트가 v2 로 업데이트될 때까지 v1 을 유지합니다.

1.  **Parallel Operation:** `read_grip_result` (v1) 와 `read_gripper_temp` (v2) 를 동시에 유지합니다.
2.  **Data Sync:** `read_gripper_temp` 에는 `gripper_temperature` 만 포함하고, `read_grip_result` 에는 포함하지 않습니다.
3.  **Cut-over:**
    *   모든 클라이언트가 v2 API 를 사용하도록 배포된 후, `read_gripper_temp` 테이블의 데이터를 `read_grip_result` 테이블의 `gripper_temperature` 열로 **COPY/MERGE** 합니다.
    *   이때 `read_grip_result` 테이블의 `gripper_temperature` 열을 NULL 이 아닌 실제 값으로 업데이트합니다.
    *   `read_gripper_temp` 테이블을 삭제하거나 비활성화합니다.

### SQL 코드 (Postgres)

```sql
-- 1. 새 Read Model 테이블 생성 (read_gripper_temp)
-- 기존 read_grip_result 와 같은 키 구조를 유지하여 Join 이 가능하도록 함
CREATE TABLE IF NOT EXISTS read_gripper_temp (
    scene_key VARCHAR PRIMARY KEY,
    attempt_num SMALLINT NOT NULL,
    gripper_temperature NUMERIC(5, 2), -- 필드 추가
    occurred_at TIMESTAMPTZ NOT NULL,
    stream_id VARCHAR,
    global_seq BIGINT,
    UNIQUE(scene_key, attempt_num)
);

-- 2. 기존 Read Model 에 필드 추가하지 않음 (기존 API v1 깨짐 방지)
-- 만약 기존 테이블에 추가해야 한다면, NULL 허용으로 확장해야 하지만 
-- 권장하는 방법은 새 테이블 생성 후 병행 운영 후 마이그레이션

-- 3. (예시) 새 Read Model 에 데이터 로드하는 INSERT 문
-- 실제 이벤트 스토어에서 데이터를 추출하여 이 테이블로 로드하는 로직 필요
INSERT INTO read_gripper_temp (scene_key, attempt_num, gripper_temperature, occurred_at, stream_id, global_seq)
SELECT 
    split_part(stream_id, ':', 2) as scene_key,
    split_part(stream_id, ':', 3)::smallint as attempt_num,
    payload_data->>'gripper_temperature'::numeric as gripper_temperature,
    occurred_at,
    stream_id,
    global_seq
FROM event_store_grip_result
WHERE payload_data->>'gripper_temperature' IS NOT NULL;

-- 4. (예시) 기존 Read Model 에 데이터 병합하는 쿼리 (컷오버 단계에서 실행)
-- 기존 v1 API 가 사용하는 read_grip_result 테이블에 필드 추가
UPDATE read_grip_result r
SET gripper_temperature = s.gripper_temperature
FROM read_gripper_temp s
WHERE r.scene_key = s.scene_key 
  AND r.attempt_num = s.attempt_num
  AND s.gripper_temperature IS NOT NULL;
```

**주의:** 위 SQL 의 `event_store_grip_result` 는 예시 테이블명이며, 실제 이벤트 스토어에 접근하는 방식은 시스템 아키텍처에 따라 다를 수 있습니다. 핵심은 **기존 Read Model (`read_grip_result`) 에는 `gripper_temperature` 필드를 포함하지 않고, 새 Read Model (`read_gripper_temp`) 을 별도로 구축하여 API 버전을 분리하는 것**입니다.
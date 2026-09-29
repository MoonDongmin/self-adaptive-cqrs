제공된 자료 (로그 컨텍스트, Read Model 스키마) 에 따르면, 현재 시스템은 `payload.schema.drift` 로그를 발생시키고 있으며, 이는 스키마에 없는 신규 키 (`conveyor_speed`, `gripper_temperature`) 가 유입되어 Read Model 에 적재되지 않고 유실되는 상황입니다.

**주의:** 제공된 자료에는 **기존 v1 API 의 스키마 정의, v2 API 의 스키마 정의, 또는 v1 API 의 응답 필드 목록**에 대한 정보가 포함되어 있지 않습니다. 따라서 "기존 v1 API 클라이언트가 깨지지 않게 하려면"이라는 전제에 따라 구체적인 API 응답 필드 변경 사항 (예: `conveyor_speed` 필드가 추가되었다는 사실) 을 가정할 수 없습니다.

자료에 없는 사실을 지어내지 않는 원칙에 따라, **가상의 API 변경 사항이 없거나, API 응답 구조가 Read Model 의 스키마와 동적하게 매핑되는 경우**를 전제로, **데이터 무결성 (유실된 필드 복구) 을 보장하는 백엔드 마이그레이션 절차**를 제안합니다.

### 1. 버전 경로 전략 (Versioning Strategy)

API 응답 구조가 변경되지 않는 한 (즉, v1 API 가 여전히 구형 스키마로만 응답하는 경우), 클라이언트 호환성을 위해 **URL 버전 경로**를 사용하는 것이 가장 안전합니다.

*   **v1 API:** `GET /api/v1/read_grip_result` (기존 스키마 준수, 신규 필드 없음)
*   **v2 API:** `GET /api/v2/read_grip_result` (신규 스키마 준수, `conveyor_speed`, `gripper_temperature` 포함)

이 방식은 클라이언트가 즉시 업데이트하지 않아도 v1 엔드포인트를 계속 호출할 수 있어 호환성이 보장됩니다.

### 2. 신구 병행 운영 (Parallel Operation)

백엔드 서비스는 두 가지 스키마를 동시에 지원하도록 구현되어야 합니다.

*   **Request Routing:** API Gateway 또는 Load Balancer 에서 `Host` 헤더 (`api-v1` vs `api-v2`) 또는 URL 경로 (`/v1/...` vs `/v2/...`) 에 따라 요청을 라우팅합니다.
*   **Response Generation:**
    *   **v1 응답:** CQRS 의 `Read Model` 에서 구형 스키마에 맞는 필드만 추출하여 JSON 을 생성합니다. (신규 필드는 포함 안 함)
    *   **v2 응답:** CQRS 의 `Read Model` 에서 최신 스키마에 맞는 모든 필드 (신규 필드 포함) 를 추출하여 JSON 을 생성합니다.

### 3. 마이그레이션 및 컷오버 절차 (Migration & Cutover)

자료에 따르면 현재 `payload.schema.drift` 로 인해 신규 필드가 **Read Model 에 저장되지 않고 유실**되고 있습니다. 따라서 마이그레이션의 핵심 목표는 **유실된 데이터를 복구하여 v2 API 가 정상 작동하도록 하는 것**입니다.

#### 단계 1: 스키마 드리프트 감지 및 자동 복구 (Data Repair)
현재 운영 중인 이벤트 소싱 파이프라인에 **스키마 드리프트 감지 로직**을 즉시 적용해야 합니다.

*   **이벤트 스토어 (Event Store) 에 대한 쿼리:**
    유실된 필드가 포함된 원본 이벤트 (Event Store) 를 직접 조회하여, Read Model 로 변환되지 않은 이벤트를 찾아냅니다.
    ```sql
    -- 이벤트 스토어에서 신규 키가 포함된 이벤트를 조회
    SELECT 
        stream_id,
        global_seq,
        payload::jsonb
    FROM "event_store"
    WHERE 
        stream_id LIKE 'grip-attempt:%'
        AND payload::jsonb ? 'conveyor_speed'
        AND payload::jsonb ? 'gripper_temperature'
        AND global_seq > (SELECT MAX(global_seq) FROM "read_grip_result" WHERE stream_id = stream_id)
    ORDER BY global_seq;
    ```

#### 단계 2: Read Model 동기화 (Backfill)
위 쿼리로 찾은 이벤트들을 사용하여 Read Model 을 직접 업데이트합니다.

*   **Read Model (`read_grip_result`) 업데이트:**
    ```sql
    -- 유실된 필드가 포함된 이벤트를 기반으로 Read Model 업데이트
    -- 주의: 기존 Read Model 에 해당 row 가 없거나, 필드가 null 인 경우에만 업데이트하거나 병합
    INSERT INTO "read_grip_result" (
        scene_key, attempt_num, object_name, grip_succeed, gripper_type, 
        occurred_at, grip_2d_pose, grip_3d_pose, robot_tf, human_annotation_grasp,
        stream_id, global_seq, -- 신규 필드 추가
        conveyor_speed, gripper_temperature
    )
    SELECT 
        -- scene_key 추출 로직 (stream_id 에서 'grip-attempt:' 제거)
        SUBSTRING(stream_id, POSITION('grip-attempt:' IN stream_id) + LENGTH('grip-attempt:')),
        -- attempt_num 추출 로직 (stream_id 에서 시도번호 추출)
        CAST(SUBSTRING(stream_id, POSITION('grip-attempt:') IN stream_id) AS INT),
        -- payload 에서 필드 추출
        payload->>'object_name',
        payload->>'grip_succeed',
        payload->>'gripper_type',
        payload->>'occurred_at',
        payload->>'grip_2d_pose',
        payload->>'grip_3d_pose',
        payload->>'robot_tf',
        payload->>'human_annotation_grasp',
        stream_id,
        global_seq,
        payload->>'conveyor_speed',
        payload->>'gripper_temperature'
    FROM "event_store"
    WHERE 
        stream_id LIKE 'grip-attempt:%'
        AND payload::jsonb ? 'conveyor_speed'
        AND payload::jsonb ? 'gripper_temperature'
        AND global_seq > (SELECT COALESCE(MAX(global_seq), 0) FROM "read_grip_result" WHERE stream_id = stream_id)
    ON CONFLICT (scene_key, attempt_num) DO UPDATE SET
        conveyor_speed = EXCLUDED.conveyor_speed,
        gripper_temperature = EXCLUDED.gripper_temperature;
    ```

#### 단계 3: v2 API 활성화 및 v1 API 유지 (Cutover)
데이터 복구 작업이 완료되었음을 확인한 후, API 응답 로직을 변경합니다.

*   **v1 API:** 기존 로직 유지 (신규 필드 필터링 또는 무시).
*   **v2 API:** `read_grip_result` 테이블에서 `conveyor_speed`, `gripper_temperature` 필드를 포함하여 응답.

#### 단계 4: 클라이언트 마이그레이션 (Client Migration)
*   클라이언트 측에서 `GET /api/v1/...` 대신 `GET /api/v2/...` 로 엔드포인트를 변경합니다.
*   v1 API 는 필요에 따라 유지하거나 (Gradual Deprecation), 일정 기간 후下线합니다.

### 요약

1.  **버전 경로:** `/api/v1` (구 스키마), `/api/v2` (신 스키마) 로 분리.
2.  **병행 운영:** 두 버전의 API 엔드포인트를 동시에 노출.
3.  **마이그레이션 핵심:** `payload.schema.drift` 로 인해 유실된 데이터를 **Event Store**에서 직접 조회하여 **Read Model**에 `INSERT` 또는 `UPDATE` 하는 백필 (Backfill) 작업 수행.
4.  **컷오버:** 데이터 동기화가 완료되면 v2 API 를 트래픽에 적용하고, v1 API 는 유지 또는下线.

*참고: 위 SQL 쿼리는 Postgres 문법이며, `stream_id` 에서 `scene_key` 와 `attempt_num` 을 추출하는 로직은 제공된 자료의 예시 (`grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00018`) 에 기반하여 작성되었습니다.*
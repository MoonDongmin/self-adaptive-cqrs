제공된 자료 (로그 컨텍트, Read Model 스키마) 에 따르면, 현재 시스템은 `payload.schema.drift` 로그를 발생시키고 있으며, 이는 이벤트 스토어에 `conveyor_speed` 와 `gripper_temperature` 같은 **신규 키 (New Keys)** 가 유입되었음을 의미합니다.

하지만 **Read Model 스키마 (`read_grip_result`, `read_multimodal`)** 에는 이 두 필드가 정의되어 있지 않습니다. 이벤트 소싱 + CQRS 아키텍처에서 Read Model은 이벤트 스토어의 스키마 변경에 따라 마이그레이션을 거치지 않고, **이벤트 프로세서 (Projector)** 가 새 필드를 무시하거나 (Ignore) 또는 필드 추출 로직을 수정하여 기존 스키마에 맞는 데이터만 추출하는 방식으로 처리해야 합니다.

따라서 **API 클라이언트 (v1) 가 깨지지 않게 하려면, API 레이어에서는 아예 변경 사항 (신규 필드) 을 인지하지 못하게 하거나, 기존 API 엔드포인트의 응답 구조를 유지하는 것이 핵심**입니다.

구체적인 단계별 대응 방안은 다음과 같습니다.

### 1. 버전 경로 전략 (Versioning Strategy)
*   **전략:** URL 기반 버전 관리 (`/api/v1/...`, `/api/v2/...`) 를 사용하되, **v1 엔드포인트의 응답 스키마는 변경하지 않습니다.**
*   **이유:** v1 클라이언트는 `/api/v1` 경로의 응답을 파싱하도록 작성되어 있을 것입니다. 만약 v1 엔드포인트의 JSON 응답 구조 (필드명, 타입) 가 바뀌면 v1 클라이언트가 즉시 깨집니다.
*   **실행:**
    *   새 API 기능을 `/api/v2` (또는 `/api/v1.1` 등) 에 노출합니다.
    *   `/api/v1` 엔드포인트는 기존 스키마 (신규 필드 포함 여부 포함) 를 그대로 유지합니다.

### 2. 신구 병행 운영 (Parallel Operation)
*   **전략:** 새 기능은 v2 경로로 배포하고, v1 경로는 기존 로직으로 계속 운영합니다.
*   **이유:** v1 클라이언트 사용자는 v2 경로를 모르고 v1 을 계속 호출하므로, v1 응답이 깨지면 서비스 중단이 발생합니다.
*   **실행:**
    *   **Read Model 업데이트 금지:** `read_grip_result` 및 `read_multimodal` 테이블의 스키마 (DDL) 에 새 필드 (`conveyor_speed`, `gripper_temperature`) 를 추가하지 않습니다.
    *   **Projector 로직 수정:** 이벤트 프로세서 코드를 수정하여, 이벤트 스토어에서 들어오는 `payload` 의 `conveyor_speed` 와 `gripper_temperature` 필드는 **무시 (Ignore)** 하거나, **Read Model 에 매핑되지 않도록 필터링**합니다.
        *   *주의:* 만약 새 필드가 `read_grip_result` 테이블의 `payload` 컬럼 (JSONB) 내부에 저장된다면, 테이블 스키마는 깨지지 않지만, v1 클라이언트가 해당 JSONB 내의 특정 키를 직접 읽으려 한다면 문제가 될 수 있습니다. 따라서 v1 클라이언트가 의존하는 필드만 추출되도록 로직을 조정해야 합니다.

### 3. 마이그레이션 및 컷오버 절차 (Migration & Cutover)
*   **단계 1: 이벤트 스토어 스키마 확장 (Event Store Update)**
    *   이벤트 스토어 (ES) 에는 이미 `conveyor_speed`, `gripper_temperature` 가 들어오고 있습니다. 이 상태는 유지합니다.
    *   **핵심:** Read Model 생성/업데이트 로직을 변경합니다.
    *   **SQL 로직 (Projector 로직 수정):**
        ```sql
        -- 기존 Read Model 생성/업데이트 쿼리 (Projector 에서 실행됨)
        -- 신규 필드가 있는 경우, 해당 필드를 Read Model 테이블에 INSERT 하거나 UPDATE 할 때
        -- 조건부로 처리하여 Primary Key 충돌을 방지하고, v1 클라이언트가 읽을 필드만 포함되도록 함
        
        -- 예시: 신규 필드가 Read Model 에 포함되지 않도록 필터링하거나, 별도 JSONB 컬럼에 담음
        INSERT INTO read_grip_result (scene_key, attempt_num, object_name, grip_succeed, gripper_type, occurred_at, grip_2d_pose, grip_3d_pose, robot_tf, human_annotation_grasp, stream_id, global_seq)
        SELECT 
            -- 기존 필드 추출 로직 유지
            scene_key,
            attempt_num,
            object_name,
            grip_succeed,
            gripper_type,
            occurred_at,
            grip_2d_pose,
            grip_3d_pose,
            robot_tf,
            human_annotation_grasp,
            stream_id,
            global_seq
        FROM raw_event_stream
        WHERE stream_id LIKE 'grip-attempt:%'
          -- 신규 필드가 payload 에 있다면, 이 필드는 Read Model 에 포함되지 않도록 WHERE 조건에서 제외하거나
          -- 별도 컬럼 (예: metadata) 에 저장되도록 로직 수정
          -- 만약 payload 가 JSONB 로 저장된다면, SELECT 에서 해당 키를 추출하지 않음
        ON CONFLICT (scene_key, attempt_num) DO NOTHING; 
        ```
        *(참고: 실제 SQL 은 Projector 코드에 따라 다르지만, 결과적으로 `read_grip_result` 테이블에는 `conveyor_speed` 필드가 없도록 보장해야 합니다.)*

*   **단계 2: Read Model 스키마 고정 (Schema Locking)**
    *   DB 스키마 변경 (ALTER TABLE) 을 **거부**합니다.
    *   만약 DB 스키마에 새 컬럼을 추가해야 한다면, **v1 클라이언트가 사용하는 쿼리 (SELECT) 가 해당 컬럼을 참조하지 않도록 확인**해야 합니다.
    *   **권장:** `read_grip_result` 테이블에 `payload_snapshot` (JSONB) 같은 컬럼을 추가하여 모든 원본 데이터를 저장하고, v1 클라이언트는 `payload_snapshot` 을 직접 읽거나, v1 에 필요한 필드만 추출하는 쿼리를 사용하도록 합니다. 하지만 v1 클라이언트가 `read_grip_result` 테이블의 고정된 컬럼만 읽는다면, 새 컬럼을 추가해도 무방합니다.

*   **단계 3: API v2 배포 및 v1 유지**
    *   새 API 엔드포인트 (`/api/v2`) 를 배포합니다. 이 엔드포인트는 `read_grip_result` 테이블의 `conveyor_speed`, `gripper_temperature` 필드를 반환합니다.
    *   `/api/v1` 엔드포인트는 기존 스키마를 그대로 반환합니다.
    *   **중요:** v1 클라이언트는 `/api/v1` 을 계속 호출하므로, v1 응답에 새 필드가 없어도 v1 클라이언트는 정상 작동합니다.

*   **단계 4: 모니터링 및 검증**
    *   v1 클라이언트 호출 로그를 모니터링하여 404/500 에러가 발생하지 않는지 확인합니다.
    *   v2 클라이언트 (새로운 기능 사용) 가 새 필드를 정상적으로 수신하는지 확인합니다.

### 요약: v1 클라이언트 보호를 위한 핵심 조치

1.  **API 엔드포인트 분리:** 새 필드를 포함하는 응답은 **새 버전 경로 (`/api/v2`)** 에만 노출합니다.
2.  **Read Model 스키마 변경 최소화:** `read_grip_result` 테이블에 새 컬럼을 추가하지 않거나, 추가하더라도 v1 쿼리가 참조하지 않도록 합니다.
3.  **Projector 로직 수정:** 이벤트 스토어에 들어오는 새 필드 (`conveyor_speed`, `gripper_temperature`) 가 **Read Model 테이블에 저장되지 않도록** 로직을 변경합니다. (필요시 JSONB 컬럼에 숨겨두는 방법도 고려)
4.  **데이터 일관성:** v1 클라이언트가 필요로 하는 필드 (기존 스키마 필드) 가 정상적으로 Read Model 에 저장되고 조회되도록 보장합니다.

**SQL 예시 (Read Model 업데이트 로직 수정 시):**

```sql
-- 기존 Read Model 생성/업데이트 로직 (Projector 에서 실행)
-- 신규 필드 (conveyor_speed, gripper_temperature) 가 Read Model 에 포함되지 않도록 필터링

INSERT INTO read_grip_result (
    scene_key, attempt_num, object_name, grip_succeed, gripper_type, 
    occurred_at, grip_2d_pose, grip_3d_pose, robot_tf, human_annotation_grasp, 
    stream_id, global_seq
)
SELECT 
    -- scene_key 추출 로직 (stream_id 에서 'grip-attempt:' 제거)
    SUBSTRING(stream_id, 13), 
    -- attempt_num 추출 로직 (파일명에서 시도번호 추출)
    CAST(SUBSTRING(file_name, POSITION('_') + 1, POSITION('_') - POSITION('_') - 1) AS SMALLINT),
    -- 기존 필드들만 추출
    -- ... (기존 필드 추출 로직)
    -- 신규 필드 (conveyor_speed, gripper_temperature) 는 SELECT 에서 제외
    -- 만약 payload 가 JSONB 로 저장되어 있다면, 해당 키를 추출하지 않음
    payload_snapshot::jsonb->>'conveyor_speed' as conveyor_speed, -- 예시: JSONB 에만 저장
    payload_snapshot::jsonb->>'gripper_temperature' as gripper_temperature -- 예시: JSONB 에만 저장
FROM raw_event_stream
WHERE stream_id LIKE 'grip-attempt:%'
  AND global_seq > (SELECT MAX(global_seq) FROM read_grip_result)
ON CONFLICT (scene_key, attempt_num) DO UPDATE SET
    -- 기존 필드 업데이트
    occurred_at = EXCLUDED.occurred_at,
    -- 신규 필드는 업데이트하지 않음 (JSONB 에만 남김)
    payload_snapshot = COALESCE(payload_snapshot, EXCLUDED.payload_snapshot);
```

이렇게 하면 `read_grip_result` 테이블의 고정된 컬럼 구조는 유지되므로 v1 API 클라이언트가 깨지지 않으며, 새 필드는 v2 API 를 통해만 제공될 수 있습니다.
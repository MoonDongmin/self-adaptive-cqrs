제공된 자료에 따르면, `payload.schema.drift` 로그에서 `gripper_temperature` 필드가 신규로 유입되었음을 알 수 있습니다. 그러나 기존 Read Model (`read_grip_result`, `read_multimodal`) 의 스키마 정의에는 해당 필드가 포함되어 있지 않으며, `payload.schema.drift` 로그의 `detail` 필드에서 "적재 시 유실됨(Read Model 후보)"이라고 명시되어 있습니다.

따라서 **기존 Read Model 로는 `gripper_temperature` 값을 조회할 수 없습니다.**

기존 v1 API 클라이언트가 깨지지 않도록 하려면 **신구 Read Model 을 병행 운영 (Dual Write)** 하고, API 응답을 합치거나 마이그레이션 절차를 거쳐야 합니다. 구체적인 단계는 다음과 같습니다.

### 1. 신규 Read Model 생성 및 스키마 정의
`read_grip_result` 테이블에 `gripper_temperature` 컬럼을 추가하거나, 별도의 `read_gripper_temp` 테이블을 생성해야 합니다. 기존 스키마에 없는 필드를 추가하는 것이 안전합니다.

```sql
-- 기존 read_grip_result 테이블에 컬럼 추가 (추천: 기존 PK 유지)
ALTER TABLE read_grip_result 
ADD COLUMN gripper_temperature numeric;

-- 인덱스 추가 (조회 성능 및 유니크 제약 조건 고려 필요)
-- 만약 scene_key 와 attempt_num 으로 조회할 경우
CREATE INDEX IF NOT EXISTS idx_read_grip_result_gripper_temp 
ON read_grip_result (scene_key, attempt_num, gripper_temperature);
```

### 2. 이벤트 스토어 (Event Store) 처리 로직 변경
`payload.schema.drift` 로지크가 감지될 때, 해당 필드가 유실되지 않도록 Event Store 에 `gripper_temperature` 필드를 포함하는 새로운 이벤트 타입 (예: `gripper.temperature.updated`) 을 발행하거나, 기존 `grip-attempt` 이벤트의 스키마를 확장하여 해당 필드를 포함하도록 프로듀서 측 로직을 수정해야 합니다.
*   **주의:** CQRS 의 핵심은 이벤트 스토어에 원본 데이터가 남는 것입니다. Read Model 을 업데이트하려면 이벤트 스토어에 해당 필드가 저장되어야 합니다.

### 3. Projection 로직 수정 (Read Model 동기화)
`multimodal-projector` (또는 `grip-projector`) 로직을 수정하여, 이벤트 스토어에서 `gripper_temperature` 필드가 추출되도록 코드를 변경해야 합니다.

```sql
-- Projection 로직 수정 예시 (Pseudo-code SQL 로 표현)
-- 기존: SELECT ... FROM read_grip_result WHERE stream_id = 'grip-attempt:...'
-- 변경: SELECT ..., gripper_temperature FROM read_grip_result WHERE stream_id = 'grip-attempt:...'
-- 또는 신규 테이블 생성 시:
-- INSERT INTO read_grip_result (scene_key, attempt_num, ..., gripper_temperature)
-- SELECT ..., e.g., payload.gripper_temperature
-- FROM event_store WHERE stream_id = 'grip-attempt:...' AND payload.gripper_temperature IS NOT NULL;
```

### 4. v1 API 클라이언트 호환성 보장 (신구 병행 운영)
v1 API 가 `gripper_temperature` 필드를 반환하지 않도록 보장해야 합니다.

*   **API 응답 구조 변경:**
    *   **옵션 A (추천):** v1 API 는 기존 스키마를 그대로 유지하고, `gripper_temperature` 필드를 포함하지 않습니다. 새로운 필드가 필요한 경우 **v2 API** 를 별도로 노출합니다.
    *   **옵션 B (Backward Compatibility):** v1 API 응답 객체에서 `gripper_temperature` 필드가 없도록 필터링하거나, 필드가 없으면 `null` 또는 `undefined` 로 처리되도록 로직을 수정합니다. (필드가 없으면 에러가 나지 않도록)

    ```sql
    -- v1 API 응답 생성 쿼리 예시 (gripper_temperature 포함 안 함)
    SELECT 
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
        -- gripper_temperature 는 제외
    FROM read_grip_result
    WHERE scene_key = :input_scene_key
    ORDER BY attempt_num;
    ```

### 5. 마이그레이션 및 컷오버 절차
1.  **데이터 마이그레이션:** 기존에 적재된 데이터 중 `gripper_temperature` 필드가 포함된 경우 (현재는 없음, 추후 유입될 경우), 해당 필드가 포함된 이벤트가 Event Store 에 저장되어 있다면, Projection 을 재실행하여 `read_grip_result` 테이블에 `gripper_temperature` 값을 채워 넣습니다.
    ```sql
    -- 과거 데이터 마이그레이션 (필요시)
    UPDATE read_grip_result
    SET gripper_temperature = (
        SELECT payload.gripper_temperature
        FROM event_store
        WHERE stream_id = read_grip_result.stream_id
        ORDER BY global_seq DESC
        LIMIT 1
    );
    ```
2.  **API 버전 관리:**
    *   v1 API 는 `gripper_temperature` 필드를 반환하지 않습니다.
    *   v2 API 는 `gripper_temperature` 필드를 포함하여 반환합니다.
    *   프론트엔드 클라이언트가 v1 을 계속 사용한다면, v1 API 호출 시 해당 필드가 없으므로 깨지지 않습니다.
3.  **컷오버:**
    *   모든 신규 적재 데이터가 `gripper_temperature` 필드를 포함하도록 프로듀서 측을 변경합니다.
    *   Projection 이 해당 필드를 Read Model 에 반영하도록 수정합니다.
    *   v1 API 를 `gripper_temperature` 를 포함하지 않는 로직으로 고정합니다.
    *   일정 기간 후, v1 API 를 `gripper_temperature` 를 포함하도록 업데이트하거나 (필드가 없으면 null 처리), v1 API 를 완전히 v2 로 대체합니다.

### 요약
*   **현재 상태:** 불가능 (Read Model 에 필드 없음).
*   **해결책:**
    1.  DB: `read_grip_result` 에 `gripper_temperature` 컬럼 추가.
    2.  Event Store: `gripper_temperature` 필드가 포함된 이벤트 발행 로직 수정.
    3.  Projection: 이벤트에서 필드 추출하여 DB 에 적재하는 로직 수정.
    4.  API: v1 API 는 해당 필드를 반환하지 않도록 유지 (Backward Compatibility). v2 API 를 새로 만들거나, v1 API 응답 필드 정의에 `gripper_temperature` 를 `nullable` 로 추가하여 빈 값으로 반환하도록 수정.
    5.  마이그레이션: 과거 데이터에 필드가 있다면 Projection 재실행 또는 직접 UPDATE.
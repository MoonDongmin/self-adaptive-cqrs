제공된 자료 (로그 및 스키마 정의) 에 따르면, 현재 `read_grip_result` 와 `read_multimodal` 테이블은 `stream_id` 와 `global_seq` 를 **추적 키 (Tracking Key)** 로 사용하여 이벤트 소싱의 순서를 보장하고 있습니다.

특히 `payload.schema.drift` 로그에 따르면, 최신 이벤트에는 `conveyor_speed` 와 `gripper_temperature` 같은 **신규 키**가 추가되었으나, 기존 Read Model 스키마에는 이 필드가 포함되어 있지 않습니다.

이 상황에서 기존 v1 API 클라이언트가 깨지지 않도록 하려면, **데이터 스키마의 호환성 (Backward Compatibility)** 을 유지하면서 **추적 키의 불일치**를 해결해야 합니다.

### 1. 분석: 문제의 핵심
*   **추적 키 불일치:** 기존 Read Model (`read_grip_result`, `read_multimodal`) 은 `stream_id` 와 `global_seq` 를 Primary Key 또는 Unique Constraint 로 사용하고 있습니다.
*   **스키마 드리프트:** 이벤트 스토어에 `conveyor_speed`, `gripper_temperature` 필드가 추가되었으나, Read Model 테이블에는 해당 컬럼이 없습니다.
*   **영향:**
    1.  **INSERT:** 새 필드를 가진 이벤트가 들어오면, `INSERT INTO read_grip_result (...)` 쿼리가 실패합니다 (Column not found).
    2.  **SELECT:** v1 API 가 `SELECT * FROM read_grip_result` 를 호출하면, 새 필드가 없으므로 `NULL` 이 반환되거나 (컬럼이 없으므로 무시됨), 만약 `SELECT ... (conveyor_speed)` 를 호출하면 `column does not exist` 에러가 납니다.
    3.  **업데이트:** 만약 v1 API 가 `UPDATE read_grip_result SET conveyor_speed = ...` 을 호출하면 에러가 납니다.

### 2. 해결 전략: 버전 관리 및 스키마 마이그레이션
기존 클라이언트를 즉시 깨뜨리지 않으려면, **데이터 스키마의 확장**과 **API 의 버전 분리**를 병행해야 합니다.

#### 단계 1: Read Model 스키마 확장 (DB 변경)
새로운 필드가 들어오는 이벤트를 처리할 수 있도록 Read Model 테이블을 즉시 확장해야 합니다.
*   **동작:** `read_grip_result` 와 `read_multimodal` 테이블에 `conveyor_speed` 와 `gripper_temperature` 컬럼을 추가합니다.
*   **주의:** `stream_id` 와 `global_seq` 는 Primary Key 로 유지되므로, 새 필드를 추가할 때 Primary Key 정의는 건드리지 않고, 단순히 `ALTER TABLE ... ADD COLUMN` 만 수행합니다.
*   **결과:** 이제 `INSERT` 로 들어오는 새 필드가 포함된 이벤트도 정상적으로 처리됩니다.

#### 단계 2: API 버전 분리 (v1 vs v2)
v1 API 클라이언트는 확장된 필드를 모르고 있을 수 있습니다. 따라서 v1 API 는 **기존 스키마만 반환**하도록 수정하거나, 새 필드를 포함하지 않는 응답 구조를 유지해야 합니다.

*   **v1 API (기존):**
    *   응답 필드: `scene_key`, `attempt_num`, `object_name`, `grip_succeed`, `gripper_type`, `occurred_at`, `pose` (jsonb), `robot_tf` (jsonb), `human_annotation_grasp` (jsonb).
    *   **동작:** DB 에서 `SELECT` 시 새 필드 (`conveyor_speed` 등) 를 포함하지 않도록 쿼리를 작성하거나, 응답 객체에서 새 필드를 필터링합니다.
    *   **추적 키:** `stream_id` 와 `global_seq` 를 계속 사용합니다.

*   **v2 API (새 버전):**
    *   응답 필드: v1 필드 + `conveyor_speed`, `gripper_temperature`.
    *   **동작:** 새 필드를 포함하여 반환합니다.

#### 단계 3: 추적 키 (Tracking Key) 불일치 해결
이벤트 소싱에서 가장 중요한 것은 `stream_id` 와 `global_seq` 의 일관성입니다.
*   **문제:** 만약 DB 마이그레이션 전에 새 필드가 포함된 이벤트가 들어와서 `global_seq` 가 증가했다면, v1 API 가 해당 `global_seq` 를 기준으로 조회할 때, DB 에는 새 필드가 없는 레코드 (또는 에러로 인한 누락) 가 있을 수 있습니다.
*   **해결:**
    1.  **DB 마이그레이션 우선:** 새 필드가 들어오는 이벤트가 쌓이는 동안, DB 스키마를 먼저 확장하여 데이터를 저장할 수 있게 합니다.
    2.  **Projection 로직 수정:** Projection 이 새 필드를 가진 이벤트를 처리하여 `read_grip_result` 에 저장할 때, v1 API 가 필요로 하는 필드만 추출하여 저장하거나, 전체 JSONB 로 저장하되 v1 API 가 읽을 수 있는 컬럼만 선택하도록 합니다.
    3.  **v1 API 쿼리 수정:** v1 API 가 `SELECT *` 대신 명시적인 컬럼 리스트를 사용하도록 변경합니다. 이때 새 필드는 포함하지 않습니다.

### 3. 구체적 SQL 및 절차

#### 단계 A: DB 스키마 확장 (필수)
새로운 필드가 들어오는 이벤트를 저장하기 위해 테이블을 확장합니다.

```sql
-- read_grip_result 테이블 확장
ALTER TABLE read_grip_result 
ADD COLUMN conveyor_speed double precision,
ADD COLUMN gripper_temperature double precision;

-- read_multimodal 테이블 확장 (필요시, 만약 payload 에 미디어 관련 필드가 추가되었다면)
-- 현재 자료에서는 multimodal 에 새 필드가 명시적으로 언급되지 않았으나, 안전성을 위해 동일하게 처리하거나 필요시 확장
-- 만약 multimodal 에도 새 필드가 필요하다면:
-- ALTER TABLE read_multimodal 
-- ADD COLUMN conveyor_speed double precision,
-- ADD COLUMN gripper_temperature double precision;
```

#### 단계 B: v1 API 쿼리 수정 (선택 사항, 권장)
v1 API 가 `SELECT *` 를 사용한다면, DB 에 새 컬럼이 추가되더라도 v1 API 는 해당 컬럼을 읽지 않으므로 깨지지 않습니다. 하지만 `SELECT ... (conveyor_speed)` 처럼 명시적으로 새 컬럼을 요청하는 경우 에러가 날 수 있습니다.

**v1 API 쿼리 예시 (변경 전):**
```sql
SELECT * FROM read_grip_result WHERE stream_id = 'grip-attempt:...' AND global_seq = ...;
```

**v1 API 쿼리 예시 (변경 후 - 안전성 확보):**
v1 API 가 새 필드를 사용하지 않으므로, 새 필드를 포함하지 않는 컬럼만 선택합니다.
```sql
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
    human_annotation_grasp
FROM read_grip_result 
WHERE stream_id = 'grip-attempt:...' 
  AND global_seq = ...;
```

#### 단계 C: Projection 로직 조정 (백엔드 로직)
Projection 이 새 필드를 가진 이벤트를 처리할 때, v1 API 가 필요로 하는 필드만 `read_grip_result` 에 저장되도록 하거나, 전체적으로 저장하되 v1 API 가 읽을 때 필터링되도록 합니다.

**Projection 로직 (가상):**
```python
# 이벤트에서 새 필드 추출
new_data = {
    "conveyor_speed": event.get("conveyor_speed"),
    "gripper_temperature": event.get("gripper_temperature"),
    # ... 기존 필드들
}

# v1 API 호환성을 위해 read_grip_result 에는 기존 필드만 저장 (또는 JSONB 로 전체 저장)
# 방법 1: 컬럼별 저장 (추천, 성능 최적화)
if "conveyor_speed" in new_data:
    # conveyor_speed 컬럼이 DB 에 없다면 에러 발생 -> 따라서 단계 A 의 ALTER TABLE 이 먼저 수행되어야 함
    db.execute("INSERT INTO read_grip_result (conveyor_speed, ...) VALUES ...")

# 방법 2: JSONB 로 전체 저장 (스키마 변경 없이)
# read_grip_result 에는 기존 필드만 컬럼으로, 새 필드는 JSONB 에 담거나 별도 컬럼에 담음
# 하지만 주어진 스키마는 고정된 컬럼 구조이므로, 단계 A 의 ALTER TABLE 이 필수입니다.
```

### 4. 마이그레이션 및 컷오버 절차

1.  **Preparation (준비):**
    *   DB 마이그레이션 스크립트 (`ALTER TABLE ... ADD COLUMN`) 를 작성합니다.
    *   v1 API 코드에서 `SELECT` 쿼리를 수정하여 새 필드를 포함하지 않도록 변경합니다.
    *   v2 API 코드를 작성하여 새 필드를 포함하도록 합니다.

2.  **Deployment (배포):**
    *   **DB Migration:** DB 마이그레이션 스크립트를 실행하여 `read_grip_result` 에 새 컬럼을 추가합니다.
        *   *주의:* 이 단계에서 새 필드가 들어오는 이벤트가 있으면 정상적으로 저장됩니다.
    *   **API Deployment:** v1 API 를 수정된 버전으로 배포합니다.
        *   v1 API 는 새 컬럼을 읽지 않으므로, DB 에 새 컬럼이 추가되어 있더라도 v1 API 는 정상 작동합니다.
    *   **v2 API Deployment:** v2 API 를 배포합니다.
        *   v2 API 는 새 컬럼을 읽을 수 있습니다.

3.  **Verification (검증):**
    *   v1 API 가 새 필드가 포함된 이벤트를 조회할 때 에러가 없는지 확인합니다.
    *   v2 API 가 새 필드를 정상적으로 반환하는지 확인합니다.

4.  **Cut-over (컷오버):**
    *   v1 API 를 완전히 제거합니다.
    *   모든 클라이언트가 v2 API 를 사용하도록 안내합니다.

### 요약
*   **DB:** `ALTER TABLE read_grip_result ADD COLUMN conveyor_speed, gripper_temperature;`
*   **v1 API:** `SELECT` 쿼리에서 새 필드를 제외하거나, `SELECT *` 를 유지하되 새 필드가 `NULL` 이거나 비어있도록 처리 (DB 에는 저장되지만 API 응답에는 포함 안 함).
*   **v2 API:** 새 필드를 포함하여 응답합니다.
*   **절차:** DB 마이그레이션 -> v1 API 수정 배포 -> v2 API 배포 -> v1 API 제거.

이 절차를 따르면, 새 필드가 들어오는 이벤트도 저장되고, 기존 v1 API 클라이언트는 새 필드가 없는 응답을 받거나 새 필드를 무시하므로 깨지지 않습니다.
제공된 자료에 따르면, `gripper_temperature` 필드는 이벤트 스토어에 새로 유입되었으며 (payload.schema.drift), 기존 Read Model (`read_grip_result`, `read_multimodal`) 에는 해당 필드가 정의되어 있지 않습니다. 따라서 기존 Read Model 로는 이 값을 조회할 수 없습니다.

기존 v1 API 클라이언트가 깨지지 않도록 하려면 **API 버전 관리 (Versioning)** 와 **데이터 마이그레이션** 을 병행해야 합니다.

### 1. 분석 및 결론
*   **현재 상태:** `gripper_temperature` 필드가 이벤트 스토어에 존재하지만, Postgres Read Model 에는 매핑되어 있지 않습니다.
*   **문제:** 기존 v1 API 는 `read_grip_result` 테이블만 참조하므로, `gripper_temperature` 필드를 반환할 수 없습니다.
*   **해결책:**
    1.  **API 버전 분리:** 기존 v1 API 를 유지하고, 새 필드를 포함하는 `v2` API 를 새로 생성합니다.
    2.  **Read Model 확장:** `read_grip_result` 테이블에 `gripper_temperature` 컬럼을 추가하거나, 새 Read Model (`read_grip_result_v2`) 을 생성합니다.
    3.  **이벤트 투영 (Projection) 수정:** 이벤트 스토어에서 새 필드가 들어오는 이벤트를 읽을 때, 해당 필드를 추출하여 확장된 Read Model 에 적재하는 로직을 구현합니다.

### 2. 구체적 단계 (v1 API 보호 기준)

#### 단계 1: API 버전 경로 정의 (API Gateway 설정)
기존 클라이언트 (`/api/v1/...`) 는 변경되지 않게 유지하고, 새 필드 조회는 새 버전 (`/api/v2/...`) 으로 라우팅합니다.

```sql
-- API Gateway 설정 예시 (Pseudo-code for routing logic)
-- 기존 v1: /api/v1/grip-results -> read_grip_result (기존 스키마)
-- 새 v2:  /api/v2/grip-results -> read_grip_result_v2 (확장된 스키마 포함)
```

#### 단계 2: Read Model 스키마 확장 (Postgres)
기존 `read_grip_result` 테이블에 `gripper_temperature` 컬럼을 추가합니다. (또는 새 테이블 생성 후 동시 운영)
*   **추천:** 기존 테이블에 컬럼 추가 (ALTER TABLE) 후 인덱스 재조명.
*   **대안:** 새 테이블 `read_grip_result_v2` 생성 (완전한 마이그레이션 시).

```sql
-- 옵션 A: 기존 테이블 확장 (가장 빠르고 비용 효율적)
ALTER TABLE read_grip_result 
ADD COLUMN gripper_temperature numeric;

-- 인덱스 추가 (필요시, 시간대별 조회 성능을 위해 occurred_at 에 인덱스 확인)
-- CREATE INDEX idx_read_grip_result_occurred_at ON read_grip_result(occurred_at);
```

#### 단계 3: 이벤트 투영 (Projection) 로직 수정
이벤트 스토어에서 `grip-attempt:*` 스트림의 이벤트가 들어올 때, `payload` 에 `gripper_temperature` 키가 있는지 확인하고, 있으면 DB 에 적재해야 합니다.

```sql
-- 옵션 A: 기존 테이블에 INSERT 시 필드 포함 (기존 쿼리 수정)
-- INSERT INTO read_grip_result (scene_key, attempt_num, object_name, gripper_type, occurred_at, grip_2d_pose, grip_3d_pose, robot_tf, human_annotation_grasp, stream_id, global_seq, gripper_temperature)
-- VALUES (
--   -- 기존 필드 매핑 로직 유지
--   -- ...
--   COALESCE(payload.gripper_temperature, NULL) -- 신규 필드 매핑
-- );

-- 옵션 B: 새 테이블 생성 및 별도 투영 (안전한 마이그레이션)
-- CREATE TABLE read_grip_result_v2 (
--   scene_key varchar PRIMARY KEY,
--   attempt_num smallint,
--   -- 기존 필드들...
--   gripper_temperature numeric
-- );
```

#### 단계 4: 투영 프로세서 (Projector) 로직 구현
`multimodal-projector` 또는 새 프로젝터에서 이벤트 스토어 데이터를 읽을 때, `payload` 객체에서 `gripper_temperature` 값을 추출하여 DB 에 적재하는 코드를 작성합니다.

```sql
-- 예시: PostgreSQL 함수 또는 애플리케이션 코드 (Pseudo-code)
-- 이벤트 스토어에서 payload 를 JSONB 로 읽음
-- IF payload.gripper_temperature IS NOT NULL THEN
--   INSERT INTO read_grip_result_v2 (..., gripper_temperature)
--   SELECT ..., payload->>'gripper_temperature'
--   FROM event_store_stream
--   WHERE stream_id = 'grip-attempt:' || scene_key;
-- END IF;
```

#### 단계 5: 마이그레이션 및 컷오버 절차
1.  **병행 운영 (Parallel Run):**
    *   v1 API: `read_grip_result` (구형 스키마) 를 조회.
    *   v2 API: `read_grip_result_v2` (신형 스키마 포함) 를 조회.
    *   두 Read Model 은 동일한 이벤트 스트림 (`grip-attempt:*`) 을 소스 olarak 공유하지만, 다른 테이블에 적재됩니다.

2.  **데이터 동기화:**
    *   새 필드가 유입되면, 두 테이블에 동시에 `INSERT` 됩니다.
    *   기존 데이터는 `gripper_temperature` 가 NULL 이 됩니다.

3.  **컷오버 (Cutover):**
    *   모든 기존 적재 데이터에 대해 `gripper_temperature` 필드가 이벤트 스토어에 완전히 반영되었는지 확인 (Backfill).
    *   v1 API 를 `read_grip_result_v2` 로 변경하거나, v1 API 를 완전히下线합니다.
    *   클라이언트 측에서 `/api/v1` 대신 `/api/v2` 를 호출하도록 업데이트합니다.

### 3. SQL 코드 (Postgres)

```sql
-- 1. 기존 Read Model 에 신규 필드 추가 (가장 빠른 방법)
ALTER TABLE read_grip_result 
ADD COLUMN gripper_temperature numeric;

-- 2. (선택사항) 시간대별 조회 성능을 위한 인덱스 확인/추가
-- 만약 occurred_at 을 기준으로 조회한다면 인덱스가 필수일 수 있음
CREATE INDEX IF NOT EXISTS idx_read_grip_result_occurred_at ON read_grip_result(occurred_at);

-- 3. (선택사항) 새 버전 Read Model 생성 (완전한 마이그레이션 시 사용)
-- 기존 데이터를 복사하고 새 필드를 NULL 로 초기화
CREATE TABLE read_grip_result_v2 AS 
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
    global_seq,
    NULL::numeric AS gripper_temperature
FROM read_grip_result;

-- 새 테이블에 고유 키 설정 (scene_key, attempt_num)
ALTER TABLE read_grip_result_v2 
ADD CONSTRAINT pk_read_grip_result_v2 PRIMARY KEY (scene_key, attempt_num);
```

### 4. 투영 로직 수정 가이드 (Pseudo-code)

이벤트 스토어에서 `grip-attempt:*` 스트림을 읽을 때:

```sql
-- 이벤트 스토어에서 payload 를 읽는 쿼리 (예시)
-- SELECT stream_id, payload FROM event_store WHERE stream_id LIKE 'grip-attempt:%' ORDER BY global_seq;

-- 투영 로직 (Application Logic)
FOREACH event IN events:
    stream_id := event.stream_id;
    payload := event.payload;
    
    -- scene_key 추출: stream_id 에서 'grip-attempt:' 제거
    scene_key := substring(stream_id, 12); 
    attempt_num := extract_number_from_stream_id(stream_id); -- 파일명 규칙에 따라 파싱
    
    -- 신규 필드 매핑
    new_gripper_temp := payload['gripper_temperature'];
    
    -- 기존 Read Model 업데이트
    INSERT INTO read_grip_result (scene_key, attempt_num, object_name, gripper_type, occurred_at, grip_2d_pose, grip_3d_pose, robot_tf, human_annotation_grasp, stream_id, global_seq, gripper_temperature)
    VALUES (
        scene_key,
        attempt_num,
        payload['objects'][0]['class_name'],
        'finger', -- 현재 로직에 따라 고정 또는 payload['gripper_type']
        extract_date_from_filename(payload['filename']),
        payload['2d_grasp_pose'],
        payload['3d_grasp_pose'],
        payload['robot_tf'],
        payload['human_annotation_grasp'],
        stream_id,
        event.global_seq,
        new_gripper_temp -- 신규 필드 추가
    );
    
    -- 새 Read Model 업데이트 (병행 운영용)
    INSERT INTO read_grip_result_v2 (scene_key, attempt_num, object_name, gripper_type, occurred_at, grip_2d_pose, grip_3d_pose, robot_tf, human_annotation_grasp, stream_id, global_seq, gripper_temperature)
    VALUES (
        scene_key,
        attempt_num,
        payload['objects'][0]['class_name'],
        'finger',
        extract_date_from_filename(payload['filename']),
        payload['2d_grasp_pose'],
        payload['3d_grasp_pose'],
        payload['robot_tf'],
        payload['human_annotation_grasp'],
        stream_id,
        event.global_seq,
        new_gripper_temp
    );
```

### 요약
1.  **Read Model 확장:** `read_grip_result` 테이블에 `gripper_temperature` 컬럼을 추가합니다.
2.  **Event Projection 수정:** 이벤트 스토어에서 `gripper_temperature` 필드가 들어오면, 이를 추출하여 확장된 Read Model 에 `INSERT` 합니다.
3.  **API 버전화:** 기존 v1 API 는 변경되지 않은 `read_grip_result` 를 계속 참조합니다. 새 필드가 필요한 요청은 `/api/v2` 엔드포인트로 라우팅되도록 합니다.
4.  **컷오버:** 모든 과거 데이터에 대해 새 필드가 DB 에 적재된 것을 확인한 후, v1 API 를下线하고 v2 API 만 사용합니다.
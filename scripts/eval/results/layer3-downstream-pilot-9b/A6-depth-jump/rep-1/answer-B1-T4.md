제공된 자료 (JSON 원시 레코드, ReadModel 스키마) 에 따르면, 현재 시스템은 **파지 성공 여부 (`grip_succeed`)** 와 **3D 포즈 (`grip_3d_pose`)** 에 대한 기본 정보를 저장하고 있으며, **파지 깊이 (Z 좌표) 의 급격한 변화 (suddenJump)** 에 대한 별도의 인사이트 (Insight) 는 저장되어 있지 않습니다.

자료에 명시된 "1 차 판정 — 검증 전 가설"과 "jump"라는 경고 메시지는 아직 데이터베이스에 영구적으로 저장된 사실이 아니라, 실시간 관찰기 (Observer) 의 로직에서 계산된 임시 결과임을 알 수 있습니다. 따라서 기존 API 클라이언트가 기대하는 필드 (예: `read_grip_result` 테이블의 기본 필드들) 에는 '파지 깊이 이상 에피소드'라는 새로운 속성이 존재하지 않습니다.

기존 v1 API 클라이언트를 깨뜨리지 않으면서 이 새로운 인사이트를 지원하기 위한 구체적인 단계는 다음과 같습니다.

### 1. 버전 경로 전략 (Versioning Strategy)
기존 클라이언트가 `GET /api/v1/grip-results` 와 같은 엔드포인트를 호출할 때, 응답 구조가 변경되어 파싱이 깨지는 것을 방지하기 위해 **URL 버전을 분리**하는 방식을 채택해야 합니다.

*   **기존 API:** `GET /api/v1/grip-results` (파지 결과만 반환)
*   **신규 API:** `GET /api/v2/grip-results` 또는 `GET /api/v1/grip-results?include_insights=true` (선택적 포함)
    *   *권장:* **URL 버전 분리 (`/api/v2/...`)** 가 가장 안전합니다. v1 클라이언트는 v2 엔드포인트를 호출하지 않으므로 전혀 영향을 받지 않습니다.

### 2. 신구 병행 운영 (Parallel Operation)
데이터 생성과 API 호환성을 동시에 보장하기 위해 다음 절차를 따릅니다.

*   **Read Model 확장 (Schema Migration):**
    *   `read_grip_result` 테이블에 새로운 컬럼을 추가하거나, 별도의 테이블 (`read_grip_insight`) 을 생성합니다.
    *   **주의:** 자료에 따르면 `read_grip_result` 는 `grip_3d_pose` (JSONB) 만 포함하고 있으며, Z 평균 계산이나 임계값 비교 (`Δ > 0.1m`) 로직은 아직 DB 에 저장된 필드가 없습니다. 따라서 즉시 기존 스키마를 변경하면 기존 v1 API 의 `SELECT` 쿼리가 깨질 수 있습니다.
    *   **해결책:** 기존 `read_grip_result` 테이블 구조를 유지한 채, **새로운 인사이트 데이터를 별도의 테이블 (`read_grip_insight`)** 에 저장하거나, 기존 테이블에 **nullable 인덱스**로 새로운 컬럼 (예: `is_depth_jump: boolean`, `depth_jump_value: numeric`) 을 추가하되, 기존 쿼리가 해당 컬럼을 참조하지 않도록 설계해야 합니다.
    *   *자료 기반 결정:* 현재 자료에는 인사이트 저장 스키마가 없습니다. 따라서 **새로운 테이블 `read_grip_insight`** 를 생성하는 것이 가장 안전합니다.
        *   `scene_key`, `attempt_num`, `insight_type` (예: 'sudden_jump'), `metric_value` (예: 0.110), `threshold` (예: 0.1), `timestamp` 등을 포함.

*   **API Gateway / Router 로직:**
    *   API 게이트웨이나 라우터에서 요청 경로 (`/v1` vs `/v2`) 에 따라 다른 핸들러를 호출하도록 설정합니다.
    *   v1 핸들러: `read_grip_result` 테이블만 조회하여 기존 JSON 구조 반환.
    *   v2 핸들러: `read_grip_result` 와 `read_grip_insight` 를 조인 (JOIN) 하여 확장된 JSON 구조 반환.

### 3. 마이그레이션 및 컷오버 절차 (Migration & Cutover Steps)

#### 단계 1: 스키마 변경 (Schema Change)
*   `read_grip_insight` 테이블 생성 (Postgres):
    ```sql
    CREATE TABLE read_grip_insight (
        scene_key VARCHAR PRIMARY KEY,
        attempt_num SMALLINT NOT NULL,
        insight_type VARCHAR(50) NOT NULL, -- 예: 'sudden_jump'
        metric_name VARCHAR(50) NOT NULL,  -- 예: 'grip3dPoseZ_avg_diff'
        metric_value NUMERIC(10, 6) NOT NULL, -- 예: 0.110
        threshold_value NUMERIC(10, 6) NOT NULL, -- 예: 0.1
        occurred_at TIMESTAMPTZ NOT NULL,
        stream_id VARCHAR NOT NULL,
        global_seq BIGINT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
    );
    ```
*   기존 `read_grip_result` 테이블은 **변경하지 않음**.

#### 단계 2: 이벤트 소싱 및 저장 로직 구현 (Event Sourcing)
*   제공된 JSON 로그에서 `jump` 경고가 발생했을 때만 `read_grip_insight` 테이블에 데이터를 삽입하는 이벤트 핸들러를 작성합니다.
*   **Postgres INSERT 로직 (예시):**
    ```sql
    INSERT INTO read_grip_insight (scene_key, attempt_num, insight_type, metric_name, metric_value, threshold_value, occurred_at, stream_id, global_seq)
    SELECT 
        '반려동물용품_CR01_강아지공룡알장난감_02010' as scene_key, -- 실제 쿼리 시 join 로 동적 추출
        2 as attempt_num,
        'sudden_jump' as insight_type,
        'grip3dPoseZ_avg_diff' as metric_name,
        0.110 as metric_value, -- 자료에서 재확인된 값
        0.1 as threshold_value,
        '2023-09-23T00:00:00.000Z' as occurred_at,
        'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02010' as stream_id,
        26 as global_seq
    WHERE 1=0; -- 실제 실행 시 WHERE 조건은 이벤트 소싱 파이프라인에서 처리
    ```
    *(참고: 실제 운영에서는 `read_grip_result` 테이블의 `attempt_num=2` 와 `attempt_num=1` 의 `grip_3d_pose` JSONB 데이터에서 Z 좌표 평균을 계산하여 `WHERE` 조건을 만족하는 경우에만 INSERT 수행)*

#### 단계 3: v2 API 개발 및 배포
*   `/api/v2/grip-results` 엔드포인트 구현.
*   이 엔드포인트는 `read_grip_result` 와 `read_grip_insight` 를 `JOIN` 하여 응답합니다.
    ```sql
    SELECT 
        r.scene_key, r.attempt_num, r.grip_succeed, r.grip_2d_pose, r.grip_3d_pose,
        i.insight_type, i.metric_value, i.threshold_value, i.is_triggered -- is_triggered = metric_value > threshold_value
    FROM read_grip_result r
    LEFT JOIN read_grip_insight i ON r.scene_key = i.scene_key AND r.attempt_num = i.attempt_num
    WHERE r.scene_key = :input_scene_key AND r.attempt_num = :input_attempt_num;
    ```

#### 단계 4: 클라이언트 배포 및 전환 (Cutover)
*   **v1 클라이언트:** 변경 없음. `/api/v1/...` 를 계속 호출하므로 정상 작동.
*   **v2 클라이언트:** `/api/v2/...` 를 호출하여 새로운 인사이트 필드 (`insight_type`, `metric_value` 등) 를 수신하여 로직 적용.
*   **컷오버 시점:** v2 API 가 안정적으로 검증되고, v1 클라이언트 호환성이 유지되는 것을 확인한 후, 신규 기능 사용자에게 v2 엔드포인트 사용을 권장하거나 점진적으로 트래픽을 v2 로 이동시킵니다.

### 요약
1.  **URL 버전 분리:** `/api/v1` (기존), `/api/v2` (신규 인사이트 포함).
2.  **DB 스키마:** 기존 `read_grip_result` 변경 금지, 새 테이블 `read_grip_insight` 생성.
3.  **데이터 저장:** 이벤트 소싱 파이프라인에서 조건 (`Δ > 0.1`) 을 만족하는 경우에만 새 테이블에 기록.
4.  **API 응답:** v1 은 기본 필드만, v2 는 기본 필드 + 인사이트 필드 (LEFT JOIN) 로 반환.
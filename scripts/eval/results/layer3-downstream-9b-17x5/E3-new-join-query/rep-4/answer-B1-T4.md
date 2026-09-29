제공된 자료 (로그 및 Read Model 스키마) 에 따르면, 현재 `read_grip_result` 와 `read_multimodal` 테이블은 **분리된 키 (`stream_id`)** 를 사용하여 데이터를 관리하고 있으며, API 는 각각 독립적으로 조회하는 구조로 보입니다. 요청된 기능 ("파지 결과와 해당 시도의 이미지·영상 경로를 한 화면에서 함께 보고 싶다") 을 구현하려면 두 Read Model 을 결합한 새로운 뷰 또는 쿼리가 필요합니다.

기존 v1 API 클라이언트가 깨지지 않도록 하려면 **버전 관리 전략 (API Versioning)** 을 적용해야 합니다.

### 1. 버전 경로 전략
기존 API 엔드포인트의 URL 경로에 버전을 명시하는 방식이 가장 안전합니다.
*   **기존 v1 API:** `/api/v1/insight-card/{scene_key}/{attempt_num}` (또는 유사한 경로)
*   **신규 v2 API:** `/api/v2/insight-card/{scene_key}/{attempt_num}`

이 방식은 기존 클라이언트가 `/api/v1` 경로를 계속 호출하면 기존 응답 구조를 그대로 받을 수 있고, 새로운 클라이언트나 업데이트된 클라이언트가 `/api/v2` 경로를 호출하면 결합된 데이터를 받을 수 있습니다.

### 2. 신구 병행 운영 (Parallel Operation)
*   **Read Model 유지:** 기존 `read_grip_result` 와 `read_multimodal` 테이블은 삭제하지 않고 그대로 유지합니다.
*   **새 Read Model 추가:** `read_grip_result` 와 `read_multimodal` 을 결합한 새로운 테이블 (예: `read_grip_result_v2`) 을 생성하거나, 기존 테이블 위에 뷰 (View) 를 생성하여 v2 API 가 이를 참조하도록 합니다.
    *   *추천:* 성능과 유지보수를 위해 별도 테이블 `read_grip_result_v2` 를 생성하는 것이 좋습니다. 이 테이블은 `read_grip_result` 와 `read_multimodal` 의 `(scene_key, attempt_num)` 키를 기준으로 `JOIN` 하여 생성된 데이터만 저장합니다.

### 3. 마이그레이션 및 컷오버 절차

#### 단계 1: 새 Read Model 생성 및 이벤트 소싱 (ECS)
*   **DDL:** `read_grip_result_v2` 테이블을 생성합니다.
    ```sql
    CREATE TABLE read_grip_result_v2 (
        scene_key VARCHAR PRIMARY KEY,
        attempt_num SMALLINT,
        object_name VARCHAR,
        grip_succeed SMALLINT,
        gripper_type VARCHAR(16),
        occurred_at TIMESTAMPTZ,
        grip_2d_pose JSONB,
        grip_3d_pose JSONB,
        robot_tf JSONB,
        human_annotation_grasp JSONB,
        image_2d_file_name VARCHAR,
        image_2d_uri TEXT,
        video_file_name VARCHAR,
        video_uri TEXT,
        stream_id VARCHAR,
        global_seq BIGINT,
        -- 결합을 위한 추가 인덱스 필요
        CONSTRAINT chk_attempt_num CHECK (attempt_num > 0)
    );
    ```
*   **Event Processor 수정:** 기존 `projection.batch` 프로세서 (또는 새로운 v2 전용 프로세서) 로직을 수정하여, `grip` 이벤트와 `multimodal` 이벤트가 들어올 때마다 두 테이블을 `JOIN` 하여 `read_grip_result_v2` 에 데이터를 적재합니다.
    *   *Join Logic:* `read_grip_result` 의 `stream_id` 와 `read_multimodal` 의 `stream_id` 가 일치하는지 확인하고, `scene_key` 와 `attempt_num` 을 기준으로 매핑합니다.
    *   *주의:* 자료에 따르면 `read_multimodal` 의 `stream_id` 는 `grip-attempt:scene_key` 형식입니다. `read_grip_result` 의 `stream_id` 도 동일하므로, `stream_id` 만으로 매핑이 가능합니다.

#### 단계 2: v2 API 구현 및 배포
*   **API 코드 작성:** `/api/v2/insight-card/{scene_key}/{attempt_num}` 엔드포인트를 구현합니다.
*   **DB 쿼리:** `read_grip_result_v2` 테이블에서 해당 키로 데이터를 조회합니다.
    ```sql
    SELECT 
        gr.scene_key, gr.attempt_num, gr.object_name, gr.grip_succeed, gr.gripper_type,
        gr.occurred_at, gr.grip_2d_pose, gr.grip_3d_pose, gr.robot_tf, gr.human_annotation_grasp,
        mm.image_2d_file_name, mm.image_2d_uri, mm.video_file_name, mm.video_uri
    FROM read_grip_result_v2 gr
    JOIN read_multimodal mm ON gr.stream_id = mm.stream_id
    WHERE gr.scene_key = :scene_key AND gr.attempt_num = :attempt_num;
    ```
    *(참고: 이미 `read_grip_result_v2` 에 JOIN 처리되어 있다면 JOIN 절은 생략 가능)*

#### 단계 3: 기존 v1 API 유지
*   `/api/v1/insight-card` 엔드포인트는 수정하지 않고 그대로 둡니다.
*   v1 API 는 여전히 `read_grip_result` 테이블만 조회하여 파지 결과만 반환합니다.

#### 단계 4: 클라이언트 배포 및 전환 (Cutover)
1.  **v2 API 배포:** 서버에 v2 API 를 배포합니다.
2.  **클라이언트 배포:**
    *   **기존 클라이언트:** 변경 사항이 없으므로 v1 API 를 계속 호출하며 정상 작동합니다.
    *   **새 클라이언트:** v2 API 를 호출하여 결합된 데이터를 받습니다.
3.  **검증:** v1 API 와 v2 API 가 예상대로 데이터를 반환하는지 확인합니다.
4.  **기능 전환 (선택 사항):**
    *   모든 클라이언트가 v2 API 로 마이그레이션되면, v1 API 를 서서히下线 (deprecate) 할 수 있습니다.
    *   만약 즉시 전환이 필요하다면, v1 API 를 v2 로 리팩토링하고, v1 경로 (`/api/v1/...`) 를 리디렉션 (`301` 또는 `302`) 하거나, v1 API 를 v2 로 변경합니다. 하지만 이 경우 기존 클라이언트가 깨질 수 있으므로 **리디렉션** 또는 **기존 v1 API 유지 후 점진적 전환**이 필수적입니다.

### 요약
1.  **URL:** `/api/v1/...` (기존), `/api/v2/...` (신규)
2.  **DB:** `read_grip_result_v2` 생성 (기존 테이블 유지).
3.  **프로세스:** 이벤트 소싱 로직 수정 -> v2 API 구현 -> v1 API 유지 -> 클라이언트 배포 -> 검증 -> (필요시) v1下线.

이 절차는 기존 클라이언트의 호환성을 보장하면서 새로운 기능을 제공하는 안전한 방법입니다.
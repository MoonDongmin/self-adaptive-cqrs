제공된 자료 (로그 및 Read Model 스키마) 에 따르면, 현재 `read_grip_result` 와 `read_multimodal` 테이블은 각각 파지 결과와 미디어 링크를 저장하고 있으며, 키는 `(scene_key, attempt_num)` 입니다. 요청된 기능은 이 두 개의 데이터를 `scene_key` 와 `attempt_num` 을 기준으로 조인하여 한 화면에 보여주는 것입니다.

기존 v1 API 클라이언트가 깨지지 않도록 하려면 **버전 관리 전략 (API Versioning)** 을 적용해야 합니다. 자료에는 API 스키마나 버전 정보가 명시되어 있지 않으므로, 업계 표준인 URL 경로 기반 버전 관리 방식을 가정하여 답변합니다.

### 1. 버전 경로 전략 (API Versioning)
기존 API 엔드포인트에 버전을 붙여 새 API 를 노출합니다.
*   **기존 API (v1):** `GET /api/v1/insight-card/{scene_key}/{attempt_num}` (파지 결과만 반환)
*   **신규 API (v2):** `GET /api/v2/insight-card/{scene_key}/{attempt_num}` (파지 결과 + 이미지/영상 링크 반환)

### 2. Read Model 확장 및 마이그레이션
기존 `read_grip_result` 테이블은 변경되지 않습니다. 새로운 데이터를 담을 테이블을 추가하거나, 기존 테이블에 컬럼을 추가하는 방식을 선택해야 합니다.

*   **추천 접근법: 새 Read Model 추가 (`read_grip_result_combined`)**
    *   기존 `read_grip_result` 테이블 구조를 유지하여 v1 API 가 깨지지 않도록 합니다.
    *   새로운 Read Model `read_grip_result_combined` 을 생성하여, `read_grip_result` 와 `read_multimodal` 을 조인한 결과를 저장합니다.
    *   **키:** `(scene_key, attempt_num)` (기존 키와 동일)
    *   **추가 컬럼:** `read_multimodal` 의 필드들을 포함 (`image_2d_uri`, `video_uri` 등).

### 3. 구체적 단계 (마이그레이션 및 컷오버)

#### 단계 1: 새 Read Model 생성 및 이벤트 소싱 로직 추가
*   **DDL:** `read_grip_result_combined` 테이블 생성.
    ```sql
    CREATE TABLE read_grip_result_combined (
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
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    ```
*   **Event Processor 변경:** `grip-result-projector` 와 `multimodal-projector` (또는 관련 이벤트 핸들러) 로직을 수정하여, `read_grip_result` 와 `read_multimodal` 이벤트를 수신할 때 `read_grip_result_combined` 을 업데이트하도록 합니다.
    *   **조인 로직:** `read_grip_result` 와 `read_multimodal` 을 `scene_key` 와 `attempt_num` 으로 조인합니다.
    *   **업데이트 전략:**
        1.  `read_grip_result` 이벤트가 들어오면 `read_grip_result_combined` 을 업데이트합니다.
        2.  `read_multimodal` 이벤트가 들어오면 `read_grip_result_combined` 을 업데이트합니다.
        3.  두 테이블의 `global_seq` 를 비교하여 최신 시퀀스를 기준으로 업데이트하거나, `updated_at` 을 기준으로 최신 데이터를 우선시합니다.

#### 단계 2: v2 API 구현
*   새로운 엔드포인트 `GET /api/v2/insight-card/{scene_key}/{attempt_num}` 을 구현합니다.
*   이 API 는 `read_grip_result_combined` 테이블을 쿼리하여 데이터를 반환합니다.
*   **SQL 예시:**
    ```sql
    SELECT 
        gr.scene_key,
        gr.attempt_num,
        gr.object_name,
        gr.grip_succeed,
        gr.gripper_type,
        gr.occurred_at,
        gr.grip_2d_pose,
        gr.grip_3d_pose,
        gr.robot_tf,
        gr.human_annotation_grasp,
        mm.image_2d_file_name,
        mm.image_2d_uri,
        mm.video_file_name,
        mm.video_uri
    FROM read_grip_result_combined gr
    JOIN read_multimodal mm ON gr.scene_key = mm.scene_key AND gr.attempt_num = mm.attempt_num
    WHERE gr.scene_key = :scene_key AND gr.attempt_num = :attempt_num;
    ```

#### 단계 3: 클라이언트 호환성 유지 (Backward Compatibility)
*   **v1 API (`/api/v1/...`) 는 변경하지 않습니다.** 기존 클라이언트는 여전히 v1 엔드포인트를 호출하므로, 기존 `read_grip_result` 테이블만 조회하면 됩니다.
*   **v2 API 는 새로 추가됩니다.** 새로운 클라이언트 또는 기존 클라이언트의 새 버전이 v2 엔드포인트를 호출합니다.

#### 단계 4: 컷오버 (Cutover) 절차
1.  **병행 운영:** v1 API 와 v2 API 를 동시에 운영합니다.
    *   v1 요청: `read_grip_result` 조회.
    *   v2 요청: `read_grip_result_combined` 조회.
2.  **데이터 동기화 확인:** `read_grip_result` 와 `read_grip_result_combined` 에 데이터가 정상적으로 반영되는지 모니터링합니다.
3.  **기존 클라이언트 마이그레이션:**
    *   기존 클라이언트 코드에서 API 호출 경로를 `v1` 에서 `v2` 로 변경합니다.
    *   또는, 기존 클라이언트가 v2 응답 형식도 처리할 수 있도록 코드를 수정합니다.
4.  **v1 API 제거:** 모든 클라이언트가 v2 로 마이그레이션된 후, v1 API 엔드포인트와 관련 Read Model (`read_grip_result`) 을 삭제합니다.

### 요약
*   **버전 경로:** `/api/v1/...` (기존), `/api/v2/...` (신규)
*   **핵심:** 새 Read Model (`read_grip_result_combined`) 을 추가하여 데이터를 조인하고 저장하며, 기존 API 는 기존 Read Model 을 계속 사용하도록 유지합니다.
제공된 자료 (로그 및 Read Model 스키마) 에 따르면, 현재 시스템은 `insight.card.request` 와 같은 요청에 대해 `insight.card.miss` 로 즉시 실패 (404) 를 반환하고 있으며, 파지 결과 (`read_grip_result`) 와 미디어 링크 (`read_multimodal`) 가 분리되어 저장되어 있어 한 화면에 함께 보여주는 것이 불가능합니다.

기존 v1 API 클라이언트가 깨지지 않게 하려면 **버전 관리 (Versioning)** 와 **병행 운영 (Parallel Operation)** 전략을 적용해야 합니다. 자료에 명시된 `insight.card.miss` 에 "파지 결과와 해당 시도의 이미지·영상 경로를 한 화면에서 함께 보고 싶다"는 내용이 포함되어 있어, 이 요청을 처리할 수 있는 새로운 엔드포인트가 필요함을 알 수 있습니다.

구체적인 단계는 다음과 같습니다.

### 1. API 버전 경로 설계
기존 API 엔드포인트의 URL 경로에 버전을 명시하여 새 API 를 노출합니다. 기존 클라이언트는 버전을 지정하지 않거나 v1 을 기본으로 호출하므로, 기존 요청은 v1 로 처리되고 새 요청은 v2 로 처리됩니다.

*   **기존 v1 API:** `/api/v1/insight/cards/{card_id}` (또는 현재 구현된 경로)
    *   응답: `insight.card.miss` 또는 기존 필드만 포함된 성공 응답.
*   **신규 v2 API:** `/api/v2/insight/cards/{card_id}`
    *   응답: 파지 결과 (`read_grip_result`) 와 미디어 링크 (`read_multimodal`) 가 결합된 객체.

### 2. Read Model 결합 (Join) 로직 구현
CQRS 의 Write Model 에서 이벤트가 발생하면, 두 개의 별도 Read Model 을 하나의 조회 쿼리로 합치는 로직을 구현해야 합니다.

*   **Join Key:** 두 테이블의 `(scene_key, attempt_num)` 키가 동일해야 합니다.
*   **Postgres 쿼리:**
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
    FROM read_grip_result gr
    JOIN read_multimodal mm
        ON gr.scene_key = mm.scene_key
        AND gr.attempt_num = mm.attempt_num
    WHERE gr.scene_key = :requested_scene_key
        AND gr.attempt_num = :requested_attempt_num;
    ```
    *(참고: `:requested_scene_key` 와 `:requested_attempt_num` 은 클라이언트 요청 파라미터에 해당하며, `read_grip_result` 의 Primary Key 로 직접 필터링 가능)*

### 3. 새 Read Model 생성 또는 뷰 (View) 활용
자료에 `read_grip_result` 와 `read_multimodal` 테이블만 정의되어 있습니다. 새 API 를 지원하기 위해 별도의 테이블을 만들거나, 기존 테이블을 JOIN 하는 뷰를 만들 수 있습니다.

*   **추천 접근법:** 새 테이블 `read_combined_insight_card` 생성.
    *   이유: CQRS 에서 Read Model 은 변경 사항만 적용해야 하므로, 기존 `read_grip_result` 와 `read_multimodal` 을 유지하면서 새 테이블을 추가하는 것이 데이터 무결성 유지에 안전합니다.
    *   스키마: 위 SQL 쿼리의 SELECT 결과를 그대로 적용하여 `(scene_key, attempt_num)` 을 Primary Key 로 설정.

### 4. 이벤트 소싱 (Event Sourcing) 프로세스 수정
새 Read Model (`read_combined_insight_card`) 을 동기화하기 위해, 기존에 `read_grip_result` 와 `read_multimodal` 을 생성하던 이벤트 처리 로직을 확장해야 합니다.

*   **필요한 이벤트:**
    1.  `grip.result` (또는 `projection.event.mapped` 로 파지 결과 생성 시)
    2.  `media.uploaded` (또는 `insert.file.ok` 로 미디어 생성 시)
*   **프로젝터 (Projector) 로직 변경:**
    *   기존: `grip.result` 이벤트 -> `read_grip_result` 업데이트, `media.uploaded` 이벤트 -> `read_multimodal` 업데이트.
    *   변경: `grip.result` 또는 `media.uploaded` 이벤트 발생 시, 두 Read Model 을 모두 참조하여 `read_combined_insight_card` 를 생성/업데이트.
    *   **중요:** 만약 두 이벤트가 동시에 발생하지 않을 경우 (예: 파지는 먼저, 영상 업로드는 나중에), `read_combined_insight_card` 가 불완전한 상태로 남을 수 있습니다. 따라서 **최종 상태 (Completion)** 를 기다렸다가 합치거나, `read_combined_insight_card` 가 `read_grip_result` 와 `read_multimodal` 의 두 테이블을 참조하는 **뷰 (View)** 를 사용하는 것이 더 안전합니다.

### 5. 마이그레이션 및 컷오버 절차

1.  **준비 단계:**
    *   새 테이블 `read_combined_insight_card` 생성.
    *   초기 데이터 동기화: 기존에 존재하는 `read_grip_result` 와 `read_multimodal` 데이터를 JOIN 하여 새 테이블에 초기 데이터 로드 (Bulk Insert).
    *   새 API 엔드포인트 `/api/v2/insight/cards/{card_id}` 구현 (위 SQL 로직 사용).

2.  **병행 운영 단계 (Read-Through):**
    *   v1 API (`/api/v1/...`) 는 기존 로직 (`read_grip_result` 또는 `read_multimodal` 중 하나만 조회) 을 계속 사용.
    *   v2 API (`/api/v2/...`) 는 새 로직 (`read_combined_insight_card` 조회) 을 사용.
    *   프론트엔드 클라이언트 중 일부는 v2 로 변경, 나머지는 v1 로 유지.

3.  **프로젝터 업데이트:**
    *   새 이벤트 처리 로직을 적용하여 `read_combined_insight_card` 가 실시간으로 업데이트되도록 프로젝트 수정.

4.  **컷오버 (Cutover) 단계:**
    *   모든 프론트엔드 클라이언트가 v2 API 로 마이그레이션 완료 확인.
    *   v1 API 엔드포인트를 비활성화 (Deprecation) 또는 삭제.
    *   `read_combined_insight_card` 테이블만 조회하도록 로직을 단순화 (필요시 `read_grip_result` 및 `read_multimodal` 테이블 삭제 또는 비활성화).

### 요약
기존 클라이언트를 깨뜨리지 않으려면 **URL 버전을 분리** (`/v1` vs `/v2`) 하고, **새로운 Read Model 을 추가**하거나 **기존 Read Model 을 JOIN 하는 뷰**를 만들어 v2 API 에서만 결합된 데이터를 반환하도록 합니다. 데이터 동기화에는 **초기 Bulk Load**와 **실시간 이벤트 기반 업데이트**를 병행해야 합니다.
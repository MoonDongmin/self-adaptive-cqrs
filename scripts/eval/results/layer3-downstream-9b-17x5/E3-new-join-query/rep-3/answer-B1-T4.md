제공된 자료 (로그 컨텍트, Read Model 스키마) 에 따르면, 현재 시스템은 `insight.card.request` 로 조회된 데이터가 `insight.card.miss` 로 반환되고 있으며, 이는 파지 결과 (`read_grip_result`) 와 미디어 링크 (`read_multimodal`) 가 결합된 뷰가 존재하지 않음을 의미합니다.

기존 v1 API 클라이언트가 깨지지 않도록 하려면 **버전 관리 전략 (API Versioning)** 과 **데이터 마이그레이션 전략** 을 병행해야 합니다. 자료에 명시된 `stream_id` 규칙 (`grip-attempt:scene_key`) 과 두 테이블의 키 구조 (`scene_key`, `attempt_num`) 가 일치한다는 점이 핵심입니다.

구체적 단계는 다음과 같습니다.

### 1. API 버전 경로 설계 (API Versioning)
기존 클라이언트가 `GET /insights/{id}` 를 호출할 때, 새 엔드포인트를 추가하되 기존 엔드포인트는 유지합니다.

*   **기존 v1 API**: `GET /api/v1/insights/{card_id}` (파지 결과만 반환하거나, 데이터가 없으면 빈 객체 반환)
*   **신규 v2 API**: `GET /api/v2/insights/{card_id}` (파지 결과 + 이미지/영상 URI 를 포함하여 반환)

> **이유**: 자료에 따르면 현재 `insight.card.miss` 가 발생하므로, v1 엔드포인트를 수정하면 기존 클라이언트가 즉시 에러를 마주하게 됩니다. 새 엔드포인트를 추가하여 점진적인 전환을 유도해야 합니다.

### 2. 데이터 모델링 및 스키마 변경 (Schema Change)
기존 `read_grip_result` 와 `read_multimodal` 테이블을 유지하되, 새로운 뷰를 생성하여 두 테이블을 JOIN 합니다.

*   **새 Read Model 생성**: `read_insight_card_combined` 테이블 생성
    *   **용도**: 파지 결과와 미디어 링크를 한 화면에 보여주기 위한 통합 뷰.
    *   **키**: `(scene_key, attempt_num)` (기존 두 테이블의 PK 조합 사용)
    *   **컬럼**:
        *   `scene_key`: `read_grip_result.scene_key`
        *   `attempt_num`: `read_grip_result.attempt_num`
        *   `object_name`: `read_grip_result.object_name`
        *   `grip_succeed`: `read_grip_result.grip_succeed`
        *   `gripper_type`: `read_grip_result.gripper_type`
        *   `occurred_at`: `read_grip_result.occurred_at` (또는 `read_multimodal.occurred_at`, 동일성 확인 필요)
        *   `grip_2d_pose`: `read_grip_result.grip_2d_pose`
        *   `grip_3d_pose`: `read_grip_result.grip_3d_pose`
        *   `robot_tf`: `read_grip_result.robot_tf`
        *   `human_annotation_grasp`: `read_grip_result.human_annotation_grasp`
        *   `image_2d_file_name`: `read_multimodal.image_2d_file_name`
        *   `image_2d_uri`: `read_multimodal.image_2d_uri`
        *   `video_file_name`: `read_multimodal.video_file_name`
        *   `video_uri`: `read_multimodal.video_uri`
    *   **JOIN 조건**: `read_grip_result.scene_key = read_multimodal.scene_key` AND `read_grip_result.attempt_num = read_multimodal.attempt_num`
    *   **Primary Key**: `(scene_key, attempt_num)`

### 3. 이벤트 소싱 및 투영 로직 변경 (Event Projection)
새로운 `read_insight_card_combined` 테이블을 유지하기 위해, 기존에 `read_grip_result` 와 `read_multimodal` 에 이벤트를 투영하는 로직을 확장합니다.

*   **필요한 이벤트**:
    1.  `grip.result` (또는 `grip.result` 관련 이벤트): `read_grip_result` 업데이트
    2.  `media.uploaded` (또는 `media.created`): `read_multimodal` 업데이트
*   **투영 로직 수정**:
    *   기존 `grip-result-projector` 로직은 `read_grip_result` 를 계속 업데이트합니다.
    *   새로운 `insight-card-projector` (또는 기존 projector 로직 확장) 를 추가하여:
        1.  `grip.result` 이벤트가 발생하면, 해당 `scene_key` 와 `attempt_num` 을 기반으로 `read_grip_result` 를 업데이트하고, **동시에** `read_insight_card_combined` 테이블에 해당 레코드를 INSERT/UPDATE 합니다.
        2.  `media.uploaded` 이벤트가 발생하면, 해당 `scene_key` 와 `attempt_num` (파일명 파싱으로 추출) 을 기반으로 `read_multimodal` 을 업데이트하고, **동시에** `read_insight_card_combined` 테이블에 해당 레코드를 INSERT/UPDATE 합니다.
    *   **중요**: 두 이벤트가 모두 도착하지 않은 경우, `read_insight_card_combined` 에는 해당 레코드가 존재하지 않아야 합니다. (기존 `insight.card.miss` 로직과 호환)

### 4. 서비스 로직 변경 (Application Service)
*   **v1 서비스**: 기존 로직 (`read_grip_result` 조회) 을 그대로 유지합니다.
*   **v2 서비스**:
    *   `scene_key` 와 `attempt_num` 을 파라미터로 받습니다.
    *   `read_insight_card_combined` 에서 해당 키로 조회합니다.
    *   조회된 데이터가 없으면 (NULL), `read_grip_result` 만 조회하여 반환합니다. (이 경우에도 `grip_succeed` 등 파지 정보는 제공되므로, 클라이언트가 "데이터 없음"을 처리할 수 있도록 `is_combined: false` 플래그 등을 추가하거나, 빈 객체를 반환하도록 정의해야 합니다. 하지만 질문의 핵심은 "파지 결과와 이미지/영상을 함께 보고 싶다"이므로, **데이터가 모두 있을 때만** v2 응답을 반환하거나, **반응형적으로** v2 응답을 제공하는 것이 좋습니다.)
    *   **추천 로직**:
        1.  `read_insight_card_combined` 에서 `(scene_key, attempt_num)` 으로 조회.
        2.  결과가 있으면: 파지 정보 + 미디어 URI 를 포함한 객체 반환.
        3.  결과가 없으면: `read_grip_result` 만 조회하여 파지 정보만 반환 (v1 호환성 유지).

### 5. 마이그레이션 및 컷오버 절차 (Migration & Cutover)

1.  **준비 단계**:
    *   `read_insight_card_combined` 테이블 생성.
    *   초기 데이터 로드 스크립트 실행: `read_grip_result` 와 `read_multimodal` 테이블을 JOIN 하여 초기 `read_insight_card_combined` 데이터 채우기.
    *   이벤트 투영 로직 배포 (새로운 프로젝터 또는 기존 로직 수정).

2.  **병행 운영 단계 (Parallel Operation)**:
    *   v1 API (`/api/v1/insights`) 는 기존 `read_grip_result` 를 계속 조회합니다.
    *   v2 API (`/api/v2/insights`) 는 `read_insight_card_combined` 을 조회합니다.
    *   프론트엔드 클라이언트 중 일부는 v1 을, 일부는 v2 를 호출합니다.
    *   **주의**: `read_insight_card_combined` 에 데이터가 아직 채워지지 않은 경우, v2 API 가 `null` 또는 빈 객체를 반환해야 합니다. 이 경우 프론트엔드는 "데이터 없음" 처리 로직을 적용해야 합니다.

3.  **컷오버 단계 (Cutover)**:
    *   **조건**: `read_insight_card_combined` 테이블에 모든 필요한 데이터가 투영되어 충분히 채워졌을 때 (또는 특정 시점).
    *   **동작**:
        1.  v1 API 엔드포인트를 `GET /api/v1/insights` 에서 `GET /api/v2/insights` 로 변경 (URL 경로 변경).
        2.  v1 API 로직을 삭제하거나, v2 로직으로 통합합니다.
        3.  초기 데이터 로드 스크립트를 중지하고, 이벤트 투영 로직만 유지합니다.
    *   **회귀 테스트**: v2 API 가 파지 결과와 미디어 링크를 정확히 함께 반환하는지 확인합니다.

### 요약: 기존 v1 API 깨지지 않게 하는 핵심 전략

*   **URL 버전화**: `/api/v1/...` (기존) 와 `/api/v2/...` (신규) 를 분리합니다.
*   **데이터 호환성**: v1 API 는 `read_grip_result` 만 조회하도록 유지합니다. v2 API 는 `read_insight_card_combined` 을 조회하며, 데이터가 없으면 빈 객체 또는 에러를 반환하되, v1 API 는 영향을 받지 않습니다.
*   **점진적 전환**: 클라이언트 측에서 v2 API 를 호출하도록 점진적으로 업데이트하며, v1 API 는 유지하다가 최종적으로 v1 경로를 v2 로 리디렉션하거나 삭제합니다.

```sql
-- 1. 새 Read Model 테이블 생성 (read_insight_card_combined)
CREATE TABLE read_insight_card_combined (
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
    UNIQUE(scene_key, attempt_num)
);

-- 2. 초기 데이터 로드 (기존 테이블 JOIN)
-- 이 쿼리는 초기화 스크립트로 실행됨
INSERT INTO read_insight_card_combined (
    scene_key, attempt_num, object_name, grip_succeed, gripper_type,
    occurred_at, grip_2d_pose, grip_3d_pose, robot_tf, human_annotation_grasp,
    image_2d_file_name, image_2d_uri, video_file_name, video_uri,
    stream_id, global_seq
)
SELECT 
    gr.scene_key, gr.attempt_num, gr.object_name, gr.grip_succeed, gr.gripper_type,
    gr.occurred_at, gr.grip_2d_pose, gr.grip_3d_pose, gr.robot_tf, gr.human_annotation_grasp,
    mm.image_2d_file_name, mm.image_2d_uri, mm.video_file_name, mm.video_uri,
    gr.stream_id, gr.global_seq
FROM read_grip_result gr
JOIN read_multimodal mm ON gr.scene_key = mm.scene_key AND gr.attempt_num = mm.attempt_num;

-- 3. 투영 로직을 위한 뷰 생성 (선택사항, 또는 직접 INSERT 로직 구현)
-- 만약 뷰로 관리할 경우:
CREATE VIEW v_read_insight_card_combined AS
SELECT 
    gr.scene_key, gr.attempt_num, gr.object_name, gr.grip_succeed, gr.gripper_type,
    gr.occurred_at, gr.grip_2d_pose, gr.grip_3d_pose, gr.robot_tf, gr.human_annotation_grasp,
    mm.image_2d_file_name, mm.image_2d_uri, mm.video_file_name, mm.video_uri,
    gr.stream_id, gr.global_seq
FROM read_grip_result gr
LEFT JOIN read_multimodal mm ON gr.scene_key = mm.scene_key AND gr.attempt_num = mm.attempt_num;
```

**주의**: 위 SQL 은 `read_insight_card_combined` 테이블을 생성하고 초기 데이터를 로드하는 스크립트입니다. 실제 운영에서는 `LEFT JOIN` 을 사용하여 `read_grip_result` 가 있고 `read_multimodal` 이 없는 경우에도 파지 정보는 저장되도록 해야 합니다. (위 SQL 은 `JOIN` 이므로 양쪽이 있어야만 저장됩니다. 실제 투영 로직에서는 `LEFT JOIN` 로 구현해야 합니다.)

**수정된 투영 로직 SQL 예시 (이벤트 발생 시 실행)**:

```sql
-- 1. Grip Result 이벤트 발생 시
INSERT INTO read_insight_card_combined (
    scene_key, attempt_num, object_name, grip_succeed, gripper_type,
    occurred_at, grip_2d_pose, grip_3d_pose, robot_tf, human_annotation_grasp,
    image_2d_file_name, image_2d_uri, video_file_name, video_uri,
    stream_id, global_seq
)
SELECT 
    gr.scene_key, gr.attempt_num, gr.object_name, gr.grip_succeed, gr.gripper_type,
    gr.occurred_at, gr.grip_2d_pose, gr.grip_3d_pose, gr.robot_tf, gr.human_annotation_grasp,
    COALESCE(mm.image_2d_file_name, NULL), COALESCE(mm.image_2d_uri, NULL),
    COALESCE(mm.video_file_name, NULL), COALESCE(mm.video_uri, NULL),
    gr.stream_id, gr.global_seq
FROM read_grip_result gr
LEFT JOIN read_multimodal mm ON gr.scene_key = mm.scene_key AND gr.attempt_num = mm.attempt_num
WHERE (gr.scene_key, gr.attempt_num) = (%s, %s); -- 파라미터로 전달된 키

-- 2. Media Upload 이벤트 발생 시 (scene_key, attempt_num 추출)
INSERT INTO read_insight_card_combined (
    scene_key, attempt_num, object_name, grip_succeed, gripper_type,
    occurred_at, grip_2d_pose, grip_3d_pose, robot_tf, human_annotation_grasp,
    image_2d_file_name, image_2d_uri, video_file_name, video_uri,
    stream_id, global_seq
)
SELECT 
    mm.scene_key, mm.attempt_num, NULL, NULL, NULL,
    mm.occurred_at, NULL, NULL, NULL, NULL,
    mm.image_2d_file_name, mm.image_2d_uri, mm.video_file_name, mm.video_uri,
    mm.stream_id, mm.global_seq
FROM read_multimodal mm
WHERE (mm.scene_key, mm.attempt_num) = (%s, %s); -- 파라미터로 전달된 키
```

이러한 방식으로 v1 API 는 기존 `read_grip_result` 를 계속 참조하므로 깨지지 않으며, v2 API 는 새로운 `read_insight_card_combined` 을 참조하여 요청된 기능을 제공합니다.
기존 v1 API 클라이언트가 깨지지 않도록 하려면 **비파괴적 변경 (Non-breaking Change)** 원칙을 따르는 **병행 운영 (Parallel Operation)** 전략을 적용해야 합니다.

주요 단계는 다음과 같습니다:

1.  **새 버전 API 정의 (`/v2`)**:
    *   새 엔드포인트: `POST /projection/insight-card-v2`
    *   기존 엔드포인트는 `POST /projection/insight-card` (v1) 를 유지합니다.
    *   새 엔드포인트는 `read_insight_card_v1` 테이블을 조회하여 통합 뷰 데이터를 반환합니다.

2.  **클라이언트 호환성 유지**:
    *   기존 v1 클라이언트는 `POST /projection/insight-card` 를 계속 호출합니다.
    *   이 요청은 기존 로직 (아직 `read_insight_card_v1` 이 없으므로 `insight.card.miss` 반환) 을 그대로 수행하므로, 기존 클라이언트 동작은 깨지지 않습니다.

3.  **마이그레이션 및 컷오버 절차**:
    *   **Step 1 (준비)**: `read_insight_card_v1` 테이블 생성 DDL 실행 및 `InsightCardProjector` 등록.
    *   **Step 2 (병행)**:
        *   `/projection/insight-card` (v1) 는 기존 로직 유지.
        *   `/projection/insight-card-v2` (v2) 는 새 로직 (`read_insight_card_v1` 조회) 적용.
        *   API Gateway 또는 Load Balancer 에서 요청 경로에 따라 v1/v2 로 라우팅하거나, 클라이언트 측에서 버전을 명시적으로 선택하게 합니다.
    *   **Step 3 (검증)**: v2 엔드포인트가 정상적으로 `read_insight_card_v1` 데이터를 반환하는지 확인.
    *   **Step 4 (컷오버)**: v2 가 안정적으로 검증된 후, 기존 `/projection/insight-card` 엔드포인트를 `/projection/insight-card-v2` 로 리네임하거나, 클라이언트 배포 시 새 버전만 호출하도록 변경.

이 과정에서 `read_grip_result` 와 `read_multimodal` 테이블은 수정되지 않으므로, 해당 테이블을 사용하는 다른 v1 API 들은 완전히 안전합니다.

```sql
-- 이 SQL 은 DDL 이므로 실행 전 인간 승인이 필요합니다.
-- v1 API 를 깨뜨리지 않기 위해 새 버전 (/v2) 을 먼저 배포하고,
-- 검증 후 기존 엔드포인트를 v2 로 교체하거나 병행 운영합니다.

CREATE TABLE read_insight_card_v1 (
    scene_key VARCHAR NOT NULL,
    attempt_num SMALLINT NOT NULL,
    object_name VARCHAR NOT NULL,
    grip_succeed SMALLINT NOT NULL,
    gripper_type VARCHAR(16) NOT NULL,
    occurred_at TIMESTAMPTZ NOT NULL,
    grip_2d_pose JSONB,
    grip_3d_pose JSONB,
    robot_tf JSONB,
    human_annotation_grasp JSONB,
    image_2d_file_name VARCHAR,
    video_file_name VARCHAR,
    stream_id VARCHAR NOT NULL,
    global_seq BIGINT NOT NULL,
    PRIMARY KEY (scene_key, attempt_num)
);
```
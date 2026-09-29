기존 v1 API 클라이언트가 깨지지 않도록 하려면 **비파괴적 변경 (Non-breaking Change)** 원칙을 따르는 **버전 병행 운영 (Versioning)** 전략을 적용해야 합니다.

제공된 자료에 따르면, 기존 `read_grip_result` 테이블은 이미지/영상 경로 필드가 없으며, 새로운 `read_grip_result_v2` 테이블은 해당 필드가 포함되어 있습니다. 따라서 기존 클라이언트가 `read_grip_result`를 호출하는 경우 기존 로직을 유지하고, 새로운 기능을 위해 `read_grip_result_v2`를 호출하는 별도의 엔드포인트를 추가하는 방식이 유일합니다.

구체적 단계는 다음과 같습니다.

### 1. API 엔드포인트 버전 분리 (Parallel Operation)
기존 API 경로와 새 API 경로를 동시에 유지하여 기존 클라이언트와 새 클라이언트 (또는 업데이트된 클라이언트) 가 충돌하지 않도록 합니다.

*   **기존 엔드포인트 (v1):** `POST /grip-result`
    *   **행동:** 기존 `read_grip_result` 테이블을 조회합니다.
    *   **반응 데이터:** `scene_key`, `attempt_num`, `object_name`, `grip_succeed`, `gripper_type`, `occurred_at` 등 기본 필드만 포함합니다. (이미지/영상 경로 없음)
    *   **영향:** 기존 클라이언트는 이 엔드포인트를 계속 호출하므로 **아무런 영향이 없습니다**.

*   **신규 엔드포인트 (v2):** `POST /grip-result-v2`
    *   **행동:** 새로 생성된 `read_grip_result_v2` 테이블을 조회합니다.
    *   **반응 데이터:** v1 엔드포인트의 모든 필드 + `image_2d_file_name`, `video_file_name` 필드가 포함됩니다.
    *   **영향:** 기존 클라이언트는 이 엔드포인트를 호출하지 않으므로 **아무런 영향이 없습니다**.

### 2. 데이터베이스 마이그레이션 절차 (Human-in-the-loop)
DDL 변경 사항 (`read_grip_result_v2` 생성) 을 즉시 실행하지 않고, 인간 승인을 거친 후 단계별로 적용합니다.

1.  **DDL 적용 (Human Approval Required):**
    ```sql
    CREATE TABLE read_grip_result_v2 (
      scene_key varchar NOT NULL,
      attempt_num smallint NOT NULL,
      object_name varchar,
      grip_succeed smallint,
      gripper_type varchar(16),
      occurred_at timestamptz,
      image_2d_file_name varchar,
      video_file_name varchar,
      stream_id varchar,
      global_seq bigint,
      PRIMARY KEY (scene_key, attempt_num)
    );
    ```
    *   기존 `read_grip_result` 테이블은 **삭제되지 않고 그대로 유지**됩니다.

2.  **Insight Read DB 카탈로그 동기화:**
    *   `insight_entity` 및 `insight_field` 테이블에 `read_grip_result_v2` 관련 레코드를 삽입/업데이트합니다. (자료 §2 참조)

3.  **애플리케이션 코드 배포:**
    *   `GripResultV2Projector` 프로젝터 추가.
    *   `ProjectionService` 에 `catchUpGripResultV2` 메서드 추가.
    *   `ProjectionController` 에 `POST /grip-result-v2` 라우트 추가.
    *   `schema/index.ts` 에 `read_grip_result_v2` 스키마 등록.

### 3. 컷오버 (Cutover) 및 전환 전략
기존 v1 클라이언트가 깨지지 않게 하려면 **반드시 기존 엔드포인트를 삭제하지 않고 유지**해야 합니다.

*   **병행 기간:** `POST /grip-result` (v1) 와 `POST /grip-result-v2` (v2) 가 모두 운영됩니다.
*   **클라이언트 호환성:**
    *   기존 클라이언트: `POST /grip-result` 호출 → `read_grip_result` 조회 → v1 응답 구조 반환.
    *   새 클라이언트: `POST /grip-result-v2` 호출 → `read_grip_result_v2` 조회 → v2 응답 구조 반환 (이미지/영상 경로 포함).
*   **롤백 (Rollback) 조건:**
    *   만약 `read_grip_result_v2` 마이그레이션 중 오류가 발생하거나 비즈니스 로직이 깨진다면, `read_grip_result_v2` 테이블만 `DROP` 하고 `GripResultV2Projector` 등을 제거하여 시스템 상태를 v1 로 되돌립니다. 기존 `read_grip_result`와 `/grip-result` 엔드포인트는 그대로 작동하므로 **기존 클라이언트는 항상 정상 작동**합니다.

### 요약
**"기존 엔드포인트 (`/grip-result`) 를 삭제하지 않고 유지하며, 새로운 엔드포인트 (`/grip-result-v2`) 를 추가하는 방식"**으로 진행해야 합니다. 이는 자료의 `constraints` 중 "v1 자산(테이블/엔드포인트/프로젝터 name) 무손상" 조건을 충족하며, 기존 클라이언트의 호환성을 보장합니다.
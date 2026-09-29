제공된 자료에 따르면, 변경 사항 (Read Model DDL 추가, API 컷오버) 은 **인간 승인 후**에만 실행되어야 하며, 현재 권고안은 **Zod 스키마 완화 금지**와 **Read Model 스키마 불변**을 핵심 원칙으로 삼고 있습니다. 따라서 기존 v1 API 클라이언트를 깨뜨리지 않고 변경을 적용하기 위한 절차는 **신구 버전 병행 운영 (Strangler Fig Pattern)**과 **데이터 마이그레이션**을 포함하는 것입니다.

구체적 단계는 다음과 같습니다.

### 1. API 버전 경로 설정 (Versioning Strategy)
기존 v1 API 클라이언트 호환성을 보장하기 위해, 변경된 엔드포인트는 새로운 버전 경로로 노출해야 합니다.
*   **기존 엔드포인트:** `GET /api/v1/read_grip_result` (변경 없음, 기존 클라이언트 계속 사용 가능)
*   **신규 엔드포인트:** `GET /api/v2/read_grip_result` (신규 Read Model 포함, 기존 클라이언트는 무시)
*   **이유:** 자료의 "API 호환성 및 DB 스키마 변경 최소화 요구사항"과 "v1 자산 무손상" 제약 조건을 충족합니다.

### 2. 데이터 마이그레이션 및 격리 (Migration & Containment)
Zod 검증 실패로 인해 `event_store` 에 이벤트가 유입되지 않았으므로, `read_grip_result` 테이블에 해당 데이터가 존재하지 않습니다. 따라서 DDL 변경 시 기존 데이터 구조를 유지하고, 새로운 필드나 행을 추가하는 방식이 필요합니다.

*   **DDL 실행 (Human-in-the-loop 승인 후):**
    *   `read_grip_result` 테이블의 스키마를 변경하지 않고, **새로운 Read Model 테이블** `read_grip_result_v2` 를 생성하거나, 기존 테이블에 **새로운 컬럼**을 추가하는 방식 중 하나를 선택해야 합니다.
    *   하지만 자료의 "PK (scene_key, attempt_num) 유지"와 "식별자 전체 단어" 제약 조건을 고려할 때, **새로운 테이블 생성**이 안전합니다.
    *   **SQL:**
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
            stream_id VARCHAR,
            global_seq BIGINT
        );
        ```
    *   **주의:** 기존 `read_grip_result` 테이블은 그대로 두어 v1 클라이언트가 깨지지 않도록 합니다.

### 3. 마이그레이션 및 컷오버 절차 (Migration & Cutover)
*   **단계 1: 병행 운영 (Parallel Operation)**
    *   v1 API (`/api/v1/...`) 는 기존 `read_grip_result` 테이블을 조회합니다.
    *   v2 API (`/api/v2/...`) 는 새로 생성된 `read_grip_result_v2` 테이블을 조회합니다.
    *   기존 클라이언트는 v1 경로를 계속 호출하므로 정상 작동합니다.

*   **단계 2: 데이터 동기화 (Data Sync)**
    *   `read_grip_result_v2` 테이블에 정상적인 데이터 (Zod 검증 통과된 파일에서 생성된 데이터) 를 삽입합니다.
    *   만약 `read_grip_result` 테이블에 누락된 데이터가 있다면 (예: 과거 데이터), 해당 데이터를 `read_grip_result_v2` 로 마이그레이션합니다.
    *   **SQL (데이터 마이그레이션 예시):**
        ```sql
        INSERT INTO read_grip_result_v2 (scene_key, attempt_num, object_name, grip_succeed, gripper_type, occurred_at, grip_2d_pose, grip_3d_pose, robot_tf, human_annotation_grasp, stream_id, global_seq)
        SELECT scene_key, attempt_num, object_name, grip_succeed, gripper_type, occurred_at, grip_2d_pose, grip_3d_pose, robot_tf, human_annotation_grasp, stream_id, global_seq
        FROM read_grip_result
        WHERE (scene_key, attempt_num) NOT IN (
            SELECT scene_key, attempt_num FROM read_grip_result_v2
        );
        ```
    *   **주의:** 현재 상황에서는 Zod 거절로 인해 해당 파일의 데이터가 `event_store` 에 없으므로, `read_grip_result` 테이블에도 해당 키 (`반려동물용품_CR01_강아지공룡알장난감_02004`, `02005`) 가 존재하지 않을 것입니다. 따라서 마이그레이션 쿼리는 빈 결과를 반환하거나, 다른 정상 데이터만 복사됩니다.

*   **단계 3: 클라이언트 업데이트 및 컷오버 (Client Update & Cutover)**
    *   v2 API 클라이언트를 배포합니다.
    *   v2 API 클라이언트는 `read_grip_result_v2` 테이블을 조회하도록 수정됩니다.
    *   **컷오버:** v1 API 클라이언트가 더 이상 사용되지 않거나, v2 API 클라이언트가 모든 트래픽을 처리할 때, v1 API 엔드포인트를 비활성화하거나, v1 API 를 v2 API 로 리디렉션합니다.
    *   **주의:** "DDL 실행·API 컷오버는 인간 승인 후에만"이라는 제약 조건을 준수해야 합니다.

### 4. 모니터링 및 검증 (Monitoring & Validation)
*   **무유입 검증:** 자료의 "무유입 검증 SQL"을 실행하여, Zod 거절된 파일의 이벤트가 `event_store` 에 유입되지 않았음을 확인합니다.
    ```sql
    SELECT count(*) AS rejected_event_count FROM event_store WHERE (stream_id, attempt_num) IN (('grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02004', 1), ('grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02005', 1));
    ```
*   **결과 확인:** `rejected_event_count` 가 0 이어야 합니다. 이는 Zod 거절로 인해 데이터가 유입되지 않았음을 의미하며, Read Model 에 해당 데이터가 생성되지 않았음을 의미합니다.

### 요약
1.  **API 버전 경로:** `GET /api/v1/read_grip_result` (기존), `GET /api/v2/read_grip_result` (신규).
2.  **신규 Read Model 생성:** `read_grip_result_v2` 테이블 생성 (DDL).
3.  **데이터 마이그레이션:** `read_grip_result` 의 정상 데이터를 `read_grip_result_v2` 로 복사 (필요시).
4.  **컷오버:** v1 API 클라이언트 사용 중단, v2 API 클라이언트 사용 전환.
5.  **검증:** `event_store` 에 해당 이벤트가 유입되지 않았음을 SQL 로 확인.

이 절차는 기존 v1 API 클라이언트를 깨뜨리지 않으면서, 새로운 Read Model 을 안전하게 도입할 수 있습니다.
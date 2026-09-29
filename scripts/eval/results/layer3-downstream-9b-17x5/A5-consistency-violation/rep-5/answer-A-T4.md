기존 v1 API 클라이언트가 깨지지 않게 하려면 **파괴적 변경 (Breaking Change) 을 피하는 버전 관리 전략**을 적용해야 합니다. 제공된 자료에 따르면 `read_grip_result_v2` 테이블과 `/grip-result-v2` 엔드포인트는 신규 버전이며, 기존 `read_grip_result` 테이블과 `/grip-result` 엔드포인트는 무손상 (Unchanged) 으로 유지됩니다.

구체적 단계는 다음과 같습니다:

### 1. 버전 경로 (Versioning Strategy)
*   **기존 API**: `POST /grip-result` (v1)
*   **신규 API**: `POST /grip-result-v2` (v2)
*   **전략**: 신규 기능은 별도의 `/v2` 서브패스 아래에 배치하여 기존 `/grip-result` 호출을 통해 v1 데이터를 계속 반환하도록 합니다.

### 2. 신구 병행 운영 (Parallel Operation)
*   **데이터 모델**: `read_grip_result` (v1) 테이블은 그대로 유지합니다. `read_grip_result_v2` (v2) 테이블을 새로 생성합니다.
*   **프로젝터**: `GripResultProjector` (v1) 는 그대로 실행 중입니다. `GripResultV2Projector` (v2) 를 새로 등록하여 이벤트 소싱을 통해 v2 데이터를 생성합니다.
*   **동기화**: 두 프로젝트는 독립적으로 실행되므로, v1 데이터는 v1 로직에 의해 투영되고, v2 데이터는 v2 로직에 의해 투영됩니다.

### 3. 마이그레이션 및 컷오버 절차 (Migration & Cutover)
*   **단계 1: 신규 테이블 생성 (DDL)**
    `read_grip_result_v2` 테이블을 생성합니다. 이때 기존 `read_grip_result` 테이블은 건드리지 않습니다.
    ```sql
    CREATE TABLE read_grip_result_v2 (
      scene_key varchar NOT NULL,
      attempt_num smallint NOT NULL,
      object_name varchar NOT NULL,
      grip_succeed smallint NOT NULL,
      occurred_at timestamptz NOT NULL,
      robot_tf_translation_z double precision,
      grip_3d_pose_z_max double precision,
      grip_outlier_flag smallint NOT NULL,
      stream_id varchar NOT NULL,
      global_seq bigint NOT NULL,
      PRIMARY KEY (scene_key, attempt_num)
    );
    CREATE INDEX idx_grip_result_v2_outlier ON read_grip_result_v2 (grip_outlier_flag, occurred_at);
    ```

### 4. 컷오버 (Cutover) 절차
*   **단계 1: v2 데이터 채우기 (Backfill)**
    `POST /grip-result-v2` 엔드포인트를 호출하여 과거 이벤트 (Event Store) 를 기반으로 `read_grip_result_v2` 테이블을 채웁니다. 이 과정에서 `GripResultV2Projector` 가 물리적 정합성 (`robot_tf_translation_z`, `grip_3d_pose_z_max`) 을 검증하여 `grip_outlier_flag` 를 계산합니다.
*   **단계 2: 데이터 정합성 검증 (Validation)**
    v1 데이터와 v2 데이터를 비교하여 정합성을 확인합니다.
    *   **조건**: `read_grip_result` (v1) 의 `grip_succeed=1` 인 모든 행에 대해, `read_grip_result_v2` (v2) 에서 같은 `(scene_key, attempt_num)` 키를 가진 행의 `grip_outlier_flag` 가 `0` 이어야 합니다.
    *   **이유**: v1 은 물리적 정합성 검사가 없으므로 모순 데이터 (예: `grip_succeed=1` 이지만 위치가 불가능한 경우) 가 포함될 수 있습니다. v2 는 정합성 검사가 적용되어 같은 데이터라도 `grip_outlier_flag=1` (오류 플래그) 로 저장됩니다. 만약 v1 에는 `grip_succeed=1` 이고 v2 에는 `grip_outlier_flag=1` 이라면, v1 데이터는 신뢰할 수 없으므로 **v1 데이터를 삭제 (Contain)** 하거나 **v1 데이터를 덮어쓰지 않고 v2 만 사용하도록 클라이언트 측에서 로직을 변경**해야 합니다.
    *   **주의**: 자료의 "권고" 섹션에서는 `read_grip_result` 테이블에서 오염 행을 직접 삭제하는 `DELETE` 쿼리를 제안하고 있습니다. 하지만 **API 클라이언트 무손상**을 위해선 DB 레벨의 삭제보다는 **API 응답 로직의 변경**이 안전합니다.
        *   **안전한 접근**: `read_grip_result` 테이블의 오염 행을 삭제하지 않고, `grip_result` API (`/grip-result`) 가 해당 행을 반환하지 않도록 **API 서비스 (`ProjectionService`) 로직을 수정**하여, `grip_succeed=1` 이고 물리적 정합성 위반 (`robot_tf_translation_z` 또는 `grip_3d_pose_z_max` 범위 이탈) 이 있는 행은 필터링하여 반환하지 않도록 합니다.
        *   **대안 (자료 권고에 따름)**: 만약 DB 레벨에서 즉시 정합성을 보장해야 한다면, `read_grip_result` 테이블에서 물리적 정합성 위반 행을 `DELETE` 합니다. 이때는 **API 클라이언트가 깨지지 않으려면**, 클라이언트가 v1 API 를 호출했을 때 해당 행이 반환되지 않도록 API 응답 필터링 로직을 적용해야 합니다. (단, DB 에서 삭제하면 해당 키의 v1 행이 사라지므로, 클라이언트가 해당 키를 기준으로 v1 데이터를 기대한다면 클라이언트 로직 수정이 필수적입니다.)

### 5. 최종 전환 (Switch)
*   **단계 1: v2 데이터 검증 완료 확인**
    모든 과거 이벤트가 v2 로 투영되었고, v1/v2 데이터 정합성이 확인되었습니다.
*   **단계 2: API 컷오버**
    *   `POST /grip-result` 엔드포인트를 `POST /grip-result-v2` 로 변경합니다.
    *   `read_grip_result` 테이블을 `read_grip_result_v2` 로 리네임하거나, v1 API 를 완전히 끕니다.
    *   **주의**: 만약 v1 데이터 중 일부만 삭제 (Contain) 했다면, v1 API 를 완전히 끄기 전에 클라이언트가 v1 API 를 호출했을 때 빈 데이터나 에러를 반환하지 않도록 **API 응답 필터링**을 유지해야 합니다.
    *   **권장**: v1 API (`/grip-result`) 를 **비활성화**하고, 모든 트래픽을 `POST /grip-result-v2` 로 유도합니다.

### 요약: API 클라이언트 무손상 보장 방법
1.  **병행 운영**: `POST /grip-result` (v1) 와 `POST /grip-result-v2` (v2) 를 모두 유지합니다.
2.  **데이터 정합성**: v1 데이터의 물리적 정합성 위반 행을 **DB 에서 삭제**하거나 **API 응답에서 필터링**합니다.
3.  **클라이언트 대응**: 클라이언트는 `POST /grip-result-v2` 엔드포인트를 사용하여 v2 데이터를 조회합니다. v1 엔드포인트는 백업용이나 점진적인 전환용으로 유지됩니다.
4.  **컷오버**: v2 데이터가 완전히 정합성 검증되고, v1 데이터의 문제 행이 모두 처리된 후, `POST /grip-result` 를 `POST /grip-result-v2` 로 변경합니다.

**SQL 코드 (오염 행 격리 - DB 레벨 정합성 보장):**
```sql
DELETE FROM read_grip_result 
WHERE (scene_key, attempt_num) IN (
    ('반려동물용품_CR01_강아지공룡알장난감_02008', 1),
    ('반려동물용품_CR01_강아지공룡알장난감_02009', 1)
);
```

**API 클라이언트 대응 전략:**
*   클라이언트는 즉시 `POST /grip-result-v2` 를 호출하여 `grip_outlier_flag` 가 0 인 데이터만 사용합니다.
*   `POST /grip-result` 호출은 v1 데이터의 정합성 위반 행이 삭제되었으므로, 해당 키에 대한 데이터가 없을 경우 빈 배열 또는 에러를 반환할 수 있으므로, 클라이언트 로직에서 해당 엔드포인트 사용을 중단하거나 에러 처리 로직을 강화해야 합니다.
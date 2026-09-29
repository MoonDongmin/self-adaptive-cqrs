기존 v1 API 클라이언트가 깨지지 않도록 하려면 **비파괴적 마이그레이션 (Non-destructive Migration)** 전략을 따르고, **버전별 엔드포인트 병행 운영**을 통해 점진적으로 전환해야 합니다.

구체적인 단계는 다음과 같습니다:

### 1. 데이터 스키마 확장 (DDL)
`read_grip_result_v2` 테이블을 생성하되, 기존 `read_grip_result` 테이블을 삭제하지 않고 유지합니다.
*   **이유:** 기존 v1 클라이언트가 `read_grip_result` 테이블을 참조하므로, 해당 테이블이 존재해야 쿼리가 실패하지 않습니다.

### 2. 프로젝트 로직 추가 (Projector)
`GripResultV2Projector`를 구현하여 이벤트 소싱 스토어에서 `read_grip_result_v2`로 데이터를 투영합니다.
*   **이유:** v2 Read Model 에 데이터가 채워지도록 합니다.

### 3. API 엔드포인트 확장 (Controller)
`/grip-result-v2` 엔드포인트를 추가하되, 기존 `/grip-result` 엔드포인트를 삭제하지 않고 유지합니다.
*   **이유:** 기존 v1 클라이언트가 `/grip-result`를 호출하므로, 해당 경로가 살아있어야 합니다.

### 4. 마이그레이션 및 컷오버 절차 (Human-in-the-loop)
인간 승인을 받은 후 다음 순서대로 실행합니다:

1.  **v2 데이터 채우기 (Catch-up):**
    *   `POST /grip-result-v2` 엔드포인트를 호출하여, 현재 시점까지 쌓인 이벤트들을 `read_grip_result_v2`로 재투영합니다.
    *   이 과정에서 `GripResultV2Projector`의 `checkIntegrity` 로직이 적용되어, workspace 범위 밖인 데이터 (Sequence 26, 27) 는 `grip_outlier_flag=1`로 플래그가 걸리거나, 더 이상 투영되지 않도록 처리됩니다.

2.  **v1 데이터 정제 (Contain):**
    *   `read_grip_result` 테이블에서 workspace 범위 밖인 오염 행 (Sequence 26, 27) 을 `DELETE` 합니다.
    *   **이유:** v1 클라이언트가 `/grip-result`를 통해 조회할 때, workspace 밖인 이상 데이터를 반환하지 않도록 합니다.

3.  **컷오버 (Cutover):**
    *   **v1 클라이언트:** 기존 `/grip-result` 엔드포인트를 계속 사용합니다. (오염 행이 삭제되었으므로 정상 데이터만 조회됨)
    *   **v2 클라이언트:** 새로 추가된 `/grip-result-v2` 엔드포인트를 사용합니다. (workspace 범위 밖 데이터는 `grip_outlier_flag=1`로 필터링 가능)
    *   **결과:** 두 버전의 클라이언트가 동시에 정상적으로 작동하며, 데이터의 정합성도 보장됩니다.

### 요약: 변경 사항
*   **테이블:** `read_grip_result` (유지) + `read_grip_result_v2` (신규 생성)
*   **엔드포인트:** `/grip-result` (유지) + `/grip-result-v2` (신규 추가)
*   **데이터:** `read_grip_result` 의 오염 행 삭제 후, `read_grip_result_v2` 로 재투영 완료.

이 방식은 기존 v1 API 클라이언트의 호환성을 깨뜨리지 않으면서, v2 의 새로운 정합성 규칙을 적용할 수 있는 유일한 안전한 방법입니다.

```sql
-- 1. v2 스키마 생성 (v1 삭제 X)
CREATE TABLE read_grip_result_v2 (
  scene_key varchar NOT NULL,
  attempt_num smallint NOT NULL,
  object_name varchar NOT NULL,
  grip_succeed smallint NOT NULL,
  occurred_at timestamptz NOT NULL,
  robot_tf_translation_x double precision,
  robot_tf_translation_y double precision,
  grip_outlier_flag smallint NOT NULL,
  stream_id varchar NOT NULL,
  global_seq bigint NOT NULL,
  PRIMARY KEY (scene_key, attempt_num)
);

CREATE INDEX idx_grip_result_v2_outlier ON read_grip_result_v2 (grip_outlier_flag);

-- 2. v1 스키마 유지 (이미 존재하므로 별도 DDL 불필요, 또는 DROP 없이 그대로 둠)
-- DROP TABLE IF EXISTS read_grip_result; -- 절대 실행 금지

-- 3. v1 데이터 정제 (오염 행 삭제)
DELETE FROM read_grip_result 
WHERE (scene_key, attempt_num) IN (('반려동물용품_CR01_강아지공룡알장난감_02020', 1), ('반려동물용품_CR01_강아지공룡알장난감_02021', 1));

-- 4. v2 데이터 재투영 (API 호출 또는 백그라운드 러너)
-- POST /grip-result-v2 호출 시 자동으로 발생
```
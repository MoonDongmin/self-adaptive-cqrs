기존 v1 API 클라이언트가 깨지지 않게 하려면 **비파괴적 마이그레이션 (Non-destructive Migration)** 전략을 따르고, **병행 운영 (Parallel Operation)**을 통해 점진적으로 트래픽을 전환해야 합니다.

구체적인 단계는 다음과 같습니다.

### 1. 데이터 모델 확장 (DDL)
기존 `read_grip_result` 테이블을 삭제하지 않고, 새로운 `read_grip_result_v2` 테이블을 생성합니다.
*   **이유:** `read_grip_result` 테이블은 v1 클라이언트가 의존하므로 삭제 시 즉시 서비스 중단이 발생합니다. 대신 `read_grip_result_v2`를 추가하여 정합성 검증이 강화된 데이터를 저장합니다.

```sql
-- 기존 v1 테이블은 절대 삭제하지 않습니다.
-- 신규 v2 테이블 생성 (필드 추가 및 정합성 플래그 포함)
CREATE TABLE read_grip_result_v2 (
  scene_key varchar NOT NULL,
  attempt_num smallint NOT NULL,
  object_name varchar NOT NULL,
  grip_succeed smallint NOT NULL,
  occurred_at timestamptz NOT NULL,
  robot_tf_translation_z double precision,
  grip_3d_pose_min_z double precision,
  grip_outlier_flag smallint NOT NULL CHECK (grip_outlier_flag IN (0, 1)),
  PRIMARY KEY (scene_key, attempt_num)
);
CREATE INDEX idx_grip_result_v2_time ON read_grip_result_v2 (occurred_at);
```

### 2. 투영 로직 추가 (Projector)
`GripResultV2Projector`를 구현하여 이벤트 소스에서 `read_grip_result_v2`로 데이터를 투영합니다.
*   **이유:** v1 로직 (`GripResultProjector`) 은 그대로 유지하며, v2 로직만 추가합니다.
*   **동작:**
    *   `gripSucceed=1`이고 `min_z < 0.01`인 경우 `grip_outlier_flag`를 `1`로 설정하여 DB 에 저장합니다.
    *   기존 `read_grip_result` 로직은 `grip_3d_pose` (jsonb) 을 그대로 저장하므로 v1 클라이언트 호환성을 유지합니다.

### 3. API 엔드포인트 병행 운영
`/grip-result` (v1) 와 `/grip-result-v2` (v2) 두 엔드포인트를 동시에 노출합니다.
*   **`POST /grip-result`**: 기존 `read_grip_result` 테이블을 조회하여 jsonb 데이터를 반환합니다. (v1 클라이언트용)
*   **`POST /grip-result-v2`**: 새로 추가된 `read_grip_result_v2` 테이블을 조회하여 정규화된 필드와 `grip_outlier_flag`를 반환합니다. (v2 클라이언트용)

### 4. 컷오버 (Cutover) 절차
v1 클라이언트 호환성을 보장하기 위해 **반드시 v1 엔드포인트를 삭제하지 않습니다.**

1.  **v2 엔드포인트 배포:** `/grip-result-v2` 라우트를 추가합니다.
2.  **v1 클라이언트 유지:** 기존 `/grip-result` 엔드포인트는 그대로 두며, 해당 엔드포인트가 정상 작동하도록 `read_grip_result` 테이블에 데이터가 계속 쌓이도록 합니다.
3.  **v2 클라이언트 전환:** v2 클라이언트 개발자가 `/grip-result-v2` 엔드포인트를 사용하도록 변경합니다.
4.  **v1 클라이언트 종료:** v1 클라이언트가 완전히 서비스에서 퇴출되고, 더 이상 `/grip-result` 호출이 없는 것을 확인한 후, 해당 엔드포인트를 삭제합니다.

### 요약
*   **버전 경로:** `/grip-result` (v1 유지), `/grip-result-v2` (신규 추가)
*   **데이터 전략:** `read_grip_result` (기존 jsonb) 과 `read_grip_result_v2` (신규 정규화 + 플래그) 를 **병렬로 유지**.
*   **핵심 원칙:** 기존 v1 자산 (테이블/엔드포인트) 을 무손상 (Unbroken) 으로 유지하며, v2 는 신규로 추가된 후 점진적으로 전환합니다.
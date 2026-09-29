기존 v1 API 클라이언트가 깨지지 않게 하려면 **신구 모델 병행 운영 (Dual Write/Read)**과 **점진적 컷오버 (Phased Cutover)** 전략을 따릅니다. 구체적 단계는 다음과 같습니다.

### 1. 신규 Read Model 생성 및 투영기 배선 (v2 준비)
*   **DDL 실행:** `read_grip_result_v2` 테이블을 생성합니다.
*   **프로젝터 등록:** `GripResultV2Projector`를 Projection Service 에 등록합니다.
*   **라우트 추가:** `/grip-result-v2` 엔드포인트를 추가합니다.
*   **상태:** 이 단계에서는 v1 (`read_grip_result`) 과 v2 (`read_grip_result_v2`) 가 **동시에** 존재하며, 새로운 이벤트는 두 모델 모두에 투영됩니다.

### 2. API 응답 로직 수정 (클라이언트 호환성 유지)
*   **동작:** `/grip-result` 엔드포인트의 응답 로직을 수정하여, **v1 테이블과 v2 테이블을 병합**하여 반환합니다.
*   **이유:** 클라이언트는 여전히 `/grip-result` 를 호출하므로, 기존 키 (`scene_key`, `attempt_num`) 로 v1 데이터를 조회하되, v2 데이터가 있으면 v2 의 `grip_outlier_flag` 등 추가 정보를 포함하거나 우선순위를 정해 반환해야 합니다.
*   **구현 예시 (Pseudo-code):**
    ```typescript
    // 기존 /grip-result 라우트 내부 로직 수정
    async getGripResult(sceneKey: string, attemptNum: number) {
      // 1. v1 데이터 조회 (기존 로직 유지)
      const v1Result = await this.readModelRepository.getGripResult(sceneKey, attemptNum);
      
      // 2. v2 데이터 조회 (신규 로직)
      const v2Result = await this.readModelRepository.getGripResultV2(sceneKey, attemptNum);

      // 3. 병합 및 반환 (클라이언트 호환성 우선)
      // 만약 v2 가 존재하면 v2 의 outlier_flag 로 상태 판단, 아니면 v1 로 판단
      if (v2Result && v2Result.grip_outlier_flag === 1) {
        return { ...v1Result, status: 'OUTLIER', outlierReason: 'physical_consistency_violation' };
      }
      return v1Result;
    }
    ```

### 3. 데이터 마이그레이션 (Backfill)
*   **동작:** 기존에 쌓인 v1 데이터 (`read_grip_result`) 가 v2 규칙 (`grip_outlier_flag`) 을 따르지 않는 경우, 해당 데이터를 v2 테이블로 복사하거나, v1 데이터를 v2 로 변환하여 v2 에 적재합니다.
*   **이유:** 컷오버 시점 이전에 발생한 이벤트는 v2 로 투영되지 않았으므로, v2 쿼리가 빈 결과를 반환하거나 잘못된 결과를 반환할 수 있습니다.
*   **주의:** `read_grip_result_v2` 의 `grip_outlier_flag` 는 v1 데이터의 `robot_tf` 와 `grip_3d_pose` 필드를 기반으로 계산해야 하므로, 원본 이벤트 스토어 (Event Store) 에서 해당 데이터를 조회하여 계산하는 것이 안전합니다.

### 4. 컷오버 (Cutover)
*   **동작:** v1 데이터가 모두 v2 로 마이그레이션되고, v1 데이터가 더 이상 생성되지 않도록 투영기를 중단한 후, `/grip-result` 엔드포인트를 `/grip-result-v2` 로 변경합니다.
*   **조건:** v1 테이블을 DROP 하기 전에, v1 의 모든 `grip_succeed=1` 행이 v2 에서 `grip_outlier_flag=0` (정상) 으로 매핑되는지 **전수 검증**을 수행해야 합니다. (자료의 `constraints` 참조)
*   **결과:** 컷오버 후 `/grip-result` 엔드포인트는 v1 테이블을 참조하지 않고, `/grip-result-v2` 엔드포인트만 사용하게 됩니다.

### 5. v1 자산 정리 (Rollback 시나리오 포함)
*   **동작:** 컷오버가 성공적으로 완료되면, `read_grip_result` 테이블, `GripResultProjector`, `/grip-result` 라우트를 제거합니다.
*   **이유:** 불필요한 유지보수 비용 절감 및 데이터 무결성 보장.
*   **주의:** 만약 컷오버 중 문제가 발생하면 즉시 `read_grip_result_v2` 를 DROP 하고 `/grip-result` 로 라우트를 되돌려 v1 로 회귀해야 합니다.

### 요약
1.  **v2 생성:** `read_grip_result_v2` 생성 및 `/grip-result-v2` 추가.
2.  **병행:** `/grip-result` 로직을 수정하여 v1 과 v2 데이터를 병합하여 반환 (클라이언트 깨지지 않게 함).
3.  **마이그레이션:** 과거 데이터를 v2 로 변환/적재.
4.  **검증:** v1 → v2 매핑 정합성 확인.
5.  **컷오버:** v1 제거 및 `/grip-result` 를 `/grip-result-v2` 로 변경.
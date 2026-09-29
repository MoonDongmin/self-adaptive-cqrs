기존 v1 API 클라이언트가 깨지지 않도록 하려면 **비파괴적 마이그레이션 (Non-breaking Migration)** 전략을 따르고, **병행 운영 (Parallel Operation)**을 통해 점진적으로 새 Read Model 을 도입해야 합니다.

구체적인 단계는 다음과 같습니다.

### 1. DDL 변경: 신규 테이블 추가 (Additive Change)
기존 `read_grip_result` 테이블을 삭제하거나 수정하지 않고, 신규 Read Model 테이블만 추가합니다.
*   **실행 SQL:** `read_object_success_rate_v1` 테이블 생성.
*   **이유:** 기존 v1 API 가 `read_grip_result` 를 참조하므로, 이를 건드리면 즉시 깨집니다. 신규 테이블만 추가하면 기존 API 는 정상 작동하며, 새 API 엔드포인트만 추가됩니다.

### 2. 코드 변경: 신규 컴포넌트 추가 (Additive Change)
기존 서비스 클래스와 컨트롤러의 로직을 수정하지 않고, 새로운 클래스와 핸들러만 정의하여 DI 컨테이너에 등록합니다.
*   **추가 파일/클래스:** `ObjectSuccessRateProjector` 구현.
*   **수정 파일 (`ProjectionService`):** `catchUpObjectSuccessRate` 메서드 추가 (기존 메서드 삭제 X).
*   **수정 파일 (`ProjectionController`):** `POST /object-success-rate` 엔드포인트 추가 (기존 엔드포인트 삭제 X).
*   **이유:** 기존 API 호출 (`/multimodal`, `/grip-result`) 은 여전히 기존 메서드 (`catchUpMultimodal`, `catchUpGripResult`) 를 호출하므로 응답 형식과 경로가 그대로 유지됩니다.

### 3. 데이터 동기화: 초기 캐치업 (Catch-up)
신규 Read Model 에 데이터가 없으므로, 이벤트 스토어에 축적된 이벤트를 새 모델로 투영합니다.
*   **실행:** `catchUpObjectSuccessRate()` 호출.
*   **이유:** `ObjectSuccessRateProjector` 의 `upsert` 로직이 `total_attempts` 와 `success_count` 를 누적하여 `object_name` 키로 저장되도록 설계되어 있으므로, 초기 실행 시 모든 과거 데이터가 새 테이블에 반영됩니다.

### 4. API 컷오버: 새 엔드포인트 사용 (Switch)
클라이언트 측에서 새 엔드포인트를 호출하도록 변경합니다.
*   **전환:** `POST /projection/object-success-rate` 호출.
*   **결과:** 기존 `/projection/grip-result` 는 여전히 장면별 시도별 결과를 반환하므로, 클라이언트가 `/object-success-rate` 를 호출하면 `object_name` 별 집계된 성공률 (시도 수, 성공 수, 성공률) 을 즉시 반환할 수 있게 됩니다.

### 요약: 마이그레이션 절차
1.  **DDL:** `CREATE TABLE read_object_success_rate_v1 ...` 실행.
2.  **코드 배포:** `ObjectSuccessRateProjector`, `ProjectionService` (메서드 추가), `ProjectionController` (라우트 추가) 배포.
3.  **데이터 초기화:** `POST /projection/object-success-rate` 호출하여 초기 데이터 채우기.
4.  **클라이언트 전환:** API 호출 경로를 `/object-success-rate` 로 변경.
5.  **검증:** 새 엔드포인트에서 `object_name` 별 성공률 조회가 정상적으로 이루어지는지 확인.
6.  **옵션 (선택):** 모든 데이터가 새 모델에 안정적으로 반영된 후, 필요시 `read_grip_result` 관련 로직을 제거할 수 있으나, 즉시 삭제하지는 않는 것이 안전합니다.

이 절차는 **v1 자산 무손상**과 **PK 유지** 제약 조건을 모두 만족하며, **TypeScript any 금지**와 **식별자 전체 단어** 규칙도 준수합니다.
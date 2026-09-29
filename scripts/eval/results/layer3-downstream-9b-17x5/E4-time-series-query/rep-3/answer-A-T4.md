기존 v1 API 클라이언트가 깨지지 않도록 하려면 **파괴적 변경 (Breaking Change) 을 피하는 버전 관리 전략**을 적용해야 합니다. 제공된 자료에 따르면 신규 Read Model 은 `read_grip_daily_success_rate` (v2) 로 생성되며, 기존 v1 엔드포인트는 무손상 유지됩니다.

구체적 단계는 다음과 같습니다:

1.  **API 엔드포인트 버전 분리**:
    *   기존 v1 엔드포인트 (`/grip-result`) 는 그대로 유지합니다.
    *   신규 v2 엔드포인트 (`/grip-daily-success-rate`) 를 추가합니다.
    *   클라이언트는 필요에 따라 `/grip-result` (원천 시도 기록 조회) 또는 `/grip-daily-success-rate` (일자별 집계 조회) 중 하나를 호출하게 됩니다.

2.  **신규 Read Model 병행 운영**:
    *   DDL (`CREATE TABLE read_grip_daily_success_rate`) 을 실행하여 신규 테이블을 생성합니다.
    *   기존 `read_grip_result` 테이블은 삭제되지 않고 그대로 유지됩니다.
    *   두 테이블은 서로 다른 키 구조와 용도를 가지므로 충돌이 없습니다.

3.  **프로젝터 (Projector) 병행 등록**:
    *   기존 `GripResultProjector` 와 신규 `GripDailySuccessRateProjector` 를 모두 Projection Service 에 등록합니다.
    *   이벤트가 들어오면 두 프로젝터가 동시에 실행되어 각기 다른 Read Model 을 업데이트합니다.

4.  **컷오버 (Cutover) 절차**:
    *   **테스트**: 신규 v2 엔드포인트와 v2 Read Model 로 조회가 정상 작동하는지 확인합니다.
    *   **전환**: 신규 v2 엔드포인트가 안정적으로 작동함을 확인한 후, 클라이언트 측에서 v1 에서 v2 로 호환성 처리를 하거나, 신규 엔드포인트 사용으로 전환합니다.
    *   **비파괴적 전환**: 기존 v1 엔드포인트와 서비스 로직은 완전히 제거되지 않고, 신규 v2 로 완전히 대체될 때까지 병행 유지합니다.

이 과정을 통해 기존 v1 클라이언트는 기존 엔드포인트를 계속 사용할 수 있고, 신규 기능은 v2 엔드포인트를 통해 제공되므로 호환성이 보장됩니다.
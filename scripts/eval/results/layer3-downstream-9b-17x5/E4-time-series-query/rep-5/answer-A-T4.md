기존 v1 API 클라이언트가 깨지지 않도록 하려면 **비파괴적 변경 (Non-breaking Change)** 원칙을 따르는 **병행 운영 (Parallel Operation)** 전략을 적용해야 합니다.

구체적인 단계는 다음과 같습니다:

1.  **신규 엔드포인트 추가 (Addition)**
    *   기존 `/projection/multimodal`, `/projection/grip-result`, `/projection/insert-all` 엔드포인트는 **변경 없이 그대로 유지**합니다.
    *   신규 Read Model (`read_daily_grip_stats_v2`) 을 지원하기 위해 **새로운 엔드포인트** `POST /projection/daily-grip-stats-v2` 를 추가합니다.
    *   기존 클라이언트는 새 엔드포인트를 호출하지 않으므로, 기존 요청 흐름은 전혀 영향을 받지 않습니다.

2.  **신규 Read Model 생성 (DDL Execution)**
    *   `read_daily_grip_stats_v2` 테이블과 `idx_daily_stats_occurred_date` 인덱스를 생성하는 SQL 을 실행합니다.
    *   기존 `read_grip_result`, `read_multimodal` 테이블은 **변경 없이 유지**됩니다.
    *   기존 클라이언트가 사용하는 테이블은 구조적 무결성을 유지하므로 조회가 정상적으로 작동합니다.

3.  **프로젝터 등록 및 초기화 (Registration & Initialization)**
    *   `DailyGripStatsV2Projector` 를 Projection Service 에 등록합니다.
    *   기존 `GripResultProjector`, `MultiModalProjector` 는 **삭제하거나 수정하지 않고** 계속 실행됩니다.
    *   이벤트 스트림에서 발생하는 `GripAttemptRecorded` 이벤트는 이제 두 개의 프로젝터 (`GripResultProjector` 와 `DailyGripStatsV2Projector`) 에 의해 동시에 처리되어, 두 Read Model (`read_grip_result` 와 `read_daily_grip_stats_v2`) 에 동시에 데이터가 적재됩니다.

4.  **컷오버 (Cutover) 및 전환 (Switching)**
    *   신규 엔드포인트 (`/projection/daily-grip-stats-v2`) 가 정상적으로 작동하고, `read_daily_grip_stats_v2` 테이블에 데이터가 올바르게 적재되는지 검증합니다.
    *   검증이 완료되면, **기존 클라이언트 코드 수정 없이** API 호출을 새 엔드포인트로 변경합니다.
    *   만약 기존 클라이언트가 새 엔드포인트를 자동으로 호출하도록 수정해야 한다면, 해당 클라이언트 코드만 업데이트합니다.

5.  **롤백 계획 (Rollback Plan)**
    *   만약 신규 기능에 문제가 발생하거나 기존 시스템에 악영향을 준다면:
        *   `DROP TABLE public.read_daily_grip_stats_v2;` 및 `DROP INDEX idx_daily_stats_occurred_date;` 를 실행하여 신규 테이블을 제거합니다.
        *   `DailyGripStatsV2Projector` 등록을 제거하고, `catchUpDailyGripStatsV2` 메서드를 제거합니다.
        *   기존 시스템은 `read_grip_result` 와 `read_multimodal` 테이블만 사용하여 정상적으로 돌아갑니다.

이 절차는 **v1 자산 무손상** 원칙을 준수하며, 기존 클라이언트와 완전히 호환되도록 설계되었습니다.
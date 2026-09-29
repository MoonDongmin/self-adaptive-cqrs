기존 v1 API 클라이언트가 깨지지 않도록 하려면 **비파괴적 마이그레이션 (Non-breaking Migration)** 전략을 따르고, **신규 v2 엔드포인트를 병행 운영**해야 합니다.

구체적 단계는 다음과 같습니다:

1.  **DDL 실행 (신규 테이블 생성)**
    *   `read_grip_outlier_v2` 테이블을 생성합니다.
    *   기존 `read_grip_result` 테이블은 삭제하지 않고 그대로 유지합니다.
    *   `insight_entity` 및 `insight_field` 카드도 함께 등록합니다.

2.  **코드 변경 및 배포 (프로젝터 추가)**
    *   `GripOutlierV2Projector` 클래스를 생성하여 `src/projection/projector/` 에 추가합니다.
    *   `ProjectionService` 에 `GripOutlierV2Projector` 를 DI 주입하고, `catchUpOutlierV2` 메서드를 추가합니다.
    *   `ProjectionController` 에 `@Post("/outlier-v2")` 라우트를 추가합니다.
    *   기존 `read_grip_result` 관련 코드 (프로젝터, 서비스, 컨트롤러) 는 수정하지 않습니다.

3.  **컷오버 전 검증 (Human-in-the-loop)**
    *   개발 환경에서 `POST /outlier-v2` 엔드포인트를 호출하여, 제공된 자료의 `seq:26` (z1=-0.05) 과 `seq:27` (xl=2500) 에 대해 `depthNegativeFlag=1` 과 `pixelXlOutOfBoundsFlag=1` 이 반환되는지 확인합니다.
    *   정상 데이터에 대해 플래그가 `null` 또는 `0` 이 반환되는지 확인합니다.
    *   기존 `/grip-result` 엔드포인트가 정상 작동하는지 확인합니다.

4.  **컷오버 (Cutover)**
    *   승인 후 프로덕션 환경에서 DDL (`CREATE TABLE`) 을 실행합니다.
    *   코드 변경사항을 배포합니다.
    *   기존 v1 클라이언트는 `/grip-result` 를 계속 호출하므로 영향이 없습니다.
    *   신규 v2 클라이언트는 `/outlier-v2` 를 호출하여 이상 데이터만 조회합니다.

5.  **Rollback 계획 (필요시)**
    *   만약 문제가 발생하면, `DROP TABLE IF EXISTS read_grip_outlier_v2;` 를 실행하고, 코드에서 `GripOutlierV2Projector` DI 와 `/outlier-v2` 라우트를 제거하여 즉시 이전 상태로 복원합니다.

이 절차는 **v1 자산 무손상**과 **PK 유지** 제약사항을 충족시키며, **인간 승인 후 DDL 실행** 규칙을 따릅니다.
기존 v1 API 클라이언트가 깨지지 않도록 보장하기 위해 **비파괴적 마이그레이션 (Non-breaking Migration)** 전략을 따르되, 요청된 기능은 **v2** 에서만 제공해야 합니다.

구체적인 단계는 다음과 같습니다.

### 1. 버전 경로 분리 (API Versioning)
*   **기존 기능 유지:** 기존 엔드포인트 (`/multimodal`, `/grip-result`, `/insert-all`) 는 **v1** 버전을 그대로 유지합니다.
*   **신규 기능 추가:** 새로운 조회 기능 (파지 실패 상위 목록) 을 지원하기 위해 **v2** 버전을 추가하고, 해당 기능은 **v2** 전용 엔드포인트 (`/grip-object-failures`) 에 배치합니다.
*   **결과:** v1 클라이언트는 `/grip-object-failures` 엔드포인트를 호출하지 않으므로, 해당 엔드포인트의 추가나 삭제로 인해 깨지지 않습니다.

### 2. 신규 Read Model 생성 및 마이그레이션 (Human-in-the-loop)
*   **DDL 실행:** `read_grip_object_failures` 테이블을 생성하는 SQL 을 실행합니다.
    *   *주의:* 이 단계는 **인간 승인**이 필요합니다.
    *   *이유:* 기존 PK (`scene_key`, `attempt_num`) 를 유지해야 하므로, 새로운 테이블은 기존 테이블과 충돌이 없으며, 새로운 PK (`object_name`) 를 도입하는 것이 안전합니다.
*   **Schema 등록:** `insight_entity` 와 `insight_field` 에 `read_grip_object_failures` 관련 정보를 INSERT/UPDATE 합니다.

### 3. 투영 서비스 (Projector) 확장
*   **Projector 추가:** `GripObjectFailuresProjector` 클래스를 구현하여 이벤트 (`GripAttemptRecorded`) 를 `read_grip_object_failures` 테이블로 투영합니다.
*   **Service 확장:** `ProjectionService` 의 `catchUpAll()` 메서드에 `catchUpGripObjectFailures()` 로직을 추가합니다.
*   **Controller 확장:** `ProjectionController` 에 `POST /grip-object-failures` 엔드포인트를 추가합니다.
*   **주의:** 기존 `ProjectionService`, `ProjectionController`, `ProjectionModule` 의 기존 메서드와 라우트는 **변경하지 않고** 새 메서드만 추가합니다.

### 4. 컷오버 (Cutover) 절차
1.  **준비:** v1, v2, v3 (신규) 엔드포인트가 모두 준비됩니다.
2.  **v1 클라이언트 영향 최소화:**
    *   v1 클라이언트는 `/grip-object-failures` 엔드포인트를 호출하지 않으므로, 해당 엔드포인트가 추가되어도 무방합니다.
    *   v1 클라이언트가 호출하는 `/multimodal`, `/grip-result` 엔드포인트는 변경되지 않으므로 정상 작동합니다.
3.  **v2 클라이언트 전환:**
    *   v2 클라이언트가 `/grip-object-failures` 엔드포인트를 호출하게 됩니다.
    *   이 엔드포인트는 새로 추가된 `read_grip_object_failures` 테이블을 조회하여 결과를 반환합니다.
4.  **데이터 동기화:**
    *   기존에 쌓여있던 이벤트 (Event Store) 를 새 `GripObjectFailuresProjector` 로 처리하여 `read_grip_object_failures` 테이블에 초기 데이터를 채웁니다.
    *   이후 발생하는 이벤트는 실시간으로 투영됩니다.

### 5. 롤백 계획 (Rollback Plan)
만약 v2 마이그레이션 중 문제가 발생하면:
1.  **API 레벨:** `POST /grip-object-failures` 엔드포인트를 v2 에서 제거합니다. v2 클라이언트는 해당 엔드포인트를 호출하지 않으므로 (또는 호출해도 404 에러가 나지만, v1 클라이언트는 영향 없음) 서비스는 v1 로 회귀합니다.
2.  **DB 레벨:** `read_grip_object_failures` 테이블을 `DROP` 합니다.
3.  **코드 레벨:** `GripObjectFailuresProjector`, `ProjectionService` 내 관련 로직, `ProjectionController` 내 관련 라우트를 제거합니다.

### 요약
*   **v1:** 기존 엔드포인트만 노출 (변경 없음).
*   **v2:** 기존 엔드포인트 + 신규 `/grip-object-failures` 엔드포인트 노출.
*   **v1 클라이언트:** v1 엔드포인트만 호출하므로 **완전 무손상**.
*   **v2 클라이언트:** 신규 엔드포인트를 통해 요청된 기능을 사용 가능.
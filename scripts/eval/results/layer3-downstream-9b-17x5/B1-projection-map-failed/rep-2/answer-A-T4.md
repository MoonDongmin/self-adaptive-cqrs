제공된 자료에 따르면, 이번 변경은 **Read Model 스키마나 DB 테이블 구조를 변경하지 않으며**, 기존 API 엔드포인트도 유지하는 'Dead-letter Policy'를 적용하는 것입니다. 따라서 v1 API 클라이언트는 데이터 구조 변화 없이 그대로 작동할 수 있습니다.

하지만 **API 컷오버 (Cut-over)** 절차는 반드시 필요합니다. 변경 사항 (격리 로그 생성 및 투영 실패 시 처리 로직 변경) 이 적용되도록 하기 위해, 기존 v1 API 클라이언트가 깨지지 않도록 다음 단계를 수행해야 합니다.

### 1. 버전 경로 전략 (Versioning Strategy)
*   **전략**: **URI Path Versioning** 사용 (`/api/v1/...` 유지, `/api/v2/...` 추가).
*   **이유**: 자료의 "Non-Goals"에 "Read Model 스키마 변경"이 명시되어 있으므로, 스키마 변경 없이 API 응답 구조를 유지해야 합니다. 따라서 기존 `/api/v1` 경로는 그대로 유지하고, 새로운 기능 (필요시) 이나 향후 변경을 위해 `/api/v2` 를 준비하되, 현재는 v1 을 계속 서비스합니다.
*   **구체적 경로**:
    *   기존: `GET /api/v1/read_grip_result` (유지)
    *   신규 (필요시): `GET /api/v2/read_grip_result` (선택 사항, 현재는 비활성화)

### 2. 마이그레이션 및 컷오버 절차 (Migration & Cut-over Steps)

변경 사항이 **백엔드 프로젝트터 로직**과 **격리 로그 생성**에 국한되므로, 데이터베이스 마이그레이션 (DDL) 은 불필요하며, API 컷오버는 **로직 배포 후 즉시 전환**이 가능합니다.

#### 단계 1: 격리 (Containment) 및 검증
*   **행동**: 제공된 자료의 [격리 SQL](https://sql) 을 실행하여 현재 시스템 상태 (미투영 이벤트 수) 를 확인합니다.
*   **목표**: `unprojected_normal_events` 가 0 이 아닌 경우, 아직 정상 이벤트가 미투영 상태이므로 즉시 컷오버를 중단하고 [권고 §1](https://text) 의 **Dead-letter Policy**를 먼저 적용해야 합니다.
    ```sql
    SELECT count(*) AS unprojected_normal_events
    FROM event_store 
    WHERE global_seq > (SELECT last_event_seq FROM projection_cursor WHERE projector_name = 'grip-result-projector')
      AND event_id NOT IN ('949923ab-381a-4bf9-af3e-61583aed52c0');
    ```
*   **판단 기준**: 만약 `unprojected_normal_events > 0` 이라면, 아직 시스템이 안정화되지 않았으므로 컷오버를 연기합니다.

#### 단계 2: 백엔드 로직 배포 (Logic Deployment)
*   **행동**: `grip-result.projector.ts` 파일에 [권고](https://text) 에 명시된 **Dead-letter Policy** 코드를 적용합니다.
    ```typescript
    // 기존 map() 함수 내 또는 별도 핸들러에 추가
    if (payload.objects.length === 0) { 
      throw new SkipProjectionError(`grip-result map: empty objects in event ${event.eventId}`); 
    }
    ```
*   **효과**: 빈 배열 (`objects: []`) 을 가진 이벤트 (Poison Event, ID: `949923ab-381a-4bf9-af3e-61583aed52c0`) 가 `SkipProjectionError` 를 발생시키면, `CatchUpRunner` 가 이를 포착하여 **트랜잭션 롤백**을 방지하고 **격리 로그 (Isolation Log)** 를 생성하며 **커서를 전진**시킵니다.
*   **주의**: 이 단계에서 DDL은 실행하지 않습니다.

#### 단계 3: 격리 데이터 처리 (Data Containment - Optional but Recommended)
*   **행동**: 만약 `unprojected_normal_events` 가 0 이지만, 이미 실패한 이벤트가 DB 에 남아있거나, 격리 로그가 생성된 후에도 해당 이벤트가 Read Model 에 반영되지 않았음을 확인해야 합니다.
*   **조치**: 격리 로그에 기록된 이벤트 ID (`949923ab-381a-4bf9-af3e-61583aed52c0`) 를 기반으로, 해당 이벤트가 `read_grip_result` 테이블에 **영구적으로 저장되지 않도록** 확인합니다.
    *   Dead-letter 정책이 제대로 작동하면, 해당 이벤트는 `read_grip_result` 테이블에 INSERT 되지 않고, `isolation_logs` 테이블 (또는 별도 격리 테이블) 에만 기록됩니다.
    *   만약 이미 `read_grip_result` 에 잘못된 데이터가 남아있다면, 해당 `scene_key` 와 `attempt_num` 을 가진 행을 **DELETE**하거나 **UPDATE**하여 정합성을 복구합니다. (자료의 "결함 데이터 무해화" 참조)
    ```sql
    -- 예시: 해당 시도에만 영향을 미치는 경우 삭제 (정합성 복구)
    DELETE FROM read_grip_result 
    WHERE stream_id = 'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02011';
    ```

#### 단계 4: 컷오버 (Cut-over)
*   **행동**: 위 단계들이 완료되고, `CatchUpRunner` 가 격리된 이벤트를 성공적으로 처리했음을 확인 (격리 로그 확인 또는 재투영 확인) 후, **API 트래픽을 새 로직으로 전환**합니다.
*   **전환 방법**:
    1.  **로직 전환**: 이미 배포된 새 로직이 모든 요청을 처리하므로, API Gateway 설정을 변경하거나, 로드밸런서를 새 인스턴스 그룹으로 라우팅합니다.
    2.  **버전 유지**: 클라이언트는 `/api/v1` 을 계속 호출하므로, 백엔드가 `/api/v1` 요청을 처리할 때 새 로직 (Dead-letter 처리 포함) 을 실행합니다.
*   **결과**: 이제 빈 배열 이벤트가 들어오더라도, v1 API 클라이언트는 정상적인 응답 (또는 4xx 에러 대신 적절한 처리) 을 받으며, 시스템은 Poison Event 를 우회하여 정상 이벤트를 투영합니다.

#### 단계 5: 검증 (Verification)
*   **행동**: 컷오버 후, 빈 배열 이벤트 (`949923ab-381a-4bf9-af3e-61583aed52c0`) 가 `read_grip_result` 테이블에 존재하지 않는지, 그리고 `isolation_logs` 에 기록되었는지 확인합니다.
*   **SQL**:
    ```sql
    SELECT * FROM read_grip_result WHERE stream_id = 'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02011';
    -- 결과: 0 rows (성공)
    SELECT * FROM isolation_logs WHERE event_id = '949923ab-381a-4bf9-af3e-61583aed52c0';
    -- 결과: 1 row (격리됨)
    ```

### 요약
1.  **스키마 변경 없음**: v1 API 클라이언트 호환성 보장.
2.  **로직 변경**: `SkipProjectionError` 로 Poison Event 처리 및 커서 전진.
3.  **DDL 실행 금지**: 인간 승인 후 실행 (현재는 불필요).
4.  **컷오버**: 로직 배포 후 즉시 트래픽 전환 (API 버전 변경 없음).

이 절차에 따라 기존 v1 API 클라이언트는 깨지지 않으며, 시스템은 치명적인 투영 실패를 격리하여 정상 운영을 유지할 수 있습니다.
기존 v1 API 클라이언트가 깨지지 않게 하려면 **파괴적 변경 (Breaking Change) 을 피하는 버전 관리 전략**을 따라야 합니다. 제공된 자료에 따르면 `read_grip_result_v2` 테이블과 `/grip-result-v2` 엔드포인트는 신규 버전이며, 기존 v1 자산은 무손상이어야 합니다.

구체적 단계는 다음과 같습니다:

### 1. 버전 경로 분리 (Versioned Endpoint)
기존 `/grip-result` 엔드포인트는 그대로 유지하고, 신규 로직은 별도의 버전 경로에 노출합니다.
- **v1 경로**: `POST /grip-result` (기존 `read_grip_result` 테이블 조회)
- **v2 경로**: `POST /grip-result-v2` (신규 `read_grip_result_v2` 테이블 조회)

### 2. 신규 Read Model 생성 및 병행 운영
기존 `read_grip_result` 테이블을 삭제하거나 수정하지 않고, 신규 테이블 `read_grip_result_v2` 를 추가하여 병행 운영합니다.
- **DDL**: `read_grip_result_v2` 테이블 생성 (자료 §2 참조).
- **프로젝터**: `GripResultV2Projector` 를 등록하여 이벤트 소싱 시 신규 모델로 투영합니다.
- **API**: `POST /grip-result-v2` 엔드포인트를 추가합니다.

### 3. 클라이언트 호환성 보장 (Backward Compatibility)
v1 API 클라이언트는 `POST /grip-result` 엔드포인트를 계속 호출하므로, 해당 엔드포인트가 정상 작동하도록 기존 `read_grip_result` 테이블과 `GripResultProjector` 를 무손상 상태로 유지합니다.
- **주의**: v1 클라이언트는 물리적 정합성 검사 (robotTfTranslationZ 범위 등) 를 수행하지 않으므로, v1 경로로 조회된 데이터는 모순된 상태 (gripSucceed=1 이지만 물리적으로 불가능한 좌표) 를 그대로 반환할 수 있습니다. 이는 v1 클라이언트의 책임 영역이므로 v1 클라이언트 코드 수정은 필요 없습니다.

### 4. 마이그레이션 및 컷오버 절차 (Human-in-the-loop)
신규 v2 가 안정화되고 v1 의 데이터 정합성 문제가 해결된 후, v1 을 v2 로 전환합니다.

1.  **v2 데이터 검증**: `read_grip_result_v2` 가 생성된 후, `grip_outlier_flag` 가 1 인 행 (물리적 모순 행) 이 있는지 확인합니다.
2.  **격리 (Contain)**: `read_grip_result` 테이블에서 물리적 모순 행 (자료 §1 의 `DELETE FROM` SQL) 을 제거합니다.
3.  **컷오버 전 최종 검증**: v1 경로 (`/grip-result`) 로 조회된 모든 `gripSucceed=1` 행이 v2 경로 (`/grip-result-v2`) 에서 `grip_outlier_flag=0` (정상) 인지를 전수 검증합니다.
    -   만약 v1 의 `gripSucceed=1` 행 중 v2 에서 `grip_outlier_flag=1` 인 행이 있다면, 해당 v1 행은 여전히 물리적 모순이므로 컷오버를 보류합니다.
    -   모든 v1 행이 v2 에서 정상 (`grip_outlier_flag=0`) 으로 매칭되면 컷오버 조건을 충족합니다.
4.  **컷오버**:
    -   `read_grip_result` 테이블을 `read_grip_result_v2` 로 리네임하거나, v1 엔드포인트를 v2 로 변경합니다.
    -   `GripResultProjector` 를 `GripResultV2Projector` 로 교체합니다.
    -   API 엔드포인트를 `/grip-result` 에서 `/grip-result-v2` 로 변경합니다.

### 요약
v1 API 클라이언트를 보호하기 위해 **신규 엔드포인트 (`/grip-result-v2`) 를 먼저 배포**하고, **v1 엔드포인트 (`/grip-result`) 는 기존 로직으로 유지**한 상태에서, v1 데이터의 정합성 문제가 완전히 해결된 후 **단일 버전으로 통합**하는 것이 안전합니다.
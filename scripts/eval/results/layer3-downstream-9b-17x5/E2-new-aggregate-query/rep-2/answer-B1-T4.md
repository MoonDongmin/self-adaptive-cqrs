제공된 자료 (로그 컨텍스트, Read Model 스키마) 에 따르면, 요청하신 "객체별 파지 성공률 (시도 수, 성공 수, 성공률)"을 조회하기 위한 **Read Model 은 현재 존재하지 않습니다**.

*   `read_grip_result` 테이블에는 `object_name` 과 `attempt_num`, `grip_succeed` 필드가 있지만, `object_name` 을 기준으로 집계된 결과 (SUM, COUNT 등) 를 저장하는 컬럼이나 별도 테이블이 정의되어 있지 않습니다.
*   로그 컨텍스트에는 `insight.card.miss` 로그가 포함되어 있어 요청이 실패했음을 시사하지만, 이는 API 응답 내용일 뿐 데이터베이스 내 영구 저장된 집계 데이터가 있음을 의미하지는 않습니다.

따라서 **기존 v1 API 클라이언트가 깨지지 않게 하려면, 새로운 기능 구현 시 기존 API 엔드포인트의 응답 구조를 유지하면서, 새로운 집계 조회 기능을 별도의 엔드포인트로 분리하거나, 기존 엔드포인트의 응답 필드를 확장하는 방식**을 취해야 합니다.

구체적인 단계별 절차는 다음과 같습니다.

### 1. 버전 경로 전략 (Versioning Strategy)
기존 클라이언트 호환성을 보장하기 위해 **URL 기반 버전 관리**를 적용해야 합니다.
*   **기존 API:** `GET /api/v1/insight/card` (또는 해당 리소스 경로)
*   **신규 API:** `GET /api/v2/insight/object-statistics` (또는 `/api/v1/insight/card?include_statistics=true` 방식)
    *   **권장:** `GET /api/v2/insight/object-statistics`
    *   **이유:** 새로운 집계 로직은 기존 `card` 엔드포인트의 응답 스키마 (JSON 구조) 와 충돌할 가능성이 높습니다. 클라이언트 측에서 버전을 명시적으로 관리할 수 있도록 `/v2` 경로를 새로 생성하는 것이 가장 안전합니다.

### 2. 신구 병행 운영 (Parallel Operation)
버전 1과 버전 2 를 동시에 운영하여 점진적인 전환을 수행합니다.
*   **동시 호스팅:** 두 버전의 API 코드를 동일한 도메인 하위 경로 (`/v1`, `/v2`) 에 배포합니다.
*   **데이터 공유:** 두 버전이 동일한 Read Model (`read_grip_result`) 을 공유하므로, 데이터 일관성은 유지됩니다.

### 3. 마이그레이션 및 컷오버 절차

#### 단계 1: 신규 Read Model 생성 및 이벤트 소싱 구현
*   **새 Read Model 정의:** `read_object_grip_stats` 테이블을 생성합니다.
    *   키: `(object_name)`
    *   필드: `total_attempts` (INT), `succeeded_attempts` (INT), `success_rate` (DECIMAL).
*   **프로젝터 (Projector) 구현:**
    *   `read_grip_result` 테이블의 변경 사항 (`INSERT`, `UPDATE`) 을 감지합니다.
    *   `object_name` 을 기준으로 `total_attempts` 와 `succeeded_attempts` 를 실시간으로 집계하여 `read_object_grip_stats` 테이블에 `INSERT` 또는 `UPDATE` 합니다.
    *   **주의:** `read_grip_result` 의 `grip_succeed` (0 또는 1) 를 합산하여 성공률을 계산해야 합니다.

#### 단계 2: 신규 API 구현 (v2)
*   **엔드포인트:** `GET /api/v2/insight/object-statistics`
*   **기능:** `object_name` 파라미터를 받아 `read_object_grip_stats` 테이블에서 해당 객체의 `total_attempts`, `succeeded_attempts`, `success_rate` 를 조회하여 JSON 으로 반환합니다.
*   **기존 API (`/v1`) 유지:** 기존 `/api/v1/insight/card` 엔드포인트는 변경 없이 그대로 유지합니다. 이 엔드포인트는 여전히 `read_grip_result` 를 직접 쿼리하거나, 기존 로직으로 `insight.card.miss` 에러를 반환합니다.

#### 단계 3: 클라이언트 배포 및 테스트
*   **클라이언트 배포:** v2 버전을 사용하는 새로운 클라이언트 버전을 배포합니다.
*   **회귀 테스트:** v1 API 호출을 통해 기존 기능이 정상 작동하는지 확인합니다.
*   **기능 테스트:** v2 API 호출을 통해 새로운 "객체별 파지 성공률" 조회 기능이 정상 작동하는지 확인합니다.

#### 단계 4: 컷오버 (Cutover) 및 v1 은퇴
*   **점진적 트래픽 전환:** 신규 클라이언트 사용률이 일정 비율 (예: 50%) 이상으로 올라가면, v1 API 트래픽을 v2 API 로 라우팅하는 로드밸런서 규칙을 변경합니다.
*   **v1 은퇴:** 모든 트래픽이 v2 로 이동하고, v1 API 가 더 이상 호출되지 않는 기간 (예: 1~2 주) 을 거쳐, v1 API 엔드포인트를 삭제합니다.

### 요약
1.  **Read Model 확장:** `read_object_grip_stats` 테이블 생성 및 이벤트 소싱 로직 추가.
2.  **API 버전화:** `/api/v2/insight/object-statistics` 경로로 새 API 생성.
3.  **병행 운영:** v1 (기존) 과 v2 (신규) 를 동시에 유지.
4.  **컷오버:** 신규 클라이언트 사용률 100% 도달 후 v1 엔드포인트 삭제.

이 절차는 기존 v1 API 클라이언트가 `/v1` 경로를 계속 호출하므로 깨지지 않게 보장하며, 새로운 기능은 `/v2` 경로를 통해 제공되므로 기존 클라이언트에는 영향을 주지 않습니다.
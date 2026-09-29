기존 v1 API 클라이언트가 깨지지 않도록 하려면 **API 버전 관리 (Versioning)** 전략을 통해 신규 엔드포인트를 추가하고, 기존 엔드포인트는 무손상 (Unchanged) 으로 유지해야 합니다. 제공된 자료에 따르면 API 는 `v1` 에서 `v2` 로 마이그레이션되며, 기존 엔드포인트 (`/multimodal`, `/grip-result`, `/insert-all`) 는 수정되지 않고, 신규 엔드포인트 `/object-grip-stats` 가 추가됩니다.

구체적 단계는 다음과 같습니다.

### 1. API 엔드포인트 버전 분리 (Parallel Operation)
기존 클라이언트가 사용하는 경로 (`/multimodal`, `/grip-result`, `/insert-all`) 에 버전 접두사를 붙여 기존 호환성을 유지하고, 신규 기능은 새 버전 경로에 노출합니다.

*   **기존 v1 경로 유지:**
    *   `POST /v1/multimodal`
    *   `POST /v1/grip-result`
    *   `POST /v1/insert-all`
    *   (기존 클라이언트 코드 수정 없이 이 경로로 호출 가능)
*   **신규 v2 경로 추가:**
    *   `POST /v2/object-grip-stats` (신규 집계 조회용)
    *   `POST /v2/multimodal` (기존 기능 v2 호환용)
    *   `POST /v2/grip-result` (기존 기능 v2 호환용)
    *   `POST /v2/insert-all` (기존 기능 v2 호환용)

### 2. 마이그레이션 및 컷오버 절차 (Human-in-the-loop)
자료의 `constraints` 및 `Decision Outcome` 에 따라 변경 사항이 적용되기 전에는 반드시 인간 승인이 필요합니다.

1.  **DDL 적용 (Human Approval Required):**
    *   `read_object_grip_stats` 테이블 생성 SQL 실행.
    *   `insight_entity` 및 `insight_field` 카드 등록 SQL 실행.
    *   *이 단계에서 기존 v1 DB 스키마는 무손상 유지됩니다.*

2.  **코드 배포 (v2):**
    *   `ObjectGripStatsProjector` 생성 및 `ProjectionService` 에 등록.
    *   `ProjectionController` 에 `POST /v2/object-grip-stats` 라우트 추가.
    *   기존 v1 라우트 (`/multimodal`, `/grip-result`, `/insert-all`) 는 코드 수정 없이 그대로 유지됩니다.

3.  **컷오버 (Cutover) 전략:**
    *   **병행 운영:** v1 API 와 v2 API 를 동시에 노출합니다.
    *   **기존 클라이언트 동작:** 기존 클라이언트가 `POST /v1/...` 로 호출하므로, 해당 요청은 v1 로직 (`GripResultProjector` 등) 으로 처리되어 정상 응답을 받습니다.
    *   **신규 클라이언트 동작:** 신규 집계 기능을 필요로 하는 클라이언트는 `POST /v2/object-grip-stats` 로 호출하여 `read_object_grip_stats` 테이블을 통해 결과를 받습니다.
    *   **전환 시점:** v2 로직이 안정적으로 검증되고, 기존 v1 로직이 더 이상 필요 없거나, v1 로직이 v2 로직으로 완전히 대체될 때 (필요시), v1 엔드포인트를 삭제하거나 리디렉션합니다. 하지만 "무손상" 제약 조건 하에서는 v1 을 완전히 삭제하지 않고 병행 유지하는 것이 안전합니다.

### 3. 요약된 실행 계획

| 단계 | 작업 내용 | 기존 v1 클라이언트 영향 |
| :--- | :--- | :--- |
| **1. 승인** | DDL (테이블 생성, 카드 등록) 및 코드 변경 사항 승인 | 없음 |
| **2. 배포** | v2 API 라우트 추가, 신규 프로젝터 연동 배포 | **무영향** (기존 `/v1/...` 경로만 사용) |
| **3. 운영** | v1 및 v2 API 동시 노출 | **무영향** (기존 요청은 v1 로 처리됨) |
| **4. 확장** | 필요시 신규 클라이언트 개발 (`/v2/object-grip-stats` 호출) | **무영향** |

이 방식은 "식별자 전체 단어" (object-grip-stats) 와 "Read Model 테이블명은 read_ 접두" (read_object_grip_stats) 규칙을 준수하면서, 기존 v1 자산의 무손상성을 보장합니다.
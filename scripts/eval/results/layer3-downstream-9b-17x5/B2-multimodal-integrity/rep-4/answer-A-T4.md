제공된 자료에 따르면, 변경 사항의 핵심은 **Read Model 스키마 확장 (DDL)** 이나 **API 엔드포인트 변경** 없이, **프로젝터 (Projector) 로직**을 수정하여 정합성 위반 데이터를 **DB 에 영구 적재하지 않도록 차단**하는 것입니다.

따라서 기존 v1 API 클라이언트는 변경 사항에 영향을 받지 않습니다. 구체적인 단계는 다음과 같습니다.

### 1. 버전 경로 (Versioning Strategy)
*   **전략**: **Backward Compatibility (기존 호환성 유지)**
*   **이유**: 자료의 "Decision Outcome"에 "기존 스키마/API 호환성"이 명시되어 있으며, "API Versioning" 섹션에서 "Read Model 스키마와 projection API 엔드포인트...가 불변"이라고 명시되어 있습니다.
*   **구체적 경로**:
    *   기존 API 엔드포인트: `POST /projection/multimodal` (변경 없음)
    *   기존 Read Model 테이블: `read_multimodal` (DDL 변경 없음)
    *   변경 사항: 서버 측 `MultiModalProjector.map()` 메서드 내부 로직만 강화 (정합성 체크 후 에러 발생 시 `upsert` 차단).

### 2. 신구 병행 운영 (Parallel Operation)
*   **필요성**: **불필요**
*   **이유**:
    *   **스키마 변경 없음**: `read_multimodal` 테이블 구조 (DDL) 를 변경하지 않으므로, 기존 API 가 조회하는 컬럼과 키 (PK) 가 그대로 유지됩니다.
    *   **API 응답 형식 변경 없음**: 클라이언트가 기대하는 JSON 구조는 변하지 않습니다.
    *   **데이터 차이**: 기존 로직은 위배 데이터를 DB 에 저장했으나, 새 로직은 저장하지 않습니다. 이는 데이터 양의 감소일 뿐, API 응답의 스키마나 필드 타입을 바꾸는 것이 아니므로 병행 운영이 필요 없습니다.
*   **실행 방법**:
    *   새 버전의 프로젝터 (예: `multimodal-projector-v2`) 를 배포합니다.
    *   새 프로젝터는 기존 프로젝터와 동일한 스트림 (`grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02026` 등) 을 구독합니다.
    *   새 프로젝터는 `checkIntegrity()` 로직을 적용하여 위배 데이터를 필터링하고, `upsert` 를 수행하지 않습니다.
    *   기존 프로젝터는 그대로 유지되어 (또는 새 로직으로 업데이트되어) 정상 데이터만 처리합니다.
    *   결과적으로 `read_multimodal` 테이블은 새 로직이 적용된 후부터는 위배 데이터가 추가되지 않고, 기존에 쌓인 위배 데이터만 남게 됩니다.

### 3. 마이그레이션 및 컷오버 절차 (Migration & Cutover)
*   **DDL 실행**: **무시**
    *   자료의 "격리 (containment) SQL" 섹션에서 "신규 Read Model DDL 불필요, 결함 데이터 무해화가 조치다"라고 명시되어 있습니다. DDL 변경은 수행하지 않습니다.
*   **데이터 정제 (Data Remediation)**: **필수 (Human-in-the-loop)**
    *   이미 DB 에 적재된 위배 데이터 (`projection.integrity.violation` 로 감지된 데이터) 는 API 응답에 포함될 수 있는 결함 데이터입니다.
    *   **절차**:
        1.  **인간 승인**: DB 관리자가 위배 데이터를 확인합니다.
        2.  **삭제 SQL 실행**: 위배된 행만 선택적으로 삭제합니다. (자료의 "격리 SQL" 패턴을 활용)
        3.  **확인**: `read_multimodal` 테이블에서 위배 조건 (예: `image_2d_file_name` 의 attempt 인덱스, `video_file_name` 의 scene 인덱스) 을 추출하여 PK (`scene_key`, `attempt_num`) 와 비교 검증합니다.
        4.  **수정**: 검증된 후 해당 행을 삭제하거나, 원본 이벤트 (Event Store) 를 수정하여 재투영 (Replay) 을 유도합니다. (자료의 "Non-Goals"에 "payload coercion"이 있으므로, 원본 수정 후 재투영이 가장 안전합니다.)
*   **컷오버 (Cutover)**: **로그 레벨 전환 및 모니터링**
    *   새 프로젝터 배포 후, `projection.integrity.violation` 로그가 더 이상 발생하지 않는지 확인합니다.
    *   기존 프로젝터가 새 로직으로 업데이트되면, 새로운 이벤트가 들어올 때부터 위배 데이터가 차단됩니다.
    *   API 클라이언트는 변경 사항 없이 계속 작동하며, DB 에 남은 위배 데이터만 조회할 수 있습니다.

### 요약: v1 API 클라이언트 보호를 위한 구체적 단계

1.  **배포 전**: `MultiModalProjector` 소스 코드 수정 (`map()` 내 `checkIntegrity()` 호출 후 `throw` 또는 `return null` 로 `upsert` 차단).
2.  **배포**: 새 프로젝터 이미지 배포 (기존 DB 스키마 변경 없음).
3.  **인간 승인**: DB 에 이미 존재하는 위배 데이터 (`read_multimodal` 테이블 내 특정 PK 조합) 를 확인.
4.  **정제 (Human-in-the-loop)**: 승인 후, 위배된 행만 `DELETE FROM read_multimodal WHERE ...` SQL 을 실행하여 DB 를 정화.
5.  **재투영 유도 (선택 사항)**: 원본 이벤트 스토어에 있는 해당 이벤트를 수정하거나, 새 프로젝터가 해당 이벤트를 다시 처리하도록 커서를 조정하여, 정화된 상태의 DB 에 올바른 데이터가 채워지도록 함.
6.  **확인**: API 엔드포인트 (`POST /projection/multimodal`) 를 호출하여 응답 스키마가 깨지지 않았는지, 그리고 위배 데이터가 제거되었는지 확인.

이 절차는 **DDL 실행**, **API 스키마 변경**, **TypeScript any 사용**을 피하며, **PK 유지**와 **v1 자산 무손상**을 보장합니다.
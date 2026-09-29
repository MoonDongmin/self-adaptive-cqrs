기존 v1 API 클라이언트가 깨지지 않도록 하려면 **파괴적 변경 (Breaking Change) 을 피하는 버전 관리 전략**을 적용해야 합니다. 제공된 자료에 따르면, 기존 v1 엔드포인트 (`/multimodal`, `/grip-result`) 는 무손상 유지되되, 새로운 기능은 **v2**로 별도 버전으로 노출되어야 합니다.

구체적 단계는 다음과 같습니다:

### 1. API 버전 경로 분리 (Versioned Routes)
기존 엔드포인트는 변경하지 않고, 새로운 `read_grip_media_join` 을 위한 엔드포인트는 **새로운 버전 경로**에 추가합니다.
- **기존 v1 경로 유지**: `POST /multimodal`, `POST /grip-result`, `POST /insert-all` (자료의 `affectedEndpoints` 참조)
- **신규 v2 경로 추가**: `POST /v2/grip-media-join` 또는 `POST /projection/grip-media-join` (자료의 `Added` 섹션 참조)
  - *권장*: `POST /v2/grip-media-join` 을 사용하여 API 버전과 명확히 구분하거나, `POST /projection/grip-media-join` 을 추가하되 클라이언트 측에서 버전 헤더 (`Accept-Version: v2`) 를 통해 라우팅을 제어하도록 설계합니다.
  - 자료의 `Decision Outcome` 에 따르면 "신규 v2 라우트만 추가하여 기존 클라이언트 호출 경로 영향 없음"이 목표이므로, **새로운 URL 경로**를 생성하는 것이 가장 안전합니다.

### 2. 신규 Read Model 및 프로젝트어 추가 (Non-Breaking Changes)
데이터베이스와 백엔드 코드에는 새로운 컴포넌트를 추가하되, 기존 컴포넌트를 건드리지 않습니다.
- **DDL 추가**: `read_grip_media_join` 테이블 생성 SQL 실행 (기존 `read_grip_result`, `read_multimodal` 테이블 삭제 없음).
- **프로젝터 추가**: `GripMediaJoinProjector` 클래스 구현 및 DI 등록.
- **엔드포인트 추가**: `POST /projection/grip-media-join` 라우트 추가 (기존 `/multimodal`, `/grip-result` 등 삭제/수정 없음).

### 3. 마이그레이션 및 컷오버 절차 (Human-in-the-loop)
인간 승인이 완료된 후 다음 순서대로 변경을 적용합니다.

1.  **DDL 적용**: `read_grip_media_join` 테이블 생성 SQL 실행.
2.  **Insight 카드 등록**: `insight_entity` 및 `insight_field` 테이블에 `read_grip_media_join` 관련 레코드 INSERT (ON CONFLICT DO UPDATE).
3.  **백엔드 코드 배포**:
    - `src/projection/projection.service.ts`: `catchUpGripMediaJoin` 메서드 추가, `GripMediaJoinProjector` 주입.
    - `src/projection/projection.controller.ts`: `@Post("/grip-media-join")` 핸들러 추가.
    - `src/shared/database/schema/index.ts`: `read_grip_media_join` 스키마 export 추가.
4.  **Catch-up 실행**: 신규 프로젝트어 (`GripMediaJoinProjector`) 가 과거 이벤트를 처리하여 `read_grip_media_join` 테이블에 데이터를 채우는 과정 (`catchUpGripMediaJoin`) 을 실행.
5.  **기능 검증**: 신규 엔드포인트 (`/projection/grip-media-join`) 를 호출하여 `gripMediaJoin` 결과가 반환되는지 확인.

### 4. 클라이언트 마이그레이션 가이드 (선택 사항)
- **v1 클라이언트**: 기존 코드 (`/multimodal`, `/grip-result`) 를 그대로 사용하므로 **아무런 변경 없이 정상 작동**합니다.
- **v2 클라이언트**: 새로운 엔드포인트 (`/projection/grip-media-join`) 를 호출하여 파지 결과와 미디어 경로를 한 번에 조회합니다.

이 방식은 "v1 자산 무손상" 제약 조건을 충족시키며, 기존 클라이언트와의 호환성을 완벽하게 보장합니다.
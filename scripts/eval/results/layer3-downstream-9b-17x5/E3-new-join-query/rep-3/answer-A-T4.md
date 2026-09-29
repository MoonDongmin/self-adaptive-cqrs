기존 v1 API 클라이언트가 깨지지 않도록 하려면 **비파괴적 마이그레이션 (Non-destructive Migration)** 전략을 따르고, **버전 관리 (API Versioning)** 를 통해 신구 API 를 병행 운영해야 합니다.

제공된 자료에 근거한 구체적 단계는 다음과 같습니다.

### 1. 데이터베이스 스키마 변경 (DDL)
신규 Read Model `read_grip_with_media` 테이블을 생성하되, 기존 `read_grip_result` 와 `read_multimodal` 테이블을 **절대 삭제하지 않습니다**.
- `read_grip_with_media` 테이블은 `scene_key`, `attempt_num` 을 Primary Key 로 가지며, 기존 두 테이블의 데이터를 결합한 뷰 역할을 합니다.
- `read_grip_result` 와 `read_multimodal` 테이블은 그대로 유지됩니다.

### 2. 코드 변경 (Additive Changes)
기존 코드를 수정하거나 삭제하지 않고, 새로운 컴포넌트만 추가합니다.
- **Projector**: `GripWithMediaProjector` 클래스를 새로 생성하여 `src/projection/projector/` 에 추가합니다.
- **Schema**: `read_grip_with_media` 스키마를 `src/shared/database/schema/` 에 추가하고, `index.ts` 에 export 합니다.
- **Service**: `ProjectionService` 에 `catchUpGripWithMedia()` 메서드를 추가합니다. 기존 `catchUpGripResult` 와 `catchUpMultimodal` 은 유지합니다.
- **Controller**: `ProjectionController` 에 `@Post("/grip-with-media")` 라우트를 추가합니다. 기존 `/grip-result` 와 `/multimodal` 라우트는 유지합니다.

### 3. API 컷오버 절차 (Human-in-the-loop)
사용자 요청 (단일 화면 조회) 을 지원하기 위해 `read_grip_with_media` 테이블이 충분히 채워져야 합니다.
1. **Pre-check**: `read_grip_with_media` 테이블에 데이터가 있는지 확인합니다.
2. **Human Approval**: 변경 사항 (DDL 및 API 추가) 을 승인받습니다.
3. **Execution**: 승인 후 `catchUpGripWithMedia()` 를 실행하여 이벤트 스트림을 처리하고 테이블을 채웁니다.
4. **Validation**: `POST /projection/grip-with-media` 엔드포인트를 호출하여 신규 API 가 정상 작동하는지, 그리고 `read_grip_with_media` 테이블에 데이터가 적재되었는지 확인합니다.

### 4. 클라이언트 호환성 보장
- **v1 API 유지**: 기존 `/grip-result` 와 `/multimodal` 엔드포인트는 그대로 작동하므로, v1 클라이언트는 변경 없이 계속 사용 가능합니다.
- **v2 API 추가**: 신규 `/grip-with-media` 엔드포인트가 추가되므로, v2 클라이언트 (또는 업데이트된 v1 클라이언트) 가 이 새로운 엔드포인트를 호출할 수 있게 됩니다.

### 요약
**"기존 API 를 삭제하지 않고, 새로운 `/grip-with-media` 엔드포인트와 `read_grip_with_media` 테이블을 추가하는 방식"** 으로 진행하면, 기존 v1 클라이언트는 무사히 작동하며, 새로운 기능은 v2 클라이언트 (또는 업데이트된 v1) 가 사용할 수 있게 됩니다.
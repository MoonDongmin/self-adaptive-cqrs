제공된 자료에 따르면, 이번 변경은 **Read Model 스키마 (DDL) 에 대한 변경이 전혀 없음**을 명시하고 있습니다.

1.  **권고 (Recommendation) 의 결론**: "Dead-letter 처리 (프로젝터의 map() 예외 전환)"로 결정되었습니다. 이는 `GripResultProjector` 코드 내의 로직 (`if (payload.objects.length === 0) ... throw` 을 `return null` 로 변경) 을 수정하는 것이며, 데이터베이스 스키마나 API 계약은 유지합니다.
2.  **API Versioning 섹션**: "변 변경 없음. Only projector's error handling policy changes; read_grip_result schema and API contracts remain identical."라고 명시되어 있습니다.
3.  **Read Model 생성 SQL 섹션**: "격리(containment) SQL — 신규 Read Model DDL 불필요, 결함 데이터 무해화가 조치다"라고 명시되어 있습니다.

따라서, 기존 v1 API 클라이언트가 깨지지 않게 하려면 **별도의 마이그레이션 절차나 버전 경로 변경은 필요 없습니다**. 기존 API 엔드포인트와 스키마를 그대로 유지하며, 백엔드 프로젝트의 코드 수정 (프로젝터 로직 변경) 만 수행하면 됩니다.

구체적 단계는 다음과 같습니다:

1.  **코드 수정 (백엔드)**: `src/projection/projector/grip-result.projector.ts` 파일의 `map()` 메서드를 수정합니다. 빈 `objects` 배열 감지 시 예외를 던지는 로직을 `return null` (또는 해당 이벤트 스킵 처리) 로 변경하여, 치명적 에러를 방지하고 해당 이벤트를 Dead-letter 큐로 이동하도록 합니다.
2.  **테스트**: 수정된 프로젝터 로직이 빈 `objects` 를 가진 이벤트 (예: `dbb75288-2d78-4771-9cde-45c52ee7d8fd`) 를 성공적으로 스킵하거나 Dead-letter 처리하며, 정상 이벤트는 `read_grip_result` 및 `read_multimodal` 테이블에 정상적으로 투영되는지 확인합니다.
3.  **인간 승인 (Human-in-the-loop)**: 변경 사항 (프로젝터 코드 수정) 을 승인합니다. (DDL 실행은 불필요하므로 이 단계에서 DDL 승인 요청은 생략됩니다.)
4.  **배포**: 수정된 프로젝터 코드를 배포합니다.
5.  **재투영 (Catch-up)**: `CatchUpRunner` 를 재시작하거나 수동으로 재실행하여, 이전 실패로 인해 미투영 상태였던 정상 이벤트들을 다시 처리합니다.
6.  **검증**: `read_grip_result` 및 `read_multimodal` 테이블에 정상 이벤트가 투영되었는지, 그리고 결함 이벤트 (`dbb75288...`) 가 해당 테이블에 기록되지 않았는지 (또는 Dead-letter 로그로만 남았는지) 확인합니다.

**요약**: API 버전 변경 없음, 스키마 변경 없음. 코드 로직 수정 후 재투영만 수행하면 기존 v1 API 클라이언트 호환성을 유지할 수 있습니다.
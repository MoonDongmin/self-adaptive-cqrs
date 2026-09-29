제공된 자료에 따르면, 변경 사항 (권고 사항) 은 **프로젝터 로직 수정 (Dead-letter skip 정책 적용)**이며, **Read Model 스키마 변경이나 새로운 테이블 생성은 포함되지 않습니다**.

따라서 기존 v1 API 클라이언트가 깨지지 않도록 하려면 **API 버전 변경 (Versioning) 이나 마이그레이션 절차는 전혀 필요 없습니다**. 자료의 'API Versioning' 섹션에서도 "read_grip_result 스키마와 엔드포인트 서명이 동일하게 유지됨"이라고 명시되어 있습니다.

구체적 단계는 다음과 같습니다:

1.  **프로젝터 코드 수정**: `src/projection/projector/grip-result.projector.ts` 파일의 `map()` 메소드를 수정하여, `payload.objects` 배열이 비어 있는 경우 (`length === 0`) `throw new Error("DEAD_LETTER_SKIP")`를 반환하도록 변경합니다.
2.  **프로젝션 런너 수정**: `ProjectionService` 또는 `Runner`의 catch 블록을 수정하여, `"DEAD_LETTER_SKIP"` 에러가 발생하면 로그를 남기고 해당 이벤트를 스킵 (skip) 처리하도록 합니다.
3.  **재실행 (Catch-up)**: 수정된 프로젝터로 배치 재실행을 수행하여, 결함 이벤트 (poison pill) 를 스킵하고 나머지 정상 이벤트를 투영합니다.
4.  **검증**: 재실행 후 `read_grip_result` 테이블에 결함 이벤트에 해당하는 레코드가 생성되지 않았는지, 그리고 결함 이벤트 이후의 정상 이벤트들이 모두 투영되었는지 확인합니다.

**결론**: API 버전 경로 변경, 신구 API 병행 운영, 마이그레이션 스크립트 실행, API 컷오버 절차는 **필요하지 않습니다**.
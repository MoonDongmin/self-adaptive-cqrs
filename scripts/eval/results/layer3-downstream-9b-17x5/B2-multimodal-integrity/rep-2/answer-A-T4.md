제공된 자료에 따르면, Read Model 스키마 (`read_multimodal`) 와 API 엔드포인트는 변경되지 않으며, 변경 사항은 **원천 데이터 정합성 검사 로직 조정**과 **오염된 데이터의 격리 (DELETE)** 에 국한됩니다. 따라서 v1 API 클라이언트는 스키마 변경 없이 그대로 작동할 수 있습니다.

하지만 **DB 격리 (DELETE)** 작업은 `stream_id` 와 `attempt_num` 을 기반으로 특정 행을 삭제하므로, 해당 시퀀스 ID 를 사용하는 클라이언트 측 캐시나 상태 관리에 영향을 줄 수 있습니다. 이를 방지하기 위해 **버전 경로 (Versioning)** 와 **신구 병행 운영** 전략을 적용해야 합니다.

### 1. 버전 경로 전략 (API Versioning Strategy)

v1 API 클라이언트가 깨지지 않도록, 변경 사항이 적용되는 새 API 버전을 생성하고, 기존 v1 을 유지하는 것이 안전합니다.

*   **기존 API**: `GET /read_multimodal` (v1)
    *   **행동**: 기존 스키마를 그대로 반환합니다.
    *   **주의**: DB 에서 오염 데이터를 삭제하는 작업이 진행되면, v1 엔드포인트의 응답 데이터가 즉시 갱신됩니다. 클라이언트는 최신 데이터를 받지만, 로컬 캐시된 오래된 데이터와 충돌할 수 있습니다.
*   **신규 API**: `GET /read_multimodal/v2`
    *   **행동**: 동일한 스키마 (`scene_key`, `attempt_num`, `image_2d_file_name` 등) 를 반환하지만, **정합성 검사 로직이 강화된** 데이터만 반환합니다.
    *   **이점**: v1 클라이언트는 v1 엔드포인트를 계속 호출하므로 영향이 없습니다. v2 클라이언트는 즉시 정합성이 보장된 데이터를 받을 수 있습니다.

### 2. 마이그레이션 및 컷오버 절차 (Migration & Cutover Steps)

자료의 가이드라인 ("DDL 실행·API 컷오버는 인간 승인 후에만") 에 따라, DDL 변경은 없으므로 스키마 변경 없이 로직과 데이터만 수정하는 절차입니다.

#### 단계 1: 로직 수정 (Development)
`src/projection/projector/multimodal.projector.ts` 의 `checkIntegrity` 메소드를 수정합니다.
*   파일명 파싱 (`parseModalFileName`) 후, 파싱된 `attemptNum` 과 이벤트의 `attempt_num` 을 비교합니다. 불일치 시 에러를 즉시 던집니다.
*   파싱된 `sceneNum` 과 이벤트의 `scene_key` 에서 추출된 숫자를 비교합니다. 불일치 시 에러를 즉시 던집니다.
*   에러 발생 시 `CatchUpRunner` 가 배치 트랜잭션을 롤백하도록 처리합니다.

#### 단계 2: 격리 SQL 실행 (Human-in-the-loop Approval Required)
로직 수정 후, 이미 DB 에 존재하는 오염된 데이터를 즉시 제거합니다. 이 SQL 은 **DDL 이 아님**이므로 자동 실행 가능하나, 가이드라인상 인간 승인이 필요하므로 승인 후 실행합니다.

```sql
DELETE FROM read_multimodal 
WHERE (stream_id = 'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02026' AND attempt_num = 1) 
   OR (stream_id = 'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02027' AND attempt_num = 1);
```

#### 단계 3: API 배포 및 병행 운영 (Parallel Operation)
*   **v1 API**: 기존 코드 그대로 배포. 스키마 변경 없음.
*   **v2 API**: 수정된 로직 (강화된 정합성 검사) 을 포함하는 새 프로젝트를 배포.
*   **로드 밸런서/라우터 설정**:
    *   `GET /read_multimodal` -> v1 로직 (기존 데이터 포함, 정합성 검사 없음 또는 기존 로직)
    *   `GET /read_multimodal/v2` -> v2 로직 (강화된 정합성 검사, 최신 데이터만 반환)

#### 단계 4: 클라이언트 마이그레이션 (Client Migration)
*   클라이언트 측에서 `GET /read_multimodal` 을 `GET /read_multimodal/v2` 로 서드파티 호출 경로를 변경합니다.
*   v2 엔드포인트는 정합성이 보장되므로, 클라이언트 로직은 동일하게 유지할 수 있습니다.

#### 단계 5: v1 은퇴 (Deprecation)
*   v2 가 안정적으로 운영되고, v1 의 정합성 위반이 더 이상 발생하지 않음을 확인한 후, v1 API 를 `Deprecation` 상태로 변경합니다.
*   일정 기간 후 v1 엔드포인트를 제거합니다.

### 요약: v1 API 클라이언트 보호를 위한 핵심 조치

1.  **스키마 변경 금지**: `read_multimodal` 테이블 구조 (컬럼명, 타입, PK) 는 절대 변경하지 않습니다.
2.  **새 버전 경로 제공**: `GET /read_multimodal/v2` 를 추가하여, 강화된 정합성 검사를 적용합니다.
3.  **기존 경로 유지**: `GET /read_multimodal` 은 기존 로직을 유지하여, v1 클라이언트가 즉시 중단되지 않도록 합니다.
4.  **데이터 격리**: 위 SQL 을 통해 이미 오염된 행만 삭제합니다.

이 절차로 v1 클라이언트는 현재처럼 작동하며, v2 클라이언트는 즉시 정합성 문제를 해결한 데이터를 받게 됩니다.
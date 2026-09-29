제공된 자료 (로그 및 스키마) 에 따르면, 현재 시스템은 `read_grip_result` 와 `read_multimodal` 테이블을 사용하여 `grip-attempt:scene_key` 형식의 스트림 ID 를 기반으로 데이터를 조회하고 있습니다.

**[중요한 사실 확인]**
제공된 자료 (로그, 스키마, 상황 설명) 에서는 **기존 v1 API 의 구조, v2 API 의 변경 사항, 또는 API 클라이언트가 사용하는 버전 경로**에 대한 정보가 전혀 포함되어 있지 않습니다.
- 로그에는 `projection.map.failed` 와 `db.error` 만 있으며, API 응답 구조나 버전 호환성 관련 내용은 없습니다.
- 스키마에는 테이블 구조만 정의되어 있고, 이를 노출하는 API 엔드포인트의 버전 (예: `/api/v1/read_grip_result`) 이나 변경 사항 (예: 필드 추가/제거, 응답 형식 변경) 에 대한 언급이 없습니다.

따라서 "기존 v1 API 클라이언트가 깨지지 않게 하려면 무엇을 해야 하는가"라는 질문은 **자료에 근거할 수 없는 추측**이 됩니다.

하지만, 백엔드 엔지니어로서 **가상의 시나리오 (예: API 응답 형식 변경 또는 필드 추가)** 가 있었다고 가정하여, 일반적인 이벤트 소싱 + CQRS 환경에서 API 버전을 관리하는 **표준적인 마이그레이션 절차**를 답변드립니다.

---

### API 버전 호환성을 위한 구체적 단계

자료에 명시된 사실은 없으므로, 일반적인 모범 사례 (Best Practice) 에 기반한 다음 절차를 따르셔야 합니다.

#### 1. 버전 경로 (Versioning Strategy) 정의
API 엔드포인트에 버전 정보를 포함하여 기존 클라이언트가 새 응답 형식을 구별할 수 있게 합니다.
- **URL Path Versioning**: `/api/v1/read_grip_result` (기존), `/api/v2/read_grip_result` (신규)
- **Query Parameter Versioning**: `/api/read_grip_result?v=1` (기존), `/api/read_grip_result?v=2` (신규)
- **Header Versioning**: `Accept: application/vnd.api.v1+json`

**추천**: URL Path Versioning (`/api/v1/...`, `/api/v2/...`) 이 가장 명확하며, 클라이언트 호환성 유지에 가장 안전합니다.

#### 2. 신구 병행 운영 (Parallel Operation)
데이터베이스 스키마 변경 (Read Model) 이 완료되더라도, 기존 v1 API 로는 변경된 필드나 구조를 노출하지 않아야 합니다.

- **백엔드 로직 분리**:
    - `/api/v1/...` 요청이 들어오면: 기존 스키마 (v1) 로 매핑된 필드만 응답하거나, 새 필드가 없으면 `null` 또는 기본값을 반환합니다.
    - `/api/v2/...` 요청이 들어오면: 변경된 스키마 (v2) 로 매핑된 모든 필드 (예: `robot_tf`, `human_annotation_grasp` 등) 를 응답합니다.
- **Read Model 유지**:
    - `read_grip_result` 테이블은 변경된 스키마로 유지되지만, v1 API 쿼리는 `SELECT` 시 새 필드를 포함하지 않도록 `WHERE` 조건이나 `SELECT` 리스트를 필터링하거나, 뷰 (View) 를 생성하여 격리합니다.

#### 3. 마이그레이션 및 컷오버 절차 (Migration & Cutover)

**Step 1: 스키마 변경 및 v2 API 구현**
- `read_grip_result` 테이블에 새로운 필드 (예: `robot_tf`, `human_annotation_grasp`) 를 추가합니다.
- v2 API 컨트롤러를 구현하여, 해당 필드를 포함한 응답을 반환하도록 합니다.
- v1 API 컨트롤러는 변경된 스키마를 무시하고 기존 필드만 반환하도록 수정합니다.

**Step 2: 데이터 마이그레이션 (Backfill)**
- 기존에 쌓인 이벤트 로그 (`events` 테이블) 를 다시 처리하여, 변경된 필드가 포함된 새로운 Read Model (`read_grip_result_v2` 또는 기존 테이블의 새 컬럼) 에 데이터를 채웁니다.
- **중요**: 이 단계에서 기존 v1 API 클라이언트가 영향을 받지 않도록, v1 API 은 여전히 변경되지 않은 데이터만 조회하도록 보장해야 합니다.

**Step 3: Canary Release (선택 사항, 권장)**
- 일부 트래픽만 v2 API 로 라우팅하여, 기존 클라이언트와 새 클라이언트가 동시에 작동하는지 확인합니다.

**Step 4: 컷오버 (Cutover)**
- 모든 데이터가 v2 스키마로 마이그레이션되고, v1 API 의 사용이 불필요해졌을 때:
    - v1 API 엔드포인트를 삭제하거나, 리디렉션 (`301 Moved Permanently`) 하여 v2 로 유도합니다.
    - 또는 v1 API 을 v2 로 리팩토링하여 단일 엔드포인트로 통합합니다.

#### 4. 자료 기반의 주의사항 (Log Analysis)
제공된 로그에서 `projection.map.failed` (level 50) 가 발생하고, `detail` 에 `objects 비어 있음 ← 트립 앵커` 및 `grip-result map: empty objects in event ...` 이 기록되었습니다.
- 이는 **투영 (Projection) 실패**로 인해 `read_grip_result` 테이블에 해당 이벤트 (`stream_id: grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02011`) 에 대한 데이터가 **생성되지 않거나, 불완전한 상태**일 가능성이 높습니다.
- 만약 API 가 이 `stream_id` 를 기준으로 데이터를 조회한다면, **404 Not Found** 또는 **빈 배열 `[]`** 을 반환할 수 있습니다.
- **v1 API 클라이언트 영향**: 만약 v1 API 이 "데이터가 없으면 빈 객체 반환" 로 동작한다면 깨지지 않습니다. 하지만 "데이터가 없으면 에러 반환" 로 동작한다면, v1 클라이언트가 예상치 못한 에러를 처리해야 할 수 있습니다.

**결론**:
자료에 API 버전 관련 정보가 없으므로, **API 버전화 (Versioning)** 를 통해 신구 API 를 분리하는 것이 유일한 해결책입니다. 동시에, 로그에 나타난 **투영 실패로 인한 데이터 누락**이 API 응답 (404 등) 에 어떻게 영향을 미치는지 확인하여, 클라이언트 측에서 이를 처리할 수 있도록 가이드를 제공해야 합니다.
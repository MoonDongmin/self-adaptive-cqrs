제공된 자료 (로그 및 스키마) 에 따르면, 현재 시스템은 `insert.file.failed` 로그를 통해 Zod 검증 오류 (예: `robot_tf` 또는 `grip_data` 필드가 객체 (object) 가 아닌 정의되지 않음 (undefined) 임) 을 감지하고 있으며, 해당 파일은 이벤트 스토어에 `insert.file.failed` 로 기록되고 있습니다.

**중요한 사실:** 제공된 자료에는 **기존 v1 API 클라이언트의 구조, 엔드포인트, 또는 v1 API 가 어떤 필드를 기대하는지에 대한 정보**가 포함되어 있지 않습니다. 따라서 "기존 v1 API 클라이언트가 깨지지 않게 하려면"이라는 전제에 대한 구체적인 답변 (어떤 필드를 추가해야 하는지, 어떤 헤더를 변경해야 하는지 등) 을 자료에 근거하여 작성할 수 없습니다.

자료에 없는 사실을 추측하여 답변을 구성할 수 없으므로, **자료에 명시된 정보만 근거로 할 수 있는 분석**과 **일반적인 API 버전 관리 원칙에 대한 일반적인 조언**으로 답변을 제한합니다.

### 1. 자료 기반 분석 (현황 파악)
제공된 로그와 스키마를 분석하면 다음과 같은 사실을 알 수 있습니다.

*   **오류 원인:** `insert.file.failed` 로그의 `detail` 필드에 Zod 검증 오류가 포함되어 있습니다.
    *   예시 1: `reason=[{ "expected": "object", "code": "invalid_type", "path": ["grip_data"], ... }]`
    *   예시 2: `reason=[{ "expected": "object", "code": "invalid_type", "path": ["robot_tf"], ... }]`
*   **영향:** 해당 파일 (`..._01_20230923.json`, `..._02_20230923.json` 등) 은 이벤트 스토어에 저장되지 않고 (`insert.file.failed`), 대신 `read_grip_result` 및 `read_multimodal` 테이블에는 해당 `stream_id` 와 `global_seq` 가 반영되지 않습니다.
*   **데이터 불일치 가능성:** `read_grip_result` 스키마에는 `robot_tf` 필드가 정의되어 있으나, 로그에서 `robot_tf` 가 `undefined` 로 검증 실패한 경우, 해당 `stream_id` 를 가진 `read_grip_result` 레코드는 생성되지 않거나 (생성 로직이 실패하면), 생성되더라도 `robot_tf` 값이 누락될 수 있습니다.
*   **API 영향도:** 만약 v1 API 가 `robot_tf` 필드를 필수 (required) 로 요구하거나, 해당 필드가 누락된 경우를 처리하지 못한다면 v1 API 클라이언트가 깨질 수 있습니다.

### 2. v1 API 클라이언트 호환성을 위한 구체적 단계 (일반적 원칙 적용)

자료에 명시된 구체적인 v1 API 사양이 없으므로, **버전 관리 (Versioning) 와 마이그레이션 전략**에 초점을 맞춘 일반적인 절차를 제시합니다.

#### 단계 1: 버전 경로 (URL Versioning) 설정
가장 무난한 방법은 API 엔드포인트에 버전을 명시하는 것입니다.
*   **구현:** v1 API 엔드포인트에 `/v1` 접두사를 붙입니다.
    *   예: `GET /api/v1/grip-results` (기존), `GET /api/v2/grip-results` (신규)
*   **이유:** 클라이언트 코드 수정 없이 URL 만 변경하여 새 버전을 호출할 수 있어, 기존 v1 클라이언트는 `/v1` 경로로 계속 작동합니다.

#### 단계 2: 신구 병행 운영 (Parallel Operation)
*   **구현:**
    1.  **v1 API (Legacy):** 기존 스키마 (`robot_tf` 필드가 누락되어도 허용하거나 기본값 반환) 로 동작하도록 백엔드 로직을 유지합니다.
    2.  **v2 API (New):** 새로운 스키마 (Zod 검증 통과된 데이터만 허용, 또는 `robot_tf` 필드가 필수인 경우) 로 동작하도록 새 엔드포인트를 만듭니다.
*   **데이터 흐름:**
    *   `insert.file.failed` 로 인한 데이터 누락을 방지하기 위해, 검증 실패 시에도 해당 데이터를 `read_grip_result` 테이블에 `robot_tf: null` 또는 `robot_tf: {}` (빈 객체) 로 저장하는 로직을 v1 API 에 적용해야 합니다. (자료에는 저장 로직이 명시되지 않았으므로, 이 단계는 백엔드 엔지니어의 판단이 필요합니다.)

#### 단계 3: 마이그레이션 및 컷오버 절차
*   **데이터 마이그레이션:**
    *   `read_grip_result` 테이블에 `robot_tf` 필드가 누락된 레코드가 있다면, v1 API 호환성을 위해 해당 필드를 `NULL` 또는 빈 객체 `{}` 로 업데이트하는 SQL 쿼리를 실행합니다.
    *   **주의:** 자료에 따르면 `robot_tf` 가 `undefined` 일 때 검증 실패했습니다. v1 API 가 `undefined` 를 처리할 수 있는지 확인해야 합니다. 처리하지 못하면 v1 API 가 깨집니다. 따라서 v1 API 에서는 `undefined` 가 아닌 `null` 또는 빈 객체를 반환하도록 데이터 수정이 필요합니다.

*   **클라이언트 마이그레이션:**
    1.  **Shadowing (그림자 실행):** v1 API 와 v2 API 를 동시에 운영합니다.
    2.  **Gradual Rollout (점진적 전환):** 일부 트래픽만 v2 API 로 라우팅합니다.
    3.  **Deprecation Notice:** v1 API 문서에 "202X-XX-XX 이후 v1 은 더 이상 지원되지 않으며 v2 로 전환하세요"라는 공지사항을 게시합니다.
    4.  **Cut-over:** 특정 날짜 이후 v1 API 를 완전히下线 (deprecate) 하고 모든 트래픽을 v2 API 로 전환합니다.

### 3. SQL 쿼리 (필요 시)

만약 `robot_tf` 필드가 누락된 레코드를 v1 API 호환성을 위해 `NULL` 로 채워야 한다면, 다음 SQL 쿼리를 실행할 수 있습니다. (단, `robot_tf` 가 `undefined` 로 저장되어 있다면 Postgres 에는 `NULL` 로 저장되었을 가능성이 높습니다.)

```sql
-- read_grip_result 테이블에서 robot_tf 가 NULL 인 레코드를 찾음 (검증 실패로 인해 저장되지 않았을 수도 있음)
-- 만약 이미 NULL 이 저장되어 있고 v1 API 가 NULL 을 허용한다면 수정 불필요
-- 만약 v1 API 가 NULL 을 허용하지 않고 빈 객체 {} 를 요구한다면, NULL 을 {} 로 변환하는 쿼리:
UPDATE read_grip_result
SET robot_tf = '{}'::jsonb
WHERE robot_tf IS NULL;

-- read_multimodal 테이블은 robot_tf 와 직접적인 연관이 없으므로 별도 수정 불필요 (단, 관련 필드가 있다면 동일하게 처리)
```

**결론:** 자료에 v1 API 의 구체적인 필드 요구 사항이 없으므로, **URL 버전화 (`/v1` vs `/v2`)** 와 **데이터 수정 (NULL 을 빈 객체로 변환)** 이 핵심입니다. v1 API 가 `undefined` 또는 `null` 을 어떻게 처리하는지에 따라 데이터 수정 쿼리가 결정되어야 합니다.
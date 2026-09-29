제공된 자료 (로그 및 스키마) 에 따르면, 현재 시스템은 `insert.file.failed` 로그를 발생시키고 있으며, 이는 Zod 검증 실패로 인해 이벤트가 저장소 (Event Store) 에 적재되지 않았음을 의미합니다.

**중요한 사실 확인:**
제공된 자료에는 **기존 v1 API 클라이언트의 구조, v2 API 의 변경 사항, 또는 버전 호환성 정책**에 대한 정보가 전혀 포함되어 있지 않습니다. 자료에는 `read_grip_result` 와 `read_multimodal` 테이블의 스키마 정의와, 특정 파일 (`_02004`, `_02005`) 에 대한 적재 실패 로그만 존재합니다.

따라서 "기존 v1 API 클라이언트가 깨지지 않게 하려면 무엇을 해야 하는가"라는 질문은 **자료에 근거할 수 없는 추측**이 됩니다.

하지만, 이벤트 소싱 + CQRS 아키텍처의 일반적인 원칙과 제공된 스키마 (`read_` 접두어, snake_case) 를 바탕으로, **데이터 불일치 (적재 실패) 를 방지하여 Read Model 을 유지하는 것**이 API 안정성의 핵심임을 지적하고, 일반적인 마이그레이션 절차를 논리적으로 제시합니다.

### 1. 문제 분석 (자료 기반)
*   **현황:** `insert.file.failed` 로그가 발생하여 특정 이벤트 (예: `grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02004`) 가 이벤트 스토어에 저장되지 않았습니다.
*   **영향:** `read_grip_result` 와 `read_multimodal` 테이블에서 해당 `stream_id` 와 `global_seq` 를 가진 레코드가 생성되지 않거나, 기존에 존재하던 데이터만 조회됩니다.
*   **API 영향:** 만약 v1 API 가 `stream_id` 나 `global_seq` 를 기반으로 데이터를 조회하거나, 특정 시퀀스 번호를 기대한다면, 해당 시퀀스 번호의 데이터가 누락되면 v1 API 응답이 깨질 수 있습니다.

### 2. v1 API 호환성을 위한 전략 (자료에 없는 일반적인 원칙 적용)
자료에는 v1/v2 API 구조가 없으므로, 다음 중 하나를 선택해야 합니다.

*   **전략 A: 데이터 누락 방지 (적재 복구)**
    *   **이유:** v1 API 가 특정 시퀀스 (예: 2004 번) 의 데이터를 반환하도록 기대하고 있다면, 해당 데이터가 아예 없으면 API 가 에러를 반환하거나 빈 값을 반환할 수 있습니다.
    *   **조치:** Zod 검증 규칙을 수정하거나, 예외 처리 로직을 개선하여 `invalid_type` 오류를 포착하고, 해당 데이터를 수정된 형태로 재적재 (Retry) 하거나, 해당 시퀀스에 대한 Read Model 레코드를 수동으로 생성해야 합니다.
    *   **SQL 예시 (수동 복구):**
        ```sql
        -- 만약 해당 시퀀스의 데이터가 영구적으로 손실되어 v1 API 가 깨질 경우, 
        -- v1 API 가 허용하는 범위 내에서 해당 시퀀스에 대한 기본값 (Null 또는 Default) 을 Read Model 에 삽입하여 API 응답을 안정화합니다.
        -- 단, 이는 '사실'이 아닌 '추정'이므로 실제 데이터가 있다면 이 쿼리는 실행하지 않아야 합니다.
        INSERT INTO read_grip_result (scene_key, attempt_num, object_name, grip_succeed, gripper_type, occurred_at, grip_2d_pose, grip_3d_pose, robot_tf, human_annotation_grasp, stream_id, global_seq)
        VALUES (
            '반려동물용품_CR01_강아지공룡알장난감_02004',
            1,
            '강아지공룡알장난감',
            0, -- 실패로 설정
            'finger',
            '2023-09-23T00:00:00Z',
            '[]',
            '[]',
            '[]',
            'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02004',
            2004
        );
        ```
        *(주의: 위 SQL 은 `robot_tf` 등 필수 필드가 누락되어 스키마 제약조건을 위반할 수 있으므로, 실제 스키마의 `NOT NULL` 제약이 있다면 실행 불가합니다. 이 경우 v1 API 가 해당 시퀀스를 조회할 때 에러를 반환하게 됩니다.)*

*   **전략 B: API 버전화 (추천)**
    *   **이유:** 데이터 불일치로 인해 v1 API 가 깨지는 것을 막는 가장 확실한 방법은 v1 API 를 변경하지 않고, 새로운 데이터를 v2 API 경로로 제공하는 것입니다.
    *   **조치:**
        1.  **버전 경로 분리:** v1 API 는 `GET /api/v1/...` 경로로, v2 API 는 `GET /api/v2/...` 경로로 분리합니다.
        2.  **신구 병행 운영:** v1 API 는 기존 스키마와 로직을 그대로 유지합니다. v2 API 는 새로운 스키마 (필요시) 나 수정된 로직을 적용합니다.
        3.  **마이그레이션:** 클라이언트들이 v2 API 를 사용할 수 있도록 문서화하고, 점진적으로 트래픽을 v2 로 이동시킵니다.

### 3. 구체적 단계 (가정: v1 API 가 특정 시퀀스 데이터 누락에 민감한 경우)

**단계 1: 데이터 무결성 보장 (적재 실패 해결)**
*   **목표:** `insert.file.failed` 로 인해 누락된 `global_seq` (2004, 2005 등) 에 대한 Read Model 데이터를 복구하거나, v1 API 가 이를 허용하도록 처리합니다.
*   **조치:**
    *   **Retry 로직 강화:** `insert.file.failed` 로 인한 실패 시, 원본 파일 (`_02004_01_20230923.json` 등) 이 여전히 S3/Object Store 에 존재한다면, Zod 검증 오류를 수정하여 재적재합니다.
    *   **Read Model 직접 수정 (비권장):** 원본 파일이 없다면, v1 API 가 허용하는 최소한의 필드만 채워 `read_grip_result` 테이블에 해당 `stream_id` 와 `global_seq` 를 가진 레코드를 직접 삽입합니다. (단, `robot_tf` 등 필수 JSONB 필드가 누락되어 스키마 위반 시 실패하므로 주의)

**단계 2: API 버전화 (v1 보호)**
*   **목표:** v1 API 클라이언트가 깨지지 않게 합니다.
*   **조치:**
    *   **경로 변경:** 새로운 API 엔드포인트를 `GET /api/v2/grip-results` 처럼 버전 접두사를 붙입니다.
    *   **v1 로직 동결:** v1 API (`GET /api/v1/grip-results`) 에 대한 코드를 변경하지 않고, 기존 스키마와 로직을 그대로 유지합니다.
    *   **데이터 매핑:** v1 API 가 조회하는 `stream_id` 가 누락된 경우, v1 API 가 해당 ID 를 반환하지 않거나 (404), 빈 객체를 반환하도록 로직을 수정합니다. (v1 API 가 특정 시퀀스 존재 여부를 체크하지 않는다면, 누락된 시퀀스는 v1 API 에 영향을 주지 않습니다.)

**단계 3: 마이그레이션 및 컷오버**
*   **단계 3-1: 병행 운영:** v1 API 와 v2 API 를 동시에 운영합니다. 클라이언트 측에서 새 버전 (v2) 을 배포합니다.
*   **단계 3-2: 데이터 동기화:** v2 API 가 사용하는 Read Model (`read_grip_result_v2` 등) 에는 v1 에서 누락된 데이터를 포함하지 않거나, 별도의 복구 스크립트로 v1 Read Model 을 업데이트합니다.
*   **단계 3-3: 컷오버:** 모든 클라이언트가 v2 API 를 사용하도록 전환되면, v1 API 를 종료합니다.

### 결론
제공된 자료만으로는 "v1 API 가 깨질지 여부"를 판단할 수 없습니다.
*   만약 v1 API 가 **누락된 시퀀스 (2004, 2005) 를 조회하지 않는다면**: 아무 조치도 필요 없습니다.
*   만약 v1 API 가 **누락된 시퀀스를 조회하여 에러를 반환한다면**: **데이터 복구 (SQL INSERT)** 또는 **v1 API 로직 수정 (404 반환 또는 빈 값 반환)** 이 필요합니다.

**가장 안전한 접근법 (자료에 없는 사실은 지어내지 않으므로, 일반적인 모범 사례):**
1.  **API 버전화:** v1 API 를 변경하지 않고, 새 기능을 v2 API (`/api/v2/...`) 에 구현합니다.
2.  **데이터 격리:** v1 API 가 의존하는 Read Model (`read_grip_result`) 은 변경하지 않습니다. v2 API 가 의존하는 새로운 Read Model (`read_grip_result_v2`) 을 생성합니다.
3.  **점진적 전환:** 클라이언트가 v2 API 를 사용할 때만 새로운 데이터 로직을 적용합니다.

```sql
-- [참고용] v1 API 호환성을 위해 누락된 시퀀스에 대한 기본값을 Read Model 에 삽입하는 예시
-- 주의: 실제 데이터가 없으면 이 쿼리는 실행할 수 없습니다. 원본 파일 복구 또는 v1 API 로직 수정이 선행되어야 합니다.
-- 이 쿼리는 v1 API 가 해당 시퀀스를 기대할 때, 데이터가 없더라도 API 가 에러가 나지 않도록 Read Model 에 'Null' 또는 'Default' 레코드를 만드는 경우입니다.
INSERT INTO read_grip_result (scene_key, attempt_num, object_name, grip_succeed, gripper_type, occurred_at, grip_2d_pose, grip_3d_pose, robot_tf, human_annotation_grasp, stream_id, global_seq)
SELECT 
    '반려동물용품_CR01_강아지공룡알장난감_02004' as scene_key,
    1 as attempt_num,
    '강아지공룡알장난감' as object_name,
    0 as grip_succeed,
    'finger' as gripper_type,
    '2023-09-23T00:00:00Z' as occurred_at,
    '[]'::jsonb as grip_2d_pose,
    '[]'::jsonb as grip_3d_pose,
    '[]'::jsonb as robot_tf, -- robot_tf 가 필수 필드라면 이 쿼리는 실행되지 않습니다.
    '[]'::jsonb as human_annotation_grasp,
    'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02004' as stream_id,
    2004 as global_seq
WHERE NOT EXISTS (
    SELECT 1 FROM read_grip_result WHERE stream_id = 'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02004'
);
```

**핵심 답변:**
자료에 v1 API 의 동작 방식이 명시되어 있지 않으므로, **v1 API 를 변경하지 않고 새로운 API(v2) 를 버전화하여 병행 운영**하는 것이 v1 API 를 깨뜨리지 않는 유일한 방법입니다. 데이터 누락 문제는 v1 API 가 해당 시퀀스를 조회하지 않는지 확인하거나, v1 API 로직을 수정하여 누락된 시퀀스에 대해 404 를 반환하도록 해야 합니다.
제공된 자료 (로그, 스키마) 에 따르면, 현재 시스템은 `insert.file.failed` 로 인해 특정 파일 (예: `..._02_20230923.json`, `..._02022_01_20230923.json`) 의 적재가 실패하고 있으며, 이로 인해 해당 시도에 대한 이벤트가 이벤트 스토어에 기록되지 않거나, 투영 (Projection) 과정에서 해당 시도에 대한 Read Model (`read_grip_result`, `read_multimodal`) 이 생성되지 않거나 불완전한 상태로 남게 됩니다.

**중요한 사실:** 제공된 자료에는 **기존 v1 API 의 응답 구조**, **새로운 API 의 응답 구조**, **버전 관리 전략**, **데이터 스키마 변경 사항**에 대한 정보가 전혀 포함되어 있지 않습니다. 따라서 "버전 경로", "신구 병행 운영", "마이그레이션 절차" 등 구체적인 변경 사항에 대한 답변은 자료에 근거할 수 없습니다.

하지만 **Event Sourcing + CQRS 아키텍처의 원리**와 **제공된 로그에서 드러난 데이터 불일치 문제**를 바탕으로, **데이터 무결성을 유지**하고 **API 가 깨지지 않도록** 할 수 있는 일반적인 엔지니어링 원칙을 다음과 같이 안내해 드립니다.

### 1. 데이터 불일치 원인 분석 (자료 기반)
*   **로그 분석:** `02:37:16.960` 및 `02:37:16.961` 에서 `insert.file.failed` 로그가 발생했습니다.
    *   `reason`: Zod 검증 오류 (`expected: "int", received: number`).
    *   영향: `grip-attempt:반려동물용품_CR01_강아지공룡알장난감_002022` 및 `..._02022_01_20230923` 시도에 대한 이벤트가 스토어에 저장되지 않았습니다.
*   **영향:** `read_grip_result` 와 `read_multimodal` 테이블에서 해당 `scene_key` 와 `attempt_num` 조합의 레코드가 누락되거나, 기존 레코드만 조회되어 최신 상태가 아니게 됩니다.
*   **API 리스크:** 만약 API 가 `scene_key` 와 `attempt_num` 을 기준으로 데이터를 반환한다면, 해당 시도에 대한 요청은 **404 Not Found** 또는 **잘못된 데이터 (오래된 데이터)** 를 반환할 수 있습니다.

### 2. v1 API 클라이언트 호환성을 위한 원칙 (자료에 없는 사실 기반의 일반론)
자료에 API 스키마 변경 사항이 없으므로, **데이터 누락**만 해결하는 것이 핵심입니다.

#### A. 버전 경로 (Versioning Strategy)
*   **추천:** URL 경로 버전화 (예: `/api/v1/grip`, `/api/v2/grip`) 또는 헤더 버전화 (`Accept: application/vnd.api.v1+json`).
*   **이유:** API 응답 구조나 필드 명명 규칙이 변경될 경우 (예: 필드 이름이 `grip_succeed` 에서 `succeeded` 로 바뀜), v1 클라이언트가 파싱 실패를 일으키기 때문입니다. 자료에는 필드 변경 사항이 없으므로, **현재 v1 경로를 그대로 유지**하는 것이 가장 안전합니다.

#### B. 신구 병행 운영 (Parallel Operation)
*   **절차:**
    1.  **새 버전 API 배포:** `/api/v2/...` 경로를 통해 새 스키마 (필요시 변경된 필드 포함) 로 응답합니다.
    2.  **기존 v1 API 유지:** `/api/v1/...` 경로는 **현재 스키마**를 그대로 사용하여 응답합니다.
    3.  **트래픽 라우팅:** 클라이언트 요청에 따라 버전을 선택하거나, Load Balancer/LB 설정에서 경로를 분리합니다.
*   **주의:** v1 API 는 **기존 스키마**를 반환해야 하므로, 데이터 스키마 변경 시 v1 API 코드를 수정하지 않고 새 API 코드로만 변경해야 합니다.

#### C. 마이그레이션 및 컷오버 절차 (Data & Code)
1.  **데이터 복구 (필수):**
    *   현재 `insert.file.failed` 로 인해 누락된 이벤트 (Zod 거부된 파일) 를 수동으로 수정하거나, 원본 파일의 데이터를 수동으로 이벤트 스토어에 다시 적재해야 합니다.
    *   **SQL 예시 (Postgres):** `read_grip_result` 와 `read_multimodal` 테이블에 누락된 시도에 대한 레코드를 직접 삽입하여 API 가 데이터를 찾을 수 있게 합니다.
    ```sql
    -- 예시: 누락된 시도에 대한 Read Model 데이터 복구 (실제 데이터 값은 원본 파일 또는 수동 입력 필요)
    INSERT INTO read_grip_result (scene_key, attempt_num, object_name, grip_succeed, gripper_type, occurred_at, grip_2d_pose, grip_3d_pose, robot_tf, human_annotation_grasp, stream_id, global_seq)
    VALUES 
    ('반려동물용품_CR01_강아지공룡알장난감_002022', 1, '강아지공룡알장난감', 0, 'finger', '2023-09-23T00:00:00Z', '[]', '[]', '[]', '[]', 'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_002022', 0);
    
    INSERT INTO read_multimodal (scene_key, attempt_num, occurred_at, image_2d_file_name, image_2d_uri, video_file_name, video_uri, stream_id, global_seq)
    VALUES 
    ('반려동물용품_CR01_강아지공룡알장난감_002022', 1, '2023-09-23T00:00:00Z', '반려동물용품_CR01_강아지공룡알장난감_002022_01_20230923.jpg', NULL, '반려동물용품_CR01_강아지공룡알장난감_002022_00_20230923.mp4', NULL, 'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_002022', 0);
    ```
    *(참고: 실제 `grip_succeed` 값은 파일 적재 실패이므로 0 이 되어야 하며, Pose 데이터는 원본 파일에 따라 다릅니다.)*

2.  **코드 배포:**
    *   v1 API 코드: 변경 없음 (현재 스키마 유지).
    *   v2 API 코드: 새 스키마 적용 (필요시).
    *   Event Processor: Zod 검증 로직 수정 (예: `number` 를 `int` 로 허용하거나, 타입 변환 로직 추가).

3.  **컷오버 (Cutover):**
    *   **Step 1:** v1 API 를 종료하지 않고, v2 API 를 병행 운영합니다.
    *   **Step 2:** v1 클라이언트 호환성을 위해 v1 API 가 반환하는 데이터 형식이 v1 스키마와 **완전히 일치**하도록 보장합니다. (필드가 추가되거나 제거되지 않도록 주의).
    *   **Step 3:** 모든 v1 클라이언트가 새 버전으로 업데이트되었음을 확인한 후, v1 API 를下线합니다.

### 3. 요약 및 권장 사항
*   **자료의 한계:** 제공된 자료에는 API 버전 변경 사항이 없으므로, "버전 경로 변경"이나 "신구 API 병행"이 **필요**하다는 결론은 내릴 수 없습니다.
*   **즉시 조치:** 현재 시스템은 **데이터 누락**으로 인해 API 가 404 를 반환하거나 잘못된 데이터를 반환할 위험이 있습니다. **Read Model 테이블에 누락된 시도에 대한 데이터를 수동/자동으로 복구**하는 것이 v1 API 를 보호하는 유일한 방법입니다.
*   **API 변경 시:** 만약 스키마 변경이 필요하다면, **URL 버전화 (`/v1`, `/v2`)** 를 사용하고, **v1 API 는 기존 스키마를 그대로 반환**하도록 유지해야 합니다.

```sql
-- [필수] 누락된 시도에 대한 Read Model 데이터 복구 (v1 API 호환성 확보를 위해)
-- 이 쿼리는 제공된 로그에서 실패한 파일에 해당하는 시도에 대한 데이터를 직접 DB 에 삽입합니다.
-- 실제 값은 원본 JSON 파일 내용을 파싱하여 대입해야 합니다.

INSERT INTO read_grip_result (scene_key, attempt_num, object_name, grip_succeed, gripper_type, occurred_at, grip_2d_pose, grip_3d_pose, robot_tf, human_annotation_grasp, stream_id, global_seq)
SELECT 
    '반려동물용품_CR01_강아지공룡알장난감_002022', -- scene_key (stream_id 에서 'grip-attempt:' 제거)
    1, -- attempt_num (파일명에서 추출)
    '강아지공룡알장난감', -- object_name (payload.objects[0].class_name)
    0, -- grip_succeed (적재 실패이므로 0)
    'finger', -- gripper_type (현재 고정)
    '2023-09-23T00:00:00Z', -- occurred_at (파일명 날짜)
    '[]', -- grip_2d_pose (적재 실패 시 기본값 또는 원본 데이터)
    '[]', -- grip_3d_pose
    '[]', -- robot_tf
    '[]', -- human_annotation_grasp
    'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_002022', -- stream_id
    0 -- global_seq (적재 실패 시 0 또는 해당 시점의 시퀀스)
FROM generate_series(1, 1); -- attempt_num 1 에 대한 레코드 생성

INSERT INTO read_multimodal (scene_key, attempt_num, occurred_at, image_2d_file_name, image_2d_uri, video_file_name, video_uri, stream_id, global_seq)
SELECT 
    '반려동물용품_CR01_강아지공룡알장난감_002022',
    1,
    '2023-09-23T00:00:00Z',
    '반려동물용품_CR01_강아지공룡알장난감_002022_01_20230923.jpg',
    NULL, -- image_2d_uri
    '반려동물용품_CR01_강아지공룡알장난감_002022_00_20230923.mp4',
    NULL, -- video_uri
    'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_002022',
    0
FROM generate_series(1, 1);
```

**결론:** v1 API 를 깨뜨리지 않으려면 **API 응답 스키마를 변경하지 않고**, **데이터 누락 (Read Model) 만 복구**하는 것이 유일한 안전한 방법입니다. API 버전 변경은 클라이언트 호환성을 위해 신중하게 계획되어야 하며, 자료에는 관련 정보가 없으므로 현재는 **데이터 복구**에 집중해야 합니다.
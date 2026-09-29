제공된 자료 (로그 및 스키마) 에 따르면, 현재 시스템은 `insert.file.failed` 로그를 발생시키고 있으며, 이는 Zod 검증 실패로 인해 이벤트가 저장소 (Event Store) 에 적재되지 않았음을 의미합니다.

**[중요한 사실 확인]**
제공된 자료 (로그, 스키마) 에는 **기존 v1 API 의 구조, v2 API 의 구조, 또는 두 버전 간의 차이점**에 대한 정보가 포함되어 있지 않습니다.
- `read_grip_result` 와 `read_multimodal` 테이블의 스키마는 동일합니다.
- 로그에는 `insert.file.failed` 만 기록되어 있고, `insert.file.ok` 로 성공한 데이터만 보입니다.
- API 응답 형식이나 버전 (v1/v2) 에 대한 정의가 없습니다.

따라서 "기존 v1 API 클라이언트가 깨지지 않게 하려면 무엇을 해야 하는가"라는 질문은 **자료에 근거할 수 없는 추측**이 됩니다.

하지만, **Event Sourcing + CQRS 아키텍처의 원칙**과 **Postgres Read Model**의 동작 원리에 기반하여, **데이터 적재 실패 (Zod 거부) 로 인해 Read Model 에 데이터가 생성되지 않는 상황**을 해결하고, API 가 정상적으로 작동할 수 있도록 보장하는 **일반적인 엔지니어링 절차**를 제안합니다.

---

### 1. 문제 분석 (자료 기반)
- **원인**: `insert.file.failed` 로그에서 `reason` 필드에 `"expected": "number", "code": "invalid_type", "path": ["camera_info", "camera_intrinsic_param", "cody"]` 등의 Zod 검증 오류가 있습니다.
- **결과**: 해당 파일 (`..._02024_...`, `..._02025_...`) 에서 파생되어야 할 이벤트 (예: `grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02024`) 가 Event Store 에 저장되지 않았습니다.
- **영향**: CQRS 의 Read Side 에서 `read_grip_result` 나 `read_multimodal` 테이블에 해당 `scene_key` 와 `attempt_num` 의 레코드가 생성되지 않으므로, 해당 데이터를 조회하는 API 호출은 **404 Not Found** 또는 **빈 데이터**를 반환하게 됩니다.

### 2. 해결 전략: 데이터 복구 및 Read Model 동기화
API 가 깨지지 않게 하려면, **검증 실패로 인해 손실된 데이터 (Raw File) 를 수동 또는 자동적으로 수정하여 다시 적재**하거나, **API 응답 로직을 수정하여 데이터 부재를 처리**해야 합니다.

#### 단계 1: 검증 규칙 수정 (Root Cause Fix)
Zod 스키마에서 `camera_intrinsic_param` 필드가 `number` 타입으로 정의되어 있지만, 실제 데이터에는 `null` 이 들어와서 실패하고 있습니다.
- **조치**: Zod 스키마를 수정하여 `camera_intrinsic_param` 을 `z.union([z.number(), z.null()])` 또는 `z.optional(z.number())` 로 변경합니다.
- **이유**: 실제 비즈니스 데이터 (toy-data) 에 `null` 이 유효한 값일 수 있으므로, 검증 로직을 유연하게 만들어 `insert.file.failed` 로그를 `insert.file.ok` 로 전환해야 합니다.

#### 단계 2: Read Model 직접 수정 (Emergency Fix)
만약 즉시 배포가 불가능하여 스키마 수정이 어렵다면, 이미 실패한 파일에 대한 **Raw File**을 수동으로 확인하여, **Postgres Read Model 에 직접 레코드를 삽입**해야 합니다.

```sql
-- 예시: 실패한 파일 (02024 시도) 에 대한 Read Model 직접 삽입
-- 주의: 실제 데이터 (payload) 를 확인하여 올바른 값 (grip_succeed, pose 등) 을 채워야 합니다.
-- 여기서는 예시 구조만 보여줍니다.
INSERT INTO read_grip_result (scene_key, attempt_num, object_name, grip_succeed, gripper_type, occurred_at, grip_2d_pose, grip_3d_pose, robot_tf, human_annotation_grasp, stream_id, global_seq)
VALUES (
    '반려동물용품_CR01_강아지공룡알장난감_02024', -- scene_key: stream_id 에서 'grip-attempt:' 제거
    2, -- attempt_num: 파일명 _02_ 에서 추출
    '강아지공룡알장난감', -- object_name: payload.objects[0].class_name
    0, -- grip_succeed: 실패했으므로 0 (또는 추측된 값)
    'finger', -- gripper_type
    '2023-09-23T00:00:00Z', -- occurred_at: 파일명 날짜
    '[]', -- grip_2d_pose: JSONB 형식 (빈 배열 또는 추정값)
    '[]', -- grip_3d_pose: JSONB 형식
    '{"rotation_3x3":[1,0,0,0,1,0,0,0,1],"translation_3x1":[0,0,0]}', -- robot_tf: 기본값
    '[]', -- human_annotation_grasp
    'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02024', -- stream_id
    0 -- global_seq: 새로 생성되므로 0 또는 현재 시퀀스 다음 값
);

-- read_multimodal 도 동일하게 처리
INSERT INTO read_multimodal (scene_key, attempt_num, occurred_at, image_2d_file_name, image_2d_uri, video_file_name, video_uri, stream_id, global_seq)
VALUES (
    '반려동물용품_CR01_강아지공룡알장난감_02024',
    2,
    '2023-09-23T00:00:00Z',
    '반려동물용품_CR01_강아지공룡알장난감_02024_02_20230923.jpg', -- 파일명 복원
    NULL, -- image_2d_uri
    '반려동물용품_CR01_강아지공룡알장난감_02024_00_20230923.mp4', -- video_file_name (시도번호 00)
    NULL, -- video_uri
    'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02024',
    0
);
```

#### 단계 3: API 응답 로직 강화 (Fallback Strategy)
Read Model 에 데이터가 없더라도 API 가 완전히 깨지지 않도록 (예: 500 에러가 아닌 404 또는 빈 객체 반환) 로직을 수정해야 합니다.

- **현재 상태**: API 가 `SELECT` 쿼리를 실행했을 때 결과가 없으면 빈 배열 `[]` 또는 `null` 을 반환해야 합니다.
- **수정 사항**: API 응답 핸들러에서 `SELECT` 결과가 `LIMIT` 또는 `OFFSET` 로 제한되었는지 확인하고, 결과가 없을 경우 **404 Not Found**를 반환하거나, **빈 객체 `{}`**를 반환하도록 로직을 명확히 합니다.
- **주의**: 만약 v1 API 가 "데이터가 없으면 에러"를 반환하도록 설계되어 있고, v2 API 가 "데이터가 없으면 빈 객체"를 반환하도록 설계되었다면, **v1 API 가 깨질 수 있습니다.** 이 경우 v1 API 로직을 수정해야 합니다.

### 3. 버전 관리 및 마이그레이션 절차 (v1 -> v2)
자료에는 v1/v2 정의가 없으므로, 일반적인 **비breaking change** 원칙을 적용합니다.

#### 단계 1: 버전 경로 분리 (Versioned API)
- **v1 API**: `/api/v1/grip-results` (기존 스키마 준수)
- **v2 API**: `/api/v2/grip-results` (수정된 스키마 또는 추가 필드 포함)
- **동작**: 클라이언트가 `/v1` 을 호출하면 v1 로직이, `/v2` 를 호출하면 v2 로직이 실행됩니다.

#### 단계 2: 신구 병행 운영 (Parallel Operation)
- **Read Model 분리**:
  - `read_grip_result_v1`: v1 API 에 필요한 필드만 포함 (기존 스키마 유지).
  - `read_grip_result_v2`: v2 API 에 필요한 필드 포함 (수정된 스키마).
- **Event Projection 분리**:
  - `multimodal-projector-v1`: `read_grip_result_v1` 을 업데이트.
  - `multimodal-projector-v2`: `read_grip_result_v2` 를 업데이트.
- **Event Store**: 하나의 Event Store 를 유지하되, 이벤트 메타데이터 (`version` 필드) 를 추가하여 어떤 프로jektor 가 처리할지 결정합니다.

#### 단계 3: 마이그레이션 및 컷오버 (Migration & Cutover)
1.  **데이터 마이그레이션**:
    - `read_grip_result_v1` 에 기존 데이터 복사.
    - `read_grip_result_v2` 에 기존 데이터 복사 (필드 변환 적용).
    ```sql
    INSERT INTO read_grip_result_v1 (scene_key, attempt_num, object_name, grip_succeed, ...)
    SELECT scene_key, attempt_num, object_name, grip_succeed, ... FROM read_grip_result;
    ```
2.  **프로젝터 업데이트**:
    - v1 프로jektor 를 `read_grip_result_v1` 로 연결.
    - v2 프로jektor 를 `read_grip_result_v2` 로 연결.
3.  **API Gateway 설정**:
    - `/api/v1/*` -> v1 로직 -> `read_grip_result_v1` 쿼리.
    - `/api/v2/*` -> v2 로직 -> `read_grip_result_v2` 쿼리.
4.  **컷오버 (Cutover)**:
    - v1 클라이언트 호환성을 유지하는 동안 v2 로직을 점진적으로 트래픽에 노출.
    - v1 클라이언트 호환성이 보장되면 v1 API 를下线 (deprecate).

### 결론
제공된 자료만으로는 "v1 API 가 깨진다"는 결론을 내릴 수 없습니다. 하지만 **Zod 검증 실패로 인해 Read Model 에 데이터가 생성되지 않는 것**은 명백합니다.

**가장 안전한 대응책**:
1.  **Zod 스키마 수정**: `null` 허용 (`z.optional(z.number())`) 로 변경하여 `insert.file.failed` 를 방지하고 정상적인 이벤트 적재를 유도합니다.
2.  **API 로직 강화**: 데이터가 없을 때 API 가 에러가 나지 않도록 (404 또는 빈 값 반환) 로직을 수정합니다.
3.  **병행 운영**: v1/v2 를 경로로 분리하여, v1 클라이언트는 v1 엔드포인트를 계속 호출하게 하여 호환성을 유지합니다.

```sql
-- [참고] Zod 스키마 수정을 위한 예시 (TypeScript/JS 코드 블록이므로 SQL 은 아님, SQL 은 아래 참조)
-- Zod Schema: camera_intrinsic_param: z.union([z.number(), z.null()])

-- [참고] Read Model 직접 복구 SQL (필요시)
-- 실패한 파일 (02024, 02025) 에 대한 scene_key 와 attempt_num 을 추출하여 직접 삽입
-- scene_key: '반려동물용품_CR01_강아지공룡알장난감_02024' (stream_id: 'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02024' 에서 추출)
-- attempt_num: 2 (파일명 '_02_' 에서 추출)

INSERT INTO read_grip_result (scene_key, attempt_num, object_name, grip_succeed, gripper_type, occurred_at, grip_2d_pose, grip_3d_pose, robot_tf, human_annotation_grasp, stream_id, global_seq)
SELECT 
    '반려동물용품_CR01_강아지공룡알장난감_02024' as scene_key,
    2 as attempt_num,
    '강아지공룡알장난감' as object_name, -- payload.objects[0].class_name
    0 as grip_succeed, -- 실패했으므로 0
    'finger' as gripper_type,
    '2023-09-23T00:00:00Z' as occurred_at, -- 파일명 날짜
    '[]'::jsonb as grip_2d_pose, -- 기본값
    '[]'::jsonb as grip_3d_pose, -- 기본값
    '{"rotation_3x3":[1,0,0,0,1,0,0,0,1],"translation_3x1":[0,0,0]}'::jsonb as robot_tf, -- 기본값
    '[]'::jsonb as human_annotation_grasp,
    'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02024' as stream_id,
    0 as global_seq -- 임시 시퀀스
FROM generate_series(1, 1); -- 1 회 실행

INSERT INTO read_multimodal (scene_key, attempt_num, occurred_at, image_2d_file_name, image_2d_uri, video_file_name, video_uri, stream_id, global_seq)
SELECT 
    '반려동물용품_CR01_강아지공룡알장난감_02024' as scene_key,
    2 as attempt_num,
    '2023-09-23T00:00:00Z' as occurred_at,
    '반려동물용품_CR01_강아지공룡알장난감_02024_02_20230923.jpg' as image_2d_file_name,
    NULL::text as image_2d_uri,
    '반려동물용품_CR01_강아지공룡알장난감_02024_00_20230923.mp4' as video_file_name,
    NULL::text as video_uri,
    'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02024' as stream_id,
    0 as global_seq
FROM generate_series(1, 1);
```
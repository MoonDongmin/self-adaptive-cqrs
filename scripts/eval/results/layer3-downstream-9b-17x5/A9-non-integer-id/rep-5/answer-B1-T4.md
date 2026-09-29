제공된 자료 (로그 및 스키마) 에 따르면, 현재 시스템은 `insert.file.failed` 로 인해 특정 파일 (예: `반려동물용품_CR01_강아지공룡알장난감_02022_01_20230923.json`) 의 적재가 실패하고 있으며, 이는 `read_grip_result` 와 같은 Read Model 에 해당 레코드 (scene_key, attempt_num) 가 생성되지 않거나 `insert.file.failed` 로그만 남게 되는 상황을 의미합니다.

**주의:** 제공된 자료에는 API 클라이언트의 구조, 기존 API 버전 (v1), 또는 마이그레이션 절차에 대한 정보가 포함되어 있지 않습니다. 따라서 "기존 v1 API 클라이언트가 깨지지 않게 하려면"이라는 전제에 따라 구체적인 버전 경로나 마이그레이션 절차를 설계할 수는 없습니다.

자료에 근거하여 **현재 시스템의 상태**와 **해결을 위한 SQL 로직**만 제시합니다.

### 1. 현재 시스템 상태 분석 (자료 기반)
*   **문제 원인:** `insert.file.failed` 로그가 발생했습니다.
    *   `reason`: Zod 검증 오류 (`expected: "int", received: number`).
    *   영향 파일: `반려동물용품_CR01_강아지공룡알장난감_02022_01_20230923.json`, `반려동물용품_CR01_강아지공룡알장난감_02023_01_20230923.json`.
*   **영향 Read Model:**
    *   **read_grip_result:** 해당 scene_key 와 attempt_num 에 대한 레코드가 `insert.file.failed` 로 인해 생성되지 않았습니다.
    *   **read_multimodal:** 해당 scene_key 와 attempt_num 에 대한 레코드가 생성되지 않았습니다.
*   **영향 API:** 해당 scene_key 와 attempt_num 을 키로 조회하는 API 호출 시, 해당 레코드가 없는 경우 404 에러 또는 빈 결과가 반환될 수 있습니다.

### 2. 해결을 위한 SQL 로직 (Postgres)
적재 실패로 인해 생성되지 않았을 것으로 예상되는 Read Model 레코드를 수동으로 복구하거나, 조회 시 빈 값을 반환하도록 처리하는 쿼리입니다.

#### A. 실패한 파일에 대한 Read Model 레코드 생성 (복구용)
만약 비즈니스 로직상 실패한 파일이라도 DB 에는 `grip_succeed=0` 로 기록해야 한다면 다음 쿼리를 실행합니다.

```sql
INSERT INTO read_grip_result (
    scene_key,
    attempt_num,
    object_name,
    grip_succeed,
    gripper_type,
    occurred_at,
    grip_2d_pose,
    grip_3d_pose,
    robot_tf,
    human_annotation_grasp,
    stream_id,
    global_seq
)
SELECT 
    '반려동물용품_CR01_강아지공룡알장난감_02022' || '_' || attempt_num::text || '_01_20230923' as scene_key,
    attempt_num,
    '강아지공룡알장난감' as object_name,
    0 as grip_succeed,
    'finger' as gripper_type,
    '2023-09-23T00:00:00Z' as occurred_at,
    '{"xl":0,"xr":0,"yl":0,"yr":0}'::jsonb as grip_2d_pose,
    '{"x1":0,"y1":0,"z1":0,"x2":0,"y2":0,"z2":0,"x3":0,"y3":0,"z3":0,"x4":0,"y4":0,"z4":0,"x5":0,"y5":0,"z5":0,"x6":0,"y6":0,"z6":0,"x7":0,"y7":0,"z7":0,"x8":0,"y8":0,"z8":0}'::jsonb as grip_3d_pose,
    '{"rotation_3x3":[1,0,0,0,1,0,0,0,1],"translation_3x1":[0,0,0]}'::jsonb as robot_tf,
    '[]'::jsonb as human_annotation_grasp,
    'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02022_' || attempt_num::text,
    0 as global_seq
FROM (VALUES (1), (2), (3)) as t(attempt_num)
WHERE NOT EXISTS (
    SELECT 1 FROM read_grip_result 
    WHERE scene_key = '반려동물용품_CR01_강아지공룡알장난감_02022_' || t.attempt_num::text
    AND attempt_num = t.attempt_num
);

INSERT INTO read_multimodal (
    scene_key,
    attempt_num,
    occurred_at,
    image_2d_file_name,
    image_2d_uri,
    video_file_name,
    video_uri,
    stream_id,
    global_seq
)
SELECT 
    '반려동물용품_CR01_강아지공룡알장난감_02022' || '_' || attempt_num::text || '_01_20230923' as scene_key,
    attempt_num,
    '2023-09-23T00:00:00Z' as occurred_at,
    '반려동물용품_CR01_강아지공룡알장난감_02022_' || attempt_num::text || '_01_20230923.jpg' as image_2d_file_name,
    NULL as image_2d_uri,
    '반려동물용품_CR01_강아지공룡알장난감_02022_00_20230923.mp4' as video_file_name,
    NULL as video_uri,
    'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02022_' || attempt_num::text,
    0 as global_seq
FROM (VALUES (1), (2), (3)) as t(attempt_num)
WHERE NOT EXISTS (
    SELECT 1 FROM read_multimodal 
    WHERE scene_key = '반려동물용품_CR01_강아지공룡알장난감_02022_' || t.attempt_num::text
    AND attempt_num = t.attempt_num
);
```

#### B. 실패한 파일에 대한 Read Model 레코드 삭제 (재시도용)
만약 실패한 레코드가 이미 DB 에 존재하여 (예: 이전 실패 시점의 잔여 데이터) 이를 삭제해야 한다면 다음 쿼리를 실행합니다.

```sql
DELETE FROM read_grip_result
WHERE scene_key LIKE '반려동물용품_CR01_강아지공룡알장난감_0202%'
  AND attempt_num IN (1, 2, 3);

DELETE FROM read_multimodal
WHERE scene_key LIKE '반려동물용품_CR01_강아지공룡알장난감_0202%'
  AND attempt_num IN (1, 2, 3);
```

### 3. API 클라이언트 호환성 및 마이그레이션에 대한 답변
**제공된 자료에는 API 클라이언트의 버전 (v1 등) 이나 변경 사항에 대한 정보가 없으므로, "기존 v1 API 클라이언트가 깨지지 않게 하려면"이라는 질문에 대한 구체적인 버전 경로나 마이그레이션 절차를 작성할 수 없습니다.**

자료에 없는 사실을 지어내지 않는 원칙에 따라, 다음과 같이 답변합니다:

1.  **현황:** 현재 시스템은 Event Sourcing + CQRS 구조로 운영 중이며, `insert.file.failed` 로 인해 특정 시나리오 (scene_key, attempt_num) 의 Read Model (`read_grip_result`, `read_multimodal`) 에 데이터가 생성되지 않았습니다.
2.  **API 영향:** 해당 시나리오를 조회하는 API 호출 시 데이터 누락 (404 또는 빈 배열) 이 발생할 수 있습니다.
3.  **필요한 정보:** 기존 v1 API 의 엔드포인트 경로, 파라미터 스키마, 그리고 변경될 v2 API 의 스키마가 제공되어야 구체적인 호환성 전략 (버전 경로 분리, 헤더 기반 라우팅 등) 을 설계할 수 있습니다.
4.  **추천 조치 (자료 기반):**
    *   **수동 복구:** 위 SQL 쿼리를 통해 실패한 시나리오에 대한 Read Model 데이터를 `grip_succeed=0` 상태로 생성하거나, 불필요한 데이터를 삭제하여 API 응답의 일관성을 유지하세요.
    *   **프로젝터 수정:** `insert.file.failed` 로 인해 이벤트가 ES 에 저장되지 않았거나, Projection 로직에서 해당 이벤트를 Skip 처리하도록 로직을 수정하여, 실패한 파일에 대한 Read Model 업데이트가 차단되도록 해야 합니다. (현재 로그는 `insert.file.failed` 후 `insert.batch.done` 로 진행되었으므로, Projection 이 실패한 이벤트를 처리하지 않았을 가능성이 높습니다.)
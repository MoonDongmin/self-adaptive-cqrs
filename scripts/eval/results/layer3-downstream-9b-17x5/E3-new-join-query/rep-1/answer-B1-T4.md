제공된 자료 (로그 및 Read Model 스키마) 에 따르면, 현재 시스템은 `insight.card.request` 로 조회된 데이터가 `insight.card.miss` 로 반환되고 있으며, 그 이유는 "파지 결과와 해당 시도의 이미지·영상 경로를 한 화면에서 함께 보고 싶다"는 요청이 기존 Read Model (`read_grip_result` 또는 `read_multimodal`) 에 통합되어 있지 않기 때문입니다.

기존 v1 API 클라이언트가 깨지지 않도록 하려면 **버전 관리 전략 (API Versioning)** 을 적용해야 합니다. 자료에는 API 스키마나 버전 정보가 명시되어 있지 않으므로, 업계 표준인 URL 경로 기반 버전 관리 방식을 가정하여 답변합니다.

### 1. 버전 경로 전략 (URL Versioning)
기존 클라이언트가 `GET /api/v1/insight-card/{id}` 를 호출하는 것을 유지하고, 새로운 기능을 위해 `GET /api/v2/insight-card/{id}` 경로를 추가합니다.

*   **v1 API (`/api/v1/insight-card`):** 기존 로직 유지. 요청 시 `image` 와 `video` 필드가 누락되거나 빈 객체로 반환되도록 하거나, 해당 필드가 없는 경우 404 에러를 반환하도록 기존 스키마를 그대로 사용합니다.
*   **v2 API (`/api/v2/insight-card`):** 새로운 로직 적용. `read_grip_result` 와 `read_multimodal` 데이터를 JOIN 하여, `image` (2D 이미지 URI) 와 `video` (비디오 URI) 필드를 포함하는 응답을 반환합니다.

### 2. 데이터 모델링 및 스키마 변경 (Read Model Update)
기존 Read Model (`read_grip_result`, `read_multimodal`) 은 별도의 테이블로 존재하므로, 새로운 필드를 추가하는 것이 가장 안전합니다.

*   **변경 사항:** `read_grip_result` 테이블에 `image_2d_uri` 와 `video_uri` 컬럼을 추가합니다.
    *   *주의:* `read_multimodal` 테이블의 `image_2d_uri` 와 `video_uri` 를 그대로 가져오거나, `read_grip_result` 에 직접 저장하는지 결정해야 합니다.
    *   **추천:** `read_grip_result` 에 `image_2d_uri` 와 `video_uri` 를 추가하고, `read_multimodal` 테이블은 `image_2d_uri` 와 `video_uri` 가 NULL 이거나 비어있는 경우에만 사용되도록 하거나, `read_grip_result` 만으로 충분하도록 마이그레이션합니다.
    *   **구체적 스키마 변경 (Postgres):**
        ```sql
        -- read_grip_result 테이블에 미디어 URI 컬럼 추가
        ALTER TABLE read_grip_result 
        ADD COLUMN image_2d_uri TEXT,
        ADD COLUMN video_uri TEXT;
        ```
    *   *대안:* 만약 `read_multimodal` 을 계속 유지하면서 JOIN 을 원한다면, `read_grip_result` 에는 미디어 관련 컬럼을 추가하지 않고, 조회 쿼리에서 두 테이블을 JOIN 하도록 로직을 변경합니다. 하지만 질문의 의도 ("한 화면에서 함께 보고 싶다") 는 응답 객체 내부에 포함되는 것을 의미하므로, `read_grip_result` 에 컬럼을 추가하는 것이 CQRS 의 일관성 유지에 더 적합해 보입니다.

### 3. 이벤트 소싱 프로세스 변경 (Event Projection Update)
`grip-attempt` 이벤트가 발행될 때, 해당 시도의 이미지/비디오 파일이 생성되었는지 확인하고, `read_grip_result` 에 미디어 URI 를 채워 넣는 로직을 추가해야 합니다.

*   **필요한 이벤트:** `insert.file.ok` (자료 로그에 존재) 또는 `insert.file.created` 같은 이벤트가 필요합니다.
*   **프로젝터 로직 변경:**
    1.  `grip-attempt` 이벤트가 들어오면, `read_grip_result` 를 업데이트합니다.
    2.  동시에 `insert.file.ok` 이벤트 (또는 같은 시도의 파일 생성 이벤트) 를 감지하면, 해당 `stream_id` 와 `attempt_num` 을 매핑하여 `read_grip_result` 의 `image_2d_uri` 와 `video_uri` 를 업데이트합니다.
    3.  만약 `insert.file.ok` 이벤트가 `stream_id` 에 `grip-attempt:` 접두사가 붙어 있다면, `stream_id` 를 기준으로 `read_grip_result` 의 `stream_id` 와 매칭하여 업데이트합니다.

### 4. 마이그레이션 및 컷오버 절차

#### 단계 1: 데이터 마이그레이션 (Backfill)
기존에 생성된 `read_grip_result` 레코드에 미디어 URI 가 누락되어 있다면, DB 에 직접 데이터를 채워 넣어야 합니다.
```sql
-- read_grip_result 에 누락된 미디어 URI 채우기 (예시: read_multimodal 에서 가져오는 경우)
-- 실제 구현 시에는 파일 시스템 또는 S3 에서 URI 를 조회하는 로직이 필요할 수 있음
UPDATE read_grip_result gr
SET image_2d_uri = m.image_2d_uri,
    video_uri = m.video_uri
FROM read_multimodal m
WHERE gr.scene_key = m.scene_key
  AND gr.attempt_num = m.attempt_num
  AND (gr.image_2d_uri IS NULL OR gr.video_uri IS NULL);
```

#### 단계 2: API 서버 배포 (v2 병행)
*   API 서버를 배포하여 `/api/v2/insight-card` 엔드포인트를 추가합니다.
*   v2 엔드포인트는 새로 추가된 `read_grip_result` 컬럼을 사용하여 `image_2d_uri` 와 `video_uri` 를 응답합니다.
*   v1 엔드포인트는 변경되지 않은 상태로 유지합니다.

#### 단계 3: 클라이언트 배포 (Gradual Rollout)
*   **옵션 A (모든 클라이언트):** 모든 클라이언트에서 v2 API 를 호출하도록 업데이트합니다. (v1 은 즉시 폐기)
*   **옵션 B (기능 플래그):** 클라이언트에서 API 버전을 감지하거나, 기능 플래그를 통해 v2 를 호출합니다.
    *   클라이언트 A: `GET /api/v1/insight-card` 호출 -> `image`, `video` 필드가 없음 (기존 동작 유지)
    *   클라이언트 B: `GET /api/v2/insight-card` 호출 -> `image`, `video` 필드가 있음 (새로운 동작)

#### 단계 4: 컷오버 (Cutover)
*   v1 API 에서 `image` 와 `video` 필드가 필수 필드로 변경되도록 스키마를 업데이트합니다.
*   v1 엔드포인트를 v2 로 리네임하거나, v1 을 완전히 제거합니다.
*   이때 v1 클라이언트가 깨지지 않도록 하기 위해, v1 API 가 v2 로직을 그대로 사용하도록 하거나, v1 API 가 `image` 와 `video` 필드가 없는 경우 404 를 반환하도록 하되, 클라이언트는 404 를 처리하여 v2 로 재시도하도록 로직을 수정해야 합니다.
*   **가장 안전한 방법:** v1 API 가 v2 로직을 그대로 사용하도록 하되, `image` 와 `video` 필드가 NULL 인 경우 빈 문자열 (`""`) 을 반환하도록 변경합니다. 이렇게 하면 기존 클라이언트가 필드를 받아서 처리할 수 있고, 새로운 클라이언트는 필드가 채워진 값을 받습니다.

### 요약: 구체적 단계

1.  **DB 스키마 변경:** `read_grip_result` 테이블에 `image_2d_uri`, `video_uri` 컬럼 추가.
2.  **프로젝터 로직 수정:** `grip-attempt` 이벤트 처리 시, 관련 파일 생성 이벤트 (`insert.file.ok`) 를 감지하여 `read_grip_result` 의 미디어 컬럼을 업데이트하도록 로직 추가.
3.  **백필 (Backfill):** 기존 DB 데이터에 미디어 컬럼이 없는 레코드를 찾아, `read_multimodal` 테이블과 JOIN 하여 데이터 채우기.
4.  **API 배포:**
    *   `/api/v1/insight-card`: 기존 로직 유지 (미디어 필드 없음 또는 NULL 반환).
    *   `/api/v2/insight-card`: `read_grip_result` 와 `read_multimodal` JOIN 로직 적용 (미디어 필드 포함).
5.  **클라이언트 업데이트:**
    *   기존 클라이언트는 v1 API 를 계속 호출.
    *   새 클라이언트는 v2 API 를 호출.
6.  **컷오버:**
    *   v1 API 응답 스키마를 업데이트하여 `image`, `video` 필드를 포함하도록 변경 (NULL 이 허용됨).
    *   v1 API 를 v2 로 리네임하거나, v1 을 삭제하고 모든 트래픽을 v2 로 유도.

이 절차는 기존 v1 클라이언트가 `image` 와 `video` 필드가 없는 응답을 받더라도 깨지지 않고 (NULL 처리), 새 클라이언트는 해당 필드를 포함한 응답을 받을 수 있게 합니다.
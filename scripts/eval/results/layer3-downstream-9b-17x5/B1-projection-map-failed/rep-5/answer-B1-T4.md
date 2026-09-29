제공된 자료 (로그 및 스키마) 에 따르면, 현재 시스템은 `read_grip_result` 와 `read_multimodal` 테이블을 사용하여 `grip-attempt:scene_key` 형식의 스트림 ID 를 기반으로 데이터를 조회하고 있습니다.

**[중요한 사실 확인]**
제공된 자료 (로그, 스키마, 상황 설명) 에서는 **기존 v1 API 의 정의, v1 API 가 사용하는 쿼리 패턴, 또는 v1 API 가 어떤 버전 경로 (예: `/api/v1/...`) 를 사용하는지**에 대한 정보가 전혀 포함되어 있지 않습니다.

따라서 "기존 v1 API 클라이언트가 깨지지 않게 하려면 무엇을 해야 하는가?"라는 질문에 대해 **자료에 없는 사실 (가상의 v1 API 구조 등) 을 근거로 답변할 수 없습니다.**

이러한 제약 하에, 제공된 자료만 근거로 할 수 있는 **가장 안전한 변경 전략**은 다음과 같습니다.

### 1. 분석 결과
*   **변경 사항:** `read_grip_result` 와 `read_multimodal` 테이블의 스키마 변경 (추가 필드 등) 이 예상됩니다.
*   **영향:** `stream_id` 와 `global_seq` 는 유지되지만, `object_name`, `grip_succeed`, `robot_tf` 등의 필드가 추가되거나 변경될 수 있습니다.
*   **API 의존성:** v1 API 가 `stream_id` 나 `global_seq` 를 직접 쿼리 파라미터로 사용하는지, 아니면 `scene_key` 와 `attempt_num` 을 사용하는지, 혹은 특정 필드 값을 반환하는지 자료에 명시되지 않았습니다.

### 2. 적용 가능한 구체적 단계 (자료 기반)
자료에 명시된 `stream_id` 와 `global_seq` 필드가 두 Read Model 에서 모두 **Primary Key** 또는 **추적 키 (Tracking Key)** 로 정의되어 있으므로, 이 두 필드를 기준으로 한 API 엔드포인트는 스키마 변경과 무관하게 정상 작동할 가능성이 높습니다.

**추천 절차:**

1.  **버전 경로 분리 (Versioning)**
    *   새로운 API 엔드포인트를 별도의 버전 경로에 배치합니다.
    *   예: 기존 `/api/v1/read_grip_result` 대신 `/api/v2/read_grip_result` 를 생성합니다.
    *   **근거:** 자료에 v1 API 의 존재는 언급되었으나, v1 API 가 어떤 필드를 반환하는지는 없습니다. 따라서 v1 경로의 스키마를 건드리지 않고 새 경로를 만드는 것이 유일한 안전장치입니다.

2.  **신구 병행 운영 (Parallel Operation)**
    *   **Read Model 변경:** `read_grip_result` 와 `read_multimodal` 테이블에 새로운 필드를 추가하거나 수정합니다.
    *   **Projection 로직 수정:** `grip-result-projector` 에서 `projection.map` 로직을 수정하여, 새로운 필드 (예: `object_name`, `robot_tf` 등) 를 `read_grip_result` 에 매핑되도록 합니다. (자료의 `projection.map.failed` 로그가 이를 시사함)
    *   **API 구현:**
        *   `/api/v1/...` : 기존 스키마 (변경 전) 를 그대로 반환합니다.
        *   `/api/v2/...` : 변경된 스키마 (변경 후) 를 반환합니다.
    *   **결과:** v1 클라이언트는 `/api/v1` 을 호출하므로 깨지지 않습니다. v2 클라이언트는 `/api/v2` 를 호출하여 새 기능을 사용합니다.

3.  **마이그레이션 및 컷오버 (Migration & Cutover)**
    *   **데이터 마이그레이션:** 기존 v1 데이터 (변경 전 스키마) 가 새 스키마와 호환되는지 확인합니다. 만약 필드가 추가되었다면 `INSERT` 로 새 필드를 채우거나 `NULL` 처리합니다. 만약 필드가 제거되었다면 `DROP` 또는 `NULL` 처리합니다.
    *   **클라이언트 배포:** v1 클라이언트와 v2 클라이언트를 동시에 배포합니다.
    *   **컷오버 (Cutover):**
        *   모든 v1 클라이언트가 새 버전으로 업데이트될 때까지는 `/api/v1` 을 계속 사용합니다.
        *   v1 클라이언트 업데이트가 완료되면, `/api/v1` 을 `/api/v2` 로 리디렉션하거나, `/api/v1` 을 서브디렉토리로 유지하되 트래픽을 `/api/v2` 로 유도합니다.
        *   **주의:** 만약 v1 API 가 `stream_id` 기반 조회를 사용한다면, `stream_id` 필드가 삭제되지 않는 한 v1 API 는 그대로 작동합니다. 하지만 `stream_id` 가 `grip-attempt:scene_key` 로 파싱되는 로직이 있다면, `scene_key` 파싱 로직이 변경되지 않는 한 안전합니다.

### 3. SQL 코드 (필요 시)
자료에 명시된 스키마 변경 사항 (예: 필드 추가) 을 적용하는 SQL 은 다음과 같습니다. (구체적인 변경 내용은 자료에 없으므로, 일반적인 `ALTER TABLE` 예시입니다.)

```sql
-- read_grip_result 에 새로운 필드 추가 (예시: object_name, grip_succeed 등 이미 정의되어 있으나, 추가 필드가 있다면)
-- 자료에 따르면 이미 정의되어 있으므로, 만약 추가 필드가 있다면 다음과 같이 추가합니다.
ALTER TABLE read_grip_result 
ADD COLUMN IF NOT EXISTS new_field_name VARCHAR(255);

-- read_multimodal 에 새로운 필드 추가 (예시: image_2d_uri, video_uri 등 이미 정의되어 있으나, 추후 매핑 필드가 있다면)
ALTER TABLE read_multimodal 
ADD COLUMN IF NOT EXISTS new_media_field_name TEXT;

-- 인덱스 유지 (stream_id, global_seq 는 이미 PK 또는 인덱스일 가능성이 높음)
-- 만약 composite index 가 필요하다면
CREATE INDEX IF NOT EXISTS idx_read_grip_result_stream_seq ON read_grip_result(stream_id, global_seq);
CREATE INDEX IF NOT EXISTS idx_read_multimodal_stream_seq ON read_multimodal(stream_id, global_seq);
```

**결론:** 자료에 v1 API 의 구체적인 정의가 없으므로, **API 버전화 (Versioning)** 를 통해 새 스키마를 `/api/v2` 경로로 제공하고, 기존 `/api/v1` 경로는 변경하지 않는 것이 유일한 해결책입니다.
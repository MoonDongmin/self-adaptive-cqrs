기존 v1 API 클라이언트가 깨지지 않도록 하려면 **하위 호환성 (Backward Compatibility)** 을 보장하는 전략을 따라야 합니다. 제공된 자료에 따르면 신규 Read Model(`read_grip_result_with_media`) 은 기존 v1 테이블 (`read_grip_result`, `read_multimodal`) 과 무관하게 **추가 (Add)** 되는 것이며, 기존 엔드포인트와 서비스 메서드는 완전 보존됩니다.

구체적인 단계는 다음과 같습니다.

### 1. 버전 경로 분리 (Versioned Routes)
신규 기능은 기존 API 경로에 중첩되지 않는 별도의 버전 경로를 사용하여 제공합니다.
- **기존 v1 경로 유지:** `POST /projection/grip-result`, `POST /projection/multimodal`
- **신규 v2 경로 추가:** `POST /projection/v2/grip-result-with-media` 또는 `POST /projection/grip-result-with-media` (문맥상 v2 로직이 적용되므로 경로명은 동일하되, 백엔드 내부 로직이 v2 로직을 따름)
- **추천:** 클라이언트 측에서 `Accept-Version` 헤더를 통해 버전을 명시하거나, 서버 측에서 경로에 버전을 포함 (`/v1/projection/grip-result`, `/v2/projection/grip-result-with-media`) 하여 완전히 분리합니다.

### 2. 신규 Read Model 병행 운영 (Parallel Operation)
DDL 실행 시 기존 테이블을 삭제하지 않고, 신규 테이블만 생성하여 두 모델이 동시에 존재하도록 합니다.
- `read_grip_result` (v1 전용)
- `read_multimodal` (v1 전용)
- `read_grip_result_with_media` (v2 전용)
- **주의:** `read_grip_result_with_media` 에는 `read_grip_result` 와 `read_multimodal` 의 필드가 모두 포함되므로, v1 클라이언트가 `read_grip_result` 를 조회하더라도 필드 누락 없이 정상 작동하며, v2 클라이언트는 `read_grip_result_with_media` 를 조회하여 통합 데이터를 얻습니다.

### 3. 마이그레이션 및 컷오버 절차 (Human-in-the-loop)
자원의 무손상과 데이터 일관성을 위해 다음 순서대로 진행합니다.

1.  **DDL 실행 (Schema Evolution):**
    ```sql
    CREATE TABLE read_grip_result_with_media (
        scene_key VARCHAR NOT NULL,
        attempt_num SMALLINT NOT NULL,
        -- ... 필드 정의 (자료 참고) ...
        PRIMARY KEY (scene_key, attempt_num)
    );
    ```
    기존 `read_grip_result` 및 `read_multimodal` 테이블은 건드리지 않습니다.

2.  **Insight 카드 등록:**
    ```sql
    INSERT INTO insight_entity (entity_name, kind, purpose, key_columns)
    VALUES ('read_grip_result_with_media', 'read_model', '...', 'scene_key, attempt_num')
    ON CONFLICT (entity_name) DO UPDATE SET purpose = EXCLUDED.purpose, key_columns = EXCLUDED.key_columns;

    INSERT INTO insight_field (entity_name, field_name, data_type, meaning, display_order)
    VALUES
      ('read_grip_result_with_media', 'scene_key', 'varchar', '...', 1),
      -- ... 필드 정의 (자료 참고) ...
      ('read_grip_result_with_media', 'global_seq', 'bigint', '...', 14)
    ON CONFLICT (entity_name, field_name) DO UPDATE SET data_type = EXCLUDED.data_type, meaning = EXCLUDED.meaning, display_order = EXCLUDED.display_order;
    ```

3.  **API 컷오버 (API Cutover):**
    - **v1 클라이언트:** 기존 엔드포인트 (`/projection/grip-result`, `/projection/multimodal`) 를 계속 호출합니다. 이 엔드포인트는 기존 로직 (`GripResultProjector`, `MultiModalProjector`) 으로만 처리되므로 변경 사항에 영향을 받지 않습니다.
    - **v2 클라이언트:** 신규 엔드포인트 (`/projection/grip-result-with-media`) 를 호출합니다. 이 엔드포인트는 신규 로직 (`GripResultWithMediaProjector`) 으로 처리되어 통합 데이터를 반환합니다.
    - **데이터 동기화:** `insert-all` 엔드포인트를 호출하면, 신규 프로젝터 (`GripResultWithMediaProjector`) 가 이벤트 스토어에서 데이터를 읽어 `read_grip_result_with_media` 테이블에 업로드합니다.

4.  **검증:**
    - v1 엔드포인트 호출 시 기존 필드만 반환되는지 확인.
    - v2 엔드포인트 호출 시 `image_2d_file_name`, `video_file_name` 필드가 포함되는지 확인.

### 4. 롤백 계획 (Rollback Plan)
만약 문제가 발생하면 즉시 변경 사항을 되돌릴 수 있어야 합니다.
- **DDL 롤백:** `DROP TABLE read_grip_result_with_media;`
- **Insight 카드 삭제:** `DELETE FROM insight_entity WHERE entity_name = 'read_grip_result_with_media';` 및 `DELETE FROM insight_field WHERE entity_name = 'read_grip_result_with_media';`
- **API 복구:** 신규 엔드포인트 (`/projection/grip-result-with-media`) 를 제거하고 기존 v1 엔드포인트만 남김.
- **데이터 정리:** `read_grip_result_with_media` 테이블에 저장된 데이터는 `read_grip_result` 와 `read_multimodal` 테이블에 이미 존재하므로, 테이블 삭제 후에도 데이터는 손실되지 않습니다.

### 요약
기존 v1 API 클라이언트는 **변경 사항에 영향을 받지 않습니다**. 기존 엔드포인트와 테이블은 그대로 유지되고, 신규 기능은 **새로운 엔드포인트와 테이블**로 추가되므로, 클라이언트 측에서는 버전을 구분하여 호출하거나, 서버 측에서 경로에 버전을 명시하여 트래픽을 분리하는 것으로 충분합니다.
제공된 자료 (로그 및 스키마) 에 따르면, 현재 `read_multimodal` 테이블의 정합성 위반 (`projection.integrity.violation`) 이 발생하고 있으며, 이는 `modalFileNameAttemptConsistency`(이미지 파일명의 attempt 번호 불일치) 와 `modalFileNameSceneConsistency`(비디오 파일명의 scene 번호 불일치) 로 구체화됩니다.

**중요한 사실 확인:**
1.  **API 버전 정보 부재:** 제공된 자료 (로그, 스키마) 에는 현재 운영 중인 API 의 버전 (예: `/api/v1`, `/api/v2`) 이나, 클라이언트가 어떤 버전 경로를 사용하는지에 대한 정보가 없습니다.
2.  **데이터 스키마 변경 부재:** 제공된 자료는 Read Model 의 **현재 상태**와 **오류 로그**를 보여줄 뿐, API 응답 스키마가 어떻게 변경되어야 하는지, 혹은 어떤 필드가 추가/변경되어야 하는지에 대한 정의가 없습니다.

따라서 "기존 v1 API 클라이언트가 깨지지 않게 하려면 무엇을 해야 하는가"라는 질문은 **자료에 근거할 수 없는 추측**이 됩니다.

하지만, **Postgres 기반 이벤트 소싱 + CQRS 아키텍처**와 **Read Model 정합성 위반 해결**이라는 맥락에서, 만약 API 응답 구조가 Read Model 의 스키마 (`read_multimodal`) 에 의존하고 있다면, 정합성 위반을 방지하거나 처리하기 위해 고려해야 할 **일반적인 백엔드 엔지니어링 원칙**은 다음과 같습니다.

### 1. API 응답 스키마의 독립성 유지 (Backward Compatibility)
*   **원칙:** API 클라이언트가 깨지지 않으려면, API 가 반환하는 JSON 구조 (Response Schema) 는 변경되지 않아야 합니다.
*   **현황:** 현재 `read_multimodal` 테이블의 스키마는 `image_2d_file_name` 과 `video_file_name` 필드가 존재합니다. 만약 API 가 이 필드 값을 그대로 반환하고 있다면, 정합성 위반 (예: `02` vs `01` 불일치) 이 발생하더라도 API 는 여전히 해당 필드를 반환할 것입니다.
*   **조치:** API 응답 스키마를 변경하지 않고, **백엔드 서비스 (Read Model Service)** 내부에서 데이터 정합성 문제를 해결하는 것이 우선입니다. API 레이어는 단순히 DB 에서 조회된 데이터를 그대로 반환하면 되므로, 클라이언트는 깨지지 않습니다.

### 2. Read Model 정합성 위반 해결 전략 (백엔드 작업)
API 를 변경하지 않고 문제를 해결하려면, `read_multimodal` 테이블에 저장된 데이터를 수정하거나, 해당 데이터를 조회하는 쿼리를 변경해야 합니다.

*   **전략 A: 데이터 수정 (Projection Correction)**
    *   로그에 나타난 `projection.integrity.violation` 을 감지한 후, 해당 시퀀스 (`global_seq`) 를 다시 처리하여 올바른 데이터로 덮어쓰거나, 충돌이 있는 행을 삭제하고 재프로젝션해야 합니다.
    *   **주의:** 이 작업은 DB 내의 `read_multimodal` 테이블만 수정하면 되며, API 응답은 수정된 DB 데이터를 기반으로 하므로 클라이언트 호환성에 영향을 주지 않습니다.

*   **전략 B: 쿼리 로직 변경 (Filtering)**
    *   API 가 특정 `scene_key` 또는 `attempt_num` 을 요청할 때, 정합성 위반이 있는 행을 필터링하여 반환하지 않도록 쿼리를 수정할 수 있습니다.
    *   **예시:** `read_multimodal` 에서 `image_2d_file_name` 의 attempt 부분과 `attempt_num` 컬럼이 일치하지 않는 행을 `WHERE` 절에서 제외하거나, `JOIN` 시 `INNER JOIN` 대신 `LEFT JOIN` 을 사용하여 누락된 데이터만 필터링하는 로직을 적용할 수 있습니다.

### 3. 구체적인 단계 (가정: API 스키마 변경 불가)

자료에 명시된 정보만 근거로 할 때, **API 버전 변경 없이** 기존 v1 클라이언트를 보호하는 절차는 다음과 같습니다.

#### 단계 1: Read Model 정합성 복구 (DB 작업)
정합성 위반 로그 (`projection.integrity.violation`) 를 모니터링하여, 위반된 `stream_id` 와 `global_seq` 를 식별합니다.
*   **SQL:** 위반된 행을 찾아, 해당 `stream_id` 에 매핑된 모든 이벤트 (이미지 및 비디오) 를 기반으로 올바른 `attempt_num` 을 가진 행만 `read_multimodal` 테이블에 유지하거나, 충돌을 일으키는 행을 삭제합니다.
    ```sql
    -- 예시: 정합성 위반 행을 식별하고, 해당 stream_id 에 대해 attempt_num 이 일치하지 않는 행을 삭제하는 쿼리
    -- (실제 구현 시에는 위반 로그의 detail 에 있는 observed 값과 expected 값 비교 로직 필요)
    DELETE FROM read_multimodal
    WHERE stream_id = 'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02026'
    AND attempt_num != (
        SELECT MAX(attempt_num) FROM read_multimodal WHERE stream_id = 'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02026'
    );
    ```
    *   **이유:** API 는 DB 에서 데이터를 조회하므로, DB 에 올바른 데이터만 남으면 API 응답은 기존 v1 클라이언트가 기대하는 형식을 유지합니다.

#### 단계 2: Projection 로직 수정 (코드 작업)
`multimodal-projector` 에서 발생하는 정합성 위반을 방지하기 위해, 이벤트 매핑 (`projection.event.mapped`) 로직을 수정해야 합니다.
*   **조치:** 이미지 이벤트와 비디오 이벤트를 매핑할 때, `attempt_num` (이미지) 과 `scene_key` (비디오) 의 불일치를 허용하지 않도록 매핑 키 (Key) 생성 로직을 강화합니다.
*   **예시:** 비디오 파일명 파싱 시 `scene_key` 를 추출하고, 이미지 파일명 파싱 시 `attempt_num` 을 추출한 후, 두 값이 서로 다른 시퀀스 (`global_seq`) 에 속하는지 확인하여 매핑을 거부하거나, 올바른 시퀀스로 재매핑합니다.

#### 단계 3: 모니터링 및 검증
*   `projection.integrity.violation` 로그가 더 이상 발생하지 않는지 확인합니다.
*   API 엔드포인트 (예: `/api/v1/multimodal`) 에 대해 기존 v1 클라이언트가 정상적으로 데이터를 반환하는지 확인합니다.

### 결론
자료에 **API 버전 정보나 응답 스키마 변경 사항이 없으므로**, "버전 경로 변경"이나 "신구 병행 운영"은 **필요하지 않습니다**.

기존 v1 API 클라이언트를 깨뜨리지 않으려면 **API 응답 스키마를 변경하지 않고**, **Read Model (`read_multimodal`) 의 데이터 정합성만 수정**하는 것이 유일한 해결책입니다.

**추천 조치:**
1.  **DB 수정:** `read_multimodal` 테이블에서 정합성 위반 (attempt_num 불일치, scene_key 불일치) 을 일으키는 행을 삭제하거나 수정하여, `stream_id` 와 `attempt_num` (또는 `scene_key`) 간의 일관성을 확보합니다.
2.  **Projection 수정:** 이벤트 매핑 로직을 개선하여, 같은 `stream_id` 에 대해 매핑되는 이미지와 비디오의 메타데이터 (attempt, scene) 가 일치하도록 합니다.
3.  **API 유지:** API 코드와 버전 (`/api/v1/...`) 을 변경하지 않습니다.

```sql
-- Read Model 정합성 위반 행을 식별하여 삭제하는 쿼리 (예시)
-- 조건: 같은 stream_id 가 있으면, attempt_num 이 다른 행 중 하나를 삭제하여 일관성 유지
-- 실제 적용 시에는 위반 로그의 detail 에 있는 observed 값과 현재 DB 값을 비교하여 결정해야 함
DELETE FROM read_multimodal
WHERE stream_id = 'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02026'
AND attempt_num != 1; -- 예시: attempt 1 이 올바른 값이라면, attempt 2 행 삭제

-- 비디오 파일명 (scene_key) 불일치 처리
-- 조건: 같은 stream_id 가 있으면, video_file_name 에서 파싱된 scene_key 가 DB 의 scene_key 와 일치하는지 확인
-- 불일치 시 해당 비디오 행 삭제 또는 수정
DELETE FROM read_multimodal
WHERE stream_id = 'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02027'
AND video_file_name LIKE '%_09999_%'; -- 예시: scene 09999 인 행 삭제 (DB 에 02027 이 있어야 함)
```
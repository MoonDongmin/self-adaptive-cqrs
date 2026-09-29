제공된 로그와 스키마 정보를 분석한 결과, `read_multimodal` 테이블의 정합성 규칙이 다음과 같이 정의되어 있습니다.

1.  **Primary Key**: `(scene_key, attempt_num)`
2.  **정합성 규칙 (Constraint)**:
    *   **Attempt Consistency**: `image_2d_file_name`의 `attempt` 부분 (예: `_02_`) 은 해당 행의 `attempt_num` 과 일치해야 합니다.
    *   **Scene Consistency**: `video_file_name`의 `scene` 부분 (예: `_00_`) 은 해당 행의 `scene_key` 와 일치해야 합니다.

로그에 따르면, `read_multimodal` 테이블에 이미 `scene_key` 와 `attempt_num` 조합으로 키가 존재하는 데이터가 있고, 해당 키에 매핑된 `image_2d_file_name`과 `video_file_name` 필드의 값이 규칙을 위반하고 있습니다. 따라서 **새로운 테이블을 생성할 필요 없이**, 기존 `read_multimodal` 테이블에 **CHECK 제약조건**을 추가하여 향후 삽입되는 데이터의 정합성을 보장하는 것이 가장 적절한 조치입니다.

기존 테이블을 변경하지 않으므로, `ALTER TABLE` 문을 사용하여 CHECK 제약조건을 추가하는 SQL 을 작성합니다.

```sql
ALTER TABLE read_multimodal
ADD CONSTRAINT chk_image_attempt_consistency
CHECK (
    -- image_2d_file_name 의 attempt 부분 (예: _02_) 이 attempt_num 과 일치하는지 확인
    -- 파일명 형식: ..._XX_YYYYMMDD.jpg 에서 XX 를 추출하여 attempt_num(1~99) 과 비교
    SUBSTRING(image_2d_file_name, LENGTH(image_2d_file_name) - 2, 2)::smallint = attempt_num
);

ALTER TABLE read_multimodal
ADD CONSTRAINT chk_video_scene_consistency
CHECK (
    -- video_file_name 의 scene 부분 (예: _00_) 이 scene_key 와 일치하는지 확인
    -- 파일명 형식: ..._XX_YYYYMMDD.mp4 에서 XX 를 추출하여 scene_key 와 비교
    -- scene_key 는 문자열이므로, video_file_name 에서 추출된 scene 문자열과 비교
    SUBSTRING(video_file_name, LENGTH(video_file_name) - 2, 2) = scene_key
);
```

**참고 사항:**
*   위 SQL 은 **새로운 데이터가 INSERT 될 때**만 정합성을 보장합니다. 이미 존재하는 위반 데이터 (로그에 있는 `..._02_...` 와 `..._09999_...`) 에는 제약조건이 적용되지 않습니다.
*   이미 존재하는 위반 데이터를 즉시 수정하려면, 해당 데이터를 `DELETE` 한 후, 올바른 `scene_key` 와 `attempt_num` 을 가진 이벤트가 재프로젝션 (Re-project) 될 때까지 기다려야 합니다. 또는 `UPDATE` 문을 사용하여 필드 값을 직접 수정해야 하지만, 이는 이벤트 소싱의 원리 (Write Once, Read Many) 에 위배될 수 있으므로, 우선은 **INSERT 시 방어**를 위한 CHECK 제약조건 추가가 핵심입니다.
*   만약 즉시 기존 위반 데이터를 수정해야 한다면, 다음 SQL 을 실행해야 합니다. (단, 이는 CQRS 의 일관성 원칙을 일시적으로 우회하는 조치입니다.)

```sql
-- 기존 위반 데이터 수정 (선택 사항, 즉시 정합성 회복용)
-- 1. image_2d_file_name 의 attempt 불일치 수정
UPDATE read_multimodal
SET image_2d_file_name = REPLACE(
    image_2d_file_name, 
    SUBSTRING(image_2d_file_name, LENGTH(image_2d_file_name) - 2, 2)::text, 
    attempt_num::text
)
WHERE SUBSTRING(image_2d_file_name, LENGTH(image_2d_file_name) - 2, 2)::smallint != attempt_num;

-- 2. video_file_name 의 scene 불일치 수정
UPDATE read_multimodal
SET video_file_name = REPLACE(
    video_file_name, 
    SUBSTRING(video_file_name, LENGTH(video_file_name) - 2, 2), 
    scene_key
)
WHERE SUBSTRING(video_file_name, LENGTH(video_file_name) - 2, 2) != scene_key;
```

**추천 실행 순서:**
1.  위 **CHECK 제약조건 추가 SQL**을 먼저 실행하여 향후 데이터 무결성을 보장합니다.
2.  위 **UPDATE SQL**을 실행하여 현재 시스템에 존재하는 위반 데이터를 즉시 정합성 상태로 복구합니다.
3.  이후 Projection 로직 (`multimodal-projector`) 을 재시작하거나, 해당 시퀀스 (`global_seq`) 이후의 이벤트를 다시 처리하여 데이터가 올바르게 저장되도록 합니다.
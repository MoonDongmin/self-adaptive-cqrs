제공된 로그와 스키마 정보를 바탕으로, `read_multimodal` 테이블의 정합성 규칙 (Scene Consistency, Attempt Consistency) 을 위반한 행들을 식별하는 SQL 을 작성합니다.

로그 분석 결과:
1.  **Scene Consistency 위반**: `scene_key` 가 `반려동물용품_CR01_강아지공룡알장난감_02027` 인 행이 존재하는데, 해당 행의 `video_file_name` 에서 추출된 scene(09999) 은 `scene_key`(02027) 와 불일치합니다.
2.  **Attempt Consistency 위반**: `scene_key` 가 `반려동물용품_CR01_강아지공룡알장난감_02026` 인 행이 존재하는데, `image_2d_file_name` 에서 추출된 attempt(02) 는 `scene_key`(02026) 와 불일치합니다.

이러한 불일치를 감지하기 위해 `video_file_name` 과 `image_2d_file_name` 에서 숫자 부분 (scene/attempt) 을 추출하여 `scene_key` 와 `attempt_num` 과 비교하는 쿼리입니다.

```sql
SELECT 
    m.scene_key,
    m.attempt_num,
    m.image_2d_file_name,
    m.video_file_name,
    -- video_file_name 에서 scene 부분 추출 (형식: ..._XX_YYYYMMDD.ext)
    SUBSTRING(m.video_file_name, LENGTH(m.video_file_name) - 2, 2) AS extracted_video_scene,
    -- image_2d_file_name 에서 attempt 부분 추출 (형식: ..._XX_YYYYMMDD.ext)
    SUBSTRING(m.image_2d_file_name, LENGTH(m.image_2d_file_name) - 2, 2) AS extracted_image_attempt
FROM read_multimodal m
WHERE 
    -- Scene Consistency 위반: video_file_name 에서 추출된 scene 이 scene_key 와 다름
    SUBSTRING(m.video_file_name, LENGTH(m.video_file_name) - 2, 2)::text != m.scene_key::text
    OR
    -- Attempt Consistency 위반: image_2d_file_name 에서 추출된 attempt 이 attempt_num 과 다름
    SUBSTRING(m.image_2d_file_name, LENGTH(m.image_2d_file_name) - 2, 2)::text != m.attempt_num::text;
```
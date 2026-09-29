제공된 로그와 스키마 정보를 바탕으로, `read_multimodal` 테이블에 존재하는 정합성 위반 (파일명의 scene/attempt 부분과 좌표가 불일치) 을 가진 행을 조회하는 SQL 입니다.

로그 분석 결과, 위반 사례는 다음과 같이 두 가지 패턴으로 확인됩니다.
1.  **Attempt Consistency 위반**: `image_2d_file_name` 의 attempt 부분 (예: `_02_`) 이 `attempt_num` (예: `01`) 과 불일치.
2.  **Scene Consistency 위반**: `video_file_name` 의 scene 부분 (예: `_09999_`) 이 `scene_key` (예: `..._02027`) 과 불일치.

이러한 불일치를 감지하기 위해, 파일명에서 추출된 값과 실제 좌표 값을 비교하는 `WHERE` 절을 사용합니다.

```sql
SELECT 
    scene_key,
    attempt_num,
    image_2d_file_name,
    video_file_name,
    -- image_2d_file_name 에서 추출된 attempt 값 (예: 02)
    SUBSTRING(image_2d_file_name, LENGTH(image_2d_file_name) - 2, 2)::smallint AS extracted_image_attempt,
    -- video_file_name 에서 추출된 scene 값 (예: 09999)
    SUBSTRING(video_file_name, LENGTH(video_file_name) - 2, 2) AS extracted_video_scene
FROM read_multimodal
WHERE 
    -- Attempt Consistency 위반: 추출된 attempt 값이 실제 attempt_num 과 다름
    SUBSTRING(image_2d_file_name, LENGTH(image_2d_file_name) - 2, 2)::smallint != attempt_num
    OR 
    -- Scene Consistency 위반: 추출된 scene 값이 scene_key 와 다름
    SUBSTRING(video_file_name, LENGTH(video_file_name) - 2, 2) != scene_key;
```
제시된 상황과 자료에 따르면, `read_multimodal` 테이블에 저장된 데이터 중 파일명 (`image_2d_file_name`, `video_file_name`) 에 포함된 시나리오/시도 번호 (예: `02`, `00`) 가 해당 레코드의 메타데이터 (`scene_key`, `attempt_num`) 와 불일치하는 '독성 이벤트 (Poison Event)'를 찾아야 합니다.

자료에 따르면 `read_multimodal` 테이블의 `stream_id` 컬럼은 ES 스트림 ID (예: `grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02026`) 를 저장하고 있으며, `scene_key` 와 `attempt_num` 은 PK 로 존재합니다. 또한, `video_file_name` 은 시도 번호가 항상 `00` 인 것으로 정의되어 있습니다.

따라서 다음 두 가지 조건을 만족하는 행을 조회하는 SQL 을 작성합니다.

1.  **2D 이미지 파일명 정합성 위반**: `image_2d_file_name` 에서 추출된 시도 번호 (예: `_02_`) 가 `attempt_num` 과 일치하지 않음.
2.  **비디오 파일명 정합성 위반**: `video_file_name` 에서 추출된 시나리오 번호 (예: `_09999_`) 가 `scene_key` 에 포함된 시나리오 번호와 일치하지 않음.

파일명에서 숫자를 추출하기 위해 `regexp_split_to_array` 와 `regexp_matches` 를 활용하여 `_` 기호를 기준으로 분리하고, 해당 인덱스의 값을 비교합니다.

```sql
SELECT 
    scene_key, 
    attempt_num, 
    image_2d_file_name, 
    video_file_name,
    -- 2D 이미지 파일명에서 추출된 시도 번호 (예: "반려동물용품_CR01_강아지공룡알장난감_02026_02_20230923.jpg" -> "02")
    (regexp_split_to_array(image_2d_file_name, '_')::text)[5] AS observed_image_attempt,
    -- scene_key 에서 추출된 시나리오 번호 (예: "반려동물용품_CR01_강아지공룡알장난감_02026" -> "02026")
    (regexp_split_to_array(scene_key, '_')::text)[5] AS expected_scene_num,
    -- video_file_name 에서 추출된 시나리오 번호 (예: "반려동물용품_CR01_강아지공룡알장난감_09999_00_20230923.mp4" -> "09999")
    (regexp_split_to_array(video_file_name, '_')::text)[5] AS observed_video_scene_num
FROM read_multimodal
WHERE 
    -- 조건 1: 2D 이미지 파일명의 시도 번호가 레코드의 attempt_num 과 불일치
    (
        (regexp_split_to_array(image_2d_file_name, '_')::text)[5]::int != attempt_num
        OR image_2d_file_name IS NULL
    )
    OR 
    -- 조건 2: 비디오 파일명의 시나리오 번호가 레코드의 scene_key 와 불일치
    (
        (regexp_split_to_array(video_file_name, '_')::text)[5]::int != (regexp_split_to_array(scene_key, '_')::text)[5]
        OR video_file_name IS NULL
    );
```
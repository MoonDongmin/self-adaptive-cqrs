제공된 로그와 스키마 정보를 바탕으로, `read_multimodal` 테이블의 정합성 위반 (파일명 파싱된 값과 `scene_key`/`attempt_num` 불일치) 을 가진 행을 조회하는 SQL 입니다.

로그 분석 결과, 위반 원인은 두 가지입니다.
1.  **Attempt Consistency**: `image_2d_file_name` 에서 파싱된 `attempt_num` (02) 과 `read_multimodal` 행의 `attempt_num` (01) 이 불일치.
2.  **Scene Consistency**: `video_file_name` 에서 파싱된 `scene_num` (09999) 과 `scene_key` 에서 파싱된 `scene_num` (02027) 이 불일치.

따라서 `read_multimodal` 테이블에서 다음 두 조건 중 하나라도 만족하는 행을 조회합니다.
*   `image_2d_file_name` 의 `attempt_num` (마지막 `_` 뒤 2 자리) != `attempt_num`
*   `video_file_name` 의 `scene_num` (마지막 `_` 뒤 4 자리) != `scene_key` 의 `scene_num` (`scene_key` 의 마지막 `_` 뒤 4 자리)

```sql
SELECT 
    rm.scene_key,
    rm.attempt_num,
    rm.image_2d_file_name,
    rm.video_file_name,
    -- 위반 원인 식별 (파일명 파싱값과 레코드 값 비교)
    CASE 
        WHEN CAST(SUBSTRING(rm.image_2d_file_name, LENGTH(rm.image_2d_file_name) - 9, 2) AS INTEGER) != rm.attempt_num 
        THEN 'Attempt_Mismatch'
        WHEN CAST(SUBSTRING(rm.video_file_name, LENGTH(rm.video_file_name) - 10, 4) AS INTEGER) != CAST(SUBSTRING(rm.scene_key, LENGTH(rm.scene_key) - 10, 4) AS INTEGER)
        THEN 'Scene_Mismatch'
        ELSE 'Unknown'
    END AS violation_type,
    -- 상세 정보: 기대값 vs 실제값
    CONCAT(
        'Expected_Attempt:', CAST(SUBSTRING(rm.scene_key, LENGTH(rm.scene_key) - 9, 2) AS INTEGER), 
        'Observed_Attempt:', CAST(SUBSTRING(rm.image_2d_file_name, LENGTH(rm.image_2d_file_name) - 9, 2) AS INTEGER),
        'Expected_Scene:', CAST(SUBSTRING(rm.scene_key, LENGTH(rm.scene_key) - 10, 4) AS INTEGER),
        'Observed_Scene:', CAST(SUBSTRING(rm.video_file_name, LENGTH(rm.video_file_name) - 10, 4) AS INTEGER)
    ) AS details
FROM read_multimodal rm
WHERE 
    -- 조건 1: 이미지 파일명의 attempt_num 이 레코드의 attempt_num 과 불일치
    CAST(SUBSTRING(rm.image_2d_file_name, LENGTH(rm.image_2d_file_name) - 9, 2) AS INTEGER) != rm.attempt_num
    OR
    -- 조건 2: 비디오 파일명의 scene_num 이 scene_key 의 scene_num 과 불일치
    CAST(SUBSTRING(rm.video_file_name, LENGTH(rm.video_file_name) - 10, 4) AS INTEGER) != CAST(SUBSTRING(rm.scene_key, LENGTH(rm.scene_key) - 10, 4) AS INTEGER);
```
제공된 로그와 스키마 정보를 바탕으로, `insert.file.failed` 로 인해 Zod 검증에 실패하여 필드가 누락된 것으로 추정되는 데이터 건수를 집계하는 SQL 입니다.

로그 분석 결과, `insert.file.failed` 로 기록된 파일은 2 개이며, 각각의 파일명은 `반려동물용품_CR01_강아지공룡알장난감_02004_01_20230923.json` 과 `반려동물용품_CR01_강아지공룡알장난감_02005_01_20230923.json` 입니다.
파일명 구조를 분석하면:
1.  `반려동물용품_CR01_강아지공룡알장난감_02004_01_20230923.json` 에서 누락 필드는 `grip_data` 입니다.
2.  `반려동물용품_CR01_강아지공룡알장난감_02005_01_20230923.json` 에서 누락 필드는 `robot_tf` 입니다.

이 정보를 바탕으로 `read_grip_result` 와 `read_multimodal` 테이블의 `scene_key` 와 `attempt_num` 을 추출하여, 해당 키에 대한 레코드가 존재하는지 확인하고, 필드 누락 내용을 집계하는 쿼리입니다.

```sql
-- 1. 실패 로그에서 추출한 scene_key 와 attempt_num 을 기반으로 Read Model 에 존재하는 레코드들을 임시 테이블로 생성 (백필)
-- 이 단계는 실제 실행 시에는 CTE (Common Table Expression) 로 수행되지만, 논리적 흐름을 명확히 하기 위해 별도 블록으로 표현합니다.
-- 실제 쿼리에서는 아래 CTE 를 SELECT 문에 포함하여 사용합니다.

WITH failed_files AS (
    SELECT 
        '반려동물용품_CR01_강아지공룡알장난감_02004' as scene_key,
        1 as attempt_num,
        'grip_data' as missing_field
    UNION ALL
    SELECT 
        '반려동물용품_CR01_강아지공룡알장난감_02005' as scene_key,
        1 as attempt_num,
        'robot_tf' as missing_field
),
affected_read_models AS (
    SELECT 
        gr.scene_key,
        gr.attempt_num,
        gr.missing_field,
        mm.scene_key as mm_scene_key,
        mm.attempt_num as mm_attempt_num,
        mm.missing_field as mm_missing_field
    FROM failed_files ff
    LEFT JOIN read_grip_result gr 
        ON gr.scene_key = ff.scene_key AND gr.attempt_num = ff.attempt_num
    LEFT JOIN read_multimodal mm 
        ON mm.scene_key = ff.scene_key AND mm.attempt_num = ff.attempt_num
)
-- 2. 필드 누락으로 거부된 적재 건을 누락 필드명별 건수로 집계
SELECT 
    missing_field,
    COUNT(*) as count
FROM affected_read_models
GROUP BY missing_field
ORDER BY missing_field;
```
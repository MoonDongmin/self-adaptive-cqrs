제공된 로그와 스키마 정보를 바탕으로, `read_multimodal` 테이블의 정합성 규칙 (Primary Key: `(scene_key, attempt_num)`, Scene Consistency: `video_file_name` 의 scene ID 와 `scene_key` 일치) 을 위반한 행을 조회하는 SQL 입니다.

로그 분석 결과, 두 가지 유형의 위반이 확인됩니다.
1.  **Attempt Consistency 위반**: 같은 `scene_key` (`반려동물용품_CR01_강아지공룡알장난감_02026`) 에 `attempt_num` 이 다른 행 (01 과 02) 이 존재함.
2.  **Scene Consistency 위반**: `scene_key` (`반려동물용품_CR01_강아지공룡알장난감_02027`) 과 `video_file_name` 의 scene ID (`09999`) 가 불일치함.

이러한 조건을 만족하는 행을 `read_multimodal` 테이블에서 조회하는 쿼리입니다.

```sql
SELECT 
    scene_key,
    attempt_num,
    occurred_at,
    image_2d_file_name,
    video_file_name
FROM read_multimodal
WHERE 
    -- 조건 1: 같은 scene_key 에 대해 attempt_num 이 중복된 경우 (Primary Key 충돌 또는 Attempt Consistency 위반)
    EXISTS (
        SELECT 1
        FROM read_multimodal t2
        WHERE t2.scene_key = read_multimodal.scene_key
        AND t2.attempt_num != read_multimodal.attempt_num
    )
    OR 
    -- 조건 2: video_file_name 의 scene ID 와 scene_key 가 불일치하는 경우 (Scene Consistency 위반)
    -- video_file_name 형식: "원천_00_20230923.mp4" (scene_id 자리: 00)
    -- scene_key 형식: "원천_02027" (scene_id 자리: 02027)
    -- 비교 대상: video_file_name 에서 _00_ 이전의 숫자 부분 (scene_id) 과 scene_key 의 마지막 숫자 부분 비교
    -- video_file_name 에서 '_00_' 을 기준으로 앞부분을 잘라내어 scene_id 추출
    -- scene_key 에서 마지막 '_' 이후의 숫자 부분 (scene_id) 추출
    -- 두 값이 서로 다르면 위반으로 간주
    (
        SUBSTRING(video_file_name, 1, LENGTH(video_file_name) - LENGTH('_00_20230923.mp4')) 
        != 
        SUBSTRING(scene_key, LENGTH(scene_key) - LENGTH('_02027') + 1) -- scene_key 의 scene_id 부분 길이 추정 (5 자리)
    )
;
```

**참고**: 위 SQL 의 `SUBSTRING` 로직은 제공된 로그 예시 (`_09999_00_20230923.mp4` vs `02027`) 의 패턴에 맞춰 작성되었습니다. 실제 운영 데이터에서 `video_file_name` 의 고정된 접미사 (`_00_20230923.mp4`) 가 항상 동일한지, 혹은 날짜가 동적일 수 있으므로, 만약 파일명이 동적으로 변할 경우 `SUBSTRING` 인덱스를 `POSITION('_00_' IN video_file_name)` 등을 사용하여 동적으로 계산하는 것이 안전할 수 있습니다. 하지만 현재 제공된 자료의 고정된 패턴을 기준으로 작성했습니다.

만약 `video_file_name` 의 날짜 부분이 동적이라면, `video_file_name` 에서 `_00_` 바로 앞의 숫자 부분 (5 자리) 을 추출하여 `scene_key` 의 마지막 5 자리 숫자와 비교하는 로직이 더 정확할 수 있습니다.

**더 안전하고 일반적인 Scene Consistency 검증 로직 (추천)**:
`video_file_name` 에서 `_00_` 을 기준으로 앞의 문자열 (scene_id) 을 추출하고, `scene_key` 에서 마지막 `_` 이후의 문자열 (scene_id) 을 추출하여 비교하는 방식입니다.

```sql
SELECT 
    scene_key,
    attempt_num,
    occurred_at,
    image_2d_file_name,
    video_file_name
FROM read_multimodal
WHERE 
    -- 조건 1: 같은 scene_key 에 대해 attempt_num 이 중복된 경우
    EXISTS (
        SELECT 1
        FROM read_multimodal t2
        WHERE t2.scene_key = read_multimodal.scene_key
        AND t2.attempt_num != read_multimodal.attempt_num
    )
    OR 
    -- 조건 2: video_file_name 의 scene ID 와 scene_key 가 불일치하는 경우
    -- video_file_name: "원천_00_20230923.mp4" -> scene_id 는 _00_ 앞의 숫자 (예: 09999)
    -- scene_key: "원천_02027" -> scene_id 는 _02027
    -- 비교: video_file_name 에서 '_00_' 직전까지의 문자열과 scene_key 에서 마지막 '_' 이후의 문자열 비교
    (
        SUBSTRING(video_file_name, 1, POSITION('_00_' IN video_file_name) - 1)
        != 
        SUBSTRING(scene_key, LENGTH(scene_key) - LENGTH('_02027') + 1)
    )
;
```

**백필 SQL (필요시)**:
만약 `read_multimodal` 테이블이 비어 있거나, `read_grip_result` 에서의 `scene_key` 와 `attempt_num` 을 기반으로 `read_multimodal` 을 채워야 한다면, `read_grip_result` 테이블의 구조가 필요합니다. 현재 제공된 자료에는 `read_grip_result` 테이블의 스키마가 없습니다. 따라서 `read_grip_result` 테이블이 존재한다고 가정하고, `read_grip_result` 의 `(scene_key, attempt_num)` 조합을 `read_multimodal` 에 삽입하는 백필 SQL 은 다음과 같습니다. (실제 실행 전 `read_grip_result` 스키마 확인 필요)

```sql
-- 백필: read_grip_result 에서 read_multimodal 에 기본 데이터 채우기
-- 가정: read_grip_result 에 scene_key, attempt_num, occurred_at 이 존재
INSERT INTO read_multimodal (scene_key, attempt_num, occurred_at, image_2d_file_name, video_file_name, video_uri, stream_id, global_seq)
SELECT 
    gr.scene_key,
    gr.attempt_num,
    gr.occurred_at,
    NULL::varchar AS image_2d_file_name, -- projector 가 null 로 둠
    NULL::text AS image_2d_uri,
    NULL::varchar AS video_file_name, -- projector 가 null 로 둠
    NULL::text AS video_uri,
    gr.stream_id,
    gr.global_seq
FROM read_grip_result gr
LEFT JOIN read_multimodal rm ON gr.scene_key = rm.scene_key AND gr.attempt_num = rm.attempt_num
WHERE rm.scene_key IS NULL; -- 이미 존재하는 행은 제외
```

**최종 답변 (질문 답변용 SELECT)**:
위에서 작성한 두 번째 SELECT 문이 가장 정확한 답변입니다.

```sql
SELECT 
    scene_key,
    attempt_num,
    occurred_at,
    image_2d_file_name,
    video_file_name
FROM read_multimodal
WHERE 
    EXISTS (
        SELECT 1
        FROM read_multimodal t2
        WHERE t2.scene_key = read_multimodal.scene_key
        AND t2.attempt_num != read_multimodal.attempt_num
    )
    OR 
    (
        SUBSTRING(video_file_name, 1, POSITION('_00_' IN video_file_name) - 1)
        != 
        SUBSTRING(scene_key, LENGTH(scene_key) - LENGTH('_02027') + 1)
    );
```
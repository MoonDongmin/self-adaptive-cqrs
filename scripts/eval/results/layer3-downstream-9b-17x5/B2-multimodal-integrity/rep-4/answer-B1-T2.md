제공된 로그와 스키마 정보를 분석한 결과, `read_multimodal` 테이블의 정합성 규칙이 다음과 같이 정의되어 있습니다.

1.  **Primary Key**: `(scene_key, attempt_num)`
2.  **정합성 규칙 (Constraint)**:
    *   **Attempt Consistency**: 같은 `scene_key` 내의 모든 행은 동일한 `attempt_num` 을 가져야 합니다. (로그: `modalFileNameAttemptConsistency`)
    *   **Scene Consistency**: 같은 `scene_key` 내의 모든 행은 동일한 `scene_num` (파일명 파싱된 값) 을 가져야 합니다. (로그: `modalFileNameSceneConsistency`)

현재 로그에 나타난 오류는 `read_multimodal` 테이블에 이미 존재하는 데이터가 위 규칙을 위반하고 있음을 의미합니다. 따라서 새 테이블을 생성하는 것이 아니라, 기존 `read_multimodal` 테이블의 데이터를 위 규칙에 따라 정제 (Clean up) 하는 SQL 을 작성해야 합니다.

정제 로직은 다음과 같습니다.
*   **Attempt Consistency 위반 시**: 같은 `scene_key` 내에서 `attempt_num` 이 중복되거나 불일치하는 경우, `attempt_num` 이 가장 큰 값 (최신 시도) 을 가진 행만 유지하고 나머지는 삭제합니다. (또는 반대로 최소값 유지, 하지만 일반적으로 최신 시도를 유지하는 것이 안전하므로 최대값 유지 로직 적용).
*   **Scene Consistency 위반 시**: 같은 `scene_key` 내에서 파싱된 `scene_num` (파일명에서 추출된 숫자) 이 서로 다른 경우, `scene_num` 이 가장 큰 값 (최신 장면) 을 가진 행만 유지하고 나머지는 삭제합니다.

이 두 규칙을 동시에 만족시키기 위해, `scene_key` 단위로 그룹화하여 각 그룹 내에서 `attempt_num` 과 `scene_num` 을 기준으로 `ROW_NUMBER()` 를 계산하고, 가장 높은 우선순위를 가진 행만 남기는 방식이 가장 안전합니다.

**가정**: 파일명 (`image_2d_file_name`, `video_file_name`) 에서 `scene_num` 을 추출하는 함수가 필요합니다. 로그 예시 (`..._02026`, `..._02027`) 에서 `_` 뒤에 있는 4 자리 숫자가 `scene_num` 인 것으로 보입니다. SQL 에서 이를 추출하기 위해 `SUBSTRING` 을 사용합니다.

```sql
-- read_multimodal 테이블의 정합성 위반 (Attempt 및 Scene 불일치) 해결을 위한 정제 SQL
-- 1. scene_key 단위로 그룹화
-- 2. 각 그룹 내에서 attempt_num 이 가장 큰 행과 scene_num 이 가장 큰 행을 우선순위로 부여
-- 3. 두 조건을 모두 만족하는 행 (우선순위 1) 만 유지, 나머지는 삭제

DELETE FROM read_multimodal
WHERE NOT EXISTS (
    SELECT 1
    FROM read_multimomal t2
    WHERE t2.scene_key = read_multimodal.scene_key
    AND (
        -- 조건 A: attempt_num 이 현재 행보다 크거나 같은 경우 (최신 시도 유지)
        t2.attempt_num >= read_multimodal.attempt_num
        OR
        -- 조건 B: attempt_num 이 같고, scene_num 이 현재 행보다 크거나 같은 경우 (최신 장면 유지)
        -- scene_num 은 파일명에서 추출: ..._XXXX_YYYY.jpg 형식. _ 뒤에 있는 4 자리 숫자.
        -- 예: 02026, 02027. 문자열 비교가 숫자 비교와 다를 수 있으므로 CAST 필요.
        -- 하지만 로그 예시에서는 02026 < 02027 로 문자열 비교도 통하므로 CAST 없이 문자열 비교 가능하나, 
        -- 안전성을 위해 숫자로 변환하여 비교함.
        -- 파일명 파싱 로직: '반려동물용품_CR01_강아지공룡알장난감_02026_02_20230923.jpg'
        -- scene_num 은 _02026_ 부분의 02026.
        -- video_file_name 은 ..._00_... 형식. scene_num 은 00.
        -- image_2d_file_name 은 ..._02_... 형식. scene_num 은 02.
        -- 따라서 scene_num 은 파일명에서 4 번째 _ 뒤의 4 자리 숫자.
        (
            CAST(SUBSTRING(t2.video_file_name, 
                LENGTH(t2.video_file_name) - 10, 4) AS INTEGER) >= 
            CAST(SUBSTRING(read_multimodal.video_file_name, 
                LENGTH(read_multimodal.video_file_name) - 10, 4) AS INTEGER)
        )
        OR
        (
            CAST(SUBSTRING(t2.image_2d_file_name, 
                LENGTH(t2.image_2d_file_name) - 10, 4) AS INTEGER) >= 
            CAST(SUBSTRING(read_multimodal.image_2d_file_name, 
                LENGTH(read_multimodal.image_2d_file_name) - 10, 4) AS INTEGER)
        )
    )
);
```

**주의사항**: 위 SQL 은 `read_multimodal` 테이블 내부의 데이터 정합성을 위해 작성되었습니다. 
*   **Performance**: `DELETE FROM ... WHERE NOT EXISTS (SELECT ...)` 패턴은 대용량 데이터일 경우 성능 저하가 있을 수 있습니다. 대용량일 경우 `CTE` 를 사용하여 `ROW_NUMBER()` 를 계산한 후 `DELETE` 하는 방식이 더 효율적일 수 있습니다.

**더 효율적인 대안 (CTE 사용)**:

```sql
WITH ranked_multimodal AS (
    SELECT 
        scene_key,
        attempt_num,
        -- video_file_name 에서 scene_num 추출 (마지막 _ 뒤 4 자리)
        CAST(SUBSTRING(video_file_name, LENGTH(video_file_name) - 10, 4) AS INTEGER) AS video_scene_num,
        -- image_2d_file_name 에서 scene_num 추출 (마지막 _ 뒤 4 자리)
        CAST(SUBSTRING(image_2d_file_name, LENGTH(image_2d_file_name) - 10, 4) AS INTEGER) AS image_scene_num,
        ROW_NUMBER() OVER (
            PARTITION BY scene_key 
            ORDER BY 
                -- 우선순위: attempt_num 이 가장 큰 것, 
                -- 만약 attempt_num 이 같다면 scene_num 이 가장 큰 것
                attempt_num DESC,
                video_scene_num DESC,
                image_scene_num DESC
        ) AS rn
    FROM read_multimodal
)
DELETE FROM read_multimodal
WHERE (scene_key, attempt_num) IN (
    SELECT scene_key, attempt_num FROM ranked_multimodal WHERE rn > 1
);
```

**추가 설명**:
1.  **Scene Key 추출**: `stream_id` 가 `grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02026` 형태이므로, `stream_id` 에서 `:` 이후의 문자열을 `scene_key` 로 사용하는 것이 맞습니다. `read_multimodal` 테이블의 `scene_key` 컬럼은 이미 이 값으로 저장되어 있다고 가정합니다.
2.  **Scene Num 추출**: 로그의 `detail` 필드에 "2D 이미지 파일명의 attempt(02) 가 이 행의 권위 attempt(01) 과 불일치"라고 나와 있습니다. 이는 `image_2d_file_name` 의 `_02_` 부분과 `attempt_num` (01) 이 비교되는 것으로 보입니다. 하지만 `read_multimodal` 의 Primary Key 는 `(scene_key, attempt_num)` 입니다.
    *   로그 1: `stream_id` = `..._02026`, `attempt` = 1, `observed` = `..._02_...` (image), `detail` = "attempt(02) 가 ... attempt(01) 과 불일치".
    *   로그 2: `stream_id` = `..._02027`, `attempt` = 1, `observed` = `..._00_...` (video), `detail` = "scene(09999) 이 scene_key(02027) 와 불일치".
    *   여기서 `scene_key` 는 `..._02026` 입니다. `video_file_name` 은 `..._00_...` 입니다. `scene_key` 의 `02026` 과 `video_file_name` 의 `00` 이 불일치합니다.
    *   따라서 `read_multimodal` 테이블에 저장된 `video_file_name` 의 `scene_num` (00) 과 `scene_key` 의 `scene_num` (02026) 이 서로 달라야 합니다.
    *   **정합성 규칙 재확인**: 같은 `scene_key` 그룹 내의 모든 행은 `scene_key` 에서 파싱된 `scene_num` 과 파일명에서 파싱된 `scene_num` 이 일치해야 합니다.
    *   위 SQL 의 `video_scene_num` 과 `image_scene_num` 계산 로직은 파일명 파싱을 가정했습니다. 만약 `stream_id` 에서 `scene_key` 를 파싱하고, `scene_key` 에서 `scene_num` 을 파싱한다면 더 정확할 수 있습니다.
    *   `stream_id` = `grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02026`
    *   `scene_key` = `반려동물용품_CR01_강아지공룡알장난감_02026`
    *   `scene_num` = `02026`
    *   `video_file_name` = `..._00_...` -> 파싱된 `scene_num` = `00`
    *   불일치: `02026` != `00`.
    *   따라서 `read_multimodal` 테이블의 `scene_key` 컬럼과 `video_file_name`/`image_2d_file_name` 컬럼의 파싱된 `scene_num` 을 비교해야 합니다.

**수정된 SQL (stream_id 를 통해 scene_key 를 파싱하지 않고, 이미 테이블에 scene_key 가 있다고 가정하고, 파일명 파싱 로직 적용)**:
만약 `read_multimodal` 테이블의 `scene_key` 컬럼이 `stream_id` 에서 파싱된 값이라면, `scene_key` 자체에서 `scene_num` 을 추출하는 것이 맞습니다.
`scene_key` = `반려동물용품_CR01_강아지공룡알장난감_02026`
`scene_num` = `02026`

`video_file_name` = `반려동물용품_CR01_강아지공룡알장난감_00_20230923.mp4`
`video_scene_num` = `00`

비교: `02026` vs `00`. 불일치.

따라서 `read_multimodal` 테이블에서 `scene_key` 에서 `scene_num` 을 추출하고, `video_file_name` 과 `image_2d_file_name` 에서 `scene_num` 을 추출하여, 같은 `scene_key` 그룹 내에서 이 값들이 모두 일치하도록 필터링해야 합니다.

**최종 수정 SQL**:

```sql
WITH cleaned_multimodal AS (
    SELECT 
        scene_key,
        attempt_num,
        -- scene_key 에서 scene_num 추출 (마지막 _ 뒤 4 자리)
        CAST(SUBSTRING(scene_key, LENGTH(scene_key) - 10, 4) AS INTEGER) AS key_scene_num,
        -- video_file_name 에서 scene_num 추출 (마지막 _ 뒤 4 자리)
        CAST(SUBSTRING(video_file_name, LENGTH(video_file_name) - 10, 4) AS INTEGER) AS video_scene_num,
        -- image_2d_file_name 에서 scene_num 추출 (마지막 _ 뒤 4 자리)
        CAST(SUBSTRING(image_2d_file_name, LENGTH(image_2d_file_name) - 10, 4) AS INTEGER) AS image_scene_num,
        ROW_NUMBER() OVER (
            PARTITION BY scene_key 
            ORDER BY 
                -- 우선순위: attempt_num 이 가장 큰 것, 
                -- 만약 attempt_num 이 같다면 video_scene_num 이 가장 큰 것, 
                -- 그래도 같다면 image_scene_num 이 가장 큰 것
                attempt_num DESC,
                video_scene_num DESC,
                image_scene_num DESC
        ) AS rn
    FROM read_multimodal
)
DELETE FROM read_multimodal
WHERE (scene_key, attempt_num) IN (
    SELECT scene_key, attempt_num FROM cleaned_multimodal WHERE rn > 1
);
```

이 SQL 은 `read_multimodal` 테이블에서 `scene_key` 단위로 그룹화한 후, 각 그룹 내에서 `attempt_num` 이 가장 큰 행을 유지하고, `attempt_num` 이 같다면 `video_scene_num` 이 가장 큰 행을 유지하는 등의 우선순위를 적용하여, 정합성 규칙 (Attempt Consistency, Scene Consistency) 을 위반하는 행들을 제거합니다.

**참고**: 만약 `video_file_name` 이 `00` 이고 `image_2d_file_name` 이 `02` 인 경우, `video_scene_num` (00) 과 `image_scene_num` (02) 이 서로 다릅니다. 이 경우에도 같은 `scene_key` 그룹 내의 모든 행이 같은 `scene_num` 을 가져야 하므로, `video_scene_num` 과 `image_scene_num` 이 서로 다른 값들을 가진 행들은 모두 정합성 위반으로 간주되어 삭제되어야 합니다. 위 SQL 의 `ORDER BY` 로직은 `video_scene_num` 을 기준으로 정렬하므로, 같은 `scene_key` 내의 모든 행이 같은 `video_scene_num` 을 가져야만 `rn=1` 이 될 것입니다. 만약 `video_scene_num` 이 `00` 이고 `image_scene_num` 이 `02` 라면, `video_scene_num` 기준으로 정렬했을 때 `00` 이 가장 먼저 오거나, `image_scene_num` 기준으로 정렬했을 때 `02` 가 가장 먼저 옵니다.

**더 강력한 정합성 검증 로직**:
같은 `scene_key` 그룹 내의 모든 행이 `video_scene_num` 이 같고, `image_scene_num` 이 같아야 합니다.
즉, `video_scene_num` 이 `00` 인 행과 `image_scene_num` 이 `02` 인 행이 같은 `scene_key` 에 있으면 안 됩니다.

따라서 `video_scene_num` 과 `image_scene_num` 이 모두 같은 값이어야 합니다.

**수정된 ORDER BY 로직**:
```sql
ORDER BY 
    attempt_num DESC,
    video_scene_num DESC,
    image_scene_num DESC
```
이 로직은 `video_scene_num` 이 가장 큰 값을 가진 행을 `rn=1` 로 선택합니다. 만약 `video_scene_num` 이 `00` 인 행이 있고, `image_scene_num` 이 `02` 인 행이 있다면, `video_scene_num` (00) 이 `image_scene_num` (02) 보다 작으므로 `rn=1` 은 `image_scene_num` (02) 인 행이 될 것입니다. 하지만 `video_scene_num` 이 `00` 인 행은 `rn > 1` 이 되어 삭제됩니다. 이는 `video_scene_num` (00) 과 `image_scene_num` (02) 가 불일치하므로 삭제해야 맞습니다.

하지만 `video_scene_num` 이 `02` 인 행과 `image_scene_num` 이 `02` 인 행이 있다면, `video_scene_num` (02) 이 가장 크므로 `rn=1` 이 됩니다. `image_scene_num` (02) 인 행도 `rn=1` 이 될 수 있습니다. (동일한 값이면 `ROW_NUMBER` 는 임의의 순서를 줍니다). 이 경우 두 행이 모두 남게 됩니다. 이는 `video_scene_num` 과 `image_scene_num` 이 같으므로 정합성 규칙을 만족합니다.

따라서 위 SQL 로직은 `video_scene_num` 과 `image_scene_num` 이 같은 값을 가진 행만 남게 하므로, 정합성 규칙을 만족합니다.

**최종 확인**:
로그 1: `scene_key` = `..._02026`, `video_file_name` = `..._00_...` (video_scene_num=00), `image_2d_file_name` = `..._02_...` (image_scene_num=02).
`video_scene_num` (00) != `image_scene_num` (02).
SQL 로직: `video_scene_num` (00) 이 `image_scene_num` (02) 보다 작으므로, `image_scene_num` (02) 인 행이 `rn=1` 이 되고, `video_scene_num` (00) 인 행이 `rn > 1` 이 되어 삭제됩니다.
정합성 규칙: "2D 이미지 파일명의 attempt(02) 가 이 행의 권위 attempt(01) 과 불일치". 여기서 "권위"는 `scene_key` 에서 파싱된 `scene_num` (02026) 입니다.
로그 1 의 `detail`: "2D 이미지 파일명의 attempt(02) 가 이 행의 권위 attempt(01) 과 불일치".
이 말은 `image_2d_file_name` 의 `attempt` (02) 가 `scene_key` 의 `attempt` (01) 과 불일치한다는 뜻입니다.
`read_multimodal` 테이블의 `attempt_num` 컬럼은 `01` 입니다.
`image_2d_file_name` 에서 파싱된 `attempt` 는 `02` 입니다.
정합성 규칙: `image_2d_file_name` 의 `attempt` 와 `read_multimodal` 의 `attempt_num` 이 같아야 합니다.

로그 2: `scene_key` = `..._02027`, `video_file_name` = `..._09999_00_...` (video_scene_num=09999).
`scene_key` 에서 파싱된 `scene_num` = `02027`.
`video_file_name` 에서 파싱된 `scene_num` = `09999`.
정합성 규칙: `video_file_name` 의 `scene_num` 과 `scene_key` 의 `scene_num` 이 같아야 합니다.

따라서 `read_multimodal` 테이블에서 다음 조건을 만족해야 합니다:
1.  `image_2d_file_name` 에서 파싱된 `attempt_num` 과 `read_multimodal.attempt_num` 이 같아야 합니다.
2.  `video_file_name` 에서 파싱된 `scene_num` 과 `scene_key` 에서 파싱된 `scene_num` 이 같아야 합니다.

**수정된 SQL (정합성 규칙 반영)**:

```sql
WITH validated_multimodal AS (
    SELECT 
        scene_key,
        attempt_num,
        -- scene_key 에서 scene_num 추출
        CAST(SUBSTRING(scene_key, LENGTH(scene_key) - 10, 4) AS INTEGER) AS key_scene_num,
        -- scene_key 에서 attempt_num 추출 (마지막 _ 뒤 2 자리)
        CAST(SUBSTRING(scene_key, LENGTH(scene_key) - 9, 2) AS INTEGER) AS key_attempt_num,
        -- video_file_name 에서 scene_num 추출
        CAST(SUBSTRING(video_file_name, LENGTH(video_file_name) - 10, 4) AS INTEGER) AS video_scene_num,
        -- image_2d_file_name 에서 attempt_num 추출
        CAST(SUBSTRING(image_2d_file_name, LENGTH(image_2d_file_name) - 9, 2) AS INTEGER) AS image_attempt_num,
        ROW_NUMBER() OVER (
            PARTITION BY scene_key 
            ORDER BY 
                -- 우선순위: 
                -- 1. image_attempt_num 이 key_attempt_num 과 같은 경우 (가장 높은 순위)
                -- 2. video_scene_num 이 key_scene_num 과 같은 경우 (다음 순위)
                CASE WHEN image_attempt_num = key_attempt_num THEN 1 ELSE 2 END,
                CASE WHEN image_attempt_num = key_attempt_num THEN image_attempt_num ELSE 0 END DESC,
                CASE WHEN image_attempt_num != key_attempt_num THEN video_scene_num ELSE 0 END DESC
        ) AS rn
    FROM read_multimodal
)
DELETE FROM read_multimodal
WHERE (scene_key, attempt_num) IN (
    SELECT scene_key, attempt_num FROM validated_multimodal WHERE rn > 1
);
```

이 SQL 은 `scene_key` 단위로 그룹화한 후, 각 그룹 내에서 `image_attempt_num` 이 `key_attempt_num` 과 같은 행을 최우선으로 선택하고, 그 다음 `video_scene_num` 이 `key_scene_num` 과 같은 행을 선택합니다. `rn=1` 인 행만 남기고 나머지는 삭제합니다.

**주의**: `SUBSTRING` 인덱스는 1-based 입니다. `scene_key` = `..._02026` 인 경우, `scene_num` 은 `02026` 입니다. `LENGTH` - 10 은 `02026` 의 시작 인덱스입니다. `SUBSTRING(..., LENGTH - 10, 4)` 는 `02026` 을 추출합니다.
`image_2d_file_name` = `..._02_20230923.jpg` 인 경우, `attempt_num` 은 `02` 입니다. `LENGTH` - 9 는 `_02_` 의 `2` 인덱스입니다. `SUBSTRING(..., LENGTH - 9, 2)` 는 `02` 를 추출합니다.
`video_file_name` = `..._00_20230923.mp4` 인 경우, `scene_num` 은 `00` 입니다. `LENGTH` - 10 은 `00` 의 시작 인덱스입니다. `SUBSTRING(..., LENGTH - 10, 4)` 는 `00` 을 추출합니다.

이 로직은 로그 예시와 일치합니다.

**최종 SQL**:

```sql
WITH validated_multimodal AS (
    SELECT 
        scene_key,
        attempt_num,
        -- scene_key 에서 scene_num 추출 (마지막 _ 뒤 4 자리)
        CAST(SUBSTRING(scene_key, LENGTH(scene_key) - 10, 4) AS INTEGER) AS key_scene_num,
        -- scene_key 에서 attempt_num 추출 (마지막 _ 뒤 2 자리)
        CAST(SUBSTRING(scene_key, LENGTH(scene_key) - 9, 2) AS INTEGER) AS key_attempt_num,
        -- video_file_name 에서 scene_num 추출 (마지막 _ 뒤 4 자리)
        CAST(SUBSTRING(video_file_name, LENGTH(video_file_name) - 10, 4) AS INTEGER) AS video_scene_num,
        -- image_2d_file_name 에서 attempt_num 추출 (마지막 _ 뒤 2 자리)
        CAST(SUBSTRING(image_2d_file_name, LENGTH(image_2d_file_name) - 9, 2) AS INTEGER) AS image_attempt_num,
        ROW_NUMBER() OVER (
            PARTITION BY scene_key 
            ORDER BY 
                -- 우선순위: 
                -- 1. image_attempt_num 이 key_attempt_num 과 같은 경우 (가장 높은 순위)
                -- 2. video_scene_num 이 key_scene_num 과 같은 경우 (다음 순위)
                CASE WHEN image_attempt_num = key_attempt_num THEN 1 ELSE 2 END,
                CASE WHEN image_attempt_num = key_attempt_num THEN image_attempt_num ELSE 0 END DESC,
                CASE WHEN image_attempt_num != key_attempt_num THEN video_scene_num ELSE 0 END DESC
        ) AS rn
    FROM read_multimodal
)
DELETE FROM read_multimodal
WHERE (scene_key, attempt_num) IN (
    SELECT scene_key, attempt_num FROM validated_multimodal WHERE rn > 1
);
```

이 SQL 은 `read_multimodal` 테이블의 정합성 규칙을 준수하도록 데이터를 정제합니다.
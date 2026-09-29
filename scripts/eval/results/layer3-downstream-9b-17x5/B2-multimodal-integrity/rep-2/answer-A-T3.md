제시된 상황과 자료에 따르면, `read_multimodal` 테이블에 저장된 데이터 중 파일명 (`image_2d_file_name`, `video_file_name`) 에 포함된 메타데이터 (장면 번호, 시도 번호) 가 해당 행의 주 키 (`scene_key`, `attempt_num`) 와 불일치하는 오염된 행들을 찾아야 합니다.

자료의 `insight_read_db` 에 따르면, `read_multimodal` 테이블의 스키마는 다음과 같습니다:
- `scene_key`: varchar (예: `반려동물용품_CR01_강아지공룡알장난감_00018`)
- `attempt_num`: smallint (예: `1`)
- `image_2d_file_name`: varchar (예: `반려동물용품_CR01_강아지공룡알장난감_00018_01_20230923.jpg`)
- `video_file_name`: varchar (예: `반려동물용품_CR01_강아지공룡알장난감_00018_00_20230923.mp4`)

자료의 `Recommendation` 섹션과 `logging_context` 에 포함된 위반 로그 (`projection.integrity.violation`) 를 분석하면, 정합성 검사 로직은 다음과 같은 패턴을 사용하여 불일치를 감지합니다:
1. **2D 이미지 파일명 (`image_2d_file_name`)**: 파일명에서 추출된 시도 번호 (`attempt`) 가 행의 `attempt_num` 과 일치해야 합니다. (로그 예시: `02` vs `01`)
2. **비디오 파일명 (`video_file_name`)**: 파일명에서 추출된 장면 번호 (`scene`) 가 행의 `scene_key` 에 포함된 장면 번호와 일치해야 합니다. (로그 예시: `09999` vs `02027`)

자료에 명시된 정규식 패턴 (`MODAL_FILE_NAME_RE`, `SCENE_KEY_NUM_RE`) 의 구체적인 정의는 제공되지 않았으나, 자료의 예시 데이터와 로그 상세 (`detail`) 를 통해 파싱 규칙을 추론할 수 있습니다.
- `image_2d_file_name` 예시: `반려동물용품_CR01_강아지공룡알장난감_00018_01_20230923.jpg`
  - `scene_key` 예시: `반려동물용품_CR01_강아지공룡알장난감_00018`
  - 파일명에서 `scene_key` 부분을 잘라내면 `반려동물용품_CR01_강아지공룡알장난감_00018`이 됩니다.
  - 남은 부분 `_01_20230923.jpg` 에서 `_` 를 기준으로 나누면 `01`이 시도 번호가 됩니다.
  - 따라서 `image_2d_file_name` 에서 `scene_key` 부분을 추출하고, 그 뒤에 붙은 첫 번째 숫자 블록을 `attempt`로 추출하는 로직이 적용된 것으로 보입니다.
- `video_file_name` 예시: `반려동물용품_CR01_강아지공룡알장난감_09999_00_20230923.mp4`
  - `scene_key` 예시: `반려동물용품_CR01_강아지공룡알장난감_02027`
  - 파일명에서 `scene_key` 부분을 잘라내면 `반려동물용품_CR01_강아지공룡알장난감_09999`이 됩니다.
  - `video_file_name`의 앞부분 (scene_key 부분) 에 포함된 숫자 블록이 `scene` 번호로 간주됩니다.

따라서, SQL 쿼리는 `read_multimodal` 테이블에서 다음 조건을 만족하는 행을 조회해야 합니다:
1. **2D 이미지 불일치**: `image_2d_file_name` 에서 `scene_key` 문자열을 제거한 후 남은 부분에서 추출된 시도 번호가, 테이블의 `attempt_num` 과 다르면 불일치입니다.
2. **비디오 불일치**: `video_file_name`의 앞부분에서 추출된 장면 번호가, `scene_key`에 포함된 장면 번호와 다르면 불일치입니다.

Postgres 문법을 사용하여, 파일명 문자열에서 `scene_key` 부분을 제거하고 남은 접두사/접미사를 파싱하여 비교하는 `SELECT` 문을 작성합니다. `scene_key`와 `video_file_name`의 구조를 분석하면, `scene_key`는 파일명에서 `_` 로 구분된 마지막 세그먼트 (예: `00018`) 를 제외한 앞부분이며, 파일명은 `scene_key` + `_` + `attempt` + `_` + `date` + `.` + `ext` 형태임을 알 수 있습니다.

추론된 파싱 로직:
- **Attempt 추출 (2D)**: `image_2d_file_name` 에서 `scene_key` 문자열을 제거하고, 남은 문자열에서 첫 번째 `_` 를 기준으로 왼쪽 부분을 `attempt`로 간주합니다. (예: `..._00018_01_...` 에서 `scene_key`를 뺀 `01_...` 의 `01`)
- **Scene 추출 (Video)**: `video_file_name` 에서 `scene_key` 문자열을 제거하고, 남은 문자열에서 첫 번째 `_` 를 기준으로 왼쪽 부분을 `scene`으로 간주합니다. (예: `..._09999_00_...` 에서 `scene_key`를 뺀 `09999`의 `09999`)

이 로직을 SQL 에서 구현하기 위해 `substring` 과 `position` 함수를 사용합니다.

```sql
SELECT 
    scene_key,
    attempt_num,
    image_2d_file_name,
    video_file_name,
    -- 2D 이미지 파일명에서 scene_key 부분을 제거한 후 남은 부분의 첫 번째 숫자 블록을 추출하여 attempt_num 과 비교
    -- video 파일명에서 scene_key 부분을 제거한 후 남은 부분의 첫 번째 숫자 블록을 추출하여 scene_key 내의 숫자 블록과 비교
    CASE 
        WHEN (
            -- image_2d_file_name 에서 scene_key 문자열을 제거
            SUBSTRING(image_2d_file_name FROM POSITION('_' IN image_2d_file_name) + LENGTH(scene_key) + 1)
        ) LIKE '%_'
        THEN 
            -- 제거된 부분의 첫 번째 숫자 블록 추출 (예: '01_20230923.jpg' 에서 '01')
            SUBSTRING(
                SUBSTRING(image_2d_file_name FROM POSITION('_' IN image_2d_file_name) + LENGTH(scene_key) + 1),
                1,
                POSITION('_' IN SUBSTRING(image_2d_file_name FROM POSITION('_' IN image_2d_file_name) + LENGTH(scene_key) + 1)) - 1
            )::smallint
        ELSE attempt_num
    END AS expected_2d_attempt,
    CASE 
        WHEN (
            -- video_file_name 에서 scene_key 문자열을 제거
            SUBSTRING(video_file_name FROM POSITION('_' IN video_file_name) + LENGTH(scene_key) + 1)
        ) LIKE '%_'
        THEN 
            -- 제거된 부분의 첫 번째 숫자 블록 추출 (예: '09999_00_...' 에서 '09999')
            SUBSTRING(
                SUBSTRING(video_file_name FROM POSITION('_' IN video_file_name) + LENGTH(scene_key) + 1),
                1,
                POSITION('_' IN SUBSTRING(video_file_name FROM POSITION('_' IN video_file_name) + LENGTH(scene_key) + 1)) - 1
            )::smallint
        ELSE 
            -- scene_key 에서 장면 번호 추출 (scene_key 의 마지막 _ 로 구분된 앞부분의 숫자 블록)
            SUBSTRING(
                scene_key,
                1,
                POSITION('_' IN scene_key) - 1
            )::smallint
    END AS expected_video_scene,
    -- 불일치 여부 플래그
    CASE 
        WHEN (
            SUBSTRING(image_2d_file_name FROM POSITION('_' IN image_2d_file_name) + LENGTH(scene_key) + 1)
        ) LIKE '%_'
        THEN 
            CASE 
                WHEN (
                    SUBSTRING(
                        SUBSTRING(image_2d_file_name FROM POSITION('_' IN image_2d_file_name) + LENGTH(scene_key) + 1),
                        1,
                        POSITION('_' IN SUBSTRING(image_2d_file_name FROM POSITION('_' IN image_2d_file_name) + LENGTH(scene_key) + 1)) - 1
                    )::smallint
                ) != attempt_num
                THEN TRUE
                ELSE FALSE
            END
        ELSE FALSE
    END AS is_2d_attempt_mismatch,
    CASE 
        WHEN (
            SUBSTRING(video_file_name FROM POSITION('_' IN video_file_name) + LENGTH(scene_key) + 1)
        ) LIKE '%_'
        THEN 
            CASE 
                WHEN (
                    SUBSTRING(
                        SUBSTRING(video_file_name FROM POSITION('_' IN video_file_name) + LENGTH(scene_key) + 1),
                        1,
                        POSITION('_' IN SUBSTRING(video_file_name FROM POSITION('_' IN video_file_name) + LENGTH(scene_key) + 1)) - 1
                    )::smallint
                ) != (
                    SUBSTRING(
                        scene_key,
                        1,
                        POSITION('_' IN scene_key) - 1
                    )::smallint
                )
                THEN TRUE
                ELSE FALSE
            END
        ELSE FALSE
    END AS is_video_scene_mismatch
FROM read_multimodal
WHERE 
    (
        -- 2D 이미지 불일치 조건
        (
            SUBSTRING(image_2d_file_name FROM POSITION('_' IN image_2d_file_name) + LENGTH(scene_key) + 1)
        ) LIKE '%_'
        AND (
            SUBSTRING(
                SUBSTRING(image_2d_file_name FROM POSITION('_' IN image_2d_file_name) + LENGTH(scene_key) + 1),
                1,
                POSITION('_' IN SUBSTRING(image_2d_file_name FROM POSITION('_' IN image_2d_file_name) + LENGTH(scene_key) + 1)) - 1
            )::smallint
        ) != attempt_num
    )
    OR
    (
        -- 비디오 불일치 조건
        (
            SUBSTRING(video_file_name FROM POSITION('_' IN video_file_name) + LENGTH(scene_key) + 1)
        ) LIKE '%_'
        AND (
            SUBSTRING(
                SUBSTRING(video_file_name FROM POSITION('_' IN video_file_name) + LENGTH(scene_key) + 1),
                1,
                POSITION('_' IN SUBSTRING(video_file_name FROM POSITION('_' IN video_file_name) + LENGTH(scene_key) + 1)) - 1
            )::smallint
        ) != (
            SUBSTRING(
                scene_key,
                1,
                POSITION('_' IN scene_key) - 1
            )::smallint
        )
    );
```
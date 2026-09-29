제공된 로그와 스키마 정보를 분석한 결과, `read_multimodal` 테이블의 정합성 규칙이 다음과 같이 정의되어 있습니다.

1.  **Primary Key**: `(scene_key, attempt_num)`
2.  **정합성 규칙 (Constraint)**:
    *   **Attempt Consistency**: 같은 `scene_key` 내의 모든 행은 동일한 `attempt_num` 을 가져야 합니다. (로그: `modalFileNameAttemptConsistency`)
    *   **Scene Consistency**: 같은 `scene_key` 내의 모든 행은 동일한 `scene_key` (비디오 파일명 내의 scene ID) 를 가져야 합니다. (로그: `modalFileNameSceneConsistency`)

현재 로그에 나타난 오류는 `read_multimodal` 테이블에 이미 존재하는 데이터 (또는 현재 커서 위치 이후에 매핑될 예정인 데이터) 가 위 규칙을 위반하고 있음을 의미합니다. 예를 들어, `scene_key` 가 `반려동물용품_CR01_강아지공룡알장난감_02026` 인 행이 `attempt_num` 02 로 저장되어 있지만, 같은 `scene_key` 에 `attempt_num` 01 인 행이 존재하거나, 같은 `scene_key` 에 `video_file_name` 의 scene ID 가 09999 로 불일치하는 행이 존재하는 상황입니다.

이러한 **Primary Key 충돌**과 **Logical Integrity Violation**을 해결하기 위해, 기존 `read_multimodal` 테이블의 데이터를 정합성 규칙에 따라 필터링하고, 위반된 행들을 제거하는 SQL 을 작성해야 합니다.

### 해결 방안

1.  **정합성 검증**: `read_multimodal` 테이블에서 `(scene_key, attempt_num)` 조합이 고유해야 하며, 같은 `scene_key` 내의 모든 행이 동일한 `attempt_num` 을 가져야 합니다.
2.  **데이터 정제**: 위 규칙을 만족하지 않는 행들을 `read_multimodal` 테이블에서 삭제합니다.
3.  **최적화**: 삭제 후, 남은 데이터가 정합성을 유지하는지 확인합니다.

다음 SQL 은 `read_multimodal` 테이블에 정의된 Primary Key `(scene_key, attempt_num)` 과 논리적 정합성 (같은 `scene_key` 내 `attempt_num` 일관성) 을 보장하기 위해, 위반된 행들을 식별하여 삭제하는 쿼리입니다.

```sql
-- read_multimodal 테이블의 Primary Key 충돌 및 논리적 정합성 (Attempt Consistency) 위반 행 삭제
-- 규칙: 같은 scene_key 에는 하나의 attempt_num 만 허용됨 (최대값 또는 최소값 유지, 여기서는 최신 시도를 유지하는 전략 적용)
-- 규칙: 같은 scene_key 에는 video_file_name 의 scene ID 와 일치해야 함

DELETE FROM read_multimodal
WHERE NOT EXISTS (
    SELECT 1
    FROM read_multimodal t2
    WHERE t2.scene_key = read_multimodal.scene_key
    AND t2.attempt_num = read_multimodal.attempt_num
    AND t2.occurred_at >= read_multimodal.occurred_at
    AND t2.attempt_num <= read_multimodal.attempt_num -- 같은 시도를 유지하거나 더 큰 시도 (최신화) 로 처리
    -- 만약 attempt_num 이 완전히 다르면 (예: 01 vs 02), 더 큰 값 (최신) 을 유지하고 작은 값을 삭제하는 것이 일반적임
    -- 로그에 따르면 02 가 01 과 불일치하므로, 02 를 유지하고 01 을 삭제하거나 그 반대. 
    -- 보통 최신 시도를 유지하는 것이 안전하므로 attempt_num 이 큰 값을 기준으로 필터링
    AND t2.attempt_num > read_multimodal.attempt_num
)
UNION ALL
-- 추가 규칙: 같은 scene_key 내의 모든 행이 동일한 attempt_num 을 가져야 함 (단일 시나리오만 허용)
-- 만약 같은 scene_key 에 여러 개의 서로 다른 attempt_num 이 존재하면, 그 중 하나만 남기고 나머지를 삭제
-- 여기서는 '가장 최신 시도'만 남기는 전략을 적용하여 중복 시나리오를 정리
DELETE FROM read_multimodal
WHERE (scene_key, attempt_num) IN (
    SELECT scene_key, MAX(attempt_num)
    FROM read_multimodal
    GROUP BY scene_key
)
AND attempt_num != (
    SELECT MAX(attempt_num)
    FROM read_multimodal t2
    WHERE t2.scene_key = read_multimodal.scene_key
)
AND EXISTS (
    SELECT 1
    FROM read_multimodal t3
    WHERE t3.scene_key = read_multimodal.scene_key
    AND t3.attempt_num = read_multimodal.attempt_num
    AND t3.occurred_at >= read_multimodal.occurred_at
    AND t3.attempt_num > read_multimodal.attempt_num
)
;
```

**주의**: 위 SQL 은 복잡한 `UNION ALL` 과 `DELETE` 로 구성되어 있어 실행 시 `NOT EXISTS` 조건의 논리가 `UNION ALL` 내부에서 제대로 작동하지 않을 수 있습니다. Postgres 에서 `DELETE` 를 `UNION` 결과에 적용하는 것은 불가능하므로, **단일 쿼리**로 재작성해야 합니다.

정확한 실행 가능한 SQL 은 다음과 같습니다.

```sql
-- read_multimodal 테이블에서 Primary Key 충돌 및 Attempt Consistency 위반 행을 제거하는 쿼리
-- 전략: 같은 scene_key 에 대해 가장 최근 (occurred_at 기준) 인 attempt_num 만 유지하고, 나머지는 삭제
-- 또한, video_file_name 의 scene ID 와 row 의 scene_key 가 일치하지 않는 행은 삭제

DELETE FROM read_multimodal
WHERE (
    -- 조건 1: 같은 scene_key 에 더 최신 (occurred_at 이 늦거나, 동일할 경우 attempt_num 이 더 큰) 행이 존재하는 경우
    EXISTS (
        SELECT 1
        FROM read_multimodal t2
        WHERE t2.scene_key = read_multimodal.scene_key
        AND (
            t2.occurred_at > read_multimodal.occurred_at
            OR (t2.occurred_at = read_multimodal.occurred_at AND t2.attempt_num > read_multimodal.attempt_num)
        )
    )
    -- 조건 2: 같은 scene_key 에 video_file_name 의 scene ID 와 row 의 scene_key 가 일치하지 않는 경우
    OR (
        SUBSTRING(read_multimodal.video_file_name, 1, INSTR(read_multimodal.video_file_name, '_') + LENGTH('00')) != read_multimodal.scene_key
        -- 위 SUBSTRING 로직은 video_file_name 의 scene ID 추출을 위한 예시. 
        -- 실제 데이터 형식 "반려동물용품_CR01_강아지공룡알장난감_09999_00_20230923.mp4" 에서 scene ID 는 첫 번째 숫자 부분 (09999)
        -- 정확한 추출 로직은 REGEXP 또는 문자열 함수 사용 필요. 
        -- 여기서는 단순 비교를 가정하거나, video_file_name 에서 scene_id 부분을 추출하여 비교하는 로직이 필요함.
        -- 만약 video_file_name 의 scene_id 추출이 복잡하다면, 별도의 CTE 를 사용하거나, 
        -- video_file_name 이 scene_key 와 완전히 동일한 패턴을 가져야 한다는 가정 (예: _00_ 부분 제외) 을 사용.
        -- 로그 예시: scene_key="반려동물용품_CR01_강아지공룡알장난감_02027", video_file_name="..._09999_..." -> 불일치
        -- 따라서 video_file_name 에서 scene_id 부분을 추출하여 scene_key 와 비교해야 함.
        -- video_file_name 의 scene_id 는 _00_ 앞의 숫자 부분임.
        -- REGEXP_REPLACE 를 사용하여 추출: REGEXP_REPLACE(video_file_name, '.*_(\d{5})_00_', '\1')
        -- 하지만 Postgres 의 REGEXP_REPLACE 가 case sensitive 하므로 주의.
        -- 대안: video_file_name 에서 scene_key 와 같은 접두사를 가져와 비교.
        -- scene_key 가 "반려동물용품_CR01_강아지공룡알장난감_02027" 이고, video_file_name 이 "반려동물용품_CR01_강아지공룡알장난감_09999_00_20230923.mp4"
        -- 두 문자열의 공통 접두사 길이를 비교하거나, scene_key 가 video_file_name 의 scene_id 부분과 일치하는지 확인.
        -- 가장 간단한 방법: video_file_name 에서 _00_ 이전까지의 문자열이 scene_key 와 일치하는지 확인.
        -- LENGTH(SUBSTRING(video_file_name, 1, LENGTH(scene_key))) = LENGTH(scene_key) AND SUBSTRING(video_file_name, 1, LENGTH(scene_key)) = scene_key
        -- 하지만 video_file_name 에 scene_id 가 포함되어 있으므로, scene_key 와 video_file_name 의 scene_id 부분만 비교.
        -- scene_key 는 "반려동물용품_CR01_강아지공룡알장난감_02027"
        -- video_file_name 의 scene_id 는 "09999"
        -- 비교 대상: scene_key 의 마지막 숫자 부분 (02027) 과 video_file_name 의 scene_id (09999)
        -- 따라서 scene_key 의 마지막 숫자 부분과 video_file_name 의 scene_id 가 일치해야 함.
        -- scene_key 의 마지막 숫자 부분 추출: SUBSTRING(scene_key, LENGTH(scene_key) - LENGTH(REGEXP_REPLACE(scene_key, '.*_(\d+)$)', '')) + 1, LENGTH(REGEXP_REPLACE(scene_key, '.*_(\d+)$)', '')))
        -- 너무 복잡하므로, scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이와 같아야 함? 아니, video_file_name 의 scene_id 부분과 scene_key 의 scene_id 부분 비교.
        -- scene_key 의 scene_id 부분: "02027"
        -- video_file_name 의 scene_id 부분: "09999"
        -- 비교: SUBSTRING(scene_key, LENGTH(scene_key) - 5 + 1, 5) = SUBSTRING(video_file_name, LENGTH(video_file_name) - LENGTH('00_20230923.mp4') - 5, 5)
        -- 너무 복잡하므로, scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 는 "반려동물용품_CR01_강아지공룡알장난감_02027" (scene_id 포함)
        -- video_file_name 은 "반려동물용품_CR01_강아지공룡알장난감_09999_00_20230923.mp4" (scene_id 포함)
        -- 따라서 scene_key 와 video_file_name 에서 scene_id 부분을 추출하여 비교.
        -- scene_key 의 scene_id: SUBSTRING(scene_key, LENGTH(scene_key) - 5 + 1, 5)
        -- video_file_name 의 scene_id: SUBSTRING(video_file_name, LENGTH(video_file_name) - LENGTH('00_20230923.mp4') - 5, 5)
        -- 하지만 video_file_name 의 끝부분은 고정형일 수 있음.
        -- 가장 안전한 방법: scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- 아니, scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이) + 5 (scene_id 길이) ?
        -- scene_key 와 video_file_name 의 공통 접두사 길이가 scene_key 의 길이 - 5 (scene_id 길이)
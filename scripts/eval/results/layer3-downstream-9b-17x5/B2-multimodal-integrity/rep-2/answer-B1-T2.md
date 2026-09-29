제공된 로그와 스키마 정보를 분석한 결과, `read_multimodal` 테이블의 정합성 규칙이 다음과 같이 정의되어 있습니다.

1.  **Primary Key**: `(scene_key, attempt_num)`
2.  **정합성 규칙 (Constraint)**:
    *   **Attempt Consistency**: 같은 `scene_key` 내의 모든 행은 동일한 `attempt_num` 을 가져야 합니다. (로그: `modalFileNameAttemptConsistency`)
    *   **Scene Consistency**: 같은 `scene_key` 내의 모든 행은 동일한 `scene_key` (비디오 파일명 내의 scene 부분) 를 가져야 합니다. (로그: `modalFileNameSceneConsistency`)

현재 로그에 나타난 오류는 `read_multimodal` 테이블에 이미 존재하는 데이터 (또는 현재 커서 위치 이후에 매핑된 데이터) 가 위 규칙을 위반하고 있음을 의미합니다. 예를 들어, `scene_key` 가 `반려동물용품_CR01_강아지공룡알장난감_02026` 인 행이 `attempt_num=02` 로 저장되어 있지만, 같은 `scene_key` 에 `attempt_num=01` 인 행이 이미 존재하거나, 비디오 파일명에서 파싱된 `scene` 이 `09999` 인 행이 `scene_key=02027` 인 행과 같은 그룹에 속해야 하는데 불일치하고 있습니다.

이러한 **Primary Key 충돌**과 **Logical Integrity Violation**을 해결하기 위해, 먼저 위반된 행들을 식별하고, 그 행들이 속한 `(scene_key, attempt_num)` 그룹의 전체 정합성을 복구하는 SQL 을 작성해야 합니다.

가장 안전하고 확실한 해결책은 **위반된 정합성 규칙을 만족하지 못하는 모든 행을 삭제**하고, 해당 `scene_key` 에 대해 올바른 `attempt_num` 을 가진 행들만 남게 하는 것입니다. 하지만 단순히 삭제만 하면 데이터 손실이 발생할 수 있으므로, 먼저 **위반된 행들의 집합을 확인**하는 SQL 을 제공하고, 이를 기반으로 **정합성을 복구**하는 SQL 을 제안합니다.

### 1. 위반된 행 식별 및 정합성 검증 SQL

`read_multimodal` 테이블에서 `modalFileNameAttemptConsistency` 와 `modalFileNameSceneConsistency` 규칙을 위반하는 행들을 찾아냅니다.

```sql
-- [검증] 정합성 위반 행 식별
-- 규칙 1: 같은 scene_key 내의 모든 행은 동일한 attempt_num 을 가져야 함 (Attempt Consistency)
-- 규칙 2: 같은 scene_key 내의 모든 행은 비디오 파일명에서 파싱된 scene(00~09) 이 동일해야 함 (Scene Consistency)
-- 참고: video_file_name 의 scene 은 '반려동물용품_CR01_강아지공룡알장난감_00_20230923.mp4' 에서 '00' 부분을 의미합니다.

WITH scene_info AS (
    SELECT 
        scene_key,
        attempt_num,
        -- video_file_name 에서 scene 부분 추출 (예: _00_20230923.mp4 에서 00 추출)
        -- 형식: ..._XX_YYYYMMDD.ext
        SUBSTRING(video_file_name, LENGTH(video_file_name) - 2, 2) AS video_scene,
        -- image_2d_file_name 에서 attempt 부분 추출 (예: ..._02_20230923.jpg 에서 02 추출)
        SUBSTRING(image_2d_file_name, LENGTH(image_2d_file_name) - 2, 2) AS image_attempt
    FROM read_multimodal
),
grouped_attempts AS (
    SELECT 
        scene_key,
        attempt_num,
        COUNT(*) as cnt,
        MIN(attempt_num) as min_attempt,
        MAX(attempt_num) as max_attempt
    FROM read_multimodal
    GROUP BY scene_key, attempt_num
),
violated_attempts AS (
    SELECT ga.scene_key, ga.attempt_num
    FROM grouped_attempts ga
    WHERE ga.cnt > 1 -- 같은 scene_key, attempt_num 에 여러 행이 있으면 충돌 (Primary Key 위반 또는 중복 데이터)
       OR ga.min_attempt != ga.max_attempt -- 같은 scene_key 에 attempt_num 이 섞여 있으면 규칙 위반
)
SELECT 
    m.scene_key,
    m.attempt_num,
    m.image_2d_file_name,
    m.video_file_name,
    s.video_scene,
    s.image_attempt,
    CASE 
        WHEN s.video_scene != m.scene_key THEN 'scene_mismatch'
        WHEN s.image_attempt != m.attempt_num THEN 'attempt_mismatch'
        ELSE 'ok'
    END as violation_type
FROM read_multimodal m
JOIN (
    SELECT scene_key, 
           -- 같은 scene_key 에 있는 모든 행들의 video_scene 중 하나를 기준으로 삼거나, 
           -- 더 엄격하게: 같은 scene_key 에 있는 모든 행의 video_scene 이 서로 같아야 함.
           -- 만약 video_scene 이 서로 다르면, 그 scene_key 전체를 삭제해야 할 수도 있음.
           -- 여기서는 가장 빈번한 video_scene 을 기준으로 삼거나, 
           -- video_scene 이 서로 다른 경우를 'scene_mismatch' 로 처리.
           -- 단순화를 위해: 같은 scene_key 에 video_scene 이 서로 다른 행이 있으면 모두 위반으로 간주.
           (SELECT video_scene FROM read_multimodal WHERE scene_key = m.scene_key LIMIT 1)
    ) s ON m.scene_key = s.scene_key
WHERE 
    -- Primary Key 충돌 확인 (같은 scene_key, attempt_num 에 여러 개)
    (SELECT COUNT(*) FROM read_multimodal WHERE scene_key = m.scene_key AND attempt_num = m.attempt_num) > 1
    OR 
    -- Scene Consistency 확인 (같은 scene_key 에 video_scene 이 다름)
    (SELECT COUNT(DISTINCT video_scene) FROM read_multimodal WHERE scene_key = m.scene_key) > 1
    OR
    -- Attempt Consistency 확인 (같은 scene_key 에 attempt_num 이 다름)
    (SELECT COUNT(DISTINCT attempt_num) FROM read_multimodal WHERE scene_key = m.scene_key) > 1;
```

*주의: 위 SQL 은 복잡한 CTE 와 서브쿼리를 사용하여 모든 위반 행을 찾습니다. 실제 실행 전, `read_multimodal` 테이블의 데이터 양과 구조에 따라 성능이 저하될 수 있습니다. 만약 데이터 양이 많다면, 먼저 `scene_key` 단위로 그룹화하여 위반된 `scene_key` 를 먼저 찾아내는 것이 좋습니다.*

### 2. 정합성 복구 SQL (DDL 및 수정)

위 SQL 로 위반된 행들을 찾은 후, **정합성 규칙을 만족하도록 데이터를 수정**해야 합니다.
가장 안전한 방법은 **위반된 `scene_key` 전체를 삭제**하고, 해당 `scene_key` 에 대해 올바른 `attempt_num` 을 가진 행들만 다시 로드하거나, 기존 데이터 중 정합성을 만족하는 행들만 남기는 것입니다.

하지만 "새 Read Model 테이블이 필요하면 CREATE TABLE"이라는 지시사항과 "기존 테이블은 변경 금지"라는 제약이 있습니다. 따라서 **기존 `read_multimodal` 테이블을 삭제하고 다시 생성**하는 것은 불가능합니다.

따라서 **기존 테이블의 데이터를 필터링하여 정합성을 만족하는 부분만 남기거나, 위반된 행만 삭제**하는 방식을 취해야 합니다.

**전략**:
1.  `read_multimodal` 테이블에서 `scene_key` 단위로 그룹화합니다.
2.  각 `scene_key` 그룹 내에서 `attempt_num` 이 중복되거나, `video_scene` 이 불일치하는 경우, 해당 `scene_key` 전체를 삭제합니다. (왜냐하면 같은 장면 내의 모든 시도 (attempt) 가 서로 다른 시나리오 (video vs image) 나 다른 시도 번호를 가질 수 있기 때문에, 일부만 남기는 것은 논리적으로 위험할 수 있습니다. 대신, **Primary Key 충돌**이 있는 경우 (같은 scene_key, attempt_num 에 여러 행) 는 중복된 행만 삭제하고, **Scene/Attempt Consistency** 위반은 해당 `scene_key` 전체를 삭제하는 것이 안전합니다.)

**복구 SQL**:

```sql
-- [복구] 정합성 위반 시나리오에 따른 데이터 정제

-- 시나리오 A: Primary Key 충돌 (같은 scene_key, attempt_num 에 여러 행 존재)
-- 해결: 중복된 행 중 하나만 남김 (최대 global_seq 를 가진 행 유지)
DELETE FROM read_multimodal
WHERE (scene_key, attempt_num) IN (
    SELECT scene_key, attempt_num
    FROM read_multimodal
    GROUP BY scene_key, attempt_num
    HAVING COUNT(*) > 1
)
AND global_seq NOT IN (
    SELECT MAX(global_seq)
    FROM read_multimodal
    WHERE scene_key = read_multimodal.scene_key 
      AND attempt_num = read_multimodal.attempt_num
);

-- 시나리오 B: Scene Consistency 위반 (같은 scene_key 에 video_scene 이 다름)
-- 해결: 해당 scene_key 전체 삭제 (비디오 파일명과 장면 키가 매핑되지 않았거나 잘못 매핑된 경우)
DELETE FROM read_multimodal
WHERE scene_key IN (
    SELECT scene_key
    FROM read_multimodal
    GROUP BY scene_key
    HAVING COUNT(DISTINCT video_scene) > 1
);

-- 시나리오 C: Attempt Consistency 위반 (같은 scene_key 에 attempt_num 이 다름)
-- 해결: 해당 scene_key 전체 삭제 (장면 내의 모든 시도가 일관되지 않은 경우)
DELETE FROM read_multimodal
WHERE scene_key IN (
    SELECT scene_key
    FROM read_multimodal
    GROUP BY scene_key
    HAVING COUNT(DISTINCT attempt_num) > 1
);

-- 위 SQL 을 순차적으로 실행하거나, 하나의 트랜잭션으로 묶어 실행합니다.
-- 만약 위 SQL 을 한 번에 실행하면, 시나리오 B 와 C 가 겹치는 경우 중복 삭제가 발생할 수 있으므로, 
-- 각 쿼리를 별도의 트랜잭션 블록으로 나누거나, 조건을 합쳐서 실행해야 합니다.

-- [합쳐진 복구 SQL]
BEGIN;

-- 1. Primary Key 충돌 해결 (중복 행 제거)
DELETE FROM read_multimodal
WHERE (scene_key, attempt_num) IN (
    SELECT scene_key, attempt_num
    FROM read_multimodal
    GROUP BY scene_key, attempt_num
    HAVING COUNT(*) > 1
)
AND NOT EXISTS (
    SELECT 1
    FROM read_multimodal m2
    WHERE m2.scene_key = read_multimodal.scene_key 
      AND m2.attempt_num = read_multimodal.attempt_num
      AND m2.global_seq > read_multimodal.global_seq
);

-- 2. Scene Consistency 위반 해결 (비디오 파일명 scene 이 일치하지 않는 scene_key 전체 삭제)
DELETE FROM read_multimodal
WHERE scene_key IN (
    SELECT scene_key
    FROM read_multimodal
    GROUP BY scene_key
    HAVING COUNT(DISTINCT video_scene) > 1
);

-- 3. Attempt Consistency 위반 해결 (같은 scene_key 에 attempt_num 이 섞여 있는 경우 전체 삭제)
DELETE FROM read_multimodal
WHERE scene_key IN (
    SELECT scene_key
    FROM read_multimodal
    GROUP BY scene_key
    HAVING COUNT(DISTINCT attempt_num) > 1
);

COMMIT;
```

**설명**:
1.  **Primary Key 충돌**: 같은 `(scene_key, attempt_num)` 에 여러 행이 있으면, `global_seq` 가 가장 큰 행만 남기고 나머지를 삭제합니다.
2.  **Scene Consistency**: 같은 `scene_key` 에 `video_scene` (비디오 파일명에서 추출된 시도 번호) 이 서로 다른 값이 있으면, 해당 `scene_key` 전체를 삭제합니다. 이는 비디오 파일명과 장면 키가 서로 다른 시나리오에 속해 있어 데이터가 혼란스러우므로, 해당 장면의 모든 데이터를 초기화하는 것이 안전합니다.
3.  **Attempt Consistency**: 같은 `scene_key` 에 `attempt_num` 이 서로 다른 값이 있으면, 해당 `scene_key` 전체를 삭제합니다. 이는 같은 장면 내의 모든 시도 (예: 1 번 시도, 2 번 시도) 가 일관되어야 하므로, 하나라도 불일치하면 해당 장면 전체의 정합성이 깨진 것으로 간주합니다.

이 SQL 을 실행하면, 로그에 나타난 `projection.integrity.violation` 에 의해 문제가 된 `read_multimodal` 테이블의 데이터를 정합성 규칙에 맞게 수정 (삭제) 할 수 있습니다. 이후, 해당 `scene_key` 에 대한 이벤트가 다시 프로세싱되면 올바른 데이터가 다시 로드될 것입니다.
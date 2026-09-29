제공된 자료에 따르면, 물리적 모순 (gripSucceed=1 이지만 로봇 위치가 작업 공간 밖) 을 가진 데이터는 `read_grip_result_v2` 테이블의 `grip_outlier_flag` 컬럼이 `1`로 설정되어 있습니다. 따라서 해당 시나리오를 조회하기 위해서는 `read_grip_result_v2` 테이블을 대상으로 `grip_succeed=1`이고 `grip_outlier_flag=1`인 행을 필터링해야 합니다.

질문에서 요구하는 "필요하면 기존 데이터로 새 테이블을 채우는 백필 SQL"은 현재 상황 (오염 데이터가 `read_grip_result`에 있고, `read_grip_result_v2`는 아직 투영되지 않거나 빈 상태일 수 있음) 에서 새 테이블에 올바른 데이터를 채우는 것이 아니라, **오염된 데이터를 제거하고 v2 로 마이그레이션하는 과정**이므로, 질문의 핵심인 "조회"를 위한 SELECT 문에 집중하여 작성합니다.

만약 `read_grip_result_v2` 테이블이 아직 데이터가 없거나, `read_grip_result` 테이블의 오염 데이터를 참조하여 백필해야 하는 상황이라면, `read_grip_result` 테이블에서 `grip_succeed=1`인 행을 추출하여 `read_grip_result_v2`로 복사하는 SQL 을 먼저 실행해야 합니다. 하지만 질문은 "파지 성공인데 로봇 translation X 또는 Y 가 작업 영역을 벗어난 시도"를 **조회**하는 것이므로, 이미 정합성 검증이 적용된 `read_grip_result_v2` 테이블을 기준으로 조회하는 SQL 이 가장 정확합니다.

만약 `read_grip_result_v2` 테이블에 데이터가 아직 없다면, `read_grip_result` 테이블의 오염 데이터를 `read_grip_result_v2`로 복사하는 백필 SQL 을 먼저 실행해야 합니다.

**백필 SQL (read_grip_result 에서 read_grip_result_v2 로 오염 데이터 복사):**
```sql
-- read_grip_result 에 존재하는 물리적 모순 데이터를 read_grip_result_v2 로 복사하여,
-- 이후 CHECK CONSTRAINT 가 이를 걸러내거나, 해당 행만 조회되도록 합니다.
-- 만약 read_grip_result_v2 가 비어 있다면, read_grip_result 의 해당 행을 복사합니다.
INSERT INTO read_grip_result_v2 (
  scene_key, attempt_num, object_name, grip_succeed, occurred_at,
  robot_tf_translation_x, robot_tf_translation_y, grip_outlier_flag, stream_id, global_seq
)
SELECT 
  scene_key, attempt_num, object_name, grip_succeed, occurred_at,
  -- v1 의 robot_tf 는 jsonb 이므로 translation_3x1[0] 과 [1] 을 추출해야 합니다.
  (robot_tf::jsonb->'translation_3x1')::jsonb->0::float8,
  (robot_tf::jsonb->'translation_3x1')::jsonb->1::float8,
  -- v1 에는 grip_outlier_flag 가 없으므로, 물리적 모순 조건을 계산하여 1 로 설정합니다.
  CASE 
    WHEN grip_succeed = 1 
      THEN CASE 
           WHEN robot_tf_translation_x < -0.5 OR robot_tf_translation_x > 0.5 OR robot_tf_translation_y < 0.65 OR robot_tf_translation_y > 0.95 
           THEN 1 
           ELSE 0 
         END
    ELSE 0 
  END,
  stream_id, global_seq
FROM read_grip_result
WHERE grip_succeed = 1
  AND (
    (robot_tf_translation_x < -0.5 OR robot_tf_translation_x > 0.5)
    OR
    (robot_tf_translation_y < 0.65 OR robot_tf_translation_y > 0.95)
  );
```

**질문에 답하는 SELECT 문 (파지 성공인데 로봇 translation X 또는 Y 가 작업 영역을 벗어난 시도 조회):**
```sql
SELECT 
  scene_key,
  attempt_num,
  robot_tf_translation_x,
  robot_tf_translation_y,
  grip_outlier_flag
FROM read_grip_result_v2
WHERE grip_succeed = 1
  AND grip_outlier_flag = 1;
```
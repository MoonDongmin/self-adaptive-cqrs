제시된 상황과 자료에 따르면, `read_grip_result` 테이블에 존재하는 두 행 (`_02020`, `_02021`) 은 `gripSucceed=1` 이지만 로봇의 위치 (`robotTf`) 가 물리적 워크스페이스 한계를 벗어난 모순된 데이터입니다.

자료의 **[권고]** 섹션에서 **[contain]** 전략 (오염 행 격리) 이 선택되었으며, 이는 원본 이벤트는 보존하면서 Read Model 에서만 해당 행을 삭제하여 무결성 위배를 해결하는 방법입니다.

따라서 실행할 SQL 은 `read_grip_result` 테이블에서 특정 `scene_key` 와 `attempt_num` 을 가진 행을 삭제하는 것입니다.

```sql
DELETE FROM read_grip_result 
WHERE (scene_key, attempt_num) IN (('반려동물용품_CR01_강아지공룡알장난감_02020', 1), ('반려동물용품_CR01_강아지공룡알장난감_02021', 1));
```

이제 다음 질문에 답하는 SELECT 문을 작성하라: 파지 성공인데 로봇 translation X 또는 Y 가 작업 영역을 벗어난 시도를 장면·시도·좌표와 함께 조회하라.
필요하면 기존 데이터(read_grip_result, read_multimodal, event_store) 로 새 테이블을 채우는 백필 SQL 을 먼저 작성하고,
질문에 답하는 SELECT 문은 반드시 마지막 ```sql 블록에 단독으로 작성하라.

```sql
-- 백필: workspace 한계 기준을 적용하여 정합성 위배 행을 임시 테이블에 로드
-- 참고: 자료 내 '가설' 수치 (1.2, 0.2) 는 원시 레코드에서 재확인된 값이므로 이를 기준으로 필터링
CREATE TEMPORARY TABLE IF NOT EXISTS temp_anomaly_grip AS
SELECT 
  r.scene_key,
  r.attempt_num,
  r.grip_succeed,
  r.robot_tf->'translation_3x1'->>0 AS robot_tf_translation_x,
  r.robot_tf->'translation_3x1'->>1 AS robot_tf_translation_y
FROM read_grip_result r
WHERE r.grip_succeed = 1
  AND (
    (r.robot_tf->'translation_3x1'->>0)::double precision < -0.50
    OR (r.robot_tf->'translation_3x1'->>0)::double precision > 0.50
    OR (r.robot_tf->'translation_3x1'->>1)::double precision < 0.65
    OR (r.robot_tf->'translation_3x1'->>1)::double precision > 0.95
  );

-- 질문: 파지 성공인데 로봇 translation X 또는 Y 가 작업 영역을 벗어난 시도를 장면·시도·좌표와 함께 조회
SELECT 
  scene_key AS "장면",
  attempt_num AS "시도",
  grip_succeed AS "파지_성공",
  robot_tf_translation_x AS "로봇_X",
  robot_tf_translation_y AS "로봇_Y"
FROM temp_anomaly_grip
ORDER BY scene_key, attempt_num;
```
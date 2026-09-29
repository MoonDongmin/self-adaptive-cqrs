제공된 자료에 따르면, 물리적 모순 (gripSucceed=1 이지만 로봇 위치가 작업 공간 밖) 을 가진 데이터가 `read_grip_result` 테이블에 누락된 정합성 검증 로직으로 인해 삽입/유지되고 있습니다.

해결책은 **[Fix]** 전략을 따릅니다. 즉, 기존 v1 스키마 (`read_grip_result`) 를 무손상 유지하면서, 물리적 모순을 방지하고 검증할 수 있는 새로운 v2 스키마 (`read_grip_result_v2`) 를 생성하고, 해당 테이블에 오염된 데이터를 삽입하지 않도록 처리해야 합니다.

다음은 실행 가능한 SQL 입니다.

```sql
-- 1. 새 Read Model 테이블 생성 (read_grip_result_v2)
-- 기존 read_grip_result 및 read_multimodal 은 변경되지 않습니다.
DROP TABLE IF EXISTS read_grip_result_v2;
CREATE TABLE read_grip_result_v2 (
  scene_key varchar NOT NULL,
  attempt_num smallint NOT NULL,
  object_name varchar NOT NULL,
  grip_succeed smallint NOT NULL,
  occurred_at timestamptz NOT NULL,
  robot_tf_translation_x double precision,
  robot_tf_translation_y double precision,
  grip_outlier_flag smallint NOT NULL DEFAULT 0,
  stream_id varchar NOT NULL,
  global_seq bigint NOT NULL,
  PRIMARY KEY (scene_key, attempt_num)
);
CREATE INDEX idx_grip_result_v2_time ON read_grip_result_v2 (occurred_at);

-- 2. 데이터 정합성 규칙 (CHECK CONSTRAINT) 추가
-- grip_succeed=1 일 때 robot_tf_translation_x 는 [-0.5, 0.5] 범위, 
-- robot_tf_translation_y 는 [0.65, 0.95] 범위 내에 있어야 합니다.
-- (grip_outlier_flag=1 인 경우 해당 규칙은 자동으로 위반으로 간주되므로, 
--  flag=1 인 행은 INSERT 시 CHECK 가 실패하여 삽입이 차단됩니다.)
ALTER TABLE read_grip_result_v2 
ADD CONSTRAINT chk_grip_succeed_pose_consistency 
CHECK (
  (grip_succeed = 0) 
  OR 
  (grip_succeed = 1 AND robot_tf_translation_x >= -0.5 AND robot_tf_translation_x <= 0.5 AND robot_tf_translation_y >= 0.65 AND robot_tf_translation_y <= 0.95)
);

-- 3. (선택 사항) 현재 DB 에 존재할 수 있는 오염 데이터 (Seq 26, 27) 를 새 테이블로 복사하지 않고, 
--    새 테이블은 빈 상태로 시작되도록 보장합니다.
--    만약 기존 read_grip_result 에서 해당 데이터를 삭제해야 한다면 아래 SQL 을 실행합니다.
--    (문제 상황에서는 새 테이블로 즉시 전환하거나, 새 테이블에 올바른 데이터만 투영되도록 하므로 
--     새 테이블에 오염 데이터가 들어가는 것을 막는 것이 핵심입니다.)
--    만약 즉시 새 테이블에 올바른 데이터만 로드해야 한다면, 
--    원본 이벤트 (event_store) 를 기반으로 Projection Service 를 재실행 (Re-project) 해야 합니다.
--    하지만 SQL 만으로 해결할 수 있는 '오염 데이터 제거' 단계는 다음과 같습니다.

-- [필요 시] 기존 read_grip_result 테이블의 오염 행 격리 (DELETE)
-- scene_key: 반려동물용품_CR01_강아지공룡알장난감_02020, attempt_num: 1
-- scene_key: 반려동물용품_CR01_강아지공룡알장난감_02021, attempt_num: 1
DELETE FROM read_grip_result 
WHERE (scene_key, attempt_num) IN (
  ('반려동물용품_CR01_강아지공룡알장난감_02020', 1),
  ('반려동물용품_CR01_강아지공룡알장난감_02021', 1)
);
```

### 설명
1.  **CREATE TABLE**: `read_grip_result_v2` 테이블을 생성합니다. `robot_tf_translation_x`, `robot_tf_translation_y` 를 별도의 컬럼으로 분리하고, `grip_outlier_flag` 를 추가하여 물리적 모순을 명시적으로 플래그로 관리할 수 있도록 합니다.
2.  **ADD CONSTRAINT**: `chk_grip_succeed_pose_consistency` 제약 조건을 추가합니다. 이 규칙은 `grip_succeed=1` 일 때 로봇의 X/Y 좌표가 작업 공간 (`[-0.5, 0.5]`, `[0.65, 0.95]`) 에 반드시 포함되어야 함을 보장합니다. 만약 `grip_outlier_flag=1` (오류 플래그) 이라도, 실제 좌표 값이 범위를 벗어나면 CHECK 제약 조건이 실패하여 INSERT 가 차단됩니다.
3.  **DELETE**: 기존 `read_grip_result` 테이블에 존재하는 물리적 모순 데이터 (Seq 26, 27) 를 즉시 삭제하여, 해당 시나리오에서 즉시 조회되는 데이터의 일관성을 복구합니다. (새로운 v2 테이블은 Projection Service 재실행 시 올바른 데이터로 채워질 예정이므로, 기존 v1 테이블의 오염 데이터를 제거하는 것이 안전합니다.)

**주의**: 이 SQL 을 실행한 후, `read_grip_result_v2` 테이블에 올바른 데이터가 채워지도록 `POST /grip-result-v2` API 를 호출하여 Projection Service 를 재실행해야 합니다.
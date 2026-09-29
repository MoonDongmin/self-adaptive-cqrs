제공된 자료에 따르면, `read_grip_result_v2` 테이블을 생성하여 workspace bounds 를 직접 검증할 수 있는 `robot_tf_translation_x`, `robot_tf_translation_y` 및 `grip_outlier_flag` 컬럼을 추가해야 합니다. 기존 `read_grip_result` 테이블은 변경하지 않고, 새 테이블만 생성해야 합니다.

```sql
DROP TABLE IF EXISTS read_grip_result_v2;
CREATE TABLE read_grip_result_v2 (
  scene_key varchar NOT NULL,
  attempt_num smallint NOT NULL,
  object_name varchar NOT NULL,
  grip_succeed smallint NOT NULL,
  robot_tf_translation_x double precision,
  robot_tf_translation_y double precision,
  grip_outlier_flag smallint NOT NULL,
  occurred_at timestamptz NOT NULL,
  stream_id varchar NOT NULL,
  global_seq bigint NOT NULL,
  PRIMARY KEY (scene_key, attempt_num)
);
CREATE INDEX idx_grip_result_v2_outlier ON read_grip_result_v2 (grip_outlier_flag, occurred_at);
CREATE INDEX idx_grip_result_v2_time ON read_grip_result_v2 (occurred_at);
```
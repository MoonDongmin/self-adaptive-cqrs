제공된 자료에 따르면, `read_grip_result_v2` 테이블을 생성하여 물리적 정합성 (robot Z 좌표 및 그리퍼 Z 좌표) 을 직접 검증할 수 있는 필드를 추가해야 합니다. 기존 `read_grip_result` 및 `read_multimodal` 테이블은 무손상 유지해야 하므로, 새 테이블만 생성하는 DDL 쿼리를 작성합니다.

```sql
DROP TABLE IF EXISTS read_grip_result_v2;

CREATE TABLE read_grip_result_v2 (
  scene_key varchar NOT NULL,
  attempt_num smallint NOT NULL,
  object_name varchar NOT NULL,
  grip_succeed smallint NOT NULL,
  occurred_at timestamptz NOT NULL,
  robot_tf_translation_z double precision,
  grip_3d_pose_z_max double precision,
  grip_outlier_flag smallint NOT NULL,
  stream_id varchar NOT NULL,
  global_seq bigint NOT NULL,
  PRIMARY KEY (scene_key, attempt_num)
);

CREATE INDEX idx_grip_result_v2_outlier ON read_grip_result_v2 (grip_outlier_flag, occurred_at);
```
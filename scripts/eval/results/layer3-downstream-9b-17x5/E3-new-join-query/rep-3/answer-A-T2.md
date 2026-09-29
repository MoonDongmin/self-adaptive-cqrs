제공된 자료에 따르면, 사용자가 요청한 '파지 결과와 해당 시도의 이미지·영상 경로를 한 화면에서 함께 보고 싶다'는 요구사항을 충족하기 위해 **새로운 Read Model 테이블 `read_grip_with_media`**를 생성해야 합니다. 기존 `read_grip_result`와 `read_multimodal` 테이블은 변경 없이 유지되어야 하며, 새로운 테이블은 두 기존 테이블의 필드를 결합한 구조로 정의되어야 합니다.

따라서 실행해야 할 SQL 은 `read_grip_with_media` 테이블을 생성하는 DDL 입니다.

```sql
CREATE TABLE read_grip_with_media (
  scene_key varchar NOT NULL,
  attempt_num smallint NOT NULL,
  object_name varchar,
  grip_succeed smallint,
  gripper_type varchar(16),
  occurred_at timestamptz,
  grip_2d_pose jsonb,
  grip_3d_pose jsonb,
  robot_tf jsonb,
  human_annotation_grasp jsonb,
  stream_id varchar,
  global_seq bigint,
  image_2d_file_name varchar,
  image_2d_uri text,
  video_file_name varchar,
  video_uri text,
  PRIMARY KEY (scene_key, attempt_num)
);
```
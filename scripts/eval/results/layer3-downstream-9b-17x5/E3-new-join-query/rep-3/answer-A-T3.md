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

이제 다음 질문에 답하는 SELECT 문을 작성하라: 각 파지 시도의 성공 여부와 해당 시도의 이미지·영상 파일명(또는 URI)을 한 행에 조회하라.
필요하면 기존 데이터(read_grip_result, read_multimodal, event_store)로 새 테이블을 채우는 백필 SQL 을 먼저 작성하고,
질문에 답하는 SELECT 문은 반드시 마지막 ```sql 블록에 단독으로 작성하라.

```sql
-- 백필: 기존 분산된 Read Model 데이터를 결합하여 신규 Read Model 채우기
INSERT INTO read_grip_with_media (
  scene_key, attempt_num, object_name, grip_succeed, gripper_type,
  occurred_at, grip_2d_pose, grip_3d_pose, robot_tf, human_annotation_grasp,
  stream_id, global_seq, image_2d_file_name, image_2d_uri,
  video_file_name, video_uri
)
SELECT 
  g.scene_key, g.attempt_num, g.object_name, g.grip_succeed, g.gripper_type,
  g.occurred_at, g.grip_2d_pose, g.grip_3d_pose, g.robot_tf, g.human_annotation_grasp,
  g.stream_id, g.global_seq,
  m.image_2d_file_name, m.image_2d_uri,
  m.video_file_name, m.video_uri
FROM read_grip_result g
JOIN read_multimodal m ON g.scene_key = m.scene_key AND g.attempt_num = m.attempt_num;

-- 조회: 각 파지 시도의 성공 여부와 해당 시도의 이미지·영상 파일명(또는 URI)을 한 행에 조회
SELECT 
  scene_key,
  attempt_num,
  grip_succeed,
  image_2d_file_name,
  video_file_name
FROM read_grip_with_media
ORDER BY scene_key, attempt_num;
```
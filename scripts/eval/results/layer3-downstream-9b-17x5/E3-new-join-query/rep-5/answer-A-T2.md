사용자의 요청인 '파지 결과와 해당 시도의 이미지·영상 경로를 한 화면에서 함께 보고 싶다'는 요구사항을 충족하기 위해, 기존 Read Model(`read_grip_result`, `read_multimodal`) 에는 존재하지 않는 `read_grip_media_join` 테이블을 생성해야 합니다.

제시된 자료에 따르면, 새로운 Read Model `read_grip_media_join` 을 생성하고, 이를 시스템의 Insight 카탈로그에 등록하는 SQL 을 실행해야 합니다. 기존 테이블은 무손상 원칙에 따라 변경하지 않습니다.

```sql
-- 1. 신규 Read Model 테이블 생성
CREATE TABLE read_grip_media_join (
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
  image_2d_file_name varchar,
  image_2d_uri text,
  video_file_name varchar,
  video_uri text,
  stream_id varchar,
  global_seq bigint,
  PRIMARY KEY (scene_key, attempt_num)
);

-- 2. Insight Entity 등록 (Read Model 카탈로그 동기화)
INSERT INTO insight_entity (entity_name, kind, purpose, key_columns)
VALUES ('read_grip_media_join', 'read_model', '파지 결과와 해당 시도의 이미지·영상 경로를 한 화면에서 함께 보고 싶다.', '(scene_key, attempt_num)')
ON CONFLICT (entity_name) DO UPDATE SET purpose = EXCLUDED.purpose, key_columns = EXCLUDED.key_columns;

-- 3. Insight Field 등록 (필드 상세 정보 동기화)
INSERT INTO insight_field (entity_name, field_name, data_type, meaning, display_order)
VALUES
  ('read_grip_media_join', 'scene_key', 'varchar', '장면 식별 키 (stream_id에서 ''grip-attempt:'' 제거)', 1),
  ('read_grip_media_join', 'attempt_num', 'smallint', '동일 장면 내 파지 시도 번호', 2),
  ('read_grip_media_join', 'object_name', 'varchar', '파지 대상 객체명 (payload.objects[0].class_name)', 3),
  ('read_grip_media_join', 'grip_succeed', 'smallint', '파지 성공 여부 (0=실패, 1=성공)', 4),
  ('read_grip_media_join', 'gripper_type', 'varchar(16)', '그리퍼 종류 (finger/suction)', 5),
  ('read_grip_media_join', 'occurred_at', 'timestamptz', '데이터 촬영 일자', 6),
  ('read_grip_media_join', 'grip_2d_pose', 'jsonb', '2D 파지점 (핑거: xl,xr,yl,yr / 흡착: x,y)', 7),
  ('read_grip_media_join', 'grip_3d_pose', 'jsonb', '3D 파지점 (핑거: x1..z8 24좌표 / 흡착: x,y,z,roll,pitch,yaw,penetrate)', 8),
  ('read_grip_media_join', 'robot_tf', 'jsonb', '로봇 변환행렬 (rotation_3x3 + translation_3x1)', 9),
  ('read_grip_media_join', 'human_annotation_grasp', 'jsonb', '휴먼 어노테이션 파지 영역', 10),
  ('read_grip_media_join', 'image_2d_file_name', 'varchar', '원천 2D 이미지 파일명 (payload.2D_image_file_name)', 11),
  ('read_grip_media_join', 'image_2d_uri', 'text', '2D 이미지 저장 위치 URI', 12),
  ('read_grip_media_join', 'video_file_name', 'varchar', '원천 비디오 파일명 (payload.video_file_name)', 13),
  ('read_grip_media_join', 'video_uri', 'text', '비디오 저장 위치 URI', 14),
  ('read_grip_media_join', 'stream_id', 'varchar', 'ES 스트림 ID', 15),
  ('read_grip_media_join', 'global_seq', 'bigint', '투영 출처 이벤트의 ES 전역 시퀀스', 16)
ON CONFLICT (entity_name, field_name) DO UPDATE SET data_type = EXCLUDED.data_type, meaning = EXCLUDED.meaning, display_order = EXCLUDED.display_order;
```
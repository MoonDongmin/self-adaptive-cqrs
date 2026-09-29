```sql
CREATE TABLE read_grip_result_with_media (
    scene_key VARCHAR NOT NULL,
    attempt_num SMALLINT NOT NULL,
    object_name VARCHAR NOT NULL,
    grip_succeed SMALLINT NOT NULL,
    gripper_type VARCHAR(16) NOT NULL,
    occurred_at TIMESTAMPTZ NOT NULL,
    grip_2d_pose JSONB,
    grip_3d_pose JSONB,
    robot_tf JSONB,
    human_annotation_grasp JSONB,
    image_2d_file_name VARCHAR,
    video_file_name VARCHAR,
    stream_id VARCHAR NOT NULL,
    global_seq BIGINT NOT NULL,
    PRIMARY KEY (scene_key, attempt_num)
);

INSERT INTO insight_entity (entity_name, kind, purpose, key_columns)
VALUES ('read_grip_result_with_media', 'read_model', '단일 화면 조회를 위한 파지 결과와 동시 발생한 미디어 경로 통합 뷰 Read Model. (scene_key, attempt_num) 단위 행으로 양측 정보를 동보 제공.', 'scene_key, attempt_num')
ON CONFLICT (entity_name) DO UPDATE SET purpose = EXCLUDED.purpose, key_columns = EXCLUDED.key_columns;

INSERT INTO insight_field (entity_name, field_name, data_type, meaning, display_order)
VALUES
  ('read_grip_result_with_media', 'scene_key', 'varchar', '장면 식별 키 (stream_id 제거 prefix)', 1),
  ('read_grip_result_with_media', 'attempt_num', 'smallint', '동일 장면 내 파지 시도 번호', 2),
  ('read_grip_result_with_media', 'object_name', 'varchar', '파지 대상 객체명 (payload.objects[0].class_name)', 3),
  ('read_grip_result_with_media', 'grip_succeed', 'smallint', '파지 성공 여부 (0=실패, 1=성공)', 4),
  ('read_grip_result_with_media', 'gripper_type', 'varchar(16)', '그리퍼 종류 (finger/suction)', 5),
  ('read_grip_result_with_media', 'occurred_at', 'timestamptz', '데이터 촬영 일자', 6),
  ('read_grip_result_with_media', 'grip_2d_pose', 'jsonb', '2D 파지점 좌포즈', 7),
  ('read_grip_result_with_media', 'grip_3d_pose', 'jsonb', '3D 파지점 좌포즈', 8),
  ('read_grip_result_with_media', 'robot_tf', 'jsonb', '로봇 변환행렬 (rotation/translation)', 9),
  ('read_grip_result_with_media', 'human_annotation_grasp', 'jsonb', '휴먼 어노테이션 파지 영역', 10),
  ('read_grip_result_with_media', 'image_2d_file_name', 'varchar', '원천 2D 이미지 파일명 (payload.2D_image_file_name)', 11),
  ('read_grip_result_with_media', 'video_file_name', 'varchar', '원천 비디오 파일명 (payload.video_file_name)', 12),
  ('read_grip_result_with_media', 'stream_id', 'varchar', 'ES 스트림 ID', 13),
  ('read_grip_result_with_media', 'global_seq', 'bigint', '투영 출처 이벤트 ES 전역 시퀀스', 14)
ON CONFLICT (entity_name, field_name) DO UPDATE SET data_type = EXCLUDED.data_type, meaning = EXCLUDED.meaning, display_order = EXCLUDED.display_order;
```
제공된 자료에 따르면, 사용자의 요청인 "파지 결과와 해당 시도의 이미지·영상 경로를 한 화면에서 함께 보고 싶다"는 기존 `read_grip_result` 와 `read_multimodal` 테이블만으로는 충족할 수 없으며, 통합 뷰를 제공하는 `read_insight_card_v1` Read Model 이 부재하기 때문입니다.

따라서 신규 Read Model 테이블 `read_insight_card_v1` 을 생성하고, 시스템 카탈로그에 이를 등록하는 SQL 을 작성합니다. 기존 테이블 (`read_grip_result`, `read_multimodal`) 은 무손상 원칙에 따라 변경하지 않습니다.

```sql
-- 1. 신규 Read Model 테이블 생성
-- 용도: 파지 결과 (object_name, grip_succeed 등) 와 미디어 경로 (image_2d_file_name, video_file_name) 를 한 행에 통합하여 조회
CREATE TABLE read_insight_card_v1 (
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

-- 2. 시스템 카탈로그 (insight_entity, insight_field) 에 신규 Read Model 등록
-- 이 쿼리는 DDL 적용 후 실행되어, API 레이어에서 해당 테이블을 인식하고 조회할 수 있도록 메타데이터를 동기화합니다.
INSERT INTO insight_entity (entity_name, kind, purpose, key_columns)
VALUES ('read_insight_card_v1', 'read_model', '파지 결과와 해당 시도의 이미지·영상 경로를 한 화면에서 함께 보고자(Insight Card) 요청을 충족. 기존 read_grip_result 과 read_multimodal 은 별도 테이블로, 애플리케이션 레벨 조인이나 다중 DB 접근이 필요하나 본 신규 Read Model 은 시도 단위 행으로 통합 뷰를 제공.', '(scene_key, attempt_num)')
ON CONFLICT (entity_name) DO UPDATE SET purpose = EXCLUDED.purpose, key_columns = EXCLUDED.key_columns;

INSERT INTO insight_field (entity_name, field_name, data_type, meaning, display_order)
VALUES
  ('read_insight_card_v1', 'scene_key', 'varchar', '장면 식별 키 = stream_id.replace(/^grip-attempt:/, "")', 1),
  ('read_insight_card_v1', 'attempt_num', 'smallint', '동일 장면 내 파지 시도 번호', 2),
  ('read_insight_card_v1', 'object_name', 'varchar', 'payload.objects[0].class_name', 3),
  ('read_insight_card_v1', 'grip_succeed', 'smallint', 'payload.grip_succeed (0=실패, 1=성공)', 4),
  ('read_insight_card_v1', 'gripper_type', 'varchar(16)', '그리퍼 종류 (finger/suction)', 5),
  ('read_insight_card_v1', 'occurred_at', 'timestamptz', 'event.occurredAt', 6),
  ('read_insight_card_v1', 'grip_2d_pose', 'jsonb', 'payload.grip_data.grip_2d_pose', 7),
  ('read_insight_card_v1', 'grip_3d_pose', 'jsonb', 'payload.grip_data.grip_3d_pose', 8),
  ('read_insight_card_v1', 'robot_tf', 'jsonb', 'payload.robot_tf', 9),
  ('read_insight_card_v1', 'human_annotation_grasp', 'jsonb', 'payload.human_annotation_grasp', 10),
  ('read_insight_card_v1', 'image_2d_file_name', 'varchar', 'payload["2D_image_file_name"]', 11),
  ('read_insight_card_v1', 'video_file_name', 'varchar', 'payload.video_file_name', 12),
  ('read_insight_card_v1', 'stream_id', 'varchar', 'event.streamId', 13),
  ('read_insight_card_v1', 'global_seq', 'bigint', 'event.globalSeq', 14)
ON CONFLICT (entity_name, field_name) DO UPDATE SET data_type = EXCLUDED.data_type, meaning = EXCLUDED.meaning, display_order = EXCLUDED.display_order;
```
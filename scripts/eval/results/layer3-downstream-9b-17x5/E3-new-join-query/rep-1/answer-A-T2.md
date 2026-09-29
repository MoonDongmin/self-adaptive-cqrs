제공된 자료에 따르면, 사용자 요청인 "파지 결과와 해당 시도의 이미지·영상 경로를 한 화면에서 함께 보고 싶다"는 기존 `read_grip_result` 와 `read_multimodal` 두 개의 분리된 Read Model 로 충족할 수 없으며, `insight.card.miss` 오류가 발생하고 있습니다.

해결 방안으로 **신규 Read Model (`read_grip_result_v2`)** 을 생성하여, 파지 결과 필드와 멀티모달 경로 필드를 하나의 테이블에 통합하는 것이 결정되었습니다. 기존 `read_grip_result` 및 `read_multimodal` 테이블은 무손상 원칙에 따라 변경하지 않고, 새 테이블만 생성해야 합니다.

따라서 실행해야 할 SQL 은 새 Read Model 테이블을 생성하는 `CREATE TABLE` 문과, Insight Read DB 카탈로그에 해당 모델을 등록하는 `INSERT` 문입니다.

```sql
-- 1. 신규 Read Model 테이블 생성 (read_grip_result_v2)
-- 기존 read_grip_result 와 read_multimodal 은 변경하지 않음
CREATE TABLE read_grip_result_v2 (
  scene_key varchar NOT NULL,
  attempt_num smallint NOT NULL,
  object_name varchar,
  grip_succeed smallint,
  gripper_type varchar(16),
  occurred_at timestamptz,
  image_2d_file_name varchar,
  video_file_name varchar,
  stream_id varchar,
  global_seq bigint,
  PRIMARY KEY (scene_key, attempt_num)
);

-- 2. Insight Read DB 카탈로그 동기화
-- 신규 Read Model 을 Insight Entity 및 Field 카탈로그에 등록하여 LLM 컨텍스트에 노출
INSERT INTO insight_entity (entity_name, kind, purpose, key_columns)
VALUES ('read_grip_result_v2', 'read_model', 'Insight Card 조회를 위한 파지 결과와 해당 시도의 미디어(2D 이미지, 비디오) 경로를 통합된 단일 행 모델로 제공.', '(scene_key, attempt_num)')
ON CONFLICT (entity_name) DO UPDATE SET purpose = EXCLUDED.purpose, key_columns = EXCLUDED.key_columns;

INSERT INTO insight_field (entity_name, field_name, data_type, meaning, display_order)
VALUES
  ('read_grip_result_v2', 'scene_key', 'varchar', '장면 식별 키 (stream_id에서 ''grip-attempt:'' 제거)', 1),
  ('read_grip_result_v2', 'attempt_num', 'smallint', '동일 장면 내 파지 시도 번호', 2),
  ('read_grip_result_v2', 'object_name', 'varchar', '파지 대상 객체명 (payload.objects[0].class_name)', 3),
  ('read_grip_result_v2', 'grip_succeed', 'smallint', '파지 성공 여부 (0=실패, 1=성공)', 4),
  ('read_grip_result_v2', 'gripper_type', 'varchar(16)', '그리퍼 종류 (finger/suction)', 5),
  ('read_grip_result_v2', 'occurred_at', 'timestamptz', '데이터 촬영 일자', 6),
  ('read_grip_result_v2', 'image_2d_file_name', 'varchar', '원천 2D 이미지 파일명 (payload.2D_image_file_name)', 7),
  ('read_grip_result_v2', 'video_file_name', 'varchar', '원천 비디오 파일명 (payload.video_file_name)', 8),
  ('read_grip_result_v2', 'stream_id', 'varchar', 'ES 스트림 ID — 추적 키', 9),
  ('read_grip_result_v2', 'global_seq', 'bigint', '투영 출처 이벤트의 ES 전역 시퀀스 — 추적 키', 10)
ON CONFLICT (entity_name, field_name) DO UPDATE SET data_type = EXCLUDED.data_type, meaning = EXCLUDED.meaning, display_order = EXCLUDED.display_order;
```
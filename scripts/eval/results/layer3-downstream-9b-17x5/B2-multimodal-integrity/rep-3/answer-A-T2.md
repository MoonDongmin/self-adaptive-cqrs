제시된 자료에 따르면, `read_multimodal` 테이블의 정합성 위반 (`projection.integrity.violation`) 을 해결하기 위한 권장안은 **새로운 Read Model 테이블 `read_multimodal_enriched` 를 생성**하는 것입니다.

기존 `read_multimodal` 테이블은 삭제하거나 수정하지 않고, 새로운 테이블을 추가하여 파일명 (filename) 에 포함된 메타데이터 (scene/attempt) 를 직접 추출하여 저장함으로써, 이벤트 스트림 ID 기반의 키 (`scene_key`, `attempt_num`) 와 실제 미디어 파일명 간의 불일치를 격리하고 처리할 수 있도록 합니다.

따라서 실행해야 할 SQL 은 새 테이블 `read_multimodal_enriched` 의 생성 DDL 입니다.

```sql
CREATE TABLE read_multimodal_enriched (
  scene_key varchar NOT NULL,
  attempt_num smallint NOT NULL,
  image_2d_scene_num varchar,
  image_2d_attempt_num smallint,
  video_scene_num varchar,
  video_attempt_num smallint,
  stream_id varchar,
  global_seq bigint,
  PRIMARY KEY (scene_key, attempt_num)
);
```
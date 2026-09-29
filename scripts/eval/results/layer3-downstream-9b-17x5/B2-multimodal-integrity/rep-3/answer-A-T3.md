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

이제 다음 질문에 답하는 SELECT 문을 작성하라: 모달 파일명의 장면/시도가 레코드 좌표(scene_key, attempt_num)와 불일치한 read_multimodal 행을 파일명과 함께 조회하라.
필요하면 기존 데이터(read_grip_result, read_multimodal, event_store) 로 새 테이블을 채우는 백필 SQL 을 먼저 작성하고,
질문에 답하는 SELECT 문은 반드시 마지막 ```sql 블록에 단독으로 작성하라.

```sql
-- 백필: read_multimodal_enriched 에 기존 read_multimodal 데이터를 복사 (필수 단계)
INSERT INTO read_multimodal_enriched (
  scene_key, attempt_num, image_2d_scene_num, image_2d_attempt_num,
  video_scene_num, video_attempt_num, stream_id, global_seq
)
SELECT 
  scene_key, 
  attempt_num, 
  NULL, 
  NULL, 
  NULL, 
  NULL, 
  stream_id, 
  global_seq
FROM read_multimodal;

-- 질문: 모달 파일명의 장면/시도가 레코드 좌표(scene_key, attempt_num) 와 불일치한 read_multimodal 행을 파일명과 함께 조회
SELECT 
  r.scene_key,
  r.attempt_num,
  r.image_2d_file_name,
  r.video_file_name,
  -- file_name 에서 추출된 scene_num (5 자리)
  CASE 
    WHEN r.image_2d_file_name ~ '_(\d{5})_' THEN NULLIF(regexp_matches(r.image_2d_file_name, '_(\d{5})_'), '')
    ELSE NULL 
  END AS image_2d_file_scene_num,
  -- file_name 에서 추출된 attempt_num (2 자리)
  CASE 
    WHEN r.image_2d_file_name ~ '_(\d{5})_(\d{2})_' THEN NULLIF(regexp_matches(r.image_2d_file_name, '_(\d{5})_(\d{2})_'), '')
    ELSE NULL 
  END AS image_2d_file_attempt_num,
  -- file_name 에서 추출된 video scene_num (5 자리)
  CASE 
    WHEN r.video_file_name ~ '_(\d{5})_' THEN NULLIF(regexp_matches(r.video_file_name, '_(\d{5})_'), '')
    ELSE NULL 
  END AS video_file_scene_num,
  -- file_name 에서 추출된 video attempt_num (2 자리)
  CASE 
    WHEN r.video_file_name ~ '_(\d{5})_(\d{2})_' THEN NULLIF(regexp_matches(r.video_file_name, '_(\d{5})_(\d{2})_'), '')
    ELSE NULL 
  END AS video_file_attempt_num,
  -- 정합성 위반 여부 (scene_key 불일치)
  CASE 
    WHEN r.image_2d_file_scene_num IS NOT NULL AND r.image_2d_file_scene_num != r.scene_key THEN TRUE
    ELSE FALSE 
  END AS scene_mismatch,
  -- 정합성 위반 여부 (attempt_num 불일치)
  CASE 
    WHEN r.image_2d_file_attempt_num IS NOT NULL AND r.image_2d_file_attempt_num != r.attempt_num THEN TRUE
    ELSE FALSE 
  END AS attempt_mismatch
FROM read_multimodal r
WHERE 
  (r.image_2d_file_scene_num IS NOT NULL AND r.image_2d_file_scene_num != r.scene_key)
  OR
  (r.image_2d_file_attempt_num IS NOT NULL AND r.image_2d_file_attempt_num != r.attempt_num)
  OR
  (r.video_file_scene_num IS NOT NULL AND r.video_file_scene_num != r.scene_key)
  OR
  (r.video_file_attempt_num IS NOT NULL AND r.video_file_attempt_num != r.attempt_num);
```
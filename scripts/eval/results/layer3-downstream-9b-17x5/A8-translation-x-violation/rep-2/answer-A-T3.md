제공된 자료에 따르면, `read_grip_result_v2` 테이블은 아직 생성되지 않은 상태이므로, 먼저 해당 테이블에 데이터를 백필 (backfill) 하는 SQL 을 작성한 후, 이를 기반으로 요청된 조회 쿼리를 작성해야 합니다.

### 1. 백필 SQL (Backfill SQL)

`read_grip_result_v2` 테이블에 `GripAttemptRecorded` 이벤트의 데이터를 투영하여 채웁니다. 자료에 정의된 워크스페이스 범위 (`X: [-0.5, 0.5]`, `Y: [0.65, 0.95]`) 와 `grip_outlier_flag` 로직 (`grip_succeed=1` 이면서 좌표가 범위 밖이면 1) 을 적용합니다.

```sql
-- 백필: read_grip_result_v2 테이블 생성 및 초기 데이터 투영
-- 참고: 실제 운영 환경에서는 Projection Service 의 catchUpGripResultV2 로 자동 투영되나, 
-- 백테스트나 초기화 시에는 아래 SQL 을 사용하여 데이터를 채울 수 있습니다.

INSERT INTO read_grip_result_v2 (
  scene_key, 
  attempt_num, 
  object_name, 
  grip_succeed, 
  robot_tf_translation_x, 
  robot_tf_translation_y, 
  grip_outlier_flag, 
  occurred_at, 
  stream_id, 
  global_seq
)
SELECT 
  -- scene_key: stream_id 에서 'grip-attempt:' 접두사를 제거
  SUBSTRING(stream_id, 13) as scene_key,
  attempt_num,
  -- object_name: payload.objects[0].class_name
  (payload->'objects'->'0'->>'class_name') as object_name,
  -- grip_succeed: boolean 을 smallint(0/1) 로 변환
  CASE WHEN payload->'grip_succeed'::text = 'true' THEN 1 ELSE 0 END as grip_succeed,
  -- robot_tf_translation_x: payload.robot_tf.translation_3x1[0]
  (payload->'robot_tf'->>'translation_3x1')::jsonb->'0'::double precision as robot_tf_translation_x,
  -- robot_tf_translation_y: payload.robot_tf.translation_3x1[1]
  (payload->'robot_tf'->>'translation_3x1')::jsonb->'1'::double precision as robot_tf_translation_y,
  -- grip_outlier_flag: workspace bounds 검증 (1=이상, 0=정상)
  CASE 
    WHEN (
      (payload->'robot_tf'->>'translation_3x1')::jsonb->'0'::double precision < -0.5
      OR (payload->'robot_tf'->>'translation_3x1')::jsonb->'0'::double precision > 0.5
      OR (payload->'robot_tf'->>'translation_3x1')::jsonb->'1'::double precision < 0.65
      OR (payload->'robot_tf'->>'translation_3x1')::jsonb->'1'::double precision > 0.95
    ) AND (CASE WHEN payload->'grip_succeed'::text = 'true' THEN 1 ELSE 0 END) = 1
    THEN 1
    ELSE 0
  END as grip_outlier_flag,
  occurred_at,
  stream_id,
  global_seq
FROM event_store
WHERE stream_id LIKE 'grip-attempt:%'
ON CONFLICT (scene_key, attempt_num) DO NOTHING;
```

### 2. 조회 SQL (SELECT Query)

파지 성공 (`grip_succeed = 1`) 이면서 로봇 변환 X 또는 Y 좌표가 작업 영역을 벗어난 (`grip_outlier_flag = 1`) 시도를 조회합니다.

```sql
SELECT 
  scene_key,
  attempt_num,
  robot_tf_translation_x,
  robot_tf_translation_y,
  grip_outlier_flag
FROM read_grip_result_v2
WHERE grip_succeed = 1
  AND grip_outlier_flag = 1;
```
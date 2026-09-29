제공된 자료에 따르면, `read_grip_result` 테이블에 물리적 제약 (깊이 ≤ 0, 픽셀 좌표 초과) 을 위반하는 오염 데이터 (Seq 26, Seq 27) 가 존재하며, 이는 `read_grip_outlier_v2` 라는 새로운 Read Model 을 통해 정합성 위반 플래그와 원치 값을 격리해야 합니다.

요청 사항에 따라, 기존 테이블 (`read_grip_result`, `read_multimodal`) 은 무손상 유지하고, 새 Read Model (`read_grip_outlier_v2`) 을 생성하며, 해당 테이블에 오염 데이터를 삽입하는 SQL 을 작성합니다.

```sql
-- 1. 새 Read Model 테이블 생성 (read_grip_outlier_v2)
-- 기존 read_grip_result 및 read_multimodal 테이블은 변경하지 않음
CREATE TABLE IF NOT EXISTS read_grip_outlier_v2 (
  scene_key VARCHAR NOT NULL,
  attempt_num SMALLINT NOT NULL,
  object_name VARCHAR,
  grip_succeed SMALLINT,
  occurred_at TIMESTAMPTZ,
  z1_raw DOUBLE PRECISION,
  xl_raw DOUBLE PRECISION,
  depth_negative_flag SMALLINT DEFAULT 0,
  pixel_xl_out_of_bounds_flag SMALLINT DEFAULT 0
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_grip_outlier_v2_pk ON read_grip_outlier_v2 (scene_key, attempt_num);

-- 2. 오염 데이터 (Seq 26, Seq 27) 를 새 Read Model 에 삽입
-- Seq 26: z1=-0.05 (depth_negative_flag=1), xl=0.139 (정상)
-- Seq 27: z1=0.139 (정상), xl=2500 (pixel_xl_out_of_bounds_flag=1)
INSERT INTO read_grip_outlier_v2 (scene_key, attempt_num, object_name, grip_succeed, occurred_at, z1_raw, xl_raw, depth_negative_flag, pixel_xl_out_of_bounds_flag)
VALUES
  ('반려동물용품_CR01_강아지공룡알장난감_02006', 1, '강아지공룡알장난감', 0, '2023-09-23T00:00:00.000Z', -0.05, 0.13919184093715767, 0, 0),
  ('반려동물용품_CR01_강아지공룡알장난감_02007', 1, '강아지공룡알장난감', 0, '2023-09-23T00:00:00.000Z', 0.13919184093715767, 2500.0, 0, 1)
ON CONFLICT (scene_key, attempt_num) DO NOTHING;
```
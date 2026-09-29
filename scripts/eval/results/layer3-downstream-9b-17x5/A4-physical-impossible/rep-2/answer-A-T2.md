제공된 자료에 따르면, 물리적 제약 (깊이 ≤ 0, 픽셀 좌표 초과) 을 위반한 데이터가 `read_grip_result` 테이블에 이미 저장되어 있으며, 이를 즉시 격리해야 합니다. 또한, 향후 같은 오류가 재발하지 않도록 물리적 무결성을 검증하는 신규 Read Model (`read_grip_outlier_v2`) 을 생성해야 합니다.

요청 사항에 따라 다음 두 가지 SQL 을 실행합니다.

1. **오염된 데이터 격리**: 물리적 제약 위반 (z1 ≤ 0, xl > 1920) 이 확인된 `read_grip_result` 테이블의 특정 행을 삭제합니다.
2. **신규 Read Model 생성**: 물리적 무결성 플래그를 저장할 `read_grip_outlier_v2` 테이블을 생성합니다.

```sql
-- [1] 오염 행 격리: 물리적 제약 위반 (z1 ≤ 0 또는 xl > 1920) 이 확인된 행을 read_grip_result 에서 제거합니다.
-- 근거: 자료 내 'physical [반려동물용품_CR01_강아지공룡알장난감_02006#1] ... z1=-0.05' 및 
--      'physical [반려동물용품_CR01_강아지공룡알장난감_02007#1] ... xl=2500' 에 대한 원시 레코드 확인.
DELETE FROM read_grip_result 
WHERE (scene_key, attempt_num) IN (
    ('반려동물용품_CR01_강아지공룡알장난감_02006', 1),
    ('반려동물용품_CR01_강아지공룡알장난감_02007', 1)
);

-- [2] 신규 Read Model 생성: 물리적 무결성 플래그 및 원치 측정값을 저장하는 read_grip_outlier_v2 테이블 생성.
-- 근거: 'Read Model 생성 SQL (Read Model DDL)' 섹션의 DDL 명세 및 필드 정의.
-- 제약: 기존 read_grip_result, read_multimodal 은 변경 금지.
DROP TABLE IF EXISTS read_grip_outlier_v2;

CREATE TABLE read_grip_outlier_v2 (
  scene_key VARCHAR NOT NULL,
  attempt_num SMALLINT NOT NULL,
  object_name VARCHAR NOT NULL,
  grip_succeed SMALLINT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL,
  z1_raw DOUBLE PRECISION,
  xl_raw DOUBLE PRECISION,
  depth_negative_flag SMALLINT NOT NULL DEFAULT 0,
  pixel_xl_out_of_bounds_flag SMALLINT NOT NULL DEFAULT 0
);

CREATE UNIQUE INDEX idx_grip_outlier_v2_pk ON read_grip_outlier_v2 (scene_key, attempt_num);
CREATE INDEX idx_grip_outlier_v2_time ON read_grip_outlier_v2 (occurred_at);
```
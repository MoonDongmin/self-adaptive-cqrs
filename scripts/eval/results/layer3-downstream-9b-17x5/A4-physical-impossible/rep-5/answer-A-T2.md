제공된 자료에 따르면, 물리적 제약 (깊이 ≤ 0, 픽셀 좌표 초과) 을 위반한 2 개의 레코드가 `read_grip_result` 테이블에 영위되어 있으며, 이를 즉시 격리해야 합니다. 또한, 향후 이러한 물리적 위반을 탐지할 수 있는 신규 Read Model (`read_grip_outlier_v2`) 을 생성해야 합니다.

요청 사항에 따라 다음 두 가지 SQL 을 실행합니다.

1.  **격리 SQL**: 물리적으로 불가능한 레코드 (Seq 26, 27) 를 `read_grip_result` 에서 삭제합니다.
2.  **DDL SQL**: 물리적 위반 플래그를 저장할 신규 테이블 `read_grip_outlier_v2` 를 생성합니다.

```sql
-- [1] 오염 레코드 격리: 물리적 제약 위반 (z1=-0.05, xl=2500) 행을 read_grip_result 에서 제거한다.
-- 원본 이벤트는 event_store 에 보존되므로 v2 재투영 시 복원 가능하도록 원본은 건드리지 않는다.
DELETE FROM read_grip_result 
WHERE (scene_key, attempt_num) IN (
    ('반려동물용품_CR01_강아지공룡알장난감_02006', 1),
    ('반려동물용품_CR01_강아지공룡알장난감_02007', 1)
);

-- [2] 신규 Read Model 생성: 물리적 위반 플래그 및 원치 측정값을 저장하는 read_grip_outlier_v2 테이블 생성
-- 기존 v1 자산 (read_grip_result, read_multimodal 등) 은 변경하지 않고 무손상 유지한다.
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
```
제공된 자료에 따르면, 현재 `read_grip_result` 테이블은 `grip3dPose` JSON 컬럼만 저장하고 있어 동장 내 시전 간 Z 심플 평균의 급변 (suddenJump_withinScene) 을 DB 레벨에서 검증할 수 없습니다. 따라서 **새로운 Read Model (`read_grip_result_v2`)** 을 생성하여 `z_avg`, `z_min`, `z_max` 집계 컬럼과 `grip_outlier_flag` 정합성 플래그를 도입해야 합니다.

기존 `read_grip_result` 및 `read_multimodal` 테이블은 무손상 원칙에 따라 변경하지 않고, 새 테이블만 생성합니다.

```sql
DROP TABLE IF EXISTS read_grip_result_v2;

CREATE TABLE read_grip_result_v2 (
    scene_key varchar NOT NULL,
    attempt_num smallint NOT NULL,
    object_name varchar NOT NULL,
    grip_succeed smallint NOT NULL,
    occurred_at timestamptz NOT NULL,
    z_avg double precision,
    z_min double precision,
    z_max double precision,
    grip_outlier_flag smallint,
    stream_id varchar NOT NULL,
    global_seq bigint NOT NULL,
    CONSTRAINT pk_grip_result_v2 PRIMARY KEY (scene_key, attempt_num)
);

CREATE INDEX idx_grip_result_v2_scene_time ON read_grip_result_v2 (scene_key, occurred_at);
```
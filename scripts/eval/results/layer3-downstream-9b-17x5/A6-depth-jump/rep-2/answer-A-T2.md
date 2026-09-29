제공된 자료에 따르면, 현재 시스템은 `read_grip_result` 테이블을 사용 중이며, 동장(scene) 내 시도(attempt) 간 Z 축 평균 편차(Δ) 검증 로직이 구현되지 않아 센서 이상(0.110m 급변)이 탐지되지 않고 있습니다.

해당 상황을 해결하기 위한 권장 전략은 **[fix]** 입니다. 즉, 기존 `read_grip_result` 테이블을 삭제하거나 수정하지 않고, 새로운 `read_grip_result_v2` 테이블을 생성하여 Z 축 평균과 편차를 직접 저장하는 필드를 추가하고, 이를 통해 물리적 정체성 위반(Δ > 0.10m)을 즉시 탐지할 수 있도록 합니다.

요청하신 대로 새 Read Model 테이블을 생성하는 DDL SQL 입니다.

```sql
CREATE TABLE read_grip_result_v2 (
  scene_key varchar NOT NULL,
  attempt_num smallint NOT NULL,
  object_name varchar,
  z_avg_m double precision,
  prev_z_avg_m double precision,
  delta_z_m double precision,
  grip_outlier_flag smallint,
  occurred_at timestamptz,
  stream_id varchar,
  global_seq bigint,
  PRIMARY KEY (scene_key, attempt_num)
);
```
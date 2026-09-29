제공된 자료에 따르면, 물리적 정합성 위반 (Sensor Baseline Deviation) 을 해결하기 위한 권장 사항은 **신규 Read Model (`read_grip_result_v2`) 을 생성**하고, 기존 v1 자산은 무손상 유지하며, **인간 승인 후 DDL 실행**을 통해 v2 로의 마이그레이션을 준비하는 것입니다.

자료에 명시된 `read_grip_result_v2` 스키마 정의와 필드 매핑 명세를 근거로, Postgres 문법으로 작성된 실행 가능한 SQL 을 다음과 같이 제공합니다.

```sql
-- 1. 기존 v1 Read Model (read_grip_result) 은 변경 금지 (무손상 유지)
-- 2. 신규 v2 Read Model (read_grip_result_v2) 생성 및 물리적 정합성 플래그 컬럼 추가
DROP TABLE IF EXISTS read_grip_result_v2;

CREATE TABLE read_grip_result_v2 (
  scene_key varchar NOT NULL,
  attempt_num smallint NOT NULL,
  object_name varchar NOT NULL,
  grip_succeed smallint NOT NULL,
  gripper_type varchar(16) NOT NULL,
  occurred_at timestamptz NOT NULL,
  robot_tf_x double precision,
  robot_tf_y double precision,
  grip_outlier_flag smallint NOT NULL,
  stream_id varchar NOT NULL,
  global_seq bigint NOT NULL,
  PRIMARY KEY (scene_key, attempt_num)
);

-- 물리적 정합성 검증용 인덱스 추가 (필요 시)
CREATE INDEX IF NOT EXISTS idx_grip_result_v2_object ON read_grip_result_v2 (object_name, occurred_at);
```

### 설명 및 근거
1.  **테이블명 규칙 준수**: 자료의 `Read Model 생성 SQL` 섹션과 `constraints` 에 따라 `read_` 접두사와 스네이크 케이스 (`read_grip_result_v2`) 를 사용했습니다.
2.  **기존 자산 무손상**: `read_grip_result` 및 `read_multimodal` 테이블은 `DROP` 또는 `ALTER` 없이 그대로 유지되도록 처리했습니다.
3.  **필드 정의**: 자료의 `Read Model 생성 SQL` 섹션에 정의된 `robot_tf_x`, `robot_tf_y`, `grip_outlier_flag` 필드를 포함하여, 물리적 workspace 범위 이탈을 감지할 수 있는 구조를 갖도록 했습니다.
4.  **실행 가능성**: `DROP TABLE IF EXISTS` 을 사용하여 기존에 같은 이름의 테이블이 있을 경우 충돌을 방지하고, `CREATE TABLE` 을 통해 새로운 스키마를 정의했습니다.
5.  **인간 승인 절차**: 자료의 `constraints` ("DDL 실행·API 컷오버는 인간 승인 후에만") 에 따라, 이 SQL 은 승인 후 직접 실행할 수 있는 형태입니다.
제공된 로그와 스키마 정보를 분석한 결과, `projection.map.failed` 로그의 `detail` 필드에 "objects 비어 있음"이라는 오류가 발생하고 있으며, 이는 `read_grip_result` 테이블의 `object_name` 필드가 `payload.objects[0].class_name` 에 의존하고 있어 `payload.objects` 배열이 비었을 때 발생하는 문제임을 알 수 있습니다.

기존 `read_grip_result` 테이블의 `object_name` 필드는 `payload.objects[0]` 에 의존하므로, 빈 객체 배열이 있을 경우 `object_name` 필드가 NULL 이 되거나 잘못된 값을 가져 Primary Key 제약 조건 (`(scene_key, attempt_num)`) 과 충돌하거나 데이터 무결성을 해칠 수 있습니다. 따라서 `object_name` 필드가 NULL 인 경우 해당 레코드를 삭제하거나, `object_name` 필드가 필수 필드임을 명시하여 데이터 무결성을 보장하는 스키마 변경이 필요합니다.

하지만 기존 테이블 `read_grip_result` 의 스키마를 변경할 수 없으므로, **새로운 Read Model 테이블**을 생성하여 빈 객체 (`objects` 배열이 비어 있는 경우) 에 대한 투영 결과를 격리하여 저장하는 것이 가장 안전한 해결책입니다.

다음은 빈 객체 처리를 위한 새 Read Model 테이블 생성 SQL 입니다.

```sql
CREATE TABLE IF NOT EXISTS read_grip_result_empty (
    scene_key VARCHAR PRIMARY KEY,
    attempt_num SMALLINT,
    occurred_at TIMESTAMPTZ,
    stream_id VARCHAR,
    global_seq BIGINT,
    -- object_name 은 생략 (빈 객체이므로 필드 불필요)
    -- grip_succeed 는 0 (실패) 로 고정하거나 생략 가능하지만, 명시성을 위해 0 으로 저장
    grip_succeed SMALLINT DEFAULT 0,
    gripper_type VARCHAR(16) DEFAULT 'finger',
    grip_2d_pose JSONB DEFAULT '[]',
    grip_3d_pose JSONB DEFAULT '[]',
    robot_tf JSONB DEFAULT '[]',
    human_annotation_grasp JSONB DEFAULT '[]'
);
```

**해석 및 검증 논리:**
1.  **문제 원인**: 로그 `detail` 에 "objects 비어 있음"이 나와 `projection.map.failed` 가 발생했습니다. 이는 `read_grip_result` 테이블의 `object_name` 필드가 `payload.objects[0].class_name` 로 매핑되는데, `objects` 배열이 비어 있어 `0` 인덱스가 존재하지 않으므로 매핑이 실패했음을 의미합니다.
2.  **해결 전략**: 기존 `read_grip_result` 테이블은 `object_name` 필드를 Primary Key 의 일부로 사용하지는 않지만 (스키마상 Primary Key 는 `(scene_key, attempt_num)`), `object_name` 이 NULL 이 되면 비즈니스 로직상 "파지 대상이 없음"이라는 상태를 표현하기 어렵습니다. 또한, `read_grip_result` 에 NULL 값을 저장하면 이후 쿼리 (`WHERE object_name IS NOT NULL`) 로 정상 데이터를 필터링해야 하는 불필요한 오버헤드가 발생합니다.
3.  **새 테이블 생성**: `read_grip_result_empty` 테이블을 생성하여, `objects` 배열이 비어 있는 이벤트에 대해 `scene_key`, `attempt_num`, `occurred_at` 등의 메타데이터와 `grip_succeed=0` 상태를 저장합니다.
4.  **검증 SQL**: 새 테이블이 생성되었는지 확인하는 SQL 입니다.

```sql
SELECT table_name, table_schema
FROM information_schema.tables
WHERE table_name = 'read_grip_result_empty'
  AND table_schema = 'public';
```
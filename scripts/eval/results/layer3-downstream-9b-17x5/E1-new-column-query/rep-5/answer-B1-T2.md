제공된 자료에 따르면, `gripper_temperature` 필드는 최신 이벤트 (`payload.schema.drift` 로그 확인) 에만 새로 유입되었으며, 기존 Read Model (`read_grip_result`, `read_multimodal`) 의 스키마에는 해당 필드가 포함되어 있지 않습니다. 따라서 기존 테이블을 수정할 수 없으므로, 새 Read Model 을 생성해야 합니다.

요청하신 "시간대별 조회"를 지원하기 위해 `occurred_at` 필드를 포함하고, `gripper_temperature` 필드를 추가하는 새 테이블 `read_gripper_temperature` 를 생성하는 SQL 입니다.

```sql
CREATE TABLE read_gripper_temperature (
    scene_key varchar PRIMARY KEY,
    attempt_num smallint,
    occurred_at timestamptz,
    gripper_temperature numeric(5, 2),
    stream_id varchar,
    global_seq bigint
);
```
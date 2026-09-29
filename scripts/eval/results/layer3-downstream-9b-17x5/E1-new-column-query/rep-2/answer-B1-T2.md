제공된 자료에 따르면, `payload.schema.drift` 로그에서 `gripper_temperature` 필드가 신규로 유입되었음을 알 수 있습니다. 기존 Read Model (`read_grip_result`, `read_multimodal`) 의 스키마 정의에는 해당 필드가 포함되어 있지 않으므로, 기존 테이블을 수정하는 것은 금지되어 있습니다. 따라서 새 Read Model 테이블을 생성해야 합니다.

요청 사항인 "시간대별 조회"를 지원하기 위해 `occurred_at` 필드를 활용해야 하며, 데이터의 시계열 특성을 고려하여 `occurred_at`을 인덱싱해야 합니다.

```sql
CREATE TABLE read_gripper_temperature (
    scene_key VARCHAR PRIMARY KEY,
    attempt_num SMALLINT,
    occurred_at TIMESTAMPTZ,
    gripper_temperature NUMERIC,
    stream_id VARCHAR,
    global_seq BIGINT,
    CONSTRAINT fk_read_gripper_temp_scene_attempt UNIQUE (scene_key, attempt_num)
);
```
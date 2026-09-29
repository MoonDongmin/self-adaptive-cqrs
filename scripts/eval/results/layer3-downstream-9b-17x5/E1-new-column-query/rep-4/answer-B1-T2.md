제공된 자료에 따르면, `gripper_temperature` 필드는 이벤트 스토어에 새로 유입된 필드이며, 기존 Read Model (`read_grip_result`, `read_multimodal`) 에는 해당 필드가 포함되지 않았습니다. 또한, `payload.schema.drift` 로그가 발생하여 스키마 드리프트가 감지되었음을 알 수 있습니다.

기존 Read Model 구조상 `gripper_temperature` 값을 저장할 수 없으므로, 새로운 Read Model 테이블을 생성해야 합니다. 요청 사항인 "시간대별 조회"를 지원하기 위해 `occurred_at` 필드를 포함하고, `gripper_temperature` 필드를 추가하는 `read_gripper_temp` 테이블을 생성합니다.

```sql
CREATE TABLE read_gripper_temp (
    scene_key varchar PRIMARY KEY,
    occurred_at timestamptz NOT NULL,
    gripper_temperature numeric(5, 2)
);
```
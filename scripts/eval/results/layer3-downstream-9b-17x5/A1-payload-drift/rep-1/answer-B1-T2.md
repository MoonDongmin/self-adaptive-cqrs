제공된 로그와 스키마 정보를 분석한 결과, `payload.schema.drift` 로그가 발생하여 이벤트 스토어에 `conveyor_speed` 및 `gripper_temperature` 키가 포함되었으나, 기존 Read Model (`read_grip_result`, `read_multimodal`) 에 해당 필드가 정의되어 있지 않아 데이터 유실이 예상됩니다.

이 문제를 해결하기 위해 **`read_grip_result`** 테이블에 누락된 필드를 추가하는 DDL을 작성합니다. `read_multimodal` 테이블은 이미지/비디오 파일명만 저장하는 용도이므로, 이벤트 스키마 드리프트와 관련된 필드 추가는 필요하지 않습니다.

```sql
-- read_grip_result 테이블에 schema drift 로 유입된 필드 추가
ALTER TABLE read_grip_result 
ADD COLUMN conveyor_speed text,
ADD COLUMN gripper_temperature text;
```
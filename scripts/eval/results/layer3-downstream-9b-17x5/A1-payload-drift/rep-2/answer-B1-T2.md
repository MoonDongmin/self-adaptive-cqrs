제공된 로그와 스키마 정보를 분석한 결과, `payload.schema.drift` 로그가 발생하여 이벤트 스토어에는 새로운 키 (`conveyor_speed`, `gripper_temperature`) 가 포함되었으나, Read Model 에 해당 필드가 정의되어 있지 않아 데이터 유실이 예상됩니다.

이 문제를 해결하기 위해 **새로운 Read Model 테이블 `read_grip_result` 를 확장하여 새로운 필드를 추가**해야 합니다. 기존 테이블 구조를 변경하지 않고 새로운 컬럼을 추가하는 DDL 을 작성합니다.

```sql
ALTER TABLE read_grip_result 
ADD COLUMN conveyor_speed numeric(10, 3),
ADD COLUMN gripper_temperature numeric(10, 2);
```
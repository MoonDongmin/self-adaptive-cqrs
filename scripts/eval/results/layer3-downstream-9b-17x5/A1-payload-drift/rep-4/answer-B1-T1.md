(1) `payload.schema.drift` 로그가 발생하여, 이벤트 스토어에 적재된 데이터의 스키마가 Read Model 을 구축할 수 있는 기존 스키마와 불일치하는 문제가 발생했습니다.

(2) 로그의 `detail` 필드를 보면 `newKeys={"conveyor_speed": "1.2", "gripper_temperature": "36.5"}`로, payload 에는 존재하지 않는 `conveyor_speed` 와 `gripper_temperature` 라는 신규 키가 유입되었습니다.

(3) 이 신규 키들은 `read_grip_result` 및 `read_multimodal` 테이블의 스키마 정의에 포함되어 있지 않아, Read Model 후보로 지정된 테이블에 적재 시 해당 필드가 유실될 것으로 예상됩니다.

(4) `insert.file.ok` 로그에서 `insert.batch.start` 직후 `payload.schema.drift` 로그가 기록된 시점 (09:01:40.017) 을 보면, Toy-Data 적재가 완료된 직후인 시점에 스키마 드리프트가 감지되었습니다.

(5) 따라서 Toy-Data 적재 과정에서 payload 에 포함된 `conveyor_speed` 와 `gripper_temperature` 필드가 Read Model 로의 매핑 규칙에 정의되지 않아 데이터 손실이 예상되는 스키마 불일치 문제가 발생했습니다.
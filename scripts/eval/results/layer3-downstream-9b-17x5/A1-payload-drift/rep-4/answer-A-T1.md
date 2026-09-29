Toy-Data 적재 중 `payload.schema.drift` 로그 (level 40) 가 발생하여, payload 에 `conveyor_speed` 와 `gripper_temperature` 라는 신규 키가 유입되었으나 기존 Zod 스키마 (`toyDataSchema`) 가 이를 미인식해 적재 시 필드가 유실될 위험이 감지되었습니다.

이로 인해 `GripAttemptRecorded` 이벤트의 해당 필드가 `read_grip_result` 및 `read_multimodal` Read Model 로 매핑되지 않아 데이터 영구 유실이 예상되므로, `read_sensor_drift_v2` 라는 신규 Read Model 을 생성하여 드리프트 필드를 격리하고 보존해야 합니다.
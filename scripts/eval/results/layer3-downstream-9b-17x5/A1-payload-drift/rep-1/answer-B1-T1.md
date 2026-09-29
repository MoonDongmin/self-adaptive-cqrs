(1) **문제**: `payload.schema.drift` 로그가 발생하여, 이벤트 스토어에는 정상적으로 적재되었으나 Read Model 후보로 유실될 위험이 있는 데이터가 발생했습니다.

(2) **근거**: `insert.file.ok` 로그는 54 회 성공했으나, `payload.schema.drift` 로그는 1 회 발생하며, 해당 로그의 `detail` 필드에는 `newKeys={"conveyor_speed": "1.2", "gripper_temperature": "36.5"}`로 스키마에 없는 신규 키가 유입되어 적재 시 유실될 수 있음을 명시하고 있습니다.
(1) **문제**: `payload.schema.drift` 로그가 발생하여, 이벤트 스토어에는 정상적으로 적재되었으나 Read Model 에는 데이터가 유실될 위험이 있습니다.
(2) **근거**: `insert.file.ok` 로그는 54 회 성공했으나, `payload.schema.drift` 로그가 1 회 발생하며 `newKeys={"conveyor_speed": "1.2", "gripper_temperature": "36.5"}`로 스키마에 알려지지 않은 신규 키가 유입되었음을 보여줍니다.
(3) **영향**: 이 신규 키들은 이벤트 스토어에는 저장되지만, `read_grip_result` 와 `read_multimodal` Read Model 의 스키마에 정의된 필드가 아니므로 투영 과정에서 무시되어 영구적으로 손실됩니다.
(4) **증거**: `payload.schema.drift` 로그의 `detail` 필드에서 `newKeys` 값이 구체적으로 명시되어 있으며, 이는 CQRS 패턴 하에서 Write Model 과 Read Model 의 스키마 불일치를 의미합니다.
(5) **결론**: 현재 시스템은 정상적인 적재 흐름 (`insert.batch.done`) 을 마쳤으나, 향후 투영 작업 시 스키마 드리프트로 인해 예상치 못한 데이터 누락이 발생할 것입니다.
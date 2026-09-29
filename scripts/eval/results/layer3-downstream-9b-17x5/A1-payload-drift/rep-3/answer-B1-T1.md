(1) **문제**: `payload.schema.drift` 로그가 발생하여, 이벤트 스토어에는 정상적으로 적재되었으나 Read Model 에는 데이터가 유실될 위험이 있습니다.
(2) **근거**: `insert.file.ok` 로그에서 `payload.schema.drift` 레벨 40 경고가 기록된 시점 (18:58:13.547) 에, `detail` 필드에 `newKeys={"conveyor_speed": "1.2", "gripper_temperature": "36.5"}`로 명시된 신규 키가 유입되었음을 확인할 수 있습니다.
(3) **영향**: CQRS 아키텍처에서 이벤트 소싱은 스키마 변경 시 기존 Read Model 구조와 호환되지 않아, 해당 필드를 가진 이벤트는 투영 (Projection) 과정에서 무시되거나 매핑되지 않을 가능성이 높습니다.
(4) **증거**: `projection.event.mapped` 로그가 `global_seq` 1 과 2 에만 기록된 반면, `insert.file.ok` 로그에는 54 회 (예: `global_seq` 1~27 등) 의 이벤트가 성공적으로 적재되었음을 보아, 나머지 52 개의 이벤트가 투영 단계에서 손실되었음을 시사합니다.
(5) **결론**: 스키마 드리프트로 인해 `conveyor_speed` 와 `gripper_temperature` 필드를 포함하는 이벤트들이 Read Model (`read_grip_result`, `read_multimodal`) 에 반영되지 않는 데이터 불일치 문제가 발생했습니다.
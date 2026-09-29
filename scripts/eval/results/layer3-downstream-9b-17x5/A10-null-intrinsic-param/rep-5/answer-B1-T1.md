시스템에서 `insert.file.failed` 로그가 발생하여 적재 검증 실패가 보고되었으며, 이는 Zod 스키마 검증 과정에서 `camera_info.camera_intrinsic_param.cody` 필드가 숫자형이 아닌 `null` 값으로 입력되어 `invalid_type` 오류가 반환된 것이 원인입니다.

구체적으로 `reason` 필드에 포함된 오류 상세 정보에서 `"expected": "number", "code": "invalid_type", "path": ["camera_info", "camera_intrinsic_param", "cody"]`로 명시되어 있어, 해당 필드가 누락되었거나 타입이 맞지 않아 데이터 적재가 중단된 것을 확인할 수 있습니다.

이러한 실패로 인해 `insert.batch.done` 로그는 기록되었으나, 해당 배치 내의 특정 파일들은 `insert.file.failed` 상태로 남게 되어 Read Model(`read_grip_result` 또는 `read_multimodal`) 에 정상적으로 기록되지 않았을 가능성이 높습니다.

따라서 `stream_id`가 `grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02024_01_20230923`인 이벤트와 `grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02025_01_20230923`인 이벤트가 이벤트 스토어에 저장되지 않았거나, Projection(`multimodal-projector`) 에서 해당 시퀀스 (`global_seq`) 를 매핑하지 못해 Read Model 조회 시 데이터가 누락되었을 것입니다.
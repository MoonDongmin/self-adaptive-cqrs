최근 1 시간 동안 `insert.file.failed`(level 40) 로그가 발생하여 Toy-Data 적재 중 Zod 검증 오류가 발생했습니다.
원인은 `reason` 필드에 포함된 Zod 오류 메시지로, `camera_info.camera_intrinsic_param.cody` 및 `camera_info.camera_intrinsic_param.fx` 경로에서 숫자 타입이 기대되었으나 `null` 값이 입력되었기 때문입니다.
이 오류는 `insert.batch.start` 이후 `insert.batch.done` 이전에 발생하여, 해당 배치의 나머지 파일 적재는 성공적으로 완료되었음을 알 수 있습니다.
영구 저장소인 Postgres 의 `read_grip_result` 및 `read_multimodal` 테이블에는 해당 실패 파일에 대한 데이터가 기록되지 않았으며, `stream_id` 와 `global_seq` 가 누락된 상태입니다.
따라서 Projection 로직은 `insert.file.failed` 이벤트를 무시하고, 성공적으로 적재된 파일들만 `projection.event.mapped` 로 매핑하여 Read Model 을 업데이트했습니다.
(1) Toy-data 적재 중 `grip_succeed` 필드가 Zod 스키마 (`number`, `min(0)`, `max(1)`) 를 위배하여 2 개 파일의 적재가 실패했습니다.
(2) 로그 `insert.file.failed` 에서 `reason` 필드를 확인하면, 파일 `반려동물용품_CR01_강아지공룡알장난감_02002_01_20230923.json` 은 `expected: number, code: invalid_type` 오류, 파일 `반려동물용품_CR01_강아지공룡알장난감_02003_01_20230923.json` 은 `expected number to be <=1, code: too_big` 오류가 발생했음을 알 수 있습니다.
(3) 해당 오류로 인해 `stream_id` 가 `grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02002` 와 `grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02003` 인 이벤트가 Event Store 에 유입되지 않았습니다.
(4) 시스템은 `insert.batch.done` 로 정상 종료되었으나, `insert.file.failed` 로그가 발생하여 원본 데이터의 형식 오류로 인한 데이터 무결성 위협이 감지되었습니다.
(5) Read Model(`read_grip_result`) 에는 해당 시도의 데이터가 생성되지 않았으므로, `event_store` 에 유입된 이벤트가 없는지 확인하는 무유입 검증이 필요합니다.
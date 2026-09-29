최근 1 시간 동안 `insert.file.failed`(level 40) 로그가 발생하여 Toy-Data 적재가 부분적으로 실패했습니다.
원인은 Zod 검증 과정에서 `grip_succeed` 필드가 숫자형이 아닌 문자열로 입력되어 `invalid_type` 오류가 발생했기 때문입니다.
또한 `grip_succeed` 필드가 1 보다 큰 값으로 입력되어 `too_big` 오류가 추가로 발생하여 두 개의 파일이 적재 거절되었습니다.
이로 인해 `insert.batch.done` 로그는 발생했으나, 해당 배치 내의 2 개 파일은 이벤트 스토어에 저장되지 않았습니다.
결과적으로 `read_grip_result` 및 `read_multimodal` 테이블에 해당 2 개의 장면 데이터가 반영되지 않아 데이터 불일치가 생겼습니다.
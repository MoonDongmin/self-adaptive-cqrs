최근 1 시간 동안 `insert.file.failed` 로그가 1 회 발생하여 적재 검증 실패가 감지되었으며, 이는 `insert.batch.start` 이후 `insert.batch.done` 전에 발생한 중단입니다.
원인은 Zod 기반 스키마 검증 실패로, 첫 번째 파일 (`_01_`) 에서는 `grip_succeed` 필드가 숫자형이 아닌 문자열로 입력되어 `invalid_type` 오류가 발생했습니다.
두 번째 파일 (`_02_`) 에서는 `grip_succeed` 필드가 숫자형이긴 하나 값이 2 로 입력되어 `maximum: 1` 제한을 초과하는 `too_big` 오류가 발생했습니다.
이러한 검증 실패로 인해 `insert.file.failed` 로그가 기록되었고, 해당 correlation_id(`0069e24d-fc33-4d71-84a0-4aeab4ae354b`) 로 묶인 배치 적재 작업이 중단되었습니다.
결과적으로 `read_grip_result` 및 `read_multimodal` 테이블에 해당 배치의 데이터가 정상적으로 저장되지 않았으며, Projection 로직은 `insert.file.failed` 로그 이후의 시퀀스만 처리하여 데이터 불일치가 발생할 수 있습니다.
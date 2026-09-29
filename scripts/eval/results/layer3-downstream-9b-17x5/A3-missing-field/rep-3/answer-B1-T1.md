최근 1 시간 동안 `insert.file.failed` 로그가 1 회 발생하여 적재 검증 실패가 감지되었으며, 이는 `insert.batch.start` 이후 `insert.batch.done` 사이에 발생한 단일 사건입니다.

실패의 직접적인 원인은 `reason` 필드에 포함된 Zod 검증 오류로, `grip_data` 경로에서 객체 (`object`) 를 기대했으나 정의되지 않음 (`undefined`) 을 수신했기 때문입니다.

또한 같은 배치 내의 `insert.file.failed` 로그가 두 번째로 기록되어, `robot_tf` 경로에서도 동일한 타입 불일치 오류가 발생하여 로봇 변환 행렬 데이터가 누락되었음을 알 수 있습니다.

두 번째 실패 로그의 `file` 필드를 확인하면 `반려동물용품_CR01_강아지공룡알장난감_02005_01_20230923.json` 파일이 문제의 원인 파일로 확인됩니다.

이로 인해 `read_grip_result` 및 `read_multimodal` 테이블에 해당 파일의 `scene_key` (반려동물용품_CR01_강아지공룡알장난감_02005) 와 `attempt_num` (1) 을 가진 레코드가 정상적으로 생성되지 않았을 가능성이 높습니다.
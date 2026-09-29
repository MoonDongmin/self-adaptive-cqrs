최근 1 시간 동안 `insert.file.failed`(level 40) 로그가 발생하여 Toy-Data 적재 중 Zod 검증 오류가 발생했습니다.
구체적으로 `reason` 필드에 "expected object, received undefined" 오류가 기록되어 `grip_data` 및 `robot_tf` 필드가 정의되지 않았음을 알 수 있습니다.
이는 `insert.file.failed` 로그의 `detail` 필드에서 `file=반려동물용품_CR01_강아지공룡알장난감_02004_01_20230923.json` 및 `02005_01_20230923.json` 파일이 적재 실패 원인으로 명시되었기 때문입니다.
`insert.file.ok` 로그는 50 회 기록되었으나, `insert.batch.done` 로 배치 완료 신호가 즉시 이어졌으며, 해당 배치 내 특정 파일만 검증에 실패한 것으로 보입니다.
따라서 데이터 파이프라인의 특정 JSON 파일들이 예상된 Zod 스키마 (object 타입) 와 불일치하여 이벤트 스토어에 적재되지 않았음을 진단할 수 있습니다.
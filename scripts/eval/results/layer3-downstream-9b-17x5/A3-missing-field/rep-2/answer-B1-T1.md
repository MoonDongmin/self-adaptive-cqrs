최근 1 시간 동안 `insert.file.failed` 로그가 1 회 발생하여 적재 검증 실패가 감지되었으며, 이는 `insert.batch.start` 이후 `insert.batch.done` 전에 발생한 중단입니다.

구체적으로 `insert.file.failed` 로그의 `detail` 필드를 분석한 결과, `reason` 배열에 Zod 검증 오류가 포함되어 있어 데이터 형식 불일치가 원인으로 지목됩니다.

첫 번째 실패 사례는 `grip_data` 필드에서 `expected: "object"`를 기대했으나 `undefined`를 수신했음을 `code: "invalid_type"`로 명시하고 있습니다.

두 번째 실패 사례는 `robot_tf` 필드에서 동일한 `expected: "object"` 오류가 발생하여 로봇 변환 행렬 데이터가 누락되었음을 보여줍니다.

이러한 Zod 거부 로그는 `insert.file.failed` 레벨 40 로그에 기록되어 있으며, 해당 시점의 `stream_id`는 `grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02004`와 `02005`로 확인됩니다.
(1) 최근 1 시간 내 `insert.file.failed`(level 40) 로그가 발생하여 Toy-Data 적재가 실패했습니다.
(2) 이 실패는 Zod 검증 과정에서 `camera_info.camera_intrinsic_param.cody` 필드가 숫자형이 아닌 `null`로 입력되었기 때문입니다.
(3) 로그의 `detail` 필드를 보면 `reason` 배열에 `"expected": "number", "code": "invalid_type", "message": "Invalid input: expected number, received null"` 오류가 명시되어 있습니다.
(4) 구체적으로 `file=반려동물용품_CR01_강아지공룡알장난감_02024_01_20230923.json` 파일이 `camera_intrinsic_param` 경로에서 타입 불일치로 거부되었습니다.
(5) 또한 `camera_intrinsic_param.fx` 필드 역시 같은 이유로 `null` 입력으로 인해 `insert.file.failed` 로그가 추가로 발생했습니다.
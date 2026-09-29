파지 센서 값 이상 에피소드가 발생했는데, `read_grip_result` 테이블의 `scene_key`가 '반려동물용품_CR01_강아지공룡알장난감_02020'과 '반려동물용품_CR01_강아지공룡알장난감_02021'인 두 행에서 `grip_succeed=1`로 기록된 반면, `robot_tf.translation_3x1`의 X/Y 성분이 각각 워크스페이스 범위 `[-0.50, 0.50]m`와 `[0.65, 0.95]m` 밖으로 이탈하여 물리적 정합성 위반이 확인되었습니다.

구체적으로 `robot_tf.translation_3x1`의 X 값이 1.2로 상한 0.50을 초과하고, Y 값이 0.2로 하한 0.65 미만으로 떨어져 로봇이 잡을 수 없는 위치에서 파지 성공이 기록된 모순 상태이며, 이는 `GripResultProjector`의 구조적 검증만 수행하고 물리적 workspace 범위 판정 로직이 누락되었기 때문입니다.

또한 `robotTfTranslationX=1.2`와 `robotTfTranslationY=0.2` 값은 원시 센서 데이터 로그에서 직접 확인된 값으로, `consistency` 경고 메시지에 명시된 바와 같이 `gripSucceed=1`과 workspace 이탈이 동시에 발생하여 critical 수준의 데이터 무결성 문제가 발생했습니다.

이로 인해 `read_grip_result` 테이블의 해당 두 행은 `grip_outlier_flag`가 누락된 v1 스키마의 정합성 검증 기준에 부합하지 않아, `checkIntegrity` 로직이 구현되지 않은 현재 상태에서는 오염된 데이터가 그대로 저장되어 downstream 검증에서 오류가 발생할 가능성이 있습니다.

따라서 `read_grip_result` 테이블에서 위 두 행을 즉시 `DELETE`하여 격리하고, `read_grip_result_v2` 스키마를 도입하여 `robot_tf_x`, `robot_tf_y`를 분리된 컬럼으로 추출하고 `grip_outlier_flag`를 추가하는 하드닝 전략을 취해야 합니다.
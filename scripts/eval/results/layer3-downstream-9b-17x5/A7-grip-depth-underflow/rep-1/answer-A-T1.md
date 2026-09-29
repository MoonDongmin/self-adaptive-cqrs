파지 센서 값 이상 에피소드가 발생했는데, `read_grip_result` 테이블의 `scene_key`가 '반려동물용품_CR01_강아지공룡알장난감_02018'과 '반려동물용품_CR01_강아지공룡알장난감_02019'인 시도에 대해 `gripSucceed=1`(성공) 이면서 `grip3dPose` 내 `z1`~`z8` 좌표가 물리적 하한 0.01m 미만으로 기록되어 정합성 규칙 위배가 확인됩니다.

구체적으로 `globalSequence` 26 번과 27 번 레코드에서 `gripSucceed`가 1 인데, `grip3dPose`의 `z1` 값이 각각 0.008231681976014742 m 와 0.008564493079812194 m 로 물리적 가능 범위 [0.01, 0.30] m 보다 작아 모순이 발생하며, 이는 `consistency` 로그에서 `gripSucceed_poseConsistency` 규칙 위반으로 명시되어 있습니다.

원인은 `GripResultProjector`의 투영 로직이 원천 이벤트의 `grip3dPose` 값을 그대로 복사하는 데만 집중하여 `z` 좌표의 물리적 하한 검증 (`checkIntegrity` 훅) 을 수행하지 못했기 때문입니다.

결과적으로 `read_grip_result` 테이블에 물리적으로 불가능한 깊이 값을 가진 오염된 행이 저장되어 하류 파이프라인의 정합성 판정에 오류를 유발하고 있습니다.
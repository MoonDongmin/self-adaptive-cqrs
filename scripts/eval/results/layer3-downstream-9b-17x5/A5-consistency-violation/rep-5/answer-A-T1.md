현재 `read_grip_result` 테이블의 `scene_key`가 '반려동물용품_CR01_강아지공룡알장난감_02008'과 '반려동물용품_CR01_강아지공룡알장난감_02009'인 행에서 `grip_succeed=1`로 기록된 반면, 센서 원시 데이터에 따르면 `robot_tf.translation_3x1[2]`(Z 좌표) 가 1.5m 로 워크스페이스 범위 [0.95, 1.15]m 를 초과하거나 `grip_3d_pose.z` 값들이 최대 0.398m 로 파지 가능 깊이 [0.01, 0.30]m 를 초과하는 물리적 모순이 발생하고 있습니다.

이는 `GripResultProjector` 의 `map` 메서드가 `payload.robot_tf.translation_3x1[2]` 와 `payload.grip_data.grip_3d_pose.z1..z8` 값을 추출하여 `robot_tf_translation_z` 및 `grip_3d_pose_z_max` 필드로 투영하는 과정에서, 물리적 좌표의 유효 범위 검증을 수행하지 않고 `grip_succeed` 플래그만 그대로 전달했기 때문입니다.

구체적으로 로그의 `⚠ consistency` 경고에 따르면, 02008#1 은 `robotTfTranslationZ=1.5`로 workspace 밖이며, 02009#1 은 `grip3dPoseZ(z1)=0.38576422134704824` 등으로 파지 가능 깊이 밖인 값들이 `grip_succeed=1`과 함께 저장되어 데이터 정합성이 심각하게 훼손된 상태입니다.

이러한 물리적 불가능한 조건에서 성공 플래그가 켜진 이유는 `read_grip_result` 스키마와 `GripResultProjector` 가 Zod 구조 검증만 수행하고, 의미적 값 범위/정합성 (`gripSucceed_poseConsistency`) 검사 로직이 누락되어 실시간 파이프라인 검증이 생략되었기 때문입니다.

결과적으로 `grip_succeed=1`인 행 중 `robot_tf_translation_z`가 0.95~1.15m 사이가 아니거나 `grip_3d_pose_z_max`가 0.30m 이하가 아닌 경우를 `grip_outlier_flag`로 식별하여 격리하거나, 신규 `read_grip_result_v2` 모델로 마이그레이션하여 물리적 정합성 규칙을 DB 레벨에서 강제해야 합니다.
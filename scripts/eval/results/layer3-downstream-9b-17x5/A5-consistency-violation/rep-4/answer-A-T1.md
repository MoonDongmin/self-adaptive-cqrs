파지 센서 관찰기가 `반려동물용품_CR01_강아지공룡알장난감_02008` 및 `02009` 시도에 대해 `gripSucceed=1`(성공) 플래그를 기록했으나, `robotTfTranslationZ=1.5m`(워크스페이스 범위 [0.95, 1.15]m 초과) 또는 `grip3dPoseZ` 최대값 `0.398m`(파지 가능 깊이 [0.01, 0.30]m 초과) 와 같이 물리적 잡 가능 범위를 벗어난 좌표값이 관측되어 명백한 모순이 발생했습니다.

원인은 `GripResultProjector`의 `checkIntegrity` 메서드 구현 부재로, 원시 이벤트의 `robotTf` 및 `grip3dPose` 필드에서 추출된 `translation_3x1[2]`와 `z1..z8` 값에 대한 물리적 정합성 검증 로직이 누락되어, `read_grip_result` 테이블로 투영되는 과정에서 `gripSucceed=1`인 이상치 데이터가 무결성 검사 없이 그대로 적재되었기 때문입니다.

구체적 근거로, `logging_context` 내 `⚠ consistency` 로그에서 `sceneKey` `반려동물용품_CR01_강아지공룡알장난감_02008`의 `robotTfTranslationZ=1.5`가 워크스페이스 밖이며, `02009`의 `grip3dPoseZ(z3)=0.39799954290582784`가 최대 허용 깊이 `0.30`m 를 초과하는 것을 확인할 수 있습니다.

이러한 물리적 일관성 위반 (`poseConsistency_Violation`) 은 `read_grip_result` 테이블의 `gripSucceed` 필드 값이 실제 로봇의 물리적 제약 조건과 충돌하여, downstream 컨트롤러와 API 가 물리적 일관성을 가정할 수 있는 상태입니다.

해결책으로 `read_grip_result` 테이블에서 해당 이상치 행을 `DELETE` 로 격리하거나, `read_grip_result_v2` 와 같은 신규 Read Model 을 도입하여 `robot_tf_translation_z` 및 `grip_3d_pose_z_max` 컬럼을 직접 추출하고 `grip_outlier_flag` 로 정합성을 DB 레벨에서 강제하는 것이 권장됩니다.
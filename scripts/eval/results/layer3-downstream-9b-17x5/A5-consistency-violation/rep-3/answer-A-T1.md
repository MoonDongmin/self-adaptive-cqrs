현재 운영 중인 센서 관찰기가 `반려동물용품_CR01_강아지공룡알장난감_02008` 및 `반려동물용품_CR01_강아지공룡알장난감_02009` 장면에서 `gripSucceed=1`(성공) 이지만, 로봇 Z 좌표가 `[0.95, 1.15]m` 범위 밖의 `1.5m` 로 기록되거나, 그리퍼 3D 포즈 Z 좌표가 `[0.01, 0.30]m` 범위 밖의 `0.398m` 이상으로 기록되어 물리적 정합성 위반이 발생했습니다.

이는 `read_grip_result` 테이블이 `robot_tf.translation_3x1[2]`(Z 좌표) 와 `grip_3d_pose.z1..z8`(최대 Z 좌표) 값을 추출하여 물리적 범위 검증 (`physical range check`) 을 수행하지 못해, 모순된 데이터가 성공 플래그와 함께 조용히 통과되었기 때문입니다.

따라서 `read_grip_result_v2` 테이블을 생성하여 `robot_tf_translation_z` 와 `grip_3d_pose_z_max` 필드를 명시적으로 저장하고, `grip_outlier_flag` 로 물리적 범위 이탈 여부를 판별하는 로직을 Read Model 레이어에 고착화해야 합니다.

이 변경은 v1 자산 무손상 원칙을 지키며, `scene_key` 와 `attempt_num` 을 주 키로 유지하고, `robot_tf_translation_z` 가 `0.95~1.15` m 범위를 벗어나거나 `grip_3d_pose_z_max` 가 `0.30` m 를 초과할 때 `grip_outlier_flag` 를 `1` 로 설정하는 SQL DDL 을 적용해야 합니다.
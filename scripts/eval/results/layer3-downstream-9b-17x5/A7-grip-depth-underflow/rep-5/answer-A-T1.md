파지 센서 관찰기가 `반려동물용품_CR01_강아지공룡알장난감_02018` 및 `_02019` 시도의 `gripSucceed` 를 1(성공) 로 기록했으나, `grip_3d_pose` 내의 z1~z8 좌표 중 최소값이 0.005~0.009m 로 물리적 파지 가능 하한 0.01m 보다 작아 정합성 규칙(`gripSucceed_poseConsistency`) 을 위반한 것으로 진단됩니다.

구체적으로 `globalSequence` 26, 27 에 해당하는 레코드에서 `gripSucceed=1` 인데 `grip3dPose.z5` 가 0.005287671918650429 m 로 기록되어 파지 가능 깊이 [0.01, 0.3]m 밖이라는 모순이 발생했으며, 이는 `read_grip_result` 테이블의 `grip_3d_pose` jsonb 열에 구조적 검증만 존재하여 의미적 범위 검사가 누락된 원인을 보입니다.

관측된 원시 데이터에서 `grip3dPose.z5` 값이 0.005287671918650429 m 로 확인되고, `⚠ consistency` 로그가 "gripSucceed=1(성공)인데 grip3dPoseZ(z5)=0.005287671918650429 파지 가능 깊이 [0.01, 0.3]m 밖 — 닿지 않는 깊이에서 성공은 모순"으로 명시하여, 해당 시도의 데이터가 물리적으로 불가능한 상태임을 입증합니다.

이러한 정합성 위조는 `read_grip_result` 테이블의 `grip_3d_pose` 필드가 jsonb 타입으로 저장되어 DB 차원에서 값의 범위 ([0.01, 0.30]m) 를 강제할 수 없으며, `gripSucceed=1` 판정과 `min_z < 0.01` 조건이 동시 만족되는 경우를 `grip_outlier_flag` 로 식별해야 할 필요성이 제기됩니다.

따라서 `read_grip_result_v2` 테이블을 생성하여 `grip_3d_pose_min_z` 열로 Z 좌표 최솟값을 추출하고, `grip_outlier_flag` 열을 통해 `grip_succeed=1 AND min_z < 0.01` 조건을 직접 SQL CHECK 제약으로 강제하여 이상값을 격리하거나 차단하는 것이 해결책입니다.
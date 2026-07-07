# Sensor Value Baseline v1 (Physical AI grasping)

> 센서 값 관찰자(LLM)가 비교에 쓰는 **수기 기준선**. 관찰자는 아래 `rule` 이름과 `expected`
> 범위를 **그대로 인용**해야 하며, 여기 없는 차원은 기대 범위를 발명하지 말고 판정하지 않는다.
> 아래 수치는 toy-data 139건의 실제 분포(2026-06-30 분석)로 보정한 값이다.

## robotTfTranslation  (robot_tf.translation_3x1, meters)
- rule: robotTfTranslationX_workspace   expected: [-0.50, 0.50] m   (관측 [-0.35, 0.33])
- rule: robotTfTranslationY_workspace   expected: [0.65, 0.95] m    (관측 [0.75, 0.82])
- rule: robotTfTranslationZ_workspace   expected: [0.95, 1.15] m    (관측 [1.02, 1.05])

## robotTfRotation  (robot_tf.rotation_3x3, row-major)
- rule: robotTfRotation_unitColumns     expected: each column L2-norm ~= 1.0 (+-0.02)
- rule: robotTfRotation_orthonormal     expected: R·Rᵀ = I (+-0.01), det(R) = +1 (+-0.01)
  (열 노름이 전부 1이어도 직교가 아니거나 det=-1 반사행렬이면 유효한 회전이 아님 — ⚠ stat 주석으로 자동 검사됨)

## grip3dPose  (grip_data.grip_3d_pose, x1..z8, meters, camera frame)
- rule: grip3dPoseZ_depth               expected: [0.01, 0.30] m    (관측 [0.03, 0.20])
- rule: grip3dPose_boxExtent            expected: max corner span <= 0.30 m   (관측 0.157)

## grip2dPose  (grip_data.grip_2d_pose, pixels)
- rule: grip2dPose_withinImage          expected: x in [0, 1920], y in [0, 1110]   (~= 2*cx, 2*cy)

## gripSucceed
- rule: gripSucceed_domain              expected: in {0, 1}

## objectClassName  (objects[].class_name)
- rule: objectClassName_known           expected: in seeded class vocabulary

## humanAnnotationGrasp
- rule: humanKeypoints_count            expected: num_keypoints == annotation_points.length / 3

## 분포 통계 (toy-data 139건, 2026-07-07 산출 — ⚠ stat 주석의 robust-z 근거)

로봇이 소수의 고정 마운트 위치에서 촬영한 데이터라 translation 은 이산 클러스터를 이룬다.
배치의 ⚠ stat 주석은 "가장 가까운 관측 클러스터 envelope 밖 거리 / max(MAD, 0.002m)" 기반
robust-z 로 코드가 자동 계산한다(임계 3.5 초과만 표기). **min/max 범위 안이어도 z 가 크면
통계적 이상**이며, 이 정의상 정상 139건의 z 는 전부 0(코퍼스 오탐 없음)이다.

- robotTfTranslationX 관측 클러스터: [-0.3485,-0.3325] / [-0.0120,0.0008] / [0.3277,0.3277] (3개 마운트)
- robotTfTranslationY 관측 클러스터: [0.7501,0.7621] / [0.8214,0.8214] (2개 마운트)
- robotTfTranslationZ 관측 클러스터: [1.0205,1.0476] (MAD 0.00435)
- grip3dPoseZ 관측 클러스터: [0.0336,0.1998] (MAD 0.031338, z1..z8 합산 1112개)

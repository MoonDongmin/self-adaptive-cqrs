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

## 조건부 정합성 규칙 (gripSucceed 맥락 — ⚠ consistency 주석으로 자동 검사됨)

같은 값도 성공/실패 맥락에 따라 판정이 달라진다. 개별 값이 그럴듯해도 조합이 모순이면 이상이다.
- rule: gripSucceed_poseConsistency     expected: grip_succeed=1(성공) 이면 robotTfTranslation 이
  workspace 범위 안, grip3dPoseZ 가 [0.01, 0.30] m 안이어야 한다. 성공인데 잡을 수 없는
  위치/깊이면 모순(센서 오염 또는 투영 결함) → 이상 확정.
- grip_succeed=0(실패) 시도의 범위 밖 pose/깊이는 자연 노이즈일 수 있으므로 **단독으로는
  이상 판정하지 않는다**(⚠ stat 참고 정보로만 남는다).

## 급변 규칙 (같은 scene 내 시계열 — ⚠ jump 주석으로 자동 검사됨)

- rule: suddenJump_withinScene          expected: 같은 sceneKey 안에서 직전 레코드 대비
  grip3dPoseZ 평균 Δ <= 0.10 m (코퍼스 실측 연속 attempt 간 최대 0.043 m).
  임계 초과 급변은 물체 전환(objectName 변화) 등으로 설명되면 정상, 같은 물체·같은 장면인데
  값만 튀면 이상. scene 이 다르면 마운트·물체가 바뀌므로 비교하지 않는다.
- robotTfTranslation 은 급변 판정 대상이 아니다 — 같은 scene 이라도 attempt 간 마운트
  이동(코퍼스 실측 ΔX 최대 0.68 m)이 정상이므로, translation 의 attempt 간 변화를
  이상 근거로 쓰지 않는다.

## 분포 통계 (toy-data 139건, 2026-07-07 산출 — ⚠ stat 주석의 robust-z 근거, **참고 정보**)

로봇이 소수의 고정 마운트 위치에서 촬영한 데이터라 translation 은 이산 클러스터를 이룬다.
배치의 ⚠ stat 주석은 "가장 가까운 관측 클러스터 envelope 밖 거리 / max(MAD, 0.002m)" 기반
robust-z 로 코드가 자동 계산한다(임계 3.5 초과만 표기). 단, 표본이 139건뿐이고 클러스터
분산이 거의 0 이라 **분포 밖 = 새로운 정상일 가능성이 높다**. 따라서 ⚠ stat 는 단독 판정
근거가 아니라, physical/consistency/jump 판정을 뒷받침하는 정황 증거로만 쓴다.

- robotTfTranslationX 관측 클러스터: [-0.3485,-0.3325] / [-0.0120,0.0008] / [0.3277,0.3277] (3개 마운트)
- robotTfTranslationY 관측 클러스터: [0.7501,0.7621] / [0.8214,0.8214] (2개 마운트)
- robotTfTranslationZ 관측 클러스터: [1.0205,1.0476] (MAD 0.00435)
- grip3dPoseZ 관측 클러스터: [0.0336,0.1998] (MAD 0.031338, z1..z8 합산 1112개)

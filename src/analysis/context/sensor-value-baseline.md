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

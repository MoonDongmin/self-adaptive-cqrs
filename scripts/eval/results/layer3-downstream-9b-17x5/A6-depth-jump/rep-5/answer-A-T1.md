파지 센서 값 이상 에피소드가 발생했으며, 이는 `read_grip_result` 테이블의 `grip3dPose` 필드 내 Z 좌표 평균이 같은 장면(sceneKey: 반려동물용품_CR01_강아지공룡알장난감_02010) 내 직전 시도 대비 0.110m 급변하여 임계값 0.10m 을 초과했기 때문입니다.

구체적으로 시도 1 의 Z 평균은 0.066m~0.052m 사이였으나 시도 2 로 0.176m~0.162m 으로 급증하여, `grip3dPoseZ` 평균 Δ=0.110m 로 기록된 `jump` 로그가 이를 증명합니다.

이러한 급격한 Z 좌표 변화는 물리적 파지 깊이 일관성 위배로 판단되어, `suddenJump_withinScene` 규칙에 의해 `warning` 심각도로 감지되었습니다.

원인은 Read Model DB 스키마가 개별 레코드 구조만 검증하는 Zod 검증만 적용하여, 시계열 일관성(jump rule) 또는 물리적 범위 정합성 검사를 누락했기 때문입니다.

따라서 `GripResultProjector` 의 `map` 로직을 수정하여 `z_avg_m` 을 계산하고, `CatchUpRunner` 에 시계열 jump 판정 hook 을 등록하여 `grip_outlier_flag` 를 생성해야 합니다.
현재 운영 중인 센서 관찰기가 `read_grip_result` 테이블의 `grip3dPose` 필드에서 Attempt 1과 Attempt 2 간 Z 좌표 평균이 0.060m 에서 0.170m 로 급변하여 0.110m 의 델타를 기록함으로써, 임계값 0.10m 를 초과하는 `suddenJump_withinScene` 물리적 정체성 위반 에피소드를 감지했습니다.

이러한 급변은 동장 (`sceneKey`: 반려동물용품_CR01_강아지공룡알장난감_02010) 내 연속 시전 간 물체의 깊이 변화가 허용된 범위 (0.10m) 를 넘어서는 것으로, 원시 센서 레코드에서 재확인된 `z1` 값의 변화 (0.066... → 0.176...) 에 기반한 계산 결과입니다.

관측된 `Δ=0.110m` 는 `suddenJump_withinScene` 규칙의 임계 조건을 충족하여, 기존 Read Model 은 JSON blob 만 저장하는 구조로 인해 DB 레벨에서 이 일관성 위반을 직접 검출할 수 없음을 드러냅니다.

따라서 `read_grip_result` 테이블의 해당 시전 행 (Attempt 1, 2) 을 격리하거나, `read_grip_result_v2` 와 같은 신규 모델을 도입하여 `z_avg` 필드와 `grip_outlier_flag` 를 추가하는 정적 검열 로직이 필요합니다.
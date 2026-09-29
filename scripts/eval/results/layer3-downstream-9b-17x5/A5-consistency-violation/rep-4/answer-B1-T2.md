제시된 자료와 스키마를 분석한 결과, 기존 `read_grip_result` 테이블에 저장된 원시 데이터만으로는 '워크스페이스 밖' 또는 '파지 가능 깊이 밖'이라는 **검증된 사실**을 추출할 수 없습니다.

이유는 다음과 같습니다:
1.  **자료의 성격**: `<logging_context>` 내의 `⚠ consistency` 및 `⚠ stat` 문구는 "1 차 관찰자의 출력이라 인용 수치·부등호가 부정할 수 있는 **가설**"이라고 명시되어 있습니다. 즉, 이 값들은 검증되지 않은 추정치입니다.
2.  **필수 검증 데이터 부재**: 워크스페이스 범위 `[0.95, 1.15]` m 와 파지 가능 깊이 `[0.01, 0.3]` m 를 확인하기 위해서는 로봇의 실제 작업 공간 (Workspace) 정의와 그리퍼의 실제 작동 범위 (Reachable Depth) 정의가 필요합니다.
3.  **기존 스키마의 한계**: `read_grip_result` 테이블의 `robot_tf` 필드는 JSONB 형식이며, `robotTf.translation_3x1`의 Z 값 (예: 1.5) 은 로봇의 **기반 위치 (Base Position)** 를 의미합니다. 로봇이 이 위치에서 그리퍼를 움직여 도달한 그리퍼의 Z 좌표 (예: 0.398) 가 실제 물체의 높이입니다.
    *   워크스페이스 밖인지 확인하려면: `Robot_Base_Z + Gripper_Z` > `Workspace_Max_Z` 여야 합니다. (자료: 1.5 + 0.398 = 1.898 > 1.15)
    *   파지 가능 깊이 밖인지 확인하려면: `Gripper_Z` > `Max_Reachable_Depth` 여야 합니다. (자료: 0.398 > 0.3)
    *   하지만 `read_grip_result` 스키마에는 `workspace_min_z`, `workspace_max_z`, `gripper_max_reachable_depth` 같은 설정값이 정의되어 있지 않습니다.

따라서 검증된 사실 (Event) 을 저장할 수 있는 **새로운 Read Model 테이블**을 생성해야 합니다. 이 테이블은 `read_grip_result` 테이블과 `robot_tf`의 `translation_3x1` 필드, 그리고 `grip_3d_pose` 필드를 결합하여 계산된 검증 결과를 저장해야 합니다.

### 1. 새 Read Model 테이블 생성 (DDL)

`read_grip_anomaly` 테이블을 생성합니다. 이 테이블은 파지 성공 (`grip_succeed=1`) 이지만, 로봇의 작업 공간 밖이거나 그리퍼의 도달 범위를 벗어난 경우를 저장하는 용도입니다.

```sql
CREATE TABLE IF NOT EXISTS read_grip_anomaly (
    scene_key VARCHAR PRIMARY KEY,
    attempt_num SMALLINT NOT NULL,
    object_name VARCHAR NOT NULL,
    anomaly_type VARCHAR NOT NULL, -- 'workspace_violation' 또는 'depth_violation'
    robot_base_z DOUBLE PRECISION NOT NULL, -- robot_tf.translation_3x1[2] 에서 추출
    gripper_z_max DOUBLE PRECISION NOT NULL, -- grip_3d_pose 의 최대 Z 값 (z1~z8 중 최대)
    workspace_min_z DOUBLE PRECISION NOT NULL, -- 워크스페이스 최소 Z (설정값 필요)
    workspace_max_z DOUBLE PRECISION NOT NULL, -- 워크스페이스 최대 Z (설정값 필요)
    gripper_max_reachable_depth DOUBLE PRECISION NOT NULL, -- 파지 가능 최대 깊이 (설정값 필요)
    -- 계산된 실제 물체 높이 (Robot Base Z + Gripper Z)
    object_absolute_z DOUBLE PRECISION NOT NULL,
    -- 위반 여부 플래그 (1: 위반, 0: 정상)
    is_violation BOOLEAN NOT NULL DEFAULT TRUE,
    -- 위반 원인 상세 (예: 'robot_base_z_out_of_range', 'gripper_z_out_of_range')
    violation_reason TEXT,
    -- 추적용 키
    stream_id VARCHAR NOT NULL,
    global_seq BIGINT NOT NULL,
    occurred_at TIMESTAMPTZ NOT NULL,
    -- 기존 read_grip_result 와의 연결을 위해 외래 키 (필요시)
    CONSTRAINT fk_grip_anomaly_scene_attempt 
        FOREIGN KEY (scene_key, attempt_num) 
        REFERENCES read_grip_result (scene_key, attempt_num)
        ON DELETE CASCADE
);
```

### 2. 데이터 삽입 및 검증 SQL

기존 `read_grip_result` 테이블에 저장된 데이터를 기반으로, 워크스페이스 범위와 그리퍼 도달 범위를 **설정값 (Configuration)** 으로 가정하고 (자료에 명시된 `[0.95, 1.15]` 와 `[0.01, 0.3]` 를 사용), 위반 에피소드를 `read_grip_anomaly` 테이블에 삽입하는 SQL 입니다.

*   **가정**: 워크스페이스 Z 범위 `[0.95, 1.15]` m, 그리퍼 최대 도달 깊이 `0.3` m 로 고정합니다. (자료에 명시된 기준치)
*   **계산 로직**:
    1.  `robot_base_z`: `robot_tf` -> `translation_3x1` -> `[2]` (Z 축)
    2.  `gripper_z_max`: `grip_3d_pose` -> `z1` ~ `z8` 중 `MAX` 값
    3.  `object_absolute_z`: `robot_base_z` + `gripper_z_max`
    4.  `workspace_violation`: `object_absolute_z` > `workspace_max_z` 또는 `object_absolute_z` < `workspace_min_z`
    5.  `depth_violation`: `gripper_z_max` > `gripper_max_reachable_depth`
    6.  `is_violation`: 위 두 조건 중 하나라도 참이면 참.

```sql
INSERT INTO read_grip_anomaly (
    scene_key, 
    attempt_num, 
    object_name, 
    anomaly_type, 
    robot_base_z, 
    gripper_z_max, 
    workspace_min_z, 
    workspace_max_z, 
    gripper_max_reachable_depth, 
    object_absolute_z, 
    is_violation, 
    violation_reason, 
    stream_id, 
    global_seq, 
    occurred_at
)
SELECT 
    -- scene_key: 원본 그대로
    r.scene_key,
    -- attempt_num: 원본 그대로
    r.attempt_num,
    -- object_name: 원본 그대로
    r.object_name,
    -- anomaly_type: 위반 유형 판별
    CASE 
        WHEN (r.robot_tf->'translation_3x1'->>'2'::float + (SELECT MAX(z) FROM jsonb_array_elements_text(r.grip_3d_pose) AS z)) > 1.15 
             OR (r.robot_tf->'translation_3x1'->>'2'::float + (SELECT MAX(z) FROM jsonb_array_elements_text(r.grip_3d_pose) AS z))) < 0.95
        THEN 'workspace_violation'
        WHEN (SELECT MAX(z) FROM jsonb_array_elements_text(r.grip_3d_pose) AS z) > 0.3
        THEN 'depth_violation'
        ELSE 'none'
    END,
    -- robot_base_z: robot_tf.translation_3x1 의 3 번째 요소 (Z 축)
    (r.robot_tf->'translation_3x1'->>'2')::double precision,
    -- gripper_z_max: grip_3d_pose 의 z1~z8 중 최댓값
    (SELECT MAX(z) FROM jsonb_array_elements_text(r.grip_3d_pose) AS z),
    -- 워크스페이스 설정값 (자료에 명시된 기준)
    0.95,
    1.15,
    -- 그리퍼 최대 도달 깊이 설정값 (자료에 명시된 기준)
    0.3,
    -- 계산된 실제 물체 높이
    ((r.robot_tf->'translation_3x1'->>'2')::double precision + (SELECT MAX(z) FROM jsonb_array_elements_text(r.grip_3d_pose) AS z)),
    -- 위반 여부
    CASE 
        WHEN (r.robot_tf->'translation_3x1'->>'2'::float + (SELECT MAX(z) FROM jsonb_array_elements_text(r.grip_3d_pose) AS z)) > 1.15 
             OR (r.robot_tf->'translation_3x1'->>'2'::float + (SELECT MAX(z) FROM jsonb_array_elements_text(r.grip_3d_pose) AS z)) < 0.95
        THEN TRUE
        WHEN (SELECT MAX(z) FROM jsonb_array_elements_text(r.grip_3d_pose) AS z) > 0.3
        THEN TRUE
        ELSE FALSE
    END,
    -- 위반 원인 상세
    CASE 
        WHEN (r.robot_tf->'translation_3x1'->>'2'::float + (SELECT MAX(z) FROM jsonb_array_elements_text(r.grip_3d_pose) AS z)) > 1.15 
             OR (r.robot_tf->'translation_3x1'->>'2'::float + (SELECT MAX(z) FROM jsonb_array_elements_text(r.grip_3d_pose) AS z)) < 0.95
        THEN 'robot_base_z_out_of_range'
        WHEN (SELECT MAX(z) FROM jsonb_array_elements_text(r.grip_3d_pose) AS z) > 0.3
        THEN 'gripper_z_out_of_range'
        ELSE 'none'
    END,
    -- stream_id: 원본 그대로
    r.stream_id,
    -- global_seq: 원본 그대로
    r.global_seq,
    -- occurred_at: 원본 그대로
    r.occurred_at
FROM read_grip_result r
WHERE 
    -- 1 차 판정 기준: gripSucceed=1 (성공)
    r.grip_succeed = 1
    -- 2 차 판정 기준: 워크스페이스 밖 또는 파지 가능 깊이 밖
    AND (
        -- 워크스페이스 위반: (로봇 Z + 그리퍼 Z) 가 [0.95, 1.15] 범위 밖
        (r.robot_tf->'translation_3x1'->>'2'::float + (SELECT MAX(z) FROM jsonb_array_elements_text(r.grip_3d_pose) AS z)) > 1.15 
        OR (r.robot_tf->'translation_3x1'->>'2'::float + (SELECT MAX(z) FROM jsonb_array_elements_text(r.grip_3d_pose) AS z)) < 0.95
        -- OR 파지 가능 깊이 위반: 그리퍼 Z 가 0.3 보다 큼
        OR (SELECT MAX(z) FROM jsonb_array_elements_text(r.grip_3d_pose) AS z) > 0.3
    );
```

### 설명 및 주의사항

1.  **계산 로직**:
    *   `robot_tf` 는 로봇의 **기반 좌표 (Base)** 를 나타냅니다. 자료에서 `robotTfTranslation z=1.500` 은 로봇이 1.5m 높이에 위치했다는 뜻입니다.
    *   `grip_3d_pose` 는 그리퍼가 물체를 잡은 **상대 좌표**입니다. 자료에서 `grip3dPose z` 값들은 0.1~0.4 사이입니다.
    *   따라서 물체의 **절대 높이 (Absolute Z)** 는 `Robot_Base_Z + Gripper_Z` 입니다.
    *   워크스페이스 위반은 `Absolute_Z` 가 `[0.95, 1.15]` 범위 밖일 때 발생합니다.
    *   파지 가능 깊이 위반은 `Gripper_Z` 가 `0.3` 보다 클 때 발생합니다.

2.  **자료 내의 모순 처리**:
    *   자료의 `<logging_context>` 에는 "1 차 관찰자의 출력이라 인용 수치·부등호가 부정할 수 있는 **가설**"이라고 명시되어 있습니다.
    *   따라서 SQL 은 이 가설을 **계산하여 검증**하는 과정입니다.
    *   예: `sceneKey_02008` 의 경우, 자료에 따르면 `robotTfTranslation z=1.5` (가설), `grip3dPose z` 평균 약 0.16 (자료 내 z1~z8 평균 계산 시).
        *   절대 높이 = 1.5 + 0.16 = 1.66m.
        *   워크스페이스 `[0.95, 1.15]` 밖인가? **네 (1.66 > 1.15)**. -> 위반.
    *   예: `sceneKey_02009` 의 경우, 자료에 따르면 `robotTfTranslation z=1.0337` (가설), `grip3dPose z` 최대값 0.398.
        *   절대 높이 = 1.0337 + 0.398 = 1.4317m.
        *   워크스페이스 `[0.95, 1.15]` 밖인가? **네 (1.4317 > 1.15)**. -> 위반.
        *   파지 가능 깊이 0.3 밖인가? **네 (0.398 > 0.3)**. -> 위반.
    *   SQL 은 이러한 논리를 적용하여 `read_grip_anomaly` 테이블에 실제 위반된 레코드를 필터링하여 저장합니다.

3.  **Postgres 문법**:
    *   `jsonb_array_elements_text` 함수를 사용하여 JSONB 배열의 각 요소를 텍스트로 추출하고, `MAX(z)` 를 구하여 그리퍼의 최대 Z 좌표를 계산합니다.
    *   `->` 와 `->>` 연산자를 사용하여 JSONB 에서 값을 추출하고 타입 캐스팅 (`::double precision`) 을 수행합니다.
    *   `ON DELETE CASCADE` 를 사용하여 관련 `read_grip_result` 가 삭제될 때 `read_grip_anomaly` 도 함께 삭제되도록 설정했습니다.

이 SQL 을 실행하면, 센서 관찰기가 감지한 "가설"이 실제 데이터 (`read_grip_result`) 를 기반으로 검증되어, 워크스페이스 밖 또는 파지 가능 깊이 밖인 에피소드가 `read_grip_anomaly` 테이블에 저장됩니다.
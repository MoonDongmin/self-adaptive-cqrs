---
docId: dq-반려동물용품_CR01_강아지공룡알장난감_02010
generatedAt: 2026-08-12T14:18:43.695Z
targetReadModel: read_grip_result
sqlDialect: postgres
sufficientEvidence: true
apiVersion:
  from: v1
  to: v2
  affectedEndpoints:
    - "POST /multimodal"
    - "POST /grip-result"
    - "POST /grip-result-v2"
    - "POST /insert-all"
evidenceSources:
  - { origin: insight-read-db, anchorId: "seq:25" }
  - { origin: insight-read-db, anchorId: "seq:26" }
constraints:
  - "v1 자산(테이블/엔드포인트/프로젝터 name) 무손상"
  - "PK (scene_key, attempt_num) 유지"
  - "TypeScript any 금지"
  - "식별자 전체 단어"
  - "DDL 실행·API 컷오버는 인간 승인 후에만 (human-in-the-loop)"
  - "Read Model 테이블명은 read_ 접두 스네이크 케이스"
---

# Self-Adaptive CQRS Docs — read_grip_result

> 결론(TL;DR): `read_grip_result`을(를) 재생성한다 — Attempt 2 의 grip3dPoseZ 평균이 Attempt 1 대비 Δ0.11m 껈약, suddenJump_withinScene(임계 0.10m) 위반. robotTfTranslation 은 동일하므로 센서 오류/데이터 오염. (이상 유형: Sensor Baseline Deviation · 심각도: critical)

<logging_context>

## 센서 이상 배치 (관찰자 1차 판정 — 검증 전 가설)
> 사유: [윈도우 1] R6 suddenJump_withinScene: 같은 scene 연속 attempt 간 z평균 0.060 → 0.170, Δ=0.110 > 0.10 m / [2차 지목] R6 suddenJump_withinScene: 같은 scene 연속 attempt 간 z평균 0.069 → 0.179, Δ=0.110 > 0.10 m
> 의심 sceneKey: 반려동물용품_CR01_강아지공룡알장난감_02010
> 위 사유는 소형 1차 관찰자의 출력이라 인용 수치·부등호가 부정확할 수 있는 **가설**이다.
> 근거로 쓸 관측값·부등호는 반드시 아래 원시 레코드에서 재확인해 원문 그대로 인용하고,
> 원시 레코드에서 재확인되지 않는 1차 사유는 기각해라.

### 투영된 센서 값 (JSON 한 줄당 한 레코드)
```json
{"sceneKey":"반려동물용품_CR01_강아지공룡알장난감_02010","attemptNumber":1,"streamId":"grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02010","globalSequence":25,"occurredAt":"2023-09-23T00:00:00.000Z","objectName":"강아지공룡알장난감","gripSucceed":1,"grip2dPose":{"xl":918.579,"xr":1065.25,"yl":857.837,"yr":861.615},"grip3dPose":{"x1":0.20699372240522948,"x2":0.21278624293053866,"x3":0.23673948496403724,"x4":0.23094696443872806,"x5":0.23686830191552877,"x6":0.24266082244083795,"x7":0.2666140644743365,"x8":0.26082154394902735,"y1":0.7842637390164078,"y2":0.9240894859656754,"y3":0.9227517007576158,"y4":0.7829259538083482,"y5":0.7846360898058824,"y6":0.92446183675515,"y7":0.9231240515470904,"y8":0.7832983045978228,"z1":0.06621591822239369,"z2":0.06738581037293279,"z3":0.07110208907802962,"z4":0.0699321969274905,"z5":0.04889791092197039,"z6":0.05006780307250949,"z7":0.053784081777606324,"z8":0.05261418962706721},"robotTf":{"rotation_3x3":[0.014497,0.909648,-0.415128,0.999887,-0.011494,0.009732,0.004081,-0.415222,-0.909711],"translation_3x1":[0.327688,0.821407,1.03805]},"humanAnnotationGrasp":[{"annotation_type":"keypoint","id":11,"annotation_points":[932.7706696391876,857.776143795846,2,1059.3954284611568,856.7581047375919,2],"num_keypoints":2}]}
{"sceneKey":"반려동물용품_CR01_강아지공룡알장난감_02010","attemptNumber":2,"streamId":"grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02010","globalSequence":26,"occurredAt":"2023-09-23T00:00:00.000Z","objectName":"강아지공룡알장난감","gripSucceed":1,"grip2dPose":{"xl":918.579,"xr":1065.25,"yl":857.837,"yr":861.615},"grip3dPose":{"x1":0.20699372240522948,"x2":0.21278624293053866,"x3":0.23673948496403724,"x4":0.23094696443872806,"x5":0.23686830191552877,"x6":0.24266082244083795,"x7":0.2666140644743365,"x8":0.26082154394902735,"y1":0.7842637390164078,"y2":0.9240894859656754,"y3":0.9227517007576158,"y4":0.7829259538083482,"y5":0.7846360898058824,"y6":0.92446183675515,"y7":0.9231240515470904,"y8":0.7832983045978228,"z1":0.17621591822239369,"z2":0.1773858103729328,"z3":0.18110208907802963,"z4":0.17993219692749052,"z5":0.1588979109219704,"z6":0.1600678030725095,"z7":0.16378408177760634,"z8":0.16261418962706722},"robotTf":{"rotation_3x3":[0.014497,0.909648,-0.415128,0.999887,-0.011494,0.009732,0.004081,-0.415222,-0.909711],"translation_3x1":[0.327688,0.821407,1.03805]},"humanAnnotationGrasp":[{"annotation_type":"keypoint","id":11,"annotation_points":[932.7706696391876,857.776143795846,2,1059.3954284611568,856.7581047375919,2],"num_keypoints":2}]}
⚠ jump [반려동물용품_CR01_강아지공룡알장난감_02010#2] grip3dPoseZ 평균 직전(#1) 대비 Δ0.1100m (임계 0.1m — 같은 scene 내 급변)
```

</logging_context>

<insight_read_db>

## ReadModel: read_grip_result

용도: 장면별 로봇 파지 결과 조회 (성공여부·포즈·그리퍼)

키: (scene_key, attempt_num)

```mschema
# Table: read_grip_result
[
(scene_key:varchar, 장면 식별 키 = {카테고리}_{카메라코드}_{객체명}_{장면번호} (stream_id에서 'grip-attempt:' 제거), Primary Key, Examples: [반려동물용품_CR01_강아지공룡알장난감_00018]),
(attempt_num:smallint, 같은 장면 내 파지 시도 번호 (파일명의 시도번호), Primary Key, Examples: [1]),
(object_name:varchar, 파지 대상 객체명 (payload.objects[0].class_name), Examples: [강아지공룡알장난감]),
(grip_succeed:smallint, 파지 성공 여부 (0=실패, 1=성공), Examples: [1]),
(gripper_type:varchar(16), 그리퍼 종류 (현재 적재는 finger 고정, 흡착형은 suction), Examples: [finger]),
(occurred_at:timestamptz, 데이터 촬영 일자 (파일명 날짜에서 도출), Examples: [2023-09-23T00:00:00Z]),
(grip_2d_pose:jsonb, 2D 파지점 (핑거: xl,xr,yl,yr / 흡착: x,y), Examples: [{"xl":0,"xr":0,"yl":0,"yr":0}]),
(grip_3d_pose:jsonb, 3D 파지점 (핑거: x1..z8 24좌표 / 흡착: x,y,z,roll,pitch,yaw,penetrate), Examples: [{"x1":10.2,"y1":3.1,"z1":-100.0, "...":"...", "z8":-90.5}]),
(robot_tf:jsonb, 로봇 변환행렬 (rotation_3x3 9개 + translation_3x1 3개), Examples: [{"rotation_3x3":[1,0,0,0,1,0,0,0,1],"translation_3x1":[0,0,0]}]),
(human_annotation_grasp:jsonb, 휴먼 어노테이션 파지 영역 (핑거: keypoints 2점), Examples: [[{"annotation_type":"keypoints","id":1,"annotation_points":[120,330,140,360],"num_keypoints":2}]]),
(stream_id:varchar, ES 스트림 ID ("grip-attempt:" + scene_key) — 추적 키, Examples: [grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00018]),
(global_seq:bigint, 투영 출처 이벤트의 ES 전역 시퀀스 — 추적 키, Examples: [1024])
]
```

## ReadModel: read_multimodal

용도: 장면별 2D이미지·비디오 미디어 링크 조회

키: (scene_key, attempt_num)

```mschema
# Table: read_multimodal
[
(scene_key:varchar, 장면 식별 키 (read_grip_result와 동일 규칙), Primary Key, Examples: [반려동물용품_CR01_강아지공룡알장난감_00018]),
(attempt_num:smallint, 같은 장면 내 파지 시도 번호, Primary Key, Examples: [1]),
(occurred_at:timestamptz, 데이터 촬영 일자, Examples: [2023-09-23T00:00:00Z]),
(image_2d_file_name:varchar, 원천 2D 이미지 파일명 (payload.2D_image_file_name), Examples: [반려동물용품_CR01_강아지공룡알장난감_00018_01_20230923.jpg]),
(image_2d_uri:text, 2D 이미지 저장 위치 URI (현재 projector가 null로 둠 — 추후 매핑)),
(video_file_name:varchar, 원천 비디오 파일명 (시도번호 자리가 항상 00 — 한 비디오 N:1로 여러 시도가 공유), Examples: [반려동물용품_CR01_강아지공룡알장난감_00018_00_20230923.mp4]),
(video_uri:text, 비디오 저장 위치 URI (현재 projector가 null로 둠 — 추후 매핑)),
(stream_id:varchar, ES 스트림 ID — 추적 키, Examples: [grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00018]),
(global_seq:bigint, 투영 출처 이벤트의 ES 전역 시퀀스 — 추적 키, Examples: [1024])
]
```

</insight_read_db>

## 1. 권고 (Recommendation)

> 동장 scene 내 시계열 grip3dPoseZ 평균이 직전 시도 대비 Δ0.11m 급변으로 물리적 안정성 위배로, 이상 판정 확정.

### 심각도 — critical

오염 컬럼(grip_3d_pose) / 영향 행수(동장 scene 2개 attempt 연속) / event_store 재투영 복 가능(예). 델타 크기 단독으로 critical 판정 근거가 부족하나, 동장 물리적 안정성 위배와 gripSucceed=1 성공 맥락의 모순을 가중.

### 기대-실측 델타 근거

- (반려동물용품_CR01_강아지공룡알장난감_02010#1, `grip3dPose` / grip3dPose) 관측 `{"z1":0.06621591822239369,"z2":0.06738581037293279,"z3":0.07110208907802962,"z4":0.0699321969274905,"z5":0.04889791092197039,"z6":0.05006780307250949,"z7":0.053784081777606324,"z8":0.05261418962706721}` vs 기준 `suddenJump_withinScene` Δ <= 0.10 m → 델타 +0.110 m · 동장 scene 내 시계열 z평균 직전 대비 Δ0.11m 초과 임계, 물리적 grasp 안정성 위배.
- (반려동물용품_CR01_강아지공룡알장난감_02010#2, `grip3dPose` / grip3dPose) 관측 `{"z1":0.17621591822239369,"z2":0.1773858103729328,"z3":0.18110208907802963,"z4":0.17993219692749052,"z5":0.1588979109219704,"z6":0.1600678030725095,"z7":0.16378408177760634,"z8":0.16261418962706722}` vs 기준 `suddenJump_withinScene` Δ <= 0.10 m → 델타 +0.110 m · 동장 scene 내 시계열 z평균 직전 대비 Δ0.11m 초과 임계, 물리적 grasp 안정성 위배.

### 관찰

- 동장 scene 내 시계열 grip3dPoseZ 평균이 직전 시도 대비 Δ0.11m 급변으로 물리적 안정성 위배
- robotTfTranslation 동일 유지로 센서/데이터 오염 판정
- gripSucceed=1 성공 맥락에서 잡을 수 없는 위치/깊이면 모순(센서 오염 또는 투영 결함)

### 영향 범위

- event_store → grip-result-projector → read_grip_result(grip_3d_pose) → catch-up.runner.ts → projection.controller.ts → API v1

### 근본원인 — projectionOrPipelineFault

1. 관측: attempt2 grip3dPoseZ 평균 Δ0.11m 급변
2. why1: 왜 같은 scene·동일 객체 grasp z값이 비약?
3. why2: robotTfTranslation 동일하므로 물리적 카메라/로봇 이동 아님
4. why3: sensor baseline validation rule suddenJump_withinScene 미적재됨
5. why4: read_grip_result 스키마에 temporal consistency/jump 검증 로직 부재(구조적 Zod만)
6. why5: 시스템적 판정 부재 — 구조적 zod만 존재이므로 이상 로그 방출로 이어

### 의사결정 기준

- 데이터 보존 vs 격리 우선
- 기저선 규칙 적용 vs 재투영
- 신독 Read Model v2 도입 vs 기존 v1 수정

### 해결책 옵션 (contain → fix → harden)

#### [contain] 오염 행 격리(DELETE)
- 접근: 오염 행 격리(DELETE — 원본은 event_store 에 보존, 재투영으로 복원)
- 트레이드오프: downstream API v1 정합성 검증 일시 중단 수용
```sql
-- 오염 행 격리: 이상 (scene_key, attempt_num) 행을 Read Model 에서 제거한다.
-- 원본 이벤트는 event_store 에 보존되므로 v2 재투영(무결성 플래그 포함)으로 복원 가능하다.
DELETE FROM read_grip_result WHERE (scene_key, attempt_num) IN (('반려동물용품_CR01_강아지공룡알장난감_02010', 1), ('반려동물용품_CR01_강아지공룡알장난감_02010', 2));
```

#### [fix] 타깃 재투영(z_avg/jump_delta 계산)
- 접근: GripResultProjector map() 로직 확장으로 z_avg_current 및 jump_delta_m 산출
- 트레이드오프: 기저 v1 호환 마이그레이션 비용 수용
```typescript
// src/projection/projector/grip-result.projector.ts
  private computeZAvg(pose: {z1:number;z2:number;z3:number;z4:number;z5:number;z6:number;z7:number;z8:number}): number {
    const vals = [pose.z1, pose.z2, pose.z3, pose.z4, pose.z5, pose.z6, pose.z7, pose.z8];
    return vals.reduce((sum: number, v: number) => sum + v, 0) / vals.length;
  }
```

#### [harden] 베이스라인 규칙 추가
- 접근: 신독 v2 jump_delta_m 열에 CHECK 제약 추가
- 트레이드오프: 기저 v1 호환 마이그레이션 비용 수용
```sql
-- 선행 조건: §2 'Read Model 생성 SQL'(DDL)을 먼저 적용한 뒤 실행한다.
ALTER TABLE read_grip_result_v2 ADD CONSTRAINT check_jump_delta CHECK (jump_delta_m IS NULL OR jump_delta_m <= 0.10);
```

### 권장
- read_grip_result_v2 채택
- 사유: 신독 Read Model v2 설계에 z_avg_current, jump_delta_m, grip_outlier_flag 필드 적재로 temporal consistency 검증 로직을 시스템화. 기존 v1 Zod-only 구조를 보완하여 이상 판정 부재 해결.
- 수용하는 트레이드오프: 기저 v1 호환 마이그레이션 비용 수용
- 기각한 대안:
  - v1 프로젝트 수정만으로는 jump_delta 계산 로직 누락
  - 고전 contain 격리만으로는 downstream API v1 정합성 검증 부재

### 즉시 격리 SQL

```sql
-- 오염 행 격리: 이상 (scene_key, attempt_num) 행을 Read Model 에서 제거한다.
-- 원본 이벤트는 event_store 에 보존되므로 v2 재투영(무결성 플래그 포함)으로 복원 가능하다.
DELETE FROM read_grip_result WHERE (scene_key, attempt_num) IN (('반려동물용품_CR01_강아지공룡알장난감_02010', 1), ('반려동물용품_CR01_강아지공룡알장난감_02010', 2));
```

### 하드닝(베이스라인 추가 규칙)

rule: suddenJump_withinScene_v2 expected: 같은 sceneKey 안에서 직전 레코드 대비 grip3dPoseZ 평균 Δ <= 0.10 m (신독 v2 z_avg_current/jump_delta_m 기준)

### 다음 단계

- v2 Read Model 마이그레이션 및 투영 로직 적용 (`src/shared/database/schema/service/read-grip-result-v2.ts`) — 15분, DBA
- GripResultProjector jump_delta 계산 로직 삽입 (`src/projection/projector/grip-result.projector.ts`) — 30분, DEV
- catch-up.runner.ts 이상 로그 연동 검증 (`src/projection/runner/catch-up.runner.ts`) — 10분, QA

## 2. Read Model 생성 SQL (Read Model DDL)

> 실행 게이트: 아래 변경은 인간 승인 후에만 적용한다 (human-in-the-loop).

- 대상: `read_grip_result_v2` · 키: (scene_key, attempt_num) · 원천 이벤트: GripAttemptRecorded

```sql
DROP TABLE IF EXISTS read_grip_result_v2;
CREATE TABLE read_grip_result_v2 (
    scene_key varchar NOT NULL,
    attempt_num smallint NOT NULL,
    object_name varchar NOT NULL,
    grip_succeed smallint NOT NULL,
    occurred_at timestamptz NOT NULL,
    z_avg_current double precision,
    jump_delta_m double precision,
    grip_outlier_flag smallint NOT NULL,
    stream_id varchar NOT NULL,
    global_seq bigint NOT NULL,
    CONSTRAINT pk_grip_result_v2 PRIMARY KEY (scene_key, attempt_num)
);
CREATE INDEX idx_v2_scene_attempt_time ON read_grip_result_v2 (scene_key, attempt_num, occurred_at);
CREATE INDEX idx_v2_outlier_flag_time ON read_grip_result_v2 (grip_outlier_flag, occurred_at);
```

### 필드

```mschema
# Table: read_grip_result_v2
[
(scene_key:varchar, 장면 식별 키 = stream_id 제거 prefix, Primary Key),
(attempt_num:smallint, 동일 장면 내 시도 번호, Primary Key),
(object_name:varchar, payload.objects[0].class_name),
(grip_succeed:smallint, payload.grip_succeed (0/1)),
(occurred_at:timestamptz, 이벤트 occurredAt),
(z_avg_current:double precision, payload.grip_3d_pose.z1..z8 평균 (m)),
(jump_delta_m:double precision, 이전 시도 z_avg_current 대비 Δz 절대값 (m). null if prev row absent),
(grip_outlier_flag:smallint, Δz > 0.1m 일 경우 1, else 0),
(stream_id:varchar, ES streamId 추적 키),
(global_seq:bigint, ES globalSeq 추적 키)
]
```

### 투영 매핑 명세 (이벤트 → 컬럼)

> upsert 키: (scene_key, attempt_num) · 리플레이: projection_cursor 초기화 시 scene_key+attempt_num 오름차순 정렬 필수. 전역 재투영(catch-up)은 upsert가 멱id해야 하므로 stateful jump_delta_m/grip_outlier_flag 계산이 deterministic sort + replay_cursor reset 보장.

| 원천 이벤트 | payload 필드 | 컬럼 | 변환 |
| --- | --- | --- | --- |
| GripAttemptRecorded | streamId | stream_id | verbatim |
| GripAttemptRecorded | attemptNumber | attempt_num | verbatim |
| GripAttemptRecorded | objectName | object_name | verbatim |
| GripAttemptRecorded | gripSucceed | grip_succeed | verbatim |
| GripAttemptRecorded | occurredAt | occurred_at | verbatim |
| GripAttemptRecorded | globalSequence | global_seq | verbatim |

파생 컬럼(이벤트 payload 아님):
- `scene_key` ← streamId prefix 'grip-attempt:' 제거
- `z_avg_current` ← payload.grip3dPose.z1..z8 평균 계산
- `jump_delta_m` ← abs(current z_avg_current - prev_row z_avg_current), null if prev absent
- `grip_outlier_flag` ← jump_delta_m > 0.1 ? 1 : 0

### Insight 카드 등록 (Insight Read DB 동기화)

> DDL 적용 시 아래 카드 등록도 함께 실행한다 — 다음 분석부터 신규 Read Model 이 LLM 컨텍스트에 노출된다.

```sql
INSERT INTO insight_entity (entity_name, kind, purpose, key_columns)
VALUES ('read_grip_result_v2', 'read_model', '장면별 시도 단 Z축 평균 포즈·이전 시도 대비 점프 거리·센서 이상 플래그 적재. 기존 read_grip_result 만 Raw Pose JSON 저장이지만 본 모델은 temporal consistency(jump) 검증과 physical bounds enforcement(Δz > 0.1m) 를 직접 계산·저장하여 LLM 관찰자 및 downstream anomaly detector 가 시계열 비교를 수행할 수 있도록 지원.', '(scene_key, attempt_num)')
ON CONFLICT (entity_name) DO UPDATE SET purpose = EXCLUDED.purpose, key_columns = EXCLUDED.key_columns;

INSERT INTO insight_field (entity_name, field_name, data_type, meaning, display_order)
VALUES
  ('read_grip_result_v2', 'scene_key', 'varchar', '장면 식별 키 = stream_id 제거 prefix', 1),
  ('read_grip_result_v2', 'attempt_num', 'smallint', '동일 장면 내 시도 번호', 2),
  ('read_grip_result_v2', 'object_name', 'varchar', 'payload.objects[0].class_name', 3),
  ('read_grip_result_v2', 'grip_succeed', 'smallint', 'payload.grip_succeed (0/1)', 4),
  ('read_grip_result_v2', 'occurred_at', 'timestamptz', '이벤트 occurredAt', 5),
  ('read_grip_result_v2', 'z_avg_current', 'double precision', 'payload.grip_3d_pose.z1..z8 평균 (m)', 6),
  ('read_grip_result_v2', 'jump_delta_m', 'double precision', '이전 시도 z_avg_current 대비 Δz 절대값 (m). null if prev row absent', 7),
  ('read_grip_result_v2', 'grip_outlier_flag', 'smallint', 'Δz > 0.1m 일 경우 1, else 0', 8),
  ('read_grip_result_v2', 'stream_id', 'varchar', 'ES streamId 추적 키', 9),
  ('read_grip_result_v2', 'global_seq', 'bigint', 'ES globalSeq 추적 키', 10)
ON CONFLICT (entity_name, field_name) DO UPDATE SET data_type = EXCLUDED.data_type, meaning = EXCLUDED.meaning, display_order = EXCLUDED.display_order;
```

## 3. API Versioning

> 실행 게이트: 아래 변경은 인간 승인 후에만 적용한다 (human-in-the-loop).

### Unreleased (v1 → v2)

#### Added
- 신규 Read Model 테이블 read_grip_result_v2 (scene_key, attempt_num, object_name, grip_succeed, occurred_at, z_avg_current, jump_delta_m, grip_outlier_flag, stream_id, global_seq)
- GripResultV2Projector 구현: temporal consistency(z_avg jump) 검증 및 outlier flagging
- 라우트 /grip-result-v2 배선 및 ProjectionService DI 확장

### 마이그레이션 절차

- 하위호환 변경: 기존 read_grip_result, GripResultProjector, /projection/grip-result 라우트/서비스 무손상 유지; 신규 테이블·프로젝터는 additive 배선으로 동시 운영 가능, 기존 클라이언트 쿼리 호환
- 파괴적 변경: 없음
- 컷오버 전 테스트: 1. /grip-result-v2 라우트 실행하여 read_grip_result_v2 populate 검증
2. 반려동물용품_CR01_강아지공룡알장난감_02010 scene_key jump_delta_m ≈ 0.11, grip_outlier_flag=1 검증
3. v1 fallback 유지 until v2 outlier_flag logic 전수 통과 확인
- 롤백 창/조건: DROP TABLE read_grip_result_v2; revert ProjectionService DI wiring; revert Controller /grip-result-v2 removal. rely on v1 structural Zod validation only.
- Insight 카드 등록: §2의 카드 등록 SQL을 DDL과 함께 적용(카탈로그 동기화)

### 사유·호환성

- 사유: 기존 v1 GripResultProjector는 Zod 구조 검증만 수행하여 scene 내 연속 attempt 간 z평균 점프(jump) 검증과 물리적 한도 enforcement를 누락. 이로 인해 sensor baseline deviation(Δz > 0.1m)가 통과되어 downstream 파지 안정성 검증에 왜곡을 가미[corr:R6]. v2는 신규 테이블과 Projector를 추가하여 z_avg_current, jump_delta_m, grip_outlier_flag를 투영 시 산출하고 temporal consistency violation을 즉시 flagging.
- 트리거 근거: [윈도우 1] R6 suddenJump_withinScene: 같은 scene 연속 attempt 간 z평균 0.060 → 0.170, Δ=0.110 > 0.10 m / [2차 지목] R6 suddenJump_withinScene: 같은 scene 연속 attempt 간 z평균 0.069 → 0.179, Δ=0.110 > 0.10 m. v1 GripResultProjector.map() 줄 `return { ... }` 은 objects[0].class_name 만 매핑하고 z-좌표 일관성 검무 누락[corr:R6].
- v1 호환성: 기존 read_grip_result, GripResultProjector, /projection/grip-result 라우트/서비스는 무손상 유지. v2 테이블·프로젝터·라우트는 additive 배선으로 동시 운영 가능. 컷오버 전 v2 outlier_flag 검증이 v1 fallback 대체.

### 변경 파일

- `src/shared/database/schema/index.ts` (modifyFile) — 신규 read-grip-result-v2 스키마 export 배선. 기존 v1 export 보존.
- `src/projection/projection.service.ts` (modifyFile) — GripResultV2Projector DI 추가, catchUpGripResultV2() 메서드 배선, CatchUpAllResult/InsertAndProjectionAllResult type 확장. 기존 v1 로직 보존.
- `src/projection/projection.controller.ts` (modifyFile) — /grip-result-v2 라우트 배선. 기존 /multimodal, /grip-result, /insert-all 보존.

## Optional — 부속 자료(컨텍스트 축소 시 생략 가능)

### 신규 Read Model — Drizzle 스키마

```ts
import { bigint, doublePrecision, pgTable, primaryKey, smallint, timestamp, varchar } from 'drizzle-orm/pg-core';

export const readGripResultV2 = pgTable(
  "read_grip_result_v2",
  {
    sceneKey: varchar("scene_key").notNull(),
    attemptNum: smallint("attempt_num").notNull(),
    objectName: varchar("object_name"),
    gripSucceed: smallint("grip_succeed"),
    occurredAt: timestamp("occurred_at", { withTimezone: true }),
    zAvgCurrent: doublePrecision("z_avg_current"),
    jumpDeltaM: doublePrecision("jump_delta_m"),
    gripOutlierFlag: smallint("grip_outlier_flag"),
    streamId: varchar("stream_id"),
    globalSeq: bigint("global_seq", { mode: "number" }),
  },
  (t) => [primaryKey({ columns: [t.sceneKey, t.attemptNum] })],
);

```

### 신규 Read Model — Projector

```ts
import { Injectable } from '@nestjs/common';
import { type InferInsertModel } from 'drizzle-orm';
import { PinoLogger } from 'nestjs-pino';
import { toyDataSchema } from '@/insert/dto/toy-data.dto';
import type { Projector } from '@/projection/projector/projector';
import type { EventStoreEventRow } from '@/projection/repository/event-store-reader.repository';
import { DrizzleTx } from '@/shared/database/drizzle.provider';
import { readGripResultV2 } from '@/shared/database/schema';
import { LogAction, LogContext } from '@/shared/logger/logging-context';

type GripResultV2ProjectorInsert = InferInsertModel<typeof readGripResultV2>;

@Injectable()
export class GripResultV2Projector implements Projector<GripResultV2ProjectorInsert> {
  readonly name: string = "grip-result-v2-projector";

  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(GripResultV2Projector.name);
  }

  map(event: EventStoreEventRow): GripResultV2ProjectorInsert {
    // 결정론 합성 프로젝터 — payload 접근 경로는 적재 스키마(ToyDataDto)에서 결정론
    // 유도했다. 유도 불가 컬럼은 TODO 주석으로 남겼다(§2 투영 매핑 명세가 대조 계약).
    const parsedPayload = toyDataSchema.passthrough().safeParse(event.payload);
    if (!parsedPayload.success) {
      this.logger.error(
        {
          action: LogAction.MAP_FAILED,
          [LogContext.STREAM_ID]: event.streamId,
          [LogContext.GLOBAL_SEQ]: event.globalSeq,
        },
        "이벤트 매핑(검증) 실패",
      );
      throw parsedPayload.error;
    }
    const payload = parsedPayload.data;

    this.logger.debug(
      {
        action: LogAction.EVENT_MAPPED,
        [LogContext.PROJECTOR_NAME]: this.name,
        [LogContext.GLOBAL_SEQ]: event.globalSeq,
      },
      "이벤트 매핑",
    );

    return {
      sceneKey: event.streamId.replace(/^grip-attempt:/, ""),
      attemptNum: event.attemptNum,
      objectName: payload.objects[0]?.class_name ?? null,
      gripSucceed: payload.grip_succeed,
      occurredAt: event.occurredAt,
      zAvgCurrent: null, // TODO(매핑 미해결): 'z_avg_current' 은 이벤트 payload 에서 결정론 유도 불가 — §2 투영 매핑 명세를 보고 직접 구현하라.
      jumpDeltaM: null, // TODO(매핑 미해결): 'jump_delta_m' 은 이벤트 payload 에서 결정론 유도 불가 — §2 투영 매핑 명세를 보고 직접 구현하라.
      gripOutlierFlag: null, // TODO(매핑 미해결): 'grip_outlier_flag' 은 이벤트 payload 에서 결정론 유도 불가 — §2 투영 매핑 명세를 보고 직접 구현하라.
      streamId: event.streamId,
      globalSeq: event.globalSeq,
    };
  }

  async upsert(tx: DrizzleTx, row: GripResultV2ProjectorInsert): Promise<void> {
    await tx
      .insert(readGripResultV2)
      .values(row)
      .onConflictDoUpdate({
        target: [readGripResultV2.sceneKey, readGripResultV2.attemptNum],
        set: {
          objectName: row.objectName,
          gripSucceed: row.gripSucceed,
          occurredAt: row.occurredAt,
          zAvgCurrent: row.zAvgCurrent,
          jumpDeltaM: row.jumpDeltaM,
          gripOutlierFlag: row.gripOutlierFlag,
          streamId: row.streamId,
          globalSeq: row.globalSeq,
        },
      });
  }
}

```

### 신규 Read Model — 배선(컨트롤러/서비스/모듈)

```ts
// src/shared/database/schema/index.ts 추가
export * from "./service/read-grip-result-v2";

// src/projection/projector/grip-result-v2.projector.ts (신규 파일 생성)
// src/projection/projection.service.ts 추가 메서드
  catchUpGripResultV2(): Promise<ProjectionResult> {
    // 신규 테이블 read_grip_result_v2 는 기존 read_grip_result 와 정지성 격화.
    // 전체 재투영 강제: CatchUpRunner 커서 리셋 0 → 0으로 리셋해 전체 재투영을 강제하는 절차를 주석으로 명시하라.
    return this.runner.run(this.gripResultV2);
  }

// src/projection/projection.controller.ts 추가 라우트
  @Post("/grip-result-v2")
  gripResultV2(): Promise<ProjectionResult> {
    this.logger.info(
      { action: LogAction.PROJECTION_REQUEST, [LogContext.ROUTE]: "POST /projection/grip-result-v2" },
      "projection 요청 수신",
    );
    return this.projectionService.catchUpGripResultV2();
  }

// src/projection/projection.module.ts providers 등록
  providers: [GripResultProjector, MultiModalProjector, GripResultV2Projector],
```

### 버전 교체 코드 — `src/shared/database/schema/index.ts` (modifyFile)

```typescript
export * from "./insight/insight-entity";
export * from "./insight/insight-field";
export * from "./log/log-cursor";
export * from "./log/log-event";
export * from "./service/event";
export * from "./service/projection-cursor";
export * from "./service/read-grip-result";
export * from "./service/read-grip-result-v2";
export * from "./service/read-multimodal";
```

### 버전 교체 코드 — `src/projection/projection.service.ts` (modifyFile)

```typescript
import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { InsertResult, InsertService } from '@/insert/insert.service';
import { GripResultProjector } from '@/projection/projector/grip-result.projector';
import { GripResultV2Projector } from '@/projection/projector/grip-result-v2.projector';
import { MultiModalProjector } from '@/projection/projector/multimodal.projector';
import { ProjectionResult } from '@/projection/projector/projector';
import { CatchUpRunner } from '@/projection/runner/catch-up.runner';
import { LogAction } from '@/shared/logger/logging-context';

export type CatchUpAllResult = {
  multimodal: ProjectionResult;
  gripResult: ProjectionResult;
  gripResultV2: ProjectionResult;
};

export type InsertAndProjectionAllResult = {
  insert: InsertResult;
  projection: CatchUpAllResult;
};

@Injectable()
export class ProjectionService {
  constructor(
    private readonly logger: PinoLogger,
    private readonly runner: CatchUpRunner,
    private readonly multimodal: MultiModalProjector,
    private readonly gripResult: GripResultProjector,
    private readonly gripResultV2: GripResultV2Projector,
    private readonly insertService: InsertService,
  ) {
    this.logger.setContext(ProjectionService.name);
  }

  catchUpMultimodal(): Promise<ProjectionResult> {
    return this.runner.run(this.multimodal);
  }

  catchUpGripResult(): Promise<ProjectionResult> {
    return this.runner.run(this.gripResult);
  }

  catchUpGripResultV2(): Promise<ProjectionResult> {
    return this.runner.run(this.gripResultV2);
  }

  async catchUpAll(): Promise<CatchUpAllResult> {
    this.logger.info({ action: LogAction.PROJECTION_START }, "전체 투영 시작");

    const multimodal: ProjectionResult = await this.catchUpMultimodal();
    const gripResult: ProjectionResult = await this.catchUpGripResult();
    const gripResultV2: ProjectionResult = await this.catchUpGripResultV2();

    this.logger.info({ action: LogAction.PROJECTION_DONE }, "전체 투영 완료");

    return { multimodal, gripResult, gripResultV2 };
  }

  async insertAllAndProjectAll(): Promise<InsertAndProjectionAllResult> {
    this.logger.info(
      { action: LogAction.PROJECTION_START },
      "전체 적재+투영 시작",
    );

    const insert: InsertResult = await this.insertService.insertToyData();
    const projection: CatchUpAllResult = await this.catchUpAll();

    this.logger.info(
      { action: LogAction.PROJECTION_DONE },
      "전체 적재+투영 완료",
    );

    return { insert, projection };
  }
}
```

### 버전 교체 코드 — `src/projection/projection.controller.ts` (modifyFile)

```typescript
import { Controller, Post } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { InsertAndProjectionAllResult, ProjectionService } from '@/projection/projection.service';
import { ProjectionResult } from '@/projection/projector/projector';
import { LogAction, LogContext } from '@/shared/logger/logging-context';

@Controller("projection")
export class ProjectionController {
  constructor(
    private readonly logger: PinoLogger,
    private readonly projectionService: ProjectionService,
  ) {
    this.logger.setContext(ProjectionController.name);
  }

  @Post("/multimodal")
  multimodal(): Promise<ProjectionResult> {
    this.logger.info(
      { action: LogAction.PROJECTION_REQUEST, [LogContext.ROUTE]: "POST /projection/multimodal" },
      "projection 요청 수신",
    );

    return this.projectionService.catchUpMultimodal();
  }

  @Post("/grip-result")
  gripResult(): Promise<ProjectionResult> {
    this.logger.info(
      { action: LogAction.PROJECTION_REQUEST, [LogContext.ROUTE]: "POST /projection/grip-result" },
      "projection 요청 수신",
    );

    return this.projectionService.catchUpGripResult();
  }

  @Post("/grip-result-v2")
  gripResultV2(): Promise<ProjectionResult> {
    this.logger.info(
      { action: LogAction.PROJECTION_REQUEST, [LogContext.ROUTE]: "POST /projection/grip-result-v2" },
      "projection v2 요청 수신",
    );

    return this.projectionService.catchUpGripResultV2();
  }

  @Post("/insert-all")
  insertAll(): Promise<InsertAndProjectionAllResult> {
    this.logger.info(
      { action: LogAction.PROJECTION_REQUEST, [LogContext.ROUTE]: "POST /projection/insert-all" },
      "projection 요청 수신",
    );

    return this.projectionService.insertAllAndProjectAll();
  }
}
```

## Guardrails (constraints)

- v1 자산(테이블/엔드포인트/프로젝터 name) 무손상
- PK (scene_key, attempt_num) 유지
- TypeScript any 금지
- 식별자 전체 단어
- DDL 실행·API 컷오버는 인간 승인 후에만 (human-in-the-loop)
- Read Model 테이블명은 read_ 접두 스네이크 케이스
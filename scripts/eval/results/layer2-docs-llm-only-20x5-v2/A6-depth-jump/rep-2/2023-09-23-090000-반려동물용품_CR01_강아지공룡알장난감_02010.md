---
docId: dq-반려동물용품_CR01_강아지공룡알장난감_02010
generatedAt: 2026-08-11T06:02:07.972Z
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

> 결론(TL;DR): `read_grip_result`을(를) 재생성한다 — 동장 scene 내 attempt 간 grip3dPoseZ 평균이 0.110m 급변(임계 0.10m)으로, 물리적 정체성 위반. (이상 유형: Sensor Baseline Departure · 심각도: critical)

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

> 동장 scene 내 grip3dPoseZ 심 평균이 0.110m 급변으로 물리적 정체성 규칙을 명시 위반.

### 심각도 — critical

grip_3d_pose jsonb 열 치명적 Z-심 평균 편만, 동장 scene 2개 시do 영향, event_store 원증 보존으로 하류 catch-up.runner.ts 재투영으로 복복구 가능하나 정적 검 부재로 유지된 상태.

### 기대-실측 델타 근거

- (반려동물용품_CR01_강아지공룡알장난감_02010#2, `grip3dPose` / grip3dPose) 관측 `"z1":0.17621591822239369,"z2":0.1773858103729328,"z3":0.18110208907802963,"z4":0.17993219692749052,"z5":0.1588979109219704,"z6":0.1600678030725095,"z7":0.16378408177760634,"z8":0.16261418962706722` vs 기준 `suddenJump_withinScene` Δ <= 0.10 m → 델타 +0.110 m · 동장 scene 내 attempt 간 Z-심 평균이 임계(0.10m)를 초과 급변으로, 물리적 정체성 위반.

### 관찰

- 동장 scene 반려동물용품_CR01_강아지공룡알장난감_02010 attempt 2 grip3dPoseZ 심 평균이 직전 시do 대비 Δ+0.110m 임계(0.10m) 초과.

### 영향 범위

- event_store → grip-result-projector → read_grip_result(grip_3d_pose jsonb) → catch-up.runner.ts → projection.controller.ts

### 근본원인 — projectionOrPipelineFault

1. 왜 값 이상 판정 부재? → 정적 Zod 스키마만 존재, 동장 scene 시계열 Z-심 정합성 규칙 미구현.
2. 왜 미구현? → GripResultProjector.checkIntegrity 미구현/미호출.
3. 왜 미호출? → Projector 인터페이스 checkIntegrity 선택 옵션 미적재.
4. 왜 미적재? → 기존 구현 소스 grip-result.projector.ts 에 checkIntegrity 메서드 미포함.
5. 왜 미포함? → 시스템 설계 초기 정적 검증만 우선 적용, 동장 정합성 감시 로직 미명.

### 의사결정 기준

- 1. 원본 event_store 보존 및 재투영 복복구 가능성
- 2. 정적 검(zo) vs 동장 검(정합성) 분리 책임
- 3. 즉시 격리(contain) vs 재투영/베이스라인 고도(harden) 소스 변경 범위

### 해결책 옵션 (contain → fix → harden)

#### [contain] 오염 시do 격리 및 플래그
- 접근: 동장 scene attempt 2 행 삭제(DELETE) 원본 event_store 보존, 재투영으로 복복구 가능.
- 트레이드오프: 일시 데이터 공백 발생, 하류 컨트롤러 빈 처리 로직 필요.
```sql
-- 오염 행 격리: 이상 (scene_key, attempt_num) 행을 Read Model 에서 제거한다.
-- 원본 이벤트는 event_store 에 보존되므로 v2 재투영(무결성 플래그 포함)으로 복원 가능하다.
DELETE FROM read_grip_result WHERE (scene_key, attempt_num) IN (('반려동물용품_CR01_강아지공룡알장난감_02010', 2));
```

#### [fix] GripResultProjector 정합성 검사 메서드 추가
- 접근: 기존 GripResultProjector 클래스에 checkIntegrity 메서드 구현, 동장 scene 시do Z-심 평균 Δ 판정 로직 삽입.
- 트레이드오프: TypeScript 코드 변경 및 재빌드 필요, 기존 Zod 검증 유지 병행.
```typescript
checkIntegrity(row: ReadGripResultInsert): IntegrityViolation[] {
  const violations: IntegrityViolation[] = [];
  if (!row.grip3dPose) return violations;
  const zValues: number[] = [row.grip3dPose.z1, row.grip3dPose.z2, row.grip3dPose.z3, row.grip3dPose.z4, row.grip3dPose.z5, row.grip3dPose.z6, row.grip3dPose.z7, row.grip3dPose.z8];
  const zAvg: number = zValues.reduce((sum: number, val: number) => sum + val, 0) / 8;
  if (zAvg > 0.30 || zAvg < 0.01) {
    violations.push({ readModelName: 'read_grip_result', sceneKey: row.sceneKey, attemptNum: row.attemptNum, streamId: row.streamId, globalSeq: row.globalSeq, ruleName: 'grip3dPoseZ_depth', affectedColumns: ['grip_3d_pose'], observedValue: `z_avg=${zAvg.toFixed(4)}m`, expected: '[0.01, 0.30] m', detail: `read_grip_result 정합성 위반[grip3dPoseZ_depth]: Z-심 평균 ${zAvg.toFixed(4)}m 이/가 기대 범위 벗어남.` });
  }
  return violations;
}
```

#### [harden] read_grip_result_v2 베이스라인 CHECK 제약 추가
- 접근: 확정 설계 read_grip_result_v2 테이블에 grip_outlier_flag Δ>0.1m CHECK 제약 추가.
- 트레이드오프: DDL 스키마 변경 및 마이그레이션 재실행 필요, 기존 v1 호환성 유지.
```sql
-- 선행 조건: §2 'Read Model 생성 SQL'(DDL)을 먼저 적용한 뒤 실행한다.
ALTER TABLE read_grip_result_v2 ADD CONSTRAINT check_sudden_jump_within_scene CHECK (delta_z_m <= 0.10 OR delta_z_m IS NULL);
```

### 권장
- fix: GripResultProjector 정합성 검사 메서드 추가
- 사유: 확정 설계(read_grip_result_v2) 채택을 전제하며, 동장 scene Z-심 정합성 검 로직에 GripResultProjector.checkIntegrity 메서드 추가 병행. 원본 event_store 보존을 전제하며, 정적 Zod 검증과 동장 scene Z-심 정합성 검을 명확히 분리 책임.
- 수용하는 트레이드오프: TypeScript 코드 변경 및 재빌드 소스 범위 수용.
- 기각한 대안:
  - contain: criterion 3(소스 변경 범위) 고실패, 원증 증거 손실 위험.
  - harden: criterion 2(정적 검 vs 동장 검 분리 책임) 미우선, v1 프로젝트터 로직 우선 고도 필요.

### 즉시 격리 SQL

```sql
-- 오염 행 격리: 이상 (scene_key, attempt_num) 행을 Read Model 에서 제거한다.
-- 원본 이벤트는 event_store 에 보존되므로 v2 재투영(무결성 플래그 포함)으로 복원 가능하다.
DELETE FROM read_grip_result WHERE (scene_key, attempt_num) IN (('반려동물용품_CR01_강아지공룡알장난감_02010', 2));
```

### 하드닝(베이스라인 추가 규칙)

rule: suddenJump_withinScene_v2 expected: read_grip_result_v2.delta_z_m <= 0.10 m (grip_outlier_flag=1 시 예외)

### 다음 단계

- GripResultProjector checkIntegrity 메서드 구현 (`src/projection/projector/grip-result.projector.ts`) — method_addition, developer
- CatchUpRunner 정합성 검사 로직 호출 연동 (`src/projection/runner/catch-up.runner.ts`) — integration_patch, developer
- read_grip_result_v2 마이그레이션 스키마 적용 (`src/shared/database/schema/service/read-grip-result-v2.ts`) — ddl_migration, db_admin

## 2. Read Model 생성 SQL (Read Model DDL)

> 실행 게이트: 아래 변경은 인간 승인 후에만 적용한다 (human-in-the-loop).

- 대상: `read_grip_result_v2` · 키: (scene_key, attempt_num) · 원천 이벤트: GripAttemptRecorded

```sql
CREATE TABLE read_grip_result_v2 (
  scene_key varchar NOT NULL,
  attempt_num smallint NOT NULL,
  object_name varchar,
  z_avg_m double precision,
  prev_z_avg_m double precision,
  delta_z_m double precision,
  grip_outlier_flag smallint,
  occurred_at timestamptz,
  stream_id varchar,
  global_seq bigint,
  PRIMARY KEY (scene_key, attempt_num)
);
```

### 필드

```mschema
# Table: read_grip_result_v2
[
(scene_key:varchar, 장면 식별 키 = stream_id 제거 prefix, Primary Key),
(attempt_num:smallint, 동장 scene 내 시도 번호, Primary Key),
(object_name:varchar, payload.objects[0].class_name),
(z_avg_m:double precision, 시도 단위 z1..z8 평균(m)),
(prev_z_avg_m:double precision, 동장 scene 전 시do z_avg(m)),
(delta_z_m:double precision, 시도 대비 z_avg 편차(m)),
(grip_outlier_flag:smallint, \/delta_z_m\/ > 0.1 시 1, else 0),
(occurred_at:timestamptz, 이벤트 occurredAt),
(stream_id:varchar, ES streamId 원천 추적),
(global_seq:bigint, ES globalSeq 원천 추적)
]
```

### 투영 매핑 명세 (이벤트 → 컬럼)

> upsert 키: (scene_key, attempt_num) · 리플레이: projection_cursor 초기화 시 scene_key/attempt_num 기준 오름차순 정렬 필수. catch-up 재투영은 upsert 전제(멱idency)로 prev_z_avg_m/delta_z_m/window state 갱신해야 누락된 attempt 간 보간되지.

| 원천 이벤트 | payload 필드 | 컬럼 | 변환 |
| --- | --- | --- | --- |
| GripAttemptRecorded | streamId | stream_id | verbatim |
| GripAttemptRecorded | attemptNumber | attempt_num | verbatim |
| GripAttemptRecorded | objects[0].class_name | object_name | verbatim |
| GripAttemptRecorded | occurredAt | occurred_at | verbatim |
| GripAttemptRecorded | globalSequence | global_seq | verbatim |

파생 컬럼(이벤트 payload 아님):
- `scene_key` ← streamId prefix 'grip-attempt:' 제거
- `z_avg_m` ← grip_data.grip_3d_pose.z1..z8 평균(m)
- `prev_z_avg_m` ← 동장(scene_key) 전 attempt의 z_avg_m (window lag 1)
- `delta_z_m` ← current z_avg_m - prev_z_avg_m
- `grip_outlier_flag` ← |delta_z_m| > 0.1 ? 1 : 0

### Insight 카드 등록 (Insight Read DB 동기화)

> DDL 적용 시 아래 카드 등록도 함께 실행한다 — 다음 분석부터 신규 Read Model 이 LLM 컨텍스트에 노출된다.

```sql
INSERT INTO insight_entity (entity_name, kind, purpose, key_columns)
VALUES ('read_grip_result_v2', 'read_model', '장면별 시도 단위 Z축 평균·이전 시도 대비 편차·기저선 이탈 플래그 계산 및 이상 로그 차단', '(scene_key, attempt_num)')
ON CONFLICT (entity_name) DO UPDATE SET purpose = EXCLUDED.purpose, key_columns = EXCLUDED.key_columns;

INSERT INTO insight_field (entity_name, field_name, data_type, meaning, display_order)
VALUES
  ('read_grip_result_v2', 'scene_key', 'varchar', '장면 식별 키 = stream_id 제거 prefix', 1),
  ('read_grip_result_v2', 'attempt_num', 'smallint', '동장 scene 내 시도 번호', 2),
  ('read_grip_result_v2', 'object_name', 'varchar', 'payload.objects[0].class_name', 3),
  ('read_grip_result_v2', 'z_avg_m', 'double precision', '시도 단위 z1..z8 평균(m)', 4),
  ('read_grip_result_v2', 'prev_z_avg_m', 'double precision', '동장 scene 전 시do z_avg(m)', 5),
  ('read_grip_result_v2', 'delta_z_m', 'double precision', '시도 대비 z_avg 편차(m)', 6),
  ('read_grip_result_v2', 'grip_outlier_flag', 'smallint', '|delta_z_m| > 0.1 시 1, else 0', 7),
  ('read_grip_result_v2', 'occurred_at', 'timestamptz', '이벤트 occurredAt', 8),
  ('read_grip_result_v2', 'stream_id', 'varchar', 'ES streamId 원천 추적', 9),
  ('read_grip_result_v2', 'global_seq', 'bigint', 'ES globalSeq 원천 추적', 10)
ON CONFLICT (entity_name, field_name) DO UPDATE SET data_type = EXCLUDED.data_type, meaning = EXCLUDED.meaning, display_order = EXCLUDED.display_order;
```

## 3. API Versioning

> 실행 게이트: 아래 변경은 인간 승인 후에만 적용한다 (human-in-the-loop).

### Unreleased (v1 → v2)

#### Added
- read_grip_result_v2 테이블·프로젝터·라우트(/grip-result-v2) 신규 등재

### 마이그레이션 절차

- 하위호환 변경: read_grip_result_v2 테이블 추가 및 동재 운영; POST /projection/grip-result-v2 엔드포인트 추가
- 파괴적 변경: 없음
- 컷오버 전 테스트: v1 gripResultProjector 실행 검증 → v2 GripResultV2Projector 실행 검증 → 두 Read Model 결과 비교(ΔZ_avg, outlier_flag) 일치 여부 확인
- 롤백 창/조건: v2 테이블 drop 및 /grip-result-v2 라우트 제거, DI 주입 revert, CatchUpAll return type revert
- Insight 카드 등록: §2의 카드 등록 SQL을 DDL과 함께 적용(카탈로그 동기화)

### 사유·호환성

- 사유: 기존 read_grip_result Read Model은 grip_3d_pose 만 jsonb 저장이며 동장 scene 간 attempt Z-평균 편차 검증을 수행하지[corr:25]. 이로써 suddenJump_withinScene 규칙(Δ>0.1m)을 놓치는 Sensor Baseline Departure 현장을 투영된 데이터에 누락됨.
- 트리거 근거: [윈도우 1] R6 suddenJump_withinScene: 같은 scene 연속 attempt 간 z평균 0.060 → 0.170, Δ=0.110 > 0.10 m / [2차 지목] R6 suddenJump_withinScene: 같은 scene 연속 attempt 간 z평균 0.069 → 0.179, Δ=0.110 > 0.10 m
- v1 호환성: 기존 read_grip_result 테이블·엔드포인트·프로젝터 클래스/name 은 무손상. 신규 read_grip_result_v2 는 동재 병렬 운영으로 backwardCompatibleChanges 적용.

### 변경 파일

- `src/projection/projection.service.ts` (modifyFile) — GripResultV2Projector DI 주입, catchUpGripResultV2 메서드 추가, CatchUpAllResult/InsertAndProjectionAllResult return type 확장.
- `src/projection/projection.controller.ts` (modifyFile) — POST /projection/grip-result-v2 라우트 엔드포인트 추가.
- `src/shared/database/schema/index.ts` (modifyFile) — read-grip-result-v2 스키마 export 추가.

## Optional — 부속 자료(컨텍스트 축소 시 생략 가능)

### 신규 Read Model — Drizzle 스키마

```ts
import { bigint, doublePrecision, index, pgTable, primaryKey, smallint, timestamp, varchar } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const readGripResultV2 = pgTable(
  "read_grip_result_v2",
  {
    sceneKey: varchar("scene_key").notNull(),
    attemptNum: smallint("attempt_num").notNull(),
    objectName: varchar("object_name").notNull(),
    zAvgM: doublePrecision("z_avg_m"),
    prevZAvgM: doublePrecision("prev_z_avg_m"),
    deltaZM: doublePrecision("delta_z_m"),
    gripOutlierFlag: smallint("grip_outlier_flag").notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
    streamId: varchar("stream_id").notNull(),
    globalSeq: bigint("global_seq", { mode: "number" }).notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.sceneKey, t.attemptNum] }),
    index("idx_v2_object").on(t.objectName),
    index("idx_v2_occurred").on(t.occurredAt),
  ],
);
```

### 신규 Read Model — Projector

```ts
import { Injectable } from '@nestjs/common';
import { type InferInsertModel } from 'drizzle-orm';
import { PinoLogger } from 'nestjs-pino';
import { type ToyDataDto, toyDataSchema } from '@/insert/dto/toy-data.dto';
import type { Projector } from '@/projection/projector/projector';
import type { EventStoreEventRow } from '@/projection/repository/event-store-reader.repository';
import { DrizzleTx } from '@/shared/database/drizzle.provider';
import { readGripResultV2 } from '@/shared/database/schema';
import { LogAction, LogContext } from '@/shared/logger/logging-context';

type ReadGripResultV2Insert = InferInsertModel<typeof readGripResultV2>;

@Injectable()
export class GripResultV2Projector implements Projector<ReadGripResultV2Insert> {
  readonly name: string = "grip-result-v2-projector";

  private lastZAvgPerScene: Record<string, number | null> = {};

  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(GripResultV2Projector.name);
  }

  map(event: EventStoreEventRow): ReadGripResultV2Insert {
    let payload: ToyDataDto;
    try {
      payload = toyDataSchema.parse(event.payload);
    } catch (error) {
      this.logger.error(
        {
          action: LogAction.MAP_FAILED,
          error,
          [LogContext.EVENT_ID]: event.eventId,
          [LogContext.STREAM_ID]: event.streamId,
          [LogContext.ATTEMPT_NUM]: event.attemptNum,
          [LogContext.GLOBAL_SEQ]: event.globalSeq,
        },
        "이벤트 매핑(검증) 실패",
      );

      throw error;
    }

    const sceneKey: string = event.streamId.replace(/^grip-attempt:/, "");
    const zCoords = [
      payload.grip_data.grip_3d_pose.z1,
      payload.grip_data.grip_3d_pose.z2,
      payload.grip_data.grip_3d_pose.z3,
      payload.grip_data.grip_3d_pose.z4,
      payload.grip_data.grip_3d_pose.z5,
      payload.grip_data.grip_3d_pose.z6,
      payload.grip_data.grip_3d_pose.z7,
      payload.grip_data.grip_3d_pose.z8,
    ];

    const zAvgM: number = zCoords.reduce((sum, val) => sum + val, 0) / zCoords.length;
    const prevZAvgM: number | null = this.lastZAvgPerScene[sceneKey] ?? null;
    let deltaZM: number | null = null;
    let gripOutlierFlag: number = 0;

    if (prevZAvgM !== null) {
      deltaZM = zAvgM - prevZAvgM;
      if (Math.abs(deltaZM) > 0.1) {
        gripOutlierFlag = 1;
      }
    }

    this.lastZAvgPerScene[sceneKey] = zAvgM;

    return {
      sceneKey,
      attemptNum: event.attemptNum,
      objectName: payload.objects[0].class_name,
      zAvgM,
      prevZAvgM,
      deltaZM,
      gripOutlierFlag,
      occurredAt: event.occurredAt,
      streamId: event.streamId,
      globalSeq: event.globalSeq,
    };
  }

  async upsert(tx: DrizzleTx, row: ReadGripResultV2Insert): Promise<void> {
    await tx
      .insert(readGripResultV2)
      .values(row)
      .onConflictDoUpdate({
        target: [readGripResultV2.sceneKey, readGripResultV2.attemptNum],
        set: {
          objectName: row.objectName,
          zAvgM: row.zAvgM,
          prevZAvgM: row.prevZAvgM,
          deltaZM: row.deltaZM,
          gripOutlierFlag: row.gripOutlierFlag,
          occurredAt: row.occurredAt,
          streamId: row.streamId,
          globalSeq: row.globalSeq,
        },
      });
  }
}
```

### 신규 Read Model — 배선(컨트롤러/서비스/모듈)

```ts
// src/shared/database/schema/index.ts
export * from "./insight/insight-entity";
export * from "./insight/insight-field";
export * from "./log/log-cursor";
export * from "./log/log-event";
export * from "./service/event";
export * from "./service/projection-cursor";
export * from "./service/read-grip-result";
export * from "./service/read-multimodal";
export * from "./service/read-grip-result-v2"; // 신규 v2 스키마 노출

// src/projection/projection.service.ts (의존성 주입/라우트 매핑)
/*
  [신구 재투영 강제] CatchUpRunner 커서(cursor)를 0으로 리셋해 전체 ES 적재+투영을 강제하는 절차를 명시:
  runner.resetCursor(0); await projectionService.catchUpGripResultV2();
*/
@Injectable()
export class ProjectionService {
  constructor(
    private readonly logger: PinoLogger,
    private readonly runner: CatchUpRunner,
    private readonly multimodal: MultiModalProjector,
    private readonly gripResult: GripResultProjector,
    private readonly gripResultV2: GripResultV2Projector, // 신규 v2 프로젝터 주입
    private readonly insertService: InsertService,
  ) {
    this.logger.setContext(ProjectionService.name);
  }

  catchUpMultimodal(): Promise<ProjectionResult> { return this.runner.run(this.multimodal); }
  catchUpGripResult(): Promise<ProjectionResult> { return this.runner.run(this.gripResult); }
  catchUpGripResultV2(): Promise<ProjectionResult> { return this.runner.run(this.gripResultV2); } // 신규 v2 catchUp

  async catchUpAll(): Promise<CatchUpAllResult> {
    this.logger.info({ action: LogAction.PROJECTION_START }, "전체 투영 시작");
    const multimodal: ProjectionResult = await this.catchUpMultimodal();
    const gripResult: ProjectionResult = await this.catchUpGripResult();
    // 신규 v2 동장 baseline departue 로직 동부 투영
    const gripResultV2: ProjectionResult = await this.catchUpGripResultV2();
    this.logger.info({ action: LogAction.PROJECTION_DONE }, "전체 투영 완료");
    return { multimodal, gripResult, gripResultV2 };
  }
}

// src/projection/projection.controller.ts (라우트 패턴)
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
    this.logger.info({ action: LogAction.PROJECTION_REQUEST, [LogContext.ROUTE]: "POST /projection/multimodal" }, "projection 요청 수신");
    return this.projectionService.catchUpMultimodal();
  }

  @Post("/grip-result")
  gripResult(): Promise<ProjectionResult> {
    this.logger.info({ action: LogAction.PROJECTION_REQUEST, [LogContext.ROUTE]: "POST /projection/grip-result" }, "projection 요청 수신");
    return this.projectionService.catchUpGripResult();
  }

  @Post("/grip-result-v2") // 신규 v2 라우트
  gripResultV2(): Promise<ProjectionResult> {
    this.logger.info({ action: LogAction.PROJECTION_REQUEST, [LogContext.ROUTE]: "POST /projection/grip-result-v2" }, "projection 요청 수신");
    return this.projectionService.catchUpGripResultV2();
  }

  @Post("/insert-all")
  insertAll(): Promise<InsertAndProjectionAllResult> {
    this.logger.info({ action: LogAction.PROJECTION_REQUEST, [LogContext.ROUTE]: "POST /projection/insert-all" }, "projection 요청 수신");
    return this.projectionService.insertAllAndProjectAll();
  }
}

// src/projection/projection.module.ts (providers 등록)
@Module({
  imports: [...],
  providers: [
    MultiModalProjector,
    GripResultProjector,
    GripResultV2Projector, // 신규 v2 프로젝터 등록
    ProjectionService,
    CatchUpRunner,
    InsertService,
  ],
})
export class ProjectionModule {}
```

### 버전 교체 코드 — `src/projection/projection.service.ts` (modifyFile)

```ts
import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { InsertResult, InsertService } from '@/insert/insert.service';
import { GripResultProjector } from '@/projection/projector/grip-result.projector';
import { MultiModalProjector } from '@/projection/projector/multimodal.projector';
import { GripResultV2Projector } from '@/projection/projector/grip-result-v2.projector';
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

```ts
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
      {
        action: LogAction.PROJECTION_REQUEST,
        [LogContext.ROUTE]: "POST /projection/multimodal",
      },
      "projection 요청 수신",
    );

    return this.projectionService.catchUpMultimodal();
  }

  @Post("/grip-result")
  gripResult(): Promise<ProjectionResult> {
    this.logger.info(
      {
        action: LogAction.PROJECTION_REQUEST,
        [LogContext.ROUTE]: "POST /projection/grip-result",
      },
      "projection 요청 수신",
    );

    return this.projectionService.catchUpGripResult();
  }

  @Post("/grip-result-v2")
  gripResultV2(): Promise<ProjectionResult> {
    this.logger.info(
      {
        action: LogAction.PROJECTION_REQUEST,
        [LogContext.ROUTE]: "POST /projection/grip-result-v2",
      },
      "projection 요청 수신",
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

### 버전 교체 코드 — `src/shared/database/schema/index.ts` (modifyFile)

```ts
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

## Guardrails (constraints)

- v1 자산(테이블/엔드포인트/프로젝터 name) 무손상
- PK (scene_key, attempt_num) 유지
- TypeScript any 금지
- 식별자 전체 단어
- DDL 실행·API 컷오버는 인간 승인 후에만 (human-in-the-loop)
- Read Model 테이블명은 read_ 접두 스네이크 케이스
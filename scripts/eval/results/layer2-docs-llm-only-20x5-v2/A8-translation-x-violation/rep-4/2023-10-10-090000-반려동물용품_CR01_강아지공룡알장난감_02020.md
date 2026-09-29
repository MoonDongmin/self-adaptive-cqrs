---
docId: dq-반려동물용품_CR01_강아지공룡알장난감_02020
generatedAt: 2026-08-12T17:35:18.978Z
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
  - { origin: insight-read-db, anchorId: "seq:27" }
constraints:
  - "v1 자산(테이블/엔드포인트/프로젝터 name) 무손상"
  - "PK (scene_key, attempt_num) 유지"
  - "TypeScript any 금지"
  - "식별자 전체 단어"
  - "DDL 실행·API 컷오버는 인간 승인 후에만 (human-in-the-loop)"
  - "Read Model 테이블명은 read_ 접두 스네이크 케이스"
---

# Self-Adaptive CQRS Docs — read_grip_result

> 결론(TL;DR): `read_grip_result`을(를) 재생성한다 — 두 장면(_02020, _02021)에서 gripSucceed=1(성 성공) 보고하나 robotTfTranslation 좌표(X=1.2m, Y=0.2m)가 물리적 workspace 한계([-0.5~0.5]m, [0.65~0.95]m)를 벗어나 잡을 수 없는 위치임. 이는 gripSucceed_poseConsistency 규칙 위배로, 성공 플래그와 센서 치유 모순. (이상 유형: Sensor Baseline Deviation / Pose Consistency Violation · 심각도: critical)

<logging_context>

## 센서 이상 배치 (관찰자 1차 판정 — 검증 전 가설)
> 사유: [윈도우 1] R5 poseConsistency: s=1 성공인데 robotTfTranslation x=1.200 이 워크스페이스 [-0.50, 0.50] m 밖 / R5 poseConsistency: s=1 성공인데 robotTfTranslation y=0.200 이 워크스페이스 [0.65, 0.95] m 밖 / [2차 지목] R5 poseConsistency: s=1 성공인데 robotTfTranslation x=1.200 이 워크스페이스 [-0.50, 0.50] m 밖 / R5 poseConsistency: s=1 성공인데 robotTfTranslation y=0.200 이 워크스페이스 [0.65, 0.95] m 밖
> 의심 sceneKey: 반려동물용품_CR01_강아지공룡알장난감_02020, 반려동물용품_CR01_강아지공룡알장난감_02021
> 위 사유는 소형 1차 관찰자의 출력이라 인용 수치·부등호가 부정확할 수 있는 **가설**이다.
> 근거로 쓸 관측값·부등호는 반드시 아래 원시 레코드에서 재확인해 원문 그대로 인용하고,
> 원시 레코드에서 재확인되지 않는 1차 사유는 기각해라.

### 투영된 센서 값 (JSON 한 줄당 한 레코드)
```json
{"sceneKey":"반려동물용품_CR01_강아지공룡알장난감_00280","attemptNumber":1,"streamId":"grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00280","globalSequence":25,"occurredAt":"2023-09-23T00:00:00.000Z","objectName":"강아지공룡알장난감","gripSucceed":0,"grip2dPose":{"xl":779.378,"xr":779.151,"yl":286.141,"yr":139.34},"grip3dPose":{"x1":-0.21735775797682086,"x2":-0.20818960263658312,"x3":-0.18143518710943327,"x4":-0.190603342449671,"x5":-0.209716404258284,"x6":-0.20054824891804626,"x7":-0.1737938333908964,"x8":-0.18296198873113415,"y1":1.0017436572954646,"y2":1.1329463728896905,"y3":1.1302049083424122,"y4":0.9990021927481864,"y5":1.0234401671588353,"y6":1.1546428827530613,"y7":1.151901418205783,"y8":1.020698702611557,"z1":0.09574115591394006,"z2":0.14371815403135035,"z3":0.14610260825330987,"z4":0.09812561013589957,"z5":0.03494747883238116,"z6":0.08292447694979146,"z7":0.08530893117175098,"z8":0.037331933054340675},"robotTf":{"rotation_3x3":[0.999992,0.003878,-0.000419,0.003871,-0.999845,-0.017179,-0.000485,0.017177,-0.999852],"translation_3x1":[-0.011986,0.750103,1.02053]},"humanAnnotationGrasp":[{"annotation_type":"keypoint","id":11,"annotation_points":[650.9555222194793,196.85269856949597,2,751.969222832053,121.83830486564389,2],"num_keypoints":2}]}
{"sceneKey":"반려동물용품_CR01_강아지공룡알장난감_02020","attemptNumber":1,"streamId":"grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02020","globalSequence":26,"occurredAt":"2023-10-10T00:00:00.000Z","objectName":"강아지공룡알장난감","gripSucceed":1,"grip2dPose":{"xl":910.488,"xr":813.657,"yl":398.957,"yr":326.183},"grip3dPose":{"x1":0.1415531755815133,"x2":0.22288056359809028,"x3":0.24444392846680513,"x4":0.16311654045022816,"x5":0.15177137426574278,"x6":0.23309876228231974,"x7":0.2546621271510346,"x8":0.17333473913445763,"y1":0.8322072064937208,"y2":0.9453139263160791,"y3":0.9294040182603559,"y4":0.8162972984379976,"y5":0.832738542517501,"y6":0.9458452623398593,"y7":0.9299353542841361,"y8":0.8168286344617778,"z1":0.1404852919172044,"z2":0.15436786694591167,"z3":0.1576687942697266,"z4":0.14378621924101934,"z5":0.07629568140522633,"z6":0.0901782564339336,"z7":0.09347918375774852,"z8":0.07959660872904126},"robotTf":{"rotation_3x3":[0.029246,-0.946137,0.322443,-0.99956,-0.029255,0.004819,0.004874,-0.322442,-0.946577],"translation_3x1":[1.2,0.755481,1.0337]},"humanAnnotationGrasp":[{"annotation_type":"keypoint","id":11,"annotation_points":[837.7735518085738,290.10657259006973,2,922.5907497697533,349.4941147247116,2],"num_keypoints":2}]}
⚠ consistency [반려동물용품_CR01_강아지공룡알장난감_02020#1] gripSucceed=1(성공)인데 robotTfTranslationX=1.2 작업범위 [-0.5, 0.5]m 밖 — 잡을 수 없는 위치에서 성공은 모순
⚠ stat [반려동물용품_CR01_강아지공룡알장난감_02020#1] robotTfTranslationX=1.2 robust-z=294.2 (임계 3.5, 관측 분포 클러스터 밖 — 신규값 참고 정보)
{"sceneKey":"반려동물용품_CR01_강아지공룡알장난감_02021","attemptNumber":1,"streamId":"grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02021","globalSequence":27,"occurredAt":"2023-10-10T00:00:00.000Z","objectName":"강아지공룡알장난감","gripSucceed":1,"grip2dPose":{"xl":1151.05,"xr":1097.73,"yl":409.763,"yr":297.697},"grip3dPose":{"x1":0.13583597575946987,"x2":0.25762077030509184,"x3":0.26881488327524555,"x4":0.1470300887296236,"x5":0.15320429723556156,"x6":0.2749890917811835,"x7":0.28618320475133724,"x8":0.16439841020571527,"y1":0.5698898414343145,"y2":0.6314120217996064,"y3":0.607180576055836,"y4":0.5456583956905441,"y5":0.5674124288670743,"y6":0.6289346092323662,"y7":0.6047031634885958,"y8":0.5431809831233039,"z1":0.1438768673260184,"z2":0.1752374339755728,"z3":0.17930300551942063,"z4":0.14794243886986624,"z5":0.08128929798453642,"z6":0.11264986463409082,"z7":0.11671543617793867,"z8":0.08535486952838427},"robotTf":{"rotation_3x3":[0.029246,-0.946137,0.322443,-0.99956,-0.029255,0.004819,0.004874,-0.322442,-0.946577],"translation_3x1":[-0.332466,0.2,1.0337]},"humanAnnotationGrasp":[{"annotation_type":"keypoint","id":11,"annotation_points":[1130.6451879522954,282.06786598651155,2,1180.0979442602377,372.73511176483686,2],"num_keypoints":2}]}
⚠ consistency [반려동물용품_CR01_강아지공룡알장난감_02021#1] gripSucceed=1(성공)인데 robotTfTranslationY=0.2 작업범위 [0.65, 0.95]m 밖 — 잡을 수 없는 위치에서 성공은 모순
⚠ stat [반려동물용품_CR01_강아지공룡알장난감_02021#1] robotTfTranslationY=0.2 robust-z=185.5 (임계 3.5, 관측 분포 클러스터 밖 — 신규값 참고 정보)
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

> 정합성 위배로 이상 확립: gripSucceed=1인데 robotTfTranslation이 물리적 workspace 한계를 벗어나 잡을 수 없는 위치.

### 심각도 — critical

오염 컬럼은 robotTf와 gripSucceed 조합으로 의미적 정합성 위배 발생, 영향 행수는 event_store 기준 2건(sequences 26, 27)으로 컨트롤러 엔드포인트 downstream 전파 위험, 재투영으로 복구는 projector 검증 로직 추가 시 event_store 원천 활용 가능. 델타 크기 단독이 아닌 consistency rule 위배로 critical 판정.

### 기대-실측 델타 근거

- (반려동물용품_CR01_강아지공룡알장난감_02020#1, `robotTf` / robotTfTranslation) 관측 `1.2` vs 기준 `robotTfTranslationX_workspace` [-0.50, 0.50] m → 델타 +0.700 m · 성 성공 플래그와 workspace 한계 위배로 잡을 수 없는 위치 보고.
- (반려동물용품_CR01_강아지공룡알장난감_02021#1, `robotTf` / robotTfTranslation) 관측 `0.2` vs 기준 `robotTfTranslationY_workspace` [0.65, 0.95] m → 델타 -0.450 m · 성 성공 플래그와 workspace 한계 위배로 잡을 수 없는 위치 보고.

### 관찰

- gripSucceed=1 보고하나 robotTfTranslationX=1.2m 가 workspace [-0.5, 0.5]m 한계를 벗남
- gripSucceed=1 보고하나 robotTfTranslationY=0.2m 가 workspace [0.65, 0.95]m 한계를 벗남

### 영향 범위

- event_store → grip-result-projector → read_grip_result(robot_tf jsonb) → ProjectionController(/grip-result) → API v1

### 근본원인 — projectionOrPipelineFault

1. 관측: gripSucceed=1인데 robotTfTranslation이 물리적 workspace 한계를 벗남
2. 왜? Projector map() 단계에서 raw payload 전달만 수행, 의미적 값 검증 생략
3. 왜? Zod 스키마는 구조(type/length)만 검사, semantic range constraint 미구현
4. 왜? Baseline consistency rule gripSucceed_poseConsistency 존재하나 코드 매칭 누락
5. 왜? Read Model schema robot_tf 열이 jsonb 타입만 적용, explicit typed column 및 CHECK constraint 부재

### 의사결정 기준

- 데이터 보존(event_store 원천 무손)
- 검증 포괄(신규 이상 자동 적발)
- 구현 리스크(기존 아키텍처 호환)

### 해결책 옵션 (contain → fix → harden)

#### [contain] 오염 행 격리
- 접근: 오염 행 격리(DELETE — 원본은 event_store 에 보존, 재투영으로 복원)
- 트레이드오프: 데이터 보존 우수, 검증 포괄 미흡(신규 이상 누락), 구현 리스크 낮음.
```sql
-- 오염 행 격리: 이상 (scene_key, attempt_num) 행을 Read Model 에서 제거한다.
-- 원본 이벤트는 event_store 에 보존되므로 v2 재투영(무결성 플래그 포함)으로 복원 가능하다.
DELETE FROM read_grip_result WHERE (scene_key, attempt_num) IN (('반려동물용품_CR01_강아지공룡알장난감_02020', 1), ('반려동물용품_CR01_강아지공룡알장난감_02021', 1));
```

#### [fix] v2 Read Model 적용 및 검증 로직 삽입
- 접근: 확정 설계 read_grip_result_v2 채택, projector map() 확장으로 explicit translation extraction + flag calculation.
- 트레이드오프: 데이터 보존 우수, 검증 포괄 우수, 구현 리스크 중(마이그레이션+projector refactor).
```typescript
// src/projection/projector/grip-result.projector.ts map() return 수정
return {
  sceneKey: event.streamId.replace(/^grip-attempt:/, ""),
  attemptNum: event.attemptNum,
  objectName: payload.objects[0].class_name,
  gripSucceed: payload.grip_succeed,
  robotTfTranslationX: payload.robot_tf.translation_3x1[0],
  robotTfTranslationY: payload.robot_tf.translation_3x1[1],
  robotTfTranslationZ: payload.robot_tf.translation_3x1[2],
  gripOutlierFlag: (payload.grip_succeed === 1 && (payload.robot_tf.translation_3x1[0] < -0.5 || payload.robot_tf.translation_3x1[0] > 0.5 || payload.robot_tf.translation_3x1[1] < 0.65 || payload.robot_tf.translation_3x1[1] > 0.95)) ? 1 : 0,
  occurredAt: event.occurredAt,
};
```

#### [harden] 베이스라인 CHECK constraint 추가
- 접근: v2 테이블에 workspace 범위 CHECK 적용.
- 트레이드오프: 데이터 보존 무관, 검증 포괄 우수(DB level), 구현 리스크 낮음(SQL DDL).
```sql
-- 선행 조건: §2 'Read Model 생성 SQL'(DDL)을 먼저 적용한 뒤 실행한다.
ALTER TABLE read_grip_result_v2 ADD CONSTRAINT check_workspace_range CHECK (
  (grip_succeed = 1 AND robot_tf_translation_x BETWEEN -0.50 AND 0.50 AND robot_tf_translation_y BETWEEN 0.65 AND 0.95) OR
  grip_succeed = 0
);
```

### 권장
- v2 Read Model 채택 및 검증 로직 삽입
- 사유: 확정 설계 read_grip_result_v2 채택으로 explicit typed column과 flag column enables immediate validation without jsonb parsing overhead, aligns with baseline rules and prevents future semantic anomalies.
- 수용하는 트레이드오프: migration cost & projector refactor risk
- 기각한 대안:
  - contain: lost on validation coverage criterion
  - fix-only v1: lost on implementation risk & validation coverage criterion

### 즉시 격리 SQL

```sql
-- 오염 행 격리: 이상 (scene_key, attempt_num) 행을 Read Model 에서 제거한다.
-- 원본 이벤트는 event_store 에 보존되므로 v2 재투영(무결성 플래그 포함)으로 복원 가능하다.
DELETE FROM read_grip_result WHERE (scene_key, attempt_num) IN (('반려동물용품_CR01_강아지공룡알장난감_02020', 1), ('반려동물용품_CR01_강아지공룡알장난감_02021', 1));
```

### 하드닝(베이스라인 추가 규칙)

rule: robotTfTranslation_workspace_hard expected: X in [-0.50, 0.50] m AND Y in [0.65, 0.95] m (gripSucceed=1 전제)

### 다음 단계

- v2 스키마 마이그레이션 적용 (`src/shared/database/schema/service/read-grip-result-v2.ts`) — schema migration & index update, DBA
- projector map() 확장으로 explicit translation extraction (`src/projection/projector/grip-result.projector.ts`) — map return object 수정 + flag logic, DEV
- catch-up runner 검증 로직 연동 (`src/projection/runner/catch-up.runner.ts`) — v2 row validation hook 삽입, DEV
- API endpoint response schema 반영 (`src/projection/projection.controller.ts`) — response DTO update, DEV

## 2. Read Model 생성 SQL (Read Model DDL)

> 실행 게이트: 아래 변경은 인간 승인 후에만 적용한다 (human-in-the-loop).

- 대상: `read_grip_result_v2` · 키: scene_key, attempt_num · 원천 이벤트: GripAttemptRecorded

```sql
DROP TABLE IF EXISTS read_grip_result_v2;

CREATE TABLE read_grip_result_v2 (
  scene_key varchar NOT NULL,
  attempt_num smallint NOT NULL,
  object_name varchar NOT NULL,
  grip_succeed smallint NOT NULL,
  robot_tf_translation_x double precision,
  robot_tf_translation_y double precision,
  robot_tf_translation_z double precision,
  grip_outlier_flag smallint NOT NULL,
  occurred_at timestamptz NOT NULL,
  PRIMARY KEY (scene_key, attempt_num)
);

CREATE INDEX idx_grip_result_v2_time_series ON read_grip_result_v2 (occurred_at);
CREATE INDEX idx_grip_result_v2_object ON read_grip_result_v2 (object_name, occurred_at);
```

### 필드

```mschema
# Table: read_grip_result_v2
[
(scene_key:varchar, 장면 식별 키 = stream_id에서 'grip-attempt:' 제거, Primary Key),
(attempt_num:smallint, 동일 장면 내 파지 시도 번호, Primary Key),
(object_name:varchar, 파지 대상 객체명 (payload.objects[0].class_name)),
(grip_succeed:smallint, 파지 성공 여부 (0=실패, 1=성공)),
(robot_tf_translation_x:double precision, 로봇 평행이동 벡터 X좌표 (translation_3x1[0])),
(robot_tf_translation_y:double precision, 로봇 평행이동 벡터 Y좌표 (translation_3x1[1])),
(robot_tf_translation_z:double precision, 로봇 평행이동 벡터 Z좌표 (translation_3x1[2])),
(grip_outlier_flag:smallint, 정합성 플래그. gripSucceed=1 AND (X<-0.5 OR X>0.5 OR Y<0.65 OR Y>0.95) 시 1, else 0),
(occurred_at:timestamptz, 데이터 촬영 일자 (event.occurredAt))
]
```

### 투영 매핑 명세 (이벤트 → 컬럼)

> upsert 키: scene_key,attempt_num · 리플레이: projection_cursor 초기화 시 0 설정. 전 재투영(catch-up) 시 동일 키(upsertKey) 기준 멱등 upsert 전제: 기존 row 덮쓰기 허용, 단 derived outlier flag 재계산 필수.

| 원천 이벤트 | payload 필드 | 컬럼 | 변환 |
| --- | --- | --- | --- |
| GripAttemptRecorded | attemptNumber | attempt_num | verbatim |
| GripAttemptRecorded | objectName | object_name | verbatim |
| GripAttemptRecorded | gripSucceed | grip_succeed | number → smallint (0/1) 캐스팅 |
| GripAttemptRecorded | occurredAt | occurred_at | verbatim |

파생 컬럼(이벤트 payload 아님):
- `scene_key` ← streamId prefix 'grip-attempt:' 제거
- `grip_outlier_flag` ← 1 if grip_succeed=1 AND (robot_tf_translation_x < -0.5 OR robot_tf_translation_x > 0.5 OR robot_tf_translation_y < 0.65 OR robot_tf_translation_y > 0.95) else 0

### Insight 카드 등록 (Insight Read DB 동기화)

> DDL 적용 시 아래 카드 등록도 함께 실행한다 — 다음 분석부터 신규 Read Model 이 LLM 컨텍스트에 노출된다.

```sql
INSERT INTO insight_entity (entity_name, kind, purpose, key_columns)
VALUES ('read_grip_result_v2', 'read_model', '장면별 로봇 파지 결과 조회와 센서 치유 모순(Workspace Consistency) 플래그 적재. 기존 read_grip_result의 robot_tf jsonb 열은 클라이언트 파싱이 필요하나 본 모델은 translation_3x1[0~2]를 doublePrecision 열로 추출하고 gripOutlierFlag(hard constraint 위배 시 1)를 직접 계산하여 SQL 기반 이상 탐지 및 시계열 조회를 지원.', 'scene_key, attempt_num')
ON CONFLICT (entity_name) DO UPDATE SET purpose = EXCLUDED.purpose, key_columns = EXCLUDED.key_columns;

INSERT INTO insight_field (entity_name, field_name, data_type, meaning, display_order)
VALUES
  ('read_grip_result_v2', 'scene_key', 'varchar', '장면 식별 키 = stream_id에서 ''grip-attempt:'' 제거', 1),
  ('read_grip_result_v2', 'attempt_num', 'smallint', '동일 장면 내 파지 시도 번호', 2),
  ('read_grip_result_v2', 'object_name', 'varchar', '파지 대상 객체명 (payload.objects[0].class_name)', 3),
  ('read_grip_result_v2', 'grip_succeed', 'smallint', '파지 성공 여부 (0=실패, 1=성공)', 4),
  ('read_grip_result_v2', 'robot_tf_translation_x', 'double precision', '로봇 평행이동 벡터 X좌표 (translation_3x1[0])', 5),
  ('read_grip_result_v2', 'robot_tf_translation_y', 'double precision', '로봇 평행이동 벡터 Y좌표 (translation_3x1[1])', 6),
  ('read_grip_result_v2', 'robot_tf_translation_z', 'double precision', '로봇 평행이동 벡터 Z좌표 (translation_3x1[2])', 7),
  ('read_grip_result_v2', 'grip_outlier_flag', 'smallint', '정합성 플래그. gripSucceed=1 AND (X<-0.5 OR X>0.5 OR Y<0.65 OR Y>0.95) 시 1, else 0', 8),
  ('read_grip_result_v2', 'occurred_at', 'timestamptz', '데이터 촬영 일자 (event.occurredAt)', 9)
ON CONFLICT (entity_name, field_name) DO UPDATE SET data_type = EXCLUDED.data_type, meaning = EXCLUDED.meaning, display_order = EXCLUDED.display_order;
```

## 3. API Versioning

> 실행 게이트: 아래 변경은 인간 승인 후에만 적용한다 (human-in-the-loop).

### Unreleased (v1 → v2)

#### Added
- read_grip_result_v2 테이블, GripResultV2Projector, /grip-result-v2 라우트
#### Fixed
- workspace bounds 정합성 검증 누락으로 인한 gripSucceed=1 이상값 통과 차단

### 마이그레이션 절차

- 하위호환 변경: -
- 파괴적 변경: 없음
- 컷오버 전 테스트: v2 컷오버 전, read_grip_result_v2.grip_outlier_flag=1 행이 trigger window anomaly log(02020/02021)와 일치하는 X/Y 좌표를 매칭. outlier_flag 정합성 일치 100% 확인 시 컷오버 승인.
- 롤백 창/조건: v2 테이블 drop, DI 제거, /grip-result-v2 라우트 삭제. v1 jsonb 저장 재적립으로 fallback.
- Insight 카드 등록: §2의 카드 등록 SQL을 DDL과 함께 적용(카탈로그 동기화)

### 사유·호환성

- 사유: 기존 v1 Read Model은 robot_tf 열이 jsonb(일반 JSON) 타입만 적용, workspace 범위 Zod 검증이나 consistency 규칙(hard constraint) 결결. 이로 인해 gripSucceed=1 보고하나 robotTfTranslation 좌표가 물리적 workspace 한계([-0.5~0.5]m, [0.65~0.95]m)를 벗어나 잡을 수 없는 위치임. v2는 explicit double precision 열과 grip_outlier_flag 플래그를 도입하여 정합성 검증이 누락된 이상값을 즉시 차단. triggeringEvidence에는 윈도우 표의 앵커 행(time/level/action/correlation_id/msg 셀)을 그대로 옮겨 '어디서/무엇이 잘못됐나'를 적고, v1 코드의 map() 메서드에서 payload.robot_tf 전제 객체를 jsonb 열에 직접 매핑하여 workspace 범위를 검증할 수 없음 [corr:02020][corr:02021].
- 트리거 근거: [win:02020#1] gripSucceed=1(성 성공)인데 robotTfTranslationX=1.2 작업범위 [-0.5, 0.5]m 밖 — 잡을 수 없는 위치에서 성공은 모순 [corr:02020]
[win:02021#1] gripSucceed=1(성 성공)인데 robotTfTranslationY=0.2 작업범위 [0.65, 0.95]m 밖 — 잡을 수 없는 위치에서 성공은 모순 [corr:02021]
- v1 호환성: 기존 v1 테이블·엔드포인트·프로젝터 클래스/name 은 수정·삭제 금지. 새 테이블(read_grip_result_v2), 새 프로젝터(GripResultV2Projector), 신규 라우트(/grip-result-v2) 추가만. 기존 DI 한 줄 추가이며 이때 changeKind=modifyFile, 기존 코드는 보존. v1과 v2 동시 존재 가능, 컷오버 전 testBeforeCutover 검증으로 outlier_flag 정합성 일치 확인.

### 변경 파일

- `src/shared/database/schema/index.ts` (modifyFile) — v2 스키마 export 추가. 기존 v1 export 보존.
- `src/projection/projection.service.ts` (modifyFile) — v2 Projector DI 추가, catchUpAll 결과 타입 확장. 기존 v1 메서드/로직 보존.
- `src/projection/projection.controller.ts` (modifyFile) — 신규 라우트 /grip-result-v2 배선. 기존 v1 엔드포인트 보존.

## Optional — 부속 자료(컨텍스트 축소 시 생략 가능)

### 신규 Read Model — Drizzle 스키마

```ts
import { bigint, doublePrecision, index, pgTable, primaryKey, smallint, timestamp, varchar } from 'drizzle-orm/pg-core';

export const readGripResultV2 = pgTable(
  "read_grip_result_v2",
  {
    sceneKey: varchar("scene_key").notNull(),
    attemptNum: smallint("attempt_num").notNull(),
    objectName: varchar("object_name").notNull(),
    gripSucceed: smallint("grip_succeed").notNull(),
    robotTfTranslationX: doublePrecision("robot_tf_translation_x"),
    robotTfTranslationY: doublePrecision("robot_tf_translation_y"),
    robotTfTranslationZ: doublePrecision("robot_tf_translation_z"),
    gripOutlierFlag: smallint("grip_outlier_flag").notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.sceneKey, t.attemptNum] }),
    index("idx_grip_result_v2_time_series").on(t.occurredAt),
    index("idx_grip_result_v2_object").on(t.objectName, t.occurredAt),
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

    const translation = payload.robot_tf.translation_3x1;
    const x = translation[0];
    const y = translation[1];
    const z = translation[2];

    // Workspace limits: X [-0.5, 0.5], Y [0.65, 0.95]
    let outlierFlag = 0;
    if (payload.grip_succeed === 1) {
      if (x < -0.5 || x > 0.5 || y < 0.65 || y > 0.95) {
        outlierFlag = 1;
      }
    }

    this.logger.debug(
      {
        action: LogAction.EVENT_MAPPED,
        [LogContext.PROJECTOR_NAME]: this.name,
        [LogContext.SCENE_KEY]: event.streamId.replace(/^grip-attempt:/, ""),
        [LogContext.ATTEMPT_NUM]: event.attemptNum,
        [LogContext.GLOBAL_SEQ]: event.globalSeq,
      },
      "이벤트 매핑",
    );

    return {
      sceneKey: event.streamId.replace(/^grip-attempt:/, ""),
      attemptNum: event.attemptNum,
      objectName: payload.objects[0].class_name,
      gripSucceed: payload.grip_succeed,
      robotTfTranslationX: x,
      robotTfTranslationY: y,
      robotTfTranslationZ: z,
      gripOutlierFlag: outlierFlag,
      occurredAt: event.occurredAt,
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
          gripSucceed: row.gripSucceed,
          robotTfTranslationX: row.robotTfTranslationX,
          robotTfTranslationY: row.robotTfTranslationY,
          robotTfTranslationZ: row.robotTfTranslationZ,
          gripOutlierFlag: row.gripOutlierFlag,
          occurredAt: row.occurredAt,
        },
      });
  }
}
```

### 신규 Read Model — 배선(컨트롤러/서비스/모듈)

```ts
// src/shared/database/schema/index.ts
export * from "./service/read-grip-result-v2";

// src/projection/projection.service.ts (add to constructor & class)
  private readonly gripResultV2: GripResultV2Projector,
  ...
  catchUpGripResultV2(): Promise<ProjectionResult> {
    return this.runner.run(this.gripResultV2);
  }

// src/projection/projection.controller.ts (add method)
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

// src/projection/projection.module.ts (add to providers array)
  GripResultV2Projector,

/* 주: CatchUpRunner 커서 리셋(0)으로 전체 재투영 강제 필요. 기존 read_grip_result ALTER 하지 않고 버전 접미사 테이블 생성해 정합성 플래그 컬럼 gripOutlierFlag smallint 포함, blue-green. */
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
      "projection v2 요청 수신",
    );

    return this.projectionService.catchUpGripResultV2();
  }

  @Post("/insert-all")
  insertAll(): Promise<InsertAndProjectionAllResult> {
    this.logger.info(
      { action: LogAction.PROJECTION_REQUEST },
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
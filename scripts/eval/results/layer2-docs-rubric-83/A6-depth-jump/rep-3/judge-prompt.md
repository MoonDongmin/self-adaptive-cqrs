당신은 이벤트 소싱 + CQRS 기반 Physical AI 데이터 플랫폼의 시니어 아키텍트이자 엄격한 평가자다. LLM 파이프라인이 [자료](로그·이벤트·스키마 정보)를 보고 [Docs]를 생성했다. Docs 는 권고 문서, Read Model 생성 SQL, API 버저닝 세 요소를 항상 함께 담아야 하는 단일 산출물이다. 당신은 [정답 요지]와 [자료], [자동 검증 결과]를 기준으로 Docs 를 네 항목의 루브릭으로 채점한다. 채점은 관대하지 않게, 근거 없는 주장·지어낸 값·의도와 다른 SQL·서로 어긋나는 절에는 낮은 점수를 준다. 반드시 JSON 객체 하나만 출력한다. 설명문·마크다운 펜스는 출력하지 않는다.

---

[시나리오] A6-depth-jump
[상황] 운영 중 센서 관찰기가 파지 센서 값 이상 에피소드를 감지했다.
[정답 요지] 같은 장면 안에서 시도 01(정상)→02(이상)의 평균 파지 깊이가 급변(Δ>0.10m). 값 자체는 분포 안이라 물리/정합성 검사에는 안 걸림. 조치: 장면 내 시도 간 깊이 변화량을 계산·플래그하는 Read Model(v2), v1 무손상.

[자료] — Docs 생성 시 파이프라인이 받은 로그·이벤트·스키마 정보
<<<자료 시작>>>
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
<<<자료 끝>>>

[자동 검증 결과] — 실제 데이터베이스 실행·컴파일 결과. 실행 가능성 판단의 실측 근거로 삼는다.
- 문서 검사: 전 항목 통과
- SQL 실행: 블록 4개 중 3개 실행 성공 / 실패 1개: type "doubleprecision" does not exist
- 코드 컴파일: 파일 4개 중 4개 통과

[Docs] — 채점 대상 문서 전문
<<<Docs 시작>>>
---
docId: dq-반려동물용품_CR01_강아지공룡알장난감_02010
generatedAt: 2026-08-11T23:52:25.264Z
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

> 결론(TL;DR): `read_grip_result`을(를) 재생성한다 — 동장 scene(반려동물용품_CR01_강아지공룡알장난감_02010) 내 attempt 1→2 간 grip3dPoseZ 평균이 0.060m → 0.170m로 Δ=0.110m가 급변 규칙(임계 0.10m)을 초과. (이상 유형: Sensor Baseline Deviation (Sudden Jump within Scene) · 심각도: warning)

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

> 동장 scene 내 attempt 간 grip3dPoseZ 평균이 0.110m 급변을 초과로, 동정성 규칙 위반으로 이상 판정.

### 심각도 — warning

오염 컬럼은 grip3dPose JSONB 단일 차원, 영향 행수는 동장 stream 내 2개 attempt 간 이산 점프, event_store 원본 보존으로 재투영 플래그/재계산 적용 시 downstream read_grip_result_v2 호환성 복 가능.

### 기대-실측 델타 근거

- (반려동물용품_CR01_강아지공룡알장난감_02010#2, `grip3dPose` / grip3dPose) 관측 `"z1":0.17621591822239369,"z2":0.1773858103729328,"z3":0.18110208907802963,"z4":0.17993219692749052,"z5":0.1588979109219704,"z6":0.1600678030725095,"z7":0.16378408177760634,"z8":0.16261418962706722` vs 기준 `suddenJump_withinScene` 같은 sceneKey 안에서 직전 레코드 대비 grip3dPoseZ 평균 Δ <= 0.10 m (코퍼스 실측 연속 attempt 간 최대 0.043 m). → 델타 Δ=0.110m (attempt 1→2) · 동장 scene 내 동동 object('강아지공룡알장난감') attempt 간 Z 평균이 0.110m 급변으로, 물리적 연속성 규칙 위반.

### 관찰

- 동장 scene 반려동물용품_CR01_강아지공룡알장난감_02010 내 attempt 1→2 간 grip3dPoseZ 평균이 0.060m → 0.170m로 Δ=0.110m 급변.
- 동장 scene 동동 object('강아지공룡알장난감') 기준, 물리적 연속성 규칙(suddenJump_withinScene) 임계 0.10m 초과 판정.
- GripResultProjector.map() 만 구조적 Zod 검증 수행, semantic/physical continuity 검건 누락.

### 영향 범위

- event_store → grip-result-projector → read_grip_result(grip_3d_pose jsonb) → catch-up.runner.ts → downstream consumers (read_grip_result_v2 aggregations, projection.controller endpoints)

### 근본원인 — projectionOrPipelineFault

1. 관측 증상: 동장 scene attempt 간 grip3dPoseZ 평균이 0.110m 급변.
2. 시스템적 원1: 투영 파이프라인이 physical continuity 규칙(suddenJump_withinScene) 미적 적용.
3. 시스템적 원2: GripResultProjector.map() 만 구조적 Zod(toyDataSchema) 검증 수행, 의미적 값 오류 검건 누락.
4. 시스템적 원3: checkIntegrity() 미구현 또는 jump threshold 로직 미삽입.
5. 영향 전파: read_grip_result raw JSON 저장 시, downstream v2 avg aggregations 및 플래그 로직이 오염값 전승.

### 의사결정 기준

- 데이터 보존 vs 격리 우선도
- 구 수정 범위(프로젝터 로직 vs DB 스키마)
- downstream 호환성(read_grip_result_v2 설계 채택)
- event_store 재투영 복구 가능성

### 해결책 옵션 (contain → fix → harden)

#### [contain] 오염 행 격리
- 접근: DELETE attempt 2 row from read_grip_result, 원본은 event_store 보존으로 재투영 복원 가능.
- 트레이드오프: 증vidence 소실됨, downstream aggregations 누락 발생.
```sql
-- 오염 행 격리: 이상 (scene_key, attempt_num) 행을 Read Model 에서 제거한다.
-- 원본 이벤트는 event_store 에 보존되므로 v2 재투영(무결성 플래그 포함)으로 복원 가능하다.
DELETE FROM read_grip_result WHERE (scene_key, attempt_num) IN (('반려동물용품_CR01_강아지공룡알장난감_02010', 2));
```

#### [fix] Z 평균 계산 및 플래그 적용
- 접근: GripResultProjector.map() 확장으로 Z 평균 산출, read_grip_result_v2 grip_outlier_flag 설정.
- 트레이드오프: 프로젝터 로직 수정 필요, 기존 v1 호환성 유지.
```typescript
const zValues = row.grip3dPose as { z1: number; z2: number; z3: number; z4: number; z5: number; z6: number; z7: number; z8: number };
  const avgZ = (zValues.z1 + zValues.z2 + zValues.z3 + zValues.z4 + zValues.z5 + zValues.z6 + zValues.z7 + zValues.z8) / 8;
  return { ...row, gripOutlierFlag: avgZ > 0.30 || avgZ < 0.01 ? 1 : 0 };
```

#### [harden] 베이스라인 규칙 DB 스키마 추가
- 접근: CREATE TABLE read_grip_result_v2 로 확정 설계 적용, grip_outlier_flag 열 확충.
- 트레이드오프: DB 마이그레이션 실행 필요, 기존 이상 행 미해지.

### 권장
- fix (Z 평균 계산 및 플래그 적용)
- 사유: 확정 설계(read_grip_result_v2) 채택 전제로, Z 평균 산출 로직을 프로젝트터에 삽입하여 downstream aggregations 호환성 확보.
- 수용하는 트레이드오프: 수행 accept minor projector refactor & migration run cost.
- 기각한 대안:
  - contain: 데이터 보존 vs 격리 우선도에서 증거 소실됨, downstream aggregations 누락 발생.
  - harden: 구 수정 범위(프로젝터 로직 vs DB 스키마)에서 DB 확충만 미해지, 기존 이상 행 jump 미적 적용.

### 즉시 격리 SQL

```sql
-- 오염 행 격리: 이상 (scene_key, attempt_num) 행을 Read Model 에서 제거한다.
-- 원본 이벤트는 event_store 에 보존되므로 v2 재투영(무결성 플래그 포함)으로 복원 가능하다.
DELETE FROM read_grip_result WHERE (scene_key, attempt_num) IN (('반려동물용품_CR01_강아지공룡알장난감_02010', 2));
```

### 하드닝(베이스라인 추가 규칙)

rule: suddenJump_withinScene expected: 같은 sceneKey 안에서 직전 레코드 대비 grip3dPoseZ 평균 Δ <= 0.10 m

### 다음 단계

- GripResultProjector.map() Z 평균 산출 및 플래그 로직 삽입 (`src/projection/projector/grip-result.projector.ts`) — method extension (10 lines), projector_maintainer
- read_grip_result_v2 migration 실행 및 schema export sync (`src/shared/database/schema/service/read-grip-result-v2.ts`) — migration apply (1 table), db_schema_maintainer
- catch-up.runner.ts v2 projection pipeline 등록 (`src/projection/runner/catch-up.runner.ts`) — pipeline config (1 runner), projection_pipeline_maintainer

## 2. Read Model 생성 SQL (Read Model DDL)

> 실행 게이트: 아래 변경은 인간 승인 후에만 적용한다 (human-in-the-loop).

- 대상: `read_grip_result_v2` · 키: scene_key, attempt_num · 원천 이벤트: GripAttemptRecorded

```sql
CREATE TABLE read_grip_result_v2 (
  scene_key varchar NOT NULL,
  attempt_num smallint NOT NULL,
  object_name varchar,
  grip_succeed smallint,
  occurred_at timestamp,
  stream_id varchar,
  global_seq bigint,
  grip3d_pose_z_avg doublePrecision,
  grip_outlier_flag smallint,
  PRIMARY KEY (scene_key, attempt_num)
);
```

### 필드

```mschema
# Table: read_grip_result_v2
[
(scene_key:varchar, 장면 식별 키, Primary Key),
(attempt_num:smallint, 시도 번호, Primary Key),
(object_name:varchar, 객체명),
(grip_succeed:smallint, 성공 여부),
(occurred_at:timestamp, 촬영 일자),
(stream_id:varchar, 스트림 ID),
(global_seq:bigint, 전역 시퀀스),
(grip3d_pose_z_avg:doublePrecision, 8개 Z 좌표 평균 (m)),
(grip_outlier_flag:smallint, Z 평균 이상 플래그 (1=위반, 0=정상))
]
```

### 투영 매핑 명세 (이벤트 → 컬럼)

> upsert 키: scene_key, attempt_num · 리플레이: 프로젝터 초기화 시 projection_cursor=0 설정. 재투영(Catch-up) 시 반드시 upsert 전제(idempotent update) 적용하여 동일 scene_key/attempt_num 기존 상태 덮어쓰기 보장.

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
- `grip3d_pose_z_avg` ← (grip3dPose.z1 + ... + grip3dPose.z8) / 8
- `grip_outlier_flag` ← 1 if |current_grip3d_pose_z_avg - prev_scene_attempt_z_avg| > 0.10 else 0

### Insight 카드 등록 (Insight Read DB 동기화)

> DDL 적용 시 아래 카드 등록도 함께 실행한다 — 다음 분석부터 신규 Read Model 이 LLM 컨텍스트에 노출된다.

```sql
INSERT INTO insight_entity (entity_name, kind, purpose, key_columns)
VALUES ('read_grip_result_v2', 'read_model', 'Per-attempt 3D pose Z-axis average and baseline deviation flag to detect sudden vertical jumps within scenes, supplementing structural validation in read_grip_result.', 'scene_key, attempt_num')
ON CONFLICT (entity_name) DO UPDATE SET purpose = EXCLUDED.purpose, key_columns = EXCLUDED.key_columns;

INSERT INTO insight_field (entity_name, field_name, data_type, meaning, display_order)
VALUES
  ('read_grip_result_v2', 'scene_key', 'varchar', '장면 식별 키', 1),
  ('read_grip_result_v2', 'attempt_num', 'smallint', '시도 번호', 2),
  ('read_grip_result_v2', 'object_name', 'varchar', '객체명', 3),
  ('read_grip_result_v2', 'grip_succeed', 'smallint', '성공 여부', 4),
  ('read_grip_result_v2', 'occurred_at', 'timestamp', '촬영 일자', 5),
  ('read_grip_result_v2', 'stream_id', 'varchar', '스트림 ID', 6),
  ('read_grip_result_v2', 'global_seq', 'bigint', '전역 시퀀스', 7),
  ('read_grip_result_v2', 'grip3d_pose_z_avg', 'doublePrecision', '8개 Z 좌표 평균 (m)', 8),
  ('read_grip_result_v2', 'grip_outlier_flag', 'smallint', 'Z 평균 이상 플래그 (1=위반, 0=정상)', 9)
ON CONFLICT (entity_name, field_name) DO UPDATE SET data_type = EXCLUDED.data_type, meaning = EXCLUDED.meaning, display_order = EXCLUDED.display_order;
```

## 3. API Versioning

> 실행 게이트: 아래 변경은 인간 승인 후에만 적용한다 (human-in-the-loop).

### Unreleased (v1 → v2)

#### Added
- 신규 Read Model 테이블 read_grip_result_v2 (grip3d_pose_z_avg, grip_outlier_flag)
- 신규 Projector GripResultV2Projector
- 신라우트 /projection/grip-result-v2

### 마이그레이션 절차

- 하위호환 변경: 기존 read_grip_result 테이블·프로젝터·라우트는 무손상 유지. v1과 v2 동시 운영 가능.; 신규 컬럼 grip3d_pose_z_avg, grip_outlier_flag는 optional fallback 시 null 허용(DDL 매핑은 varchar/smallint).
- 파괴적 변경: 없음
- 컷오버 전 테스트: 1. v1 catchUpGripResult 실행 전수 검증: objects[0] class_name 일치, grip_succeed 0/1, streamId prefix 'grip-attempt:' 제거 매칭.
2. v2 catchUpGripResultV2 실행 전수 검증: Z-avg 산출(8개 z1..z8) 범위 [0.01, 0.30]m, grip_outlier_flag 초기 0.
3. 동시 투영 비교: scene_key/attempt_num 키 충돌 발생 시 v1 vs v2 row count 일치.
- 롤백 창/조건: 조건: cutover 전 v2 integrity 검증 실패 또는 DB migration 실패.
행동: DROP TABLE read_grip_result_v2; DI wiring GripResultV2Projector 제거; 라우트 /grip-result-v2 주석 처리. v1 라우트 /grip-result 재개시.
- Insight 카드 등록: §2의 카드 등록 SQL을 DDL과 함께 적용(카탈로그 동기화)

### 사유·호환성

- 사유: 기존 v1 Read Model은 구조적 zod 검증만 수행하며 semantic/physical continuity(Z축 점프 규칙)를 누락한다[corr:R6]. v1 코드는 payload.objects[0]만 참조해 다중 객체 scene을 지원하지, Z-avg 산출 및 이상 플래그 저장이 불가능하다. 신규 v2 테이블은 grip3d_pose_z_avg와 grip_outlier_flag 컬럼을 도입하여 sensor baseline deviation(Sudden Jump within Scene)를 직접적으로 관측·검증할 수 있도록 설계한다.
- 트리거 근거: [윈도우 1] R6 suddenJump_withinScene: 같은 scene 연속 attempt 간 z평균 0.060 → 0.170, Δ=0.110 > 0.10 m / [2차 지목] R6 suddenJump_withinScene: 같은 scene 연속 attempt 간 z평균 0.069 → 0.179, Δ=0.110 > 0.10 m
- v1 호환성: 기존 read_grip_result 테이블·프로젝터·라우트(/grip-result)는 무손상 유지. 신규 v2 테이블·프로젝터·라우트(/grip-result-v2)는 동시 운영. cutover 전 v1 데이터 integrity를 검증, cutover 후 v2 라우트로 전환. DI wiring은 추가만 수행, 기존 주입/메서드 호출은 보존.

### 변경 파일

- `src/shared/database/schema/index.ts` (modifyFile) — 신규 v2 스키마 export 추가. 기존 export는 보존.
- `src/projection/projection.service.ts` (modifyFile) — 신규 v2 Projector 주입 및 catchUpGripResultV2 메서드 추가. 기존 v1 메서드는 보존.
- `src/projection/projection.controller.ts` (modifyFile) — 신규 v2 라우트 /grip-result-v2 추가. 기존 v1 라우트는 보존.

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
    gripSucceed: smallint("grip_succeed").notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),

    streamId: varchar("stream_id").notNull(),
    globalSeq: bigint("global_seq", { mode: "number" }).notNull(),

    grip3dPoseZAvg: doublePrecision("grip3d_pose_z_avg"),
    gripOutlierFlag: smallint("grip_outlier_flag"),
  },
  (t) => [
    primaryKey({ columns: [t.sceneKey, t.attemptNum] }),
    index("idx_grip_result_v2_occurred_at").on(t.occurredAt),
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

    const pose = payload.grip_data.grip_3d_pose;
    const zValues: number[] = [pose.z1, pose.z2, pose.z3, pose.z4, pose.z5, pose.z6, pose.z7, pose.z8];
    const avgZ: number = zValues.reduce((sum, v) => sum + v, 0) / zValues.length;

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
      occurredAt: event.occurredAt,
      streamId: event.streamId,
      globalSeq: event.globalSeq,
      grip3dPoseZAvg: avgZ,
      gripOutlierFlag: 0,
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
          occurredAt: row.occurredAt,
          streamId: row.streamId,
          globalSeq: row.globalSeq,
          grip3dPoseZAvg: row.grip3dPoseZAvg,
          gripOutlierFlag: row.gripOutlierFlag,
        },
      });
  }
}
```

### 신규 Read Model — 배선(컨트롤러/서비스/모듈)

```ts
// src/shared/database/schema/index.ts
export * from "./service/read-grip-result-v2";

// src/projection/projection.service.ts (snippet)
constructor(
  private readonly logger: PinoLogger,
  private readonly runner: CatchUpRunner,
  private readonly multimodal: MultiModalProjector,
  private readonly gripResult: GripResultProjector,
  private readonly gripResultV2: GripResultV2Projector, // 신규 주입
  private readonly insertService: InsertService,
) {
  this.logger.setContext(ProjectionService.name);
}

catchUpGripResultV2(): Promise<ProjectionResult> {
  return this.runner.run(this.gripResultV2);
}

// src/projection/projection.controller.ts (snippet)
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

// src/projection/projection.module.ts (snippet)
@Module({
  imports: [...],
  providers: [
    GripResultProjector,
    MultiModalProjector,
    GripResultV2Projector, // 신규 등록
  ],
})
export class ProjectionModule {}

/* 주석: CatchUpRunner 커서 리셋 0으로 강제 전체 재투영 */
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
export * from "./service/read-multimodal";
export * from "./service/read-grip-result-v2";
```

### 버전 교체 코드 — `src/projection/projection.service.ts` (modifyFile)

```typescript
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

    this.logger.info({ action: LogAction.PROJECTION_DONE }, "전체 투영 완료");

    return { multimodal, gripResult };
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
      "projection 요청 수신",
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
<<<Docs 끝>>>

[채점 루브릭] 각 항목 1~5 정수
- groundedness (근거 충실성): Docs 가 인용한 값·필드·장면 번호·로그가 [자료]에 실제로 있는가. 5=인용된 값·필드·장면이 모두 자료에 실재. 3=핵심 근거는 실재하나 일부 수치·부등호가 원문과 불일치. 1=근거 없는 주장이나 존재하지 않는 값의 인용이 결론을 좌우.
- diagnosisAccuracy (원인 진단 정확성): Docs 의 진단이 [정답 요지]와 일치하는가. 5=정답 원인과 유형·위치(필드, 장면, 처리 단계)까지 일치. 3=유형은 맞으나 위치나 메커니즘이 부정확. 1=오진이거나 원인을 특정하지 못함.
- actionability (실행 가능성): Docs 의 SQL 과 절차를 그대로 따르면 문제가 해결되는가. [자동 검증 결과]를 실측으로 반영하되, 실행이 되더라도 의도와 다른 일을 하는 SQL(조건이 한 건도 맞지 않는 삭제문, 요구한 컬럼이 없는 테이블 등)은 감점한다. 기존 v1 테이블(read_grip_result, read_multimodal, event_store)을 ALTER/DROP 하면 감점. 5=그대로 따르면 해결(실행 성공 + 요구 충족). 3=오탈자·순서 등 소폭 수정 후 해결. 1=따르면 실패하거나 기존 자산이 손상.
- completeness (완결성): 권고 문서, Read Model 생성 SQL, API 버저닝 세 요소가 모두 유효하고 서로 일치하는가(머리말·SQL 의 테이블명·권고 대상·코드가 서로 같은 것을 가리키는가). 5=세 요소가 모두 유효하고 서로 일치. 3=세 요소가 있으나 서로 어긋나거나 항목이 비어 있음. 1=요소 누락 또는 근거 부족 표시.

다음 형식의 JSON 객체 하나만 출력하라:
{"groundedness": 1-5, "diagnosisAccuracy": 1-5, "actionability": 1-5, "completeness": 1-5, "unsupportedClaims": ["자료에 없는 주장 인용 (없으면 빈 배열)"], "rationale": "각 항목 점수 근거를 항목당 1~2문장으로"}
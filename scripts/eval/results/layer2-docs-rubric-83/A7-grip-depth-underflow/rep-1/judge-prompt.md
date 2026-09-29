당신은 이벤트 소싱 + CQRS 기반 Physical AI 데이터 플랫폼의 시니어 아키텍트이자 엄격한 평가자다. LLM 파이프라인이 [자료](로그·이벤트·스키마 정보)를 보고 [Docs]를 생성했다. Docs 는 권고 문서, Read Model 생성 SQL, API 버저닝 세 요소를 항상 함께 담아야 하는 단일 산출물이다. 당신은 [정답 요지]와 [자료], [자동 검증 결과]를 기준으로 Docs 를 네 항목의 루브릭으로 채점한다. 채점은 관대하지 않게, 근거 없는 주장·지어낸 값·의도와 다른 SQL·서로 어긋나는 절에는 낮은 점수를 준다. 반드시 JSON 객체 하나만 출력한다. 설명문·마크다운 펜스는 출력하지 않는다.

---

[시나리오] A7-grip-depth-underflow
[상황] 운영 중 센서 관찰기가 파지 센서 값 이상 에피소드를 감지했다.
[정답 요지] 파지 성공 맥락인데 파지 깊이 z1~z8 이 전부 0.01m 미만(하한 위반)으로, 성공과 모순되는 정합성 위반. 조치: 최소 깊이·하한 위반 플래그를 가진 Read Model 보강/격리, v1 무손상.

[자료] — Docs 생성 시 파이프라인이 받은 로그·이벤트·스키마 정보
<<<자료 시작>>>
<logging_context>
## 센서 이상 배치 (관찰자 1차 판정 — 검증 전 가설)
> 사유: [윈도우 1] R5 poseConsistency: s=1 성공인데 robotTfTranslation z=1.038 은 워크스페이스 [0.95, 1.15] m 범위 안이지만, grip3dPose z 최솟값 0.008 m 이 물리 하한 0.01 m 보다 작아 잡을 수 없는 깊이 / R5 정합성 위반 / [2차 지목] R2 depthPositive: 반려동물용품_CR01_강아지공룡알장난감_02018#1 에서 minz=0.008 ≤ 0.01 (물리적으로 불가능한 극단적 얕은 깊이) / R5 poseConsistency: 반려동물용품_CR01_강아지공룡알장난감_02018#1 에서 s=1 성공인데 tz=1.038 이 워크스페이스 하한 0.95 보다 낮음 (1.038 < 0.95) / R5 poseConsistency: 반려동물용품_CR01_강아지공룡알장난감_02019#1 에서 s=1 성공인데 tz=1.038 이 워크스페이스 하한 0.95 보다 낮음 (1.038 < 0.95)
> 의심 sceneKey: 반려동물용품_CR01_강아지공룡알장난감_02018, 반려동물용품_CR01_강아지공룡알장난감_02019
> 위 사유는 소형 1차 관찰자의 출력이라 인용 수치·부등호가 부정확할 수 있는 **가설**이다.
> 근거로 쓸 관측값·부등호는 반드시 아래 원시 레코드에서 재확인해 원문 그대로 인용하고,
> 원시 레코드에서 재확인되지 않는 1차 사유는 기각해라.

### 투영된 센서 값 (JSON 한 줄당 한 레코드)
```json
{"sceneKey":"반려동물용품_CR01_강아지공룡알장난감_00226","attemptNumber":1,"streamId":"grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00226","globalSequence":25,"occurredAt":"2023-09-23T00:00:00.000Z","objectName":"강아지공룡알장난감","gripSucceed":0,"grip2dPose":{"xl":784.822,"xr":700.891,"yl":741.938,"yr":630.937},"grip3dPose":{"x1":-0.199450014791367,"x2":-0.28640285211019534,"x3":-0.2656118311615029,"x4":-0.17865899384267456,"x5":-0.18996650077633348,"x6":-0.2769193380951618,"x7":-0.25612831714646933,"x8":-0.16917547982764103,"y1":0.5371453145659518,"y2":0.6461534381514451,"y3":0.6630953288256005,"y4":0.5540872052401072,"y5":0.5373319555750138,"y6":0.6463400791605071,"y7":0.6632819698346625,"y8":0.5542738462491692,"z1":0.14888378212413161,"z2":0.1363764612849113,"z3":0.1394918727017228,"z4":0.1519991935409431,"z5":0.08457959775747938,"z6":0.07207227691825906,"z7":0.07518768833507057,"z8":0.08769500917429089},"robotTf":{"rotation_3x3":[0.999992,0.003878,-0.000419,0.003871,-0.999845,-0.017179,-0.000485,0.017177,-0.999852],"translation_3x1":[-0.011986,0.750103,1.02053]},"humanAnnotationGrasp":[{"annotation_type":"keypoint","id":11,"annotation_points":[672.4345935848123,684.1255949352643,2,667.8582107161069,807.9573634810615,2],"num_keypoints":2}]}
{"sceneKey":"반려동물용품_CR01_강아지공룡알장난감_02018","attemptNumber":1,"streamId":"grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02018","globalSequence":26,"occurredAt":"2023-09-23T00:00:00.000Z","objectName":"강아지공룡알장난감","gripSucceed":1,"grip2dPose":{"xl":951.079,"xr":1098.33,"yl":807.832,"yr":813.644},"grip3dPose":{"x1":0.16475296398674474,"x2":0.17330658103438495,"x3":0.19772017225257327,"x4":0.18916655520493306,"x5":0.19222857061573467,"x6":0.20078218766337488,"x7":0.2251957788815632,"x8":0.21664216183392299,"y1":0.8156262802722475,"y2":0.9551216936901339,"y3":0.9529558077348521,"y4":0.8134603943169657,"y5":0.8174187515339728,"y6":0.9569141649518592,"y7":0.9547482789965774,"y8":0.815252865578691,"z1":0.008231681976014742,"z2":0.008643583878096137,"z3":0.0092098998275888,"z4":0.008797997925507405,"z5":0.005287671918650429,"z6":0.005699573820731824,"z7":0.006265889770224487,"z8":0.005853987868143092},"robotTf":{"rotation_3x3":[0.014497,0.909648,-0.415128,0.999887,-0.011494,0.009732,0.004081,-0.415222,-0.909711],"translation_3x1":[0.327688,0.821407,1.03805]},"humanAnnotationGrasp":[{"annotation_type":"keypoint","id":11,"annotation_points":[1029.6659401614954,798.8841194965165,2,1034.7114781433231,932.4941213334656,2],"num_keypoints":2}]}
⚠ consistency [반려동물용품_CR01_강아지공룡알장난감_02018#1] gripSucceed=1(성공)인데 grip3dPoseZ(z1)=0.008231681976014742 파지 가능 깊이 [0.01, 0.3]m 밖 — 닿지 않는 깊이에서 성공은 모순
⚠ consistency [반려동물용품_CR01_강아지공룡알장난감_02018#1] gripSucceed=1(성공)인데 grip3dPoseZ(z2)=0.008643583878096137 파지 가능 깊이 [0.01, 0.3]m 밖 — 닿지 않는 깊이에서 성공은 모순
⚠ consistency [반려동물용품_CR01_강아지공룡알장난감_02018#1] gripSucceed=1(성공)인데 grip3dPoseZ(z3)=0.0092098998275888 파지 가능 깊이 [0.01, 0.3]m 밖 — 닿지 않는 깊이에서 성공은 모순
⚠ consistency [반려동물용품_CR01_강아지공룡알장난감_02018#1] gripSucceed=1(성공)인데 grip3dPoseZ(z4)=0.008797997925507405 파지 가능 깊이 [0.01, 0.3]m 밖 — 닿지 않는 깊이에서 성공은 모순
⚠ consistency [반려동물용품_CR01_강아지공룡알장난감_02018#1] gripSucceed=1(성공)인데 grip3dPoseZ(z5)=0.005287671918650429 파지 가능 깊이 [0.01, 0.3]m 밖 — 닿지 않는 깊이에서 성공은 모순
⚠ consistency [반려동물용품_CR01_강아지공룡알장난감_02018#1] gripSucceed=1(성공)인데 grip3dPoseZ(z6)=0.005699573820731824 파지 가능 깊이 [0.01, 0.3]m 밖 — 닿지 않는 깊이에서 성공은 모순
⚠ consistency [반려동물용품_CR01_강아지공룡알장난감_02018#1] gripSucceed=1(성공)인데 grip3dPoseZ(z7)=0.006265889770224487 파지 가능 깊이 [0.01, 0.3]m 밖 — 닿지 않는 깊이에서 성공은 모순
⚠ consistency [반려동물용품_CR01_강아지공룡알장난감_02018#1] gripSucceed=1(성공)인데 grip3dPoseZ(z8)=0.005853987868143092 파지 가능 깊이 [0.01, 0.3]m 밖 — 닿지 않는 깊이에서 성공은 모순
{"sceneKey":"반려동물용품_CR01_강아지공룡알장난감_02019","attemptNumber":1,"streamId":"grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02019","globalSequence":27,"occurredAt":"2023-09-23T00:00:00.000Z","objectName":"강아지공룡알장난감","gripSucceed":1,"grip2dPose":{"xl":656.657,"xr":801.407,"yl":813.692,"yr":828.131},"grip3dPose":{"x1":0.16896221497528283,"x2":0.1848493909394196,"x3":0.20992890197682607,"x4":0.1940417260126893,"x5":0.19188072131121459,"x6":0.20776789727535136,"x7":0.23284740831275783,"x8":0.21696023234862105,"y1":0.5377019333556028,"y2":0.6766896263186952,"y3":0.6734498983485733,"y4":0.5344622053854808,"y5":0.537479950175437,"y6":0.6764676431385295,"y7":0.6732279151684075,"y8":0.5342402222053151,"z1":0.008564493079812194,"z2":0.008838440358872001,"z3":0.009311521453411343,"z4":0.009037574174351536,"z5":0.005523238079488488,"z6":0.005797185358548294,"z7":0.006270266453087635,"z8":0.0059963191740278286},"robotTf":{"rotation_3x3":[0.014497,0.909648,-0.415128,0.999887,-0.011494,0.009732,0.004081,-0.415222,-0.909711],"translation_3x1":[0.327688,0.821407,1.03805]},"humanAnnotationGrasp":[{"annotation_type":"keypoint","id":11,"annotation_points":[641.0894514521013,863.4502108547322,2,770.6156501152399,873.940681061053,2],"num_keypoints":2}]}
⚠ consistency [반려동물용품_CR01_강아지공룡알장난감_02019#1] gripSucceed=1(성공)인데 grip3dPoseZ(z1)=0.008564493079812194 파지 가능 깊이 [0.01, 0.3]m 밖 — 닿지 않는 깊이에서 성공은 모순
⚠ consistency [반려동물용품_CR01_강아지공룡알장난감_02019#1] gripSucceed=1(성공)인데 grip3dPoseZ(z2)=0.008838440358872001 파지 가능 깊이 [0.01, 0.3]m 밖 — 닿지 않는 깊이에서 성공은 모순
⚠ consistency [반려동물용품_CR01_강아지공룡알장난감_02019#1] gripSucceed=1(성공)인데 grip3dPoseZ(z3)=0.009311521453411343 파지 가능 깊이 [0.01, 0.3]m 밖 — 닿지 않는 깊이에서 성공은 모순
⚠ consistency [반려동물용품_CR01_강아지공룡알장난감_02019#1] gripSucceed=1(성공)인데 grip3dPoseZ(z4)=0.009037574174351536 파지 가능 깊이 [0.01, 0.3]m 밖 — 닿지 않는 깊이에서 성공은 모순
⚠ consistency [반려동물용품_CR01_강아지공룡알장난감_02019#1] gripSucceed=1(성공)인데 grip3dPoseZ(z5)=0.005523238079488488 파지 가능 깊이 [0.01, 0.3]m 밖 — 닿지 않는 깊이에서 성공은 모순
⚠ consistency [반려동물용품_CR01_강아지공룡알장난감_02019#1] gripSucceed=1(성공)인데 grip3dPoseZ(z6)=0.005797185358548294 파지 가능 깊이 [0.01, 0.3]m 밖 — 닿지 않는 깊이에서 성공은 모순
⚠ consistency [반려동물용품_CR01_강아지공룡알장난감_02019#1] gripSucceed=1(성공)인데 grip3dPoseZ(z7)=0.006270266453087635 파지 가능 깊이 [0.01, 0.3]m 밖 — 닿지 않는 깊이에서 성공은 모순
⚠ consistency [반려동물용품_CR01_강아지공룡알장난감_02019#1] gripSucceed=1(성공)인데 grip3dPoseZ(z8)=0.0059963191740278286 파지 가능 깊이 [0.01, 0.3]m 밖 — 닿지 않는 깊이에서 성공은 모순
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
- SQL 실행: 블록 5개 중 5개 실행 성공
- 코드 컴파일: 파일 4개 중 4개 통과

[Docs] — 채점 대상 문서 전문
<<<Docs 시작>>>
---
docId: dq-반려동물용품_CR01_강아지공룡알장난감_02018
generatedAt: 2026-08-10T13:47:39.412Z
targetReadModel: read_grip_result
sqlDialect: postgres
sufficientEvidence: true
apiVersion:
  from: v1
  to: v2
  affectedEndpoints:
    - "POST /multimodal"
    - "POST /grip-result"
    - "POST /v2/grip-result"
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

> 결론(TL;DR): `read_grip_result`을(를) 재생성한다 — gripSucceed=1(성공)인데 grip3dPoseZ(z1~z8)=0.005~0.009m가 물리적 하한 0.01m 미만이 되어 poseConsistency 규칙 위배. (이상 유형: sensor_baseline_deviation · 심각도: warning)

<logging_context>

## 센서 이상 배치 (관찰자 1차 판정 — 검증 전 가설)
> 사유: [윈도우 1] R5 poseConsistency: s=1 성공인데 robotTfTranslation z=1.038 은 워크스페이스 [0.95, 1.15] m 범위 안이지만, grip3dPose z 최솟값 0.008 m 이 물리 하한 0.01 m 보다 작아 잡을 수 없는 깊이 / R5 정합성 위반 / [2차 지목] R2 depthPositive: 반려동물용품_CR01_강아지공룡알장난감_02018#1 에서 minz=0.008 ≤ 0.01 (물리적으로 불가능한 극단적 얕은 깊이) / R5 poseConsistency: 반려동물용품_CR01_강아지공룡알장난감_02018#1 에서 s=1 성공인데 tz=1.038 이 워크스페이스 하한 0.95 보다 낮음 (1.038 < 0.95) / R5 poseConsistency: 반려동물용품_CR01_강아지공룡알장난감_02019#1 에서 s=1 성공인데 tz=1.038 이 워크스페이스 하한 0.95 보다 낮음 (1.038 < 0.95)
> 의심 sceneKey: 반려동물용품_CR01_강아지공룡알장난감_02018, 반려동물용품_CR01_강아지공룡알장난감_02019
> 위 사유는 소형 1차 관찰자의 출력이라 인용 수치·부등호가 부정확할 수 있는 **가설**이다.
> 근거로 쓸 관측값·부등호는 반드시 아래 원시 레코드에서 재확인해 원문 그대로 인용하고,
> 원시 레코드에서 재확인되지 않는 1차 사유는 기각해라.

### 투영된 센서 값 (JSON 한 줄당 한 레코드)
```json
{"sceneKey":"반려동물용품_CR01_강아지공룡알장난감_00226","attemptNumber":1,"streamId":"grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00226","globalSequence":25,"occurredAt":"2023-09-23T00:00:00.000Z","objectName":"강아지공룡알장난감","gripSucceed":0,"grip2dPose":{"xl":784.822,"xr":700.891,"yl":741.938,"yr":630.937},"grip3dPose":{"x1":-0.199450014791367,"x2":-0.28640285211019534,"x3":-0.2656118311615029,"x4":-0.17865899384267456,"x5":-0.18996650077633348,"x6":-0.2769193380951618,"x7":-0.25612831714646933,"x8":-0.16917547982764103,"y1":0.5371453145659518,"y2":0.6461534381514451,"y3":0.6630953288256005,"y4":0.5540872052401072,"y5":0.5373319555750138,"y6":0.6463400791605071,"y7":0.6632819698346625,"y8":0.5542738462491692,"z1":0.14888378212413161,"z2":0.1363764612849113,"z3":0.1394918727017228,"z4":0.1519991935409431,"z5":0.08457959775747938,"z6":0.07207227691825906,"z7":0.07518768833507057,"z8":0.08769500917429089},"robotTf":{"rotation_3x3":[0.999992,0.003878,-0.000419,0.003871,-0.999845,-0.017179,-0.000485,0.017177,-0.999852],"translation_3x1":[-0.011986,0.750103,1.02053]},"humanAnnotationGrasp":[{"annotation_type":"keypoint","id":11,"annotation_points":[672.4345935848123,684.1255949352643,2,667.8582107161069,807.9573634810615,2],"num_keypoints":2}]}
{"sceneKey":"반려동물용품_CR01_강아지공룡알장난감_02018","attemptNumber":1,"streamId":"grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02018","globalSequence":26,"occurredAt":"2023-09-23T00:00:00.000Z","objectName":"강아지공룡알장난감","gripSucceed":1,"grip2dPose":{"xl":951.079,"xr":1098.33,"yl":807.832,"yr":813.644},"grip3dPose":{"x1":0.16475296398674474,"x2":0.17330658103438495,"x3":0.19772017225257327,"x4":0.18916655520493306,"x5":0.19222857061573467,"x6":0.20078218766337488,"x7":0.2251957788815632,"x8":0.21664216183392299,"y1":0.8156262802722475,"y2":0.9551216936901339,"y3":0.9529558077348521,"y4":0.8134603943169657,"y5":0.8174187515339728,"y6":0.9569141649518592,"y7":0.9547482789965774,"y8":0.815252865578691,"z1":0.008231681976014742,"z2":0.008643583878096137,"z3":0.0092098998275888,"z4":0.008797997925507405,"z5":0.005287671918650429,"z6":0.005699573820731824,"z7":0.006265889770224487,"z8":0.005853987868143092},"robotTf":{"rotation_3x3":[0.014497,0.909648,-0.415128,0.999887,-0.011494,0.009732,0.004081,-0.415222,-0.909711],"translation_3x1":[0.327688,0.821407,1.03805]},"humanAnnotationGrasp":[{"annotation_type":"keypoint","id":11,"annotation_points":[1029.6659401614954,798.8841194965165,2,1034.7114781433231,932.4941213334656,2],"num_keypoints":2}]}
⚠ consistency [반려동물용품_CR01_강아지공룡알장난감_02018#1] gripSucceed=1(성공)인데 grip3dPoseZ(z1)=0.008231681976014742 파지 가능 깊이 [0.01, 0.3]m 밖 — 닿지 않는 깊이에서 성공은 모순
⚠ consistency [반려동물용품_CR01_강아지공룡알장난감_02018#1] gripSucceed=1(성공)인데 grip3dPoseZ(z2)=0.008643583878096137 파지 가능 깊이 [0.01, 0.3]m 밖 — 닿지 않는 깊이에서 성공은 모순
⚠ consistency [반려동물용품_CR01_강아지공룡알장난감_02018#1] gripSucceed=1(성공)인데 grip3dPoseZ(z3)=0.0092098998275888 파지 가능 깊이 [0.01, 0.3]m 밖 — 닿지 않는 깊이에서 성공은 모순
⚠ consistency [반려동물용품_CR01_강아지공룡알장난감_02018#1] gripSucceed=1(성공)인데 grip3dPoseZ(z4)=0.008797997925507405 파지 가능 깊이 [0.01, 0.3]m 밖 — 닿지 않는 깊이에서 성공은 모순
⚠ consistency [반려동물용품_CR01_강아지공룡알장난감_02018#1] gripSucceed=1(성공)인데 grip3dPoseZ(z5)=0.005287671918650429 파지 가능 깊이 [0.01, 0.3]m 밖 — 닿지 않는 깊이에서 성공은 모순
⚠ consistency [반려동물용품_CR01_강아지공룡알장난감_02018#1] gripSucceed=1(성공)인데 grip3dPoseZ(z6)=0.005699573820731824 파지 가능 깊이 [0.01, 0.3]m 밖 — 닿지 않는 깊이에서 성공은 모순
⚠ consistency [반려동물용품_CR01_강아지공룡알장난감_02018#1] gripSucceed=1(성공)인데 grip3dPoseZ(z7)=0.006265889770224487 파지 가능 깊이 [0.01, 0.3]m 밖 — 닿지 않는 깊이에서 성공은 모순
⚠ consistency [반려동물용품_CR01_강아지공룡알장난감_02018#1] gripSucceed=1(성공)인데 grip3dPoseZ(z8)=0.005853987868143092 파지 가능 깊이 [0.01, 0.3]m 밖 — 닿지 않는 깊이에서 성공은 모순
{"sceneKey":"반려동물용품_CR01_강아지공룡알장난감_02019","attemptNumber":1,"streamId":"grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02019","globalSequence":27,"occurredAt":"2023-09-23T00:00:00.000Z","objectName":"강아지공룡알장난감","gripSucceed":1,"grip2dPose":{"xl":656.657,"xr":801.407,"yl":813.692,"yr":828.131},"grip3dPose":{"x1":0.16896221497528283,"x2":0.1848493909394196,"x3":0.20992890197682607,"x4":0.1940417260126893,"x5":0.19188072131121459,"x6":0.20776789727535136,"x7":0.23284740831275783,"x8":0.21696023234862105,"y1":0.5377019333556028,"y2":0.6766896263186952,"y3":0.6734498983485733,"y4":0.5344622053854808,"y5":0.537479950175437,"y6":0.6764676431385295,"y7":0.6732279151684075,"y8":0.5342402222053151,"z1":0.008564493079812194,"z2":0.008838440358872001,"z3":0.009311521453411343,"z4":0.009037574174351536,"z5":0.005523238079488488,"z6":0.005797185358548294,"z7":0.006270266453087635,"z8":0.0059963191740278286},"robotTf":{"rotation_3x3":[0.014497,0.909648,-0.415128,0.999887,-0.011494,0.009732,0.004081,-0.415222,-0.909711],"translation_3x1":[0.327688,0.821407,1.03805]},"humanAnnotationGrasp":[{"annotation_type":"keypoint","id":11,"annotation_points":[641.0894514521013,863.4502108547322,2,770.6156501152399,873.940681061053,2],"num_keypoints":2}]}
⚠ consistency [반려동물용품_CR01_강아지공룡알장난감_02019#1] gripSucceed=1(성공)인데 grip3dPoseZ(z1)=0.008564493079812194 파지 가능 깊이 [0.01, 0.3]m 밖 — 닿지 않는 깊이에서 성공은 모순
⚠ consistency [반려동물용품_CR01_강아지공룡알장난감_02019#1] gripSucceed=1(성공)인데 grip3dPoseZ(z2)=0.008838440358872001 파지 가능 깊이 [0.01, 0.3]m 밖 — 닿지 않는 깊이에서 성공은 모순
⚠ consistency [반려동물용품_CR01_강아지공룡알장난감_02019#1] gripSucceed=1(성공)인데 grip3dPoseZ(z3)=0.009311521453411343 파지 가능 깊이 [0.01, 0.3]m 밖 — 닿지 않는 깊이에서 성공은 모순
⚠ consistency [반려동물용품_CR01_강아지공룡알장난감_02019#1] gripSucceed=1(성공)인데 grip3dPoseZ(z4)=0.009037574174351536 파지 가능 깊이 [0.01, 0.3]m 밖 — 닿지 않는 깊이에서 성공은 모순
⚠ consistency [반려동물용품_CR01_강아지공룡알장난감_02019#1] gripSucceed=1(성공)인데 grip3dPoseZ(z5)=0.005523238079488488 파지 가능 깊이 [0.01, 0.3]m 밖 — 닿지 않는 깊이에서 성공은 모순
⚠ consistency [반려동물용품_CR01_강아지공룡알장난감_02019#1] gripSucceed=1(성공)인데 grip3dPoseZ(z6)=0.005797185358548294 파지 가능 깊이 [0.01, 0.3]m 밖 — 닿지 않는 깊이에서 성공은 모순
⚠ consistency [반려동물용품_CR01_강아지공룡알장난감_02019#1] gripSucceed=1(성공)인데 grip3dPoseZ(z7)=0.006270266453087635 파지 가능 깊이 [0.01, 0.3]m 밖 — 닿지 않는 깊이에서 성공은 모순
⚠ consistency [반려동물용품_CR01_강아지공룡알장난감_02019#1] gripSucceed=1(성공)인데 grip3dPoseZ(z8)=0.0059963191740278286 파지 가능 깊이 [0.01, 0.3]m 밖 — 닿지 않는 깊이에서 성공은 모순
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

> gripSucceed=1과 grip3dPoseZ 하한 미만의 z좌표 조합으로 물리적 정합성 위배가 확정되어 경고 등급을 할당한다.

### 심각도 — warning

오염 컬럼은 grip3dPose의 z차원만 치우치며, 영향 행수는 두 장면 시도의 소수에 불과하며, event_store 원천 데이터 보존을 통해 재투영으로 정상 범위 복장이 가능하므로 델타 크기 단독으로는 critical를 기각한다.

### 기대-실측 델타 근거

- (반려동물용품_CR01_강아지공룡알장난감_02018#1, `grip3dPose` / grip3dPose) 관측 `gripSucceed=1(성공)인데 grip3dPoseZ(z1)=0.008231681976014742` vs 기준 `rule: gripSucceed_poseConsistency` expected: grip_succeed=1(성공) 이면 robotTfTranslation 이 workspace 범위 안, grip3dPoseZ 가 [0.01, 0.30] m 안이어야 한다. → 델타 -0.001768 m (미만 하한 0.01) · 성공 판정(1)과 물리적 하한 미만의 z좌표 조합으로 grasp consistency 위배.
- (반려동물용품_CR01_강아지공룡알장난감_02019#1, `grip3dPose` / grip3dPose) 관측 `gripSucceed=1(성공)인데 grip3dPoseZ(z1)=0.008564493079812194` vs 기준 `rule: gripSucceed_poseConsistency` expected: grip_succeed=1(성공) 이면 robotTfTranslation 이 workspace 범위 안, grip3dPoseZ 가 [0.01, 0.30] m 안이어야 한다. → 델타 -0.001436 m (미만 하한 0.01) · 성공 판정(1)과 물리적 하한 미만의 z좌표 조합으로 grasp consistency 위배.

### 관찰

- 장면 02018 시도 1에서 gripSucceed=1이면서 z1=0.008231681976014742로 하한 0.01m 미만이 되어 정합성 위배.
- 장면 02019 시도 1에서 gripSucceed=1이면서 z1=0.008564493079812194로 하한 0.01m 미만이 되어 정합성 위배.

### 영향 범위

- event_store
- grip-result-projector
- read_grip_result(grip_3d_pose)
- catch-up.runner.ts
- projection.controller.ts

### 근본원인 — projectionOrPipelineFault

1. 왜 z좌표가 하한 미만이 발생? -> 투영 로직이 원천 payload의 z값을 그대로 복사만 할 뿐, 물리적 깊이 검증은 건너뛴다.
2. 왜 물리적 검증이 건너뛴? -> GripResultProjector의 checkIntegrity 훅이 미구현되어 정합성 검사 파이프가 뚤다.
3. 왜 미구현? -> 초기 Read Model 설계가 구조적 Zod 키 존재만 체크로 우선화, 의미적 값 오류는 하류 관찰자로 위양을 설정했다.
4. 왜 하류 관찰자 위양? -> DB 스키마 변경과 투영 로직 수정이 배포 파이프에 부담스러워, 점진적 고도 전략으로 채택했다.
5. 왜 LLM 판정 부재? -> catch-up.runner.ts가 sensorValueMessage 발행만 수행할 뿐, DB-level 필터링이나 integrity 훅 호출이 누락되어 구조적 zod만 존재하는 상태가 노출된다.

### 의사결정 기준

- 데이터 정밀도 보존 versus 고장성 판정
- 구현 파이프 수정 비용 versus 유지보수 가독
- 소스 레벨 정합성 적용 versus 하류 로직 필터링
- 확정 Read Model v2 설계 호환 versus 기존 v1 스키마 연명

### 해결책 옵션 (contain → fix → harden)

#### [contain] 오염 행 격리
- 접근: event_store 원천 보존을 전제로, read_grip_result의 오염 시도 행을 DELETE로 격리하여 하류 파이프 차단.
- 트레이드오프: 원천 데이터는 event_store에 그대로 남기며 재투영으로 복장이 가능하나, 현재 투영된 Read Model 테이블의 일관성이 일시 단절된다.
```sql
-- 오염 행 격리: 이상 (scene_key, attempt_num) 행을 Read Model 에서 제거한다.
-- 원본 이벤트는 event_store 에 보존되므로 v2 재투영(무결성 플래그 포함)으로 복원 가능하다.
DELETE FROM read_grip_result WHERE (scene_key, attempt_num) IN (('반려동물용품_CR01_강아지공룡알장난감_02018', 1), ('반려동물용품_CR01_강아지공룡알장난감_02019', 1));
```

#### [fix] 정합성 훅 주입
- 접근: GripResultProjector에 checkIntegrity 훅을 구현하여 gripSucceed_poseConsistency 위배 시 IntegrityViolation 객체 방출.
- 트레이드오프: 기존 투영 파이프 호환이 최소하나, CatchUpRunner의 이상 로그 파이프가 활성화되어 downstream 판정 로직이 필요해진다.
```typescript
checkIntegrity(row: ReadGripResultInsert, event: EventStoreEventRow): IntegrityViolation[] {
  const violations: IntegrityViolation[] = [];
  if (row.gripSucceed !== 1) return violations;
  const zValues = row.grip3dPose as Record<string, number>;
  for (const key of ['z1','z2','z3','z4','z5','z6','z7','z8']) {
    if (zValues[key] !== undefined && zValues[key] < 0.01) {
      violations.push({
        readModelName: 'read_grip_result',
        sceneKey: row.sceneKey,
        attemptNum: row.attemptNum,
        streamId: row.streamId,
        globalSeq: row.globalSeq,
        ruleName: 'gripSucceed_poseConsistency',
        affectedColumns: ['grip3dPose'],
        observedValue: `${key}=${zValues[key]}`,
        expected: '[0.01, 0.30] m',
        detail: `gripSucceed=1인데 ${key}=${zValues[key]}가 물리적 하한 미만이 되어 정합성 위배.`
      });
    }
  }
  return violations;
}
```

#### [harden] 베이스라인 규칙 고도화
- 접근: read_grip_result_v2 테이블에 CHECK 제약으로 z1~z8 하한 미만 시 적재 실패를 강제하여 DB-level 정합성 확립.
- 트레이드오프: 기존 v1 파이프가 호환이 하나, 신규 데이터 적재 실패로 upstream retry 로직이 필요하나 원천 증거는 DB에 영구히 보존된다.
```sql
-- 선행 조건: §2 'Read Model 생성 SQL'(DDL)을 먼저 적용한 뒤 실행한다.
ALTER TABLE read_grip_result_v2 ADD CONSTRAINT check_grip3dpose_z_lower_bound CHECK ((grip_3d_pose->>'z1')::numeric >= 0.01 AND (grip_3d_pose->>'z2')::numeric >= 0.01 AND (grip_3d_pose->>'z3')::numeric >= 0.01 AND (grip_3d_pose->>'z4')::numeric >= 0.01 AND (grip_3d_pose->>'z5')::numeric >= 0.01 AND (grip_3d_pose->>'z6')::numeric >= 0.01 AND (grip_3d_pose->>'z7')::numeric >= 0.01 AND (grip_3d_pose->>'z8')::numeric >= 0.01);
```

### 권장
- harden: read_grip_result_v2 CHECK 제약 채택
- 사유: 확정 Read Model v2 설계를 전제로 DB-level 정합성 확립이 가장 견고한 고장성 파이프이나, 기존 v1 스키마 연명으로는 downstream 호환 가독이 커다.
- 수용하는 트레이드오프: 신규 적재 실패로 upstream retry 로직이 필요하나 원천 증거는 DB에 영구히 보존되며 재투영으로 복장이 명확하다.
- 기각한 대안:
  - contain은 v2 설계 채택과 상호되어 자기모순 문서가 되며
  - fix는 TypeScript 훅만으로는 DB-level 정합성 확립이 모자라 v1 스키마 연명 호환이 불가

### 즉시 격리 SQL

```sql
-- 오염 행 격리: 이상 (scene_key, attempt_num) 행을 Read Model 에서 제거한다.
-- 원본 이벤트는 event_store 에 보존되므로 v2 재투영(무결성 플래그 포함)으로 복원 가능하다.
DELETE FROM read_grip_result WHERE (scene_key, attempt_num) IN (('반려동물용품_CR01_강아지공룡알장난감_02018', 1), ('반려동물용품_CR01_강아지공룡알장난감_02019', 1));
```

### 하드닝(베이스라인 추가 규칙)

rule: grip3dPoseZ_physicalLowerBound expected: [0.01, 0.30] m

### 다음 단계

- GripResultProjector checkIntegrity 훅 주입 및 IntegrityViolation 방출 로직 연명 (`src/projection/projector/grip-result.projector.ts`) — method-level, projection-engineer
- read_grip_result_v2 migrationSql 적용 및 CHECK 제약 검증 (`src/shared/database/schema/service/read-grip-result-v2.ts`) — schema-level, db-migrator
- CatchUpRunner sensorValueMessage 파이프 연명 및 IntegrityViolation 이상 로그 연명 (`src/projection/runner/catch-up.runner.ts`) — pipeline-level, catchup-operator

## 2. Read Model 생성 SQL (Read Model DDL)

> 실행 게이트: 아래 변경은 인간 승인 후에만 적용한다 (human-in-the-loop).

- 대상: `read_grip_result_v2` · 키: (scene_key, attempt_num) · 원천 이벤트: GripAttemptRecorded

```sql
CREATE TABLE read_grip_result_v2 (
  scene_key varchar NOT NULL,
  attempt_num smallint NOT NULL,
  object_name varchar,
  grip_succeed smallint,
  occurred_at timestamptz,
  gripper_type varchar(16),
  grip_2d_pose jsonb,
  grip_3d_pose jsonb,
  robot_tf jsonb,
  human_annotation_grasp jsonb,
  stream_id varchar,
  global_seq bigint,
  grip_outlier_flag smallint,
  PRIMARY KEY (scene_key, attempt_num)
);
```

### 필드

```mschema
# Table: read_grip_result_v2
[
(scene_key:varchar, 장면 식별 키 = stream_id 제거 prefix, Primary Key),
(attempt_num:smallint, 동동적 장면 내 파지 시도 번호, Primary Key),
(object_name:varchar, 파지 대상 객체명 (payload.objects[0].class_name)),
(grip_succeed:smallint, 파지 성공 여부 (0=실패, 1=성공)),
(occurred_at:timestamptz, 데이터 촬영 일자),
(gripper_type:varchar(16), 그리퍼 종류 (finger/suction)),
(grip_2d_pose:jsonb, 2D 파지점),
(grip_3d_pose:jsonb, 3D 파지점 (z1~z8)),
(robot_tf:jsonb, 로봇 변환행렬),
(human_annotation_grasp:jsonb, 휴먼 어노테이션 파지 영역),
(stream_id:varchar, ES 스트림 ID),
(global_seq:bigint, 투영 출처 이벤트의 ES 전역 시퀀스),
(grip_outlier_flag:smallint, z1~z8 하한(0.01m) 위배 플래그 (1=위배, 0=정상). 투영 시 계수.)
]
```

### 투영 매핑 명세 (이벤트 → 컬럼)

> upsert 키: (scene_key, attempt_num) · 리플레이: projection_cursor 초기화 시 stream_id 기준 정렬 필수. catch-up 전체 재투영은 upsert 전제(멱identiy)로 grip_outlier_flag 재계산 및 scene_key/attempt_num 키 일치 확인.

| 원천 이벤트 | payload 필드 | 컬럼 | 변환 |
| --- | --- | --- | --- |
| GripAttemptRecorded | attemptNumber | attempt_num | verbatim |
| GripAttemptRecorded | objectName | object_name | verbatim |
| GripAttemptRecorded | gripSucceed | grip_succeed | number to smallint |
| GripAttemptRecorded | occurredAt | occurred_at | verbatim ISO string |
| GripAttemptRecorded | grip2dPose | grip_2d_pose | verbatim JSON object |
| GripAttemptRecorded | grip3dPose | grip_3d_pose | verbatim JSON object |
| GripAttemptRecorded | robotTf | robot_tf | verbatim JSON object |
| GripAttemptRecorded | humanAnnotationGrasp | human_annotation_grasp | verbatim JSON array |
| GripAttemptRecorded | streamId | stream_id | verbatim |
| GripAttemptRecorded | globalSequence | global_seq | verbatim bigint |

파생 컬럼(이벤트 payload 아님):
- `scene_key` ← streamId prefix 'grip-attempt:' 제거
- `gripper_type` ← constant 'finger' (고정형 그리퍼)
- `grip_outlier_flag` ← 1 if min(z1..z8) < 0.01 else 0

### Insight 카드 등록 (Insight Read DB 동기화)

> DDL 적용 시 아래 카드 등록도 함께 실행한다 — 다음 분석부터 신규 Read Model 이 LLM 컨텍스트에 노출된다.

```sql
INSERT INTO insight_entity (entity_name, kind, purpose, key_columns)
VALUES ('read_grip_result_v2', 'read_model', '장면별 로봇 파지 결과 조회와 센서 기저편만 치 편차 플래그 동동적 적재. 기존 read_grip_result의 JSONb 컬럼만 원시 값 저장이지만, 본 모델은 투영 시 z1~z8 하한(0.01m) 위배를 계산해 grip_outlier_flag 열에 상수 1/0 적재하여 SQL WHERE 필터링만으로는 이상 로그 추적 가능.', '(scene_key, attempt_num)')
ON CONFLICT (entity_name) DO UPDATE SET purpose = EXCLUDED.purpose, key_columns = EXCLUDED.key_columns;

INSERT INTO insight_field (entity_name, field_name, data_type, meaning, display_order)
VALUES
  ('read_grip_result_v2', 'scene_key', 'varchar', '장면 식별 키 = stream_id 제거 prefix', 1),
  ('read_grip_result_v2', 'attempt_num', 'smallint', '동동적 장면 내 파지 시도 번호', 2),
  ('read_grip_result_v2', 'object_name', 'varchar', '파지 대상 객체명 (payload.objects[0].class_name)', 3),
  ('read_grip_result_v2', 'grip_succeed', 'smallint', '파지 성공 여부 (0=실패, 1=성공)', 4),
  ('read_grip_result_v2', 'occurred_at', 'timestamptz', '데이터 촬영 일자', 5),
  ('read_grip_result_v2', 'gripper_type', 'varchar(16)', '그리퍼 종류 (finger/suction)', 6),
  ('read_grip_result_v2', 'grip_2d_pose', 'jsonb', '2D 파지점', 7),
  ('read_grip_result_v2', 'grip_3d_pose', 'jsonb', '3D 파지점 (z1~z8)', 8),
  ('read_grip_result_v2', 'robot_tf', 'jsonb', '로봇 변환행렬', 9),
  ('read_grip_result_v2', 'human_annotation_grasp', 'jsonb', '휴먼 어노테이션 파지 영역', 10),
  ('read_grip_result_v2', 'stream_id', 'varchar', 'ES 스트림 ID', 11),
  ('read_grip_result_v2', 'global_seq', 'bigint', '투영 출처 이벤트의 ES 전역 시퀀스', 12),
  ('read_grip_result_v2', 'grip_outlier_flag', 'smallint', 'z1~z8 하한(0.01m) 위배 플래그 (1=위배, 0=정상). 투영 시 계수.', 13)
ON CONFLICT (entity_name, field_name) DO UPDATE SET data_type = EXCLUDED.data_type, meaning = EXCLUDED.meaning, display_order = EXCLUDED.display_order;
```

## 3. API Versioning

> 실행 게이트: 아래 변경은 인간 승인 후에만 적용한다 (human-in-the-loop).

### Unreleased (v1 → v2)

#### Added
- 신 v2 Read Model 테이블 read_grip_result_v2 및 grip_outlier_flag 컬럼
- 신 v2 Projector GripResultV2Projector(z1~z8 하한 위배 플래그 계수)
- 신 v2 라우트 /v2/grip-result 엔드포인트

### 마이그레이션 절차

- 하위호환 변경: read_grip_result_v2 테이블 추가 및 grip_outlier_flag 컬럼으로 정격성 위반 영고 기존 read_grip_result v1 로우 무손; /v2/grip-result 라우트 신규 배선, /projection/grip-result v1 라우트 유지
- 파괴적 변경: 없음
- 컷오버 전 테스트: SELECT scene_key, attempt_num FROM read_grip_result WHERE grip_succeed = 1 AND (grip_3d_pose.z1 < 0.01 OR grip_3d_pose.z2 < 0.01 OR grip_3d_pose.z3 < 0.01 OR grip_3d_pose.z4 < 0.01 OR grip_3d_pose.z5 < 0.01 OR grip_3d_pose.z6 < 0.01 OR grip_3d_pose.z7 < 0.01 OR grip_3d_pose.z8 < 0.01) 전수 대조로 v1 데이터에 z 하한 위배가 존재하는지 확인
- 롤백 창/조건: v2 테이블 drop 및 /v2/grip-result 엔드포인트 제거, DI 주입 해제. v1 로우 재사용.
- Insight 카드 등록: §2의 카드 등록 SQL을 DDL과 함께 적용(카탈로그 동기화)

### 사유·호환성

- 사유: 기존 v1 GripResultProjector.map() 메서드에서 raw 3D 좌표 할당(grip3dPose: payload.grip_data.grip_3d_pose,) 만 수행하여 z1~z8 하한 0.01m 미만의 물리적 불가능한 깊이 값을 허용해 poseConsistency 규칙을 위배[corr:1]。신 v2 GripResultV2Projector는 투영 시 z1~z8 중 하나 미만이 0.01m일 경우 gripOutlierFlag=1 을 계산하여 정격성 위반을 Read Model 컬럼으로 영고, 기존 v1 테이블·로우는 무손[corr:2]。
- 트리거 근거: ⚠ consistency [반려동물용품_CR01_강아지공룡알장난감_02018#1] gripSucceed=1(성공)인데 grip3dPoseZ(z5)=0.005287671918650429 파지 가능 깊이 [0.01, 0.3]m 밖 — 닿지 않는 깊이에서 성공은 모순[corr:1]
⚠ consistency [반려동물용품_CR01_강아지공룡알장난감_02019#1] gripSucceed=1(성공)인데 grip3dPoseZ(z5)=0.005523238079488488 파지 가능 깊이 [0.01, 0.3]m 밖 — 닿지 않는 깊이에서 성공은 모순[corr:2]
v1 GripResultProjector.map() 의 grip3dPose: payload.grip_data.grip_3d_pose, 줄(약 68행) 만 할당하여 z 하한 검증 생략.
- v1 호환성: 기존 read_grip_result 테이블·프로젝터·라우트·DI 주입을 무손으로 유지. v2 신규 테이블·프로젝터·라우트(/v2/grip-result) 만 추가하여 동시 운영 가능.

### 변경 파일

- `src/projection/projection.service.ts` (modifyFile) — 신 v2 Projector DI 주입 및 catchUpGripResultV2 메서드 추가. 기존 v1 로우 무손.
- `src/projection/projection.controller.ts` (modifyFile) — 신 v2 라우트 /v2/grip-result 엔드포인트 추가. 기존 v1 로우 무손.
- `src/shared/database/schema/index.ts` (modifyFile) — 신 v2 Drizzle 스키마 export 추가. 기존 v1 export 무손.

## Optional — 부속 자료(컨텍스트 축소 시 생략 가능)

### 신규 Read Model — Drizzle 스키마

```ts
import { bigint, index, jsonb, pgTable, primaryKey, smallint, timestamp, varchar } from 'drizzle-orm/pg-core';

export const readGripResultV2 = pgTable(
  "read_grip_result_v2",
  {
    sceneKey: varchar("scene_key").notNull(),
    attemptNum: smallint("attempt_num").notNull(),

    objectName: varchar("object_name").notNull(),
    gripSucceed: smallint("grip_succeed").notNull(),
    gripperType: varchar("gripper_type", { length: 16 }).notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),

    grip2dPose: jsonb("grip_2d_pose"),
    grip3dPose: jsonb("grip_3d_pose"),

    robotTf: jsonb("robot_tf"),

    humanAnnotationGrasp: jsonb("human_annotation_grasp"),

    streamId: varchar("stream_id").notNull(),
    globalSeq: bigint("global_seq", { mode: "number" }).notNull(),

    gripOutlierFlag: smallint("grip_outlier_flag").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.sceneKey, t.attemptNum] }),
    index("idx_grip_result_v2_object").on(t.objectName, t.occurredAt),
    index("idx_grip_result_v2_outlier").on(t.gripOutlierFlag, t.occurredAt),
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

    const zValues = [
      payload.grip_data.grip_3d_pose.z1,
      payload.grip_data.grip_3d_pose.z2,
      payload.grip_data.grip_3d_pose.z3,
      payload.grip_data.grip_3d_pose.z4,
      payload.grip_data.grip_3d_pose.z5,
      payload.grip_data.grip_3d_pose.z6,
      payload.grip_data.grip_3d_pose.z7,
      payload.grip_data.grip_3d_pose.z8,
    ];

    const gripOutlierFlag = zValues.some((z) => z < 0.01) ? 1 : 0;

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
      gripperType: "finger",
      occurredAt: event.occurredAt,
      grip2dPose: payload.grip_data.grip_2d_pose,
      grip3dPose: payload.grip_data.grip_3d_pose,
      robotTf: payload.robot_tf,
      humanAnnotationGrasp: payload.human_annotation_grasp,
      streamId: event.streamId,
      globalSeq: event.globalSeq,
      gripOutlierFlag,
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
          gripperType: row.gripperType,
          occurredAt: row.occurredAt,
          grip2dPose: row.grip2dPose,
          grip3dPose: row.grip3dPose,
          robotTf: row.robotTf,
          humanAnnotationGrasp: row.humanAnnotationGrasp,
          streamId: row.streamId,
          globalSeq: row.globalSeq,
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

// src/projection/projection.service.ts (catchUpAll / catchUpGripResultV2)
/* 주: 신규 read_grip_result_v2 적재 시 CatchUpRunner 커서 0으로 리셋해 전체 재투영 강제. 기존 cursor 유지 시 드리프트 이벤트 누락 발생. */
catchUpGripResultV2(): Promise<ProjectionResult> {
  return this.runner.run(this.gripResultV2);
}

// src/projection/projection.controller.ts
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

// src/projection/projection.module.ts providers
providers: [
  /* ...기존 providers... */
  GripResultV2Projector,
]
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

  @Post("/v2/grip-result")
  gripResultV2(): Promise<ProjectionResult> {
    this.logger.info(
      {
        action: LogAction.PROJECTION_REQUEST,
        [LogContext.ROUTE]: "POST /projection/v2/grip-result",
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
당신은 이벤트 소싱 + CQRS 기반 Physical AI 데이터 플랫폼의 시니어 아키텍트이자 엄격한 평가자다. LLM 파이프라인이 [자료](로그·이벤트·스키마 정보)를 보고 [Docs]를 생성했다. Docs 는 권고 문서, Read Model 생성 SQL, API 버저닝 세 요소를 항상 함께 담아야 하는 단일 산출물이다. 당신은 [정답 요지]와 [자료], [자동 검증 결과]를 기준으로 Docs 를 네 항목의 루브릭으로 채점한다. 채점은 관대하지 않게, 근거 없는 주장·지어낸 값·의도와 다른 SQL·서로 어긋나는 절에는 낮은 점수를 준다. 반드시 JSON 객체 하나만 출력한다. 설명문·마크다운 펜스는 출력하지 않는다.

---

[시나리오] A8-translation-x-violation
[상황] 운영 중 센서 관찰기가 파지 센서 값 이상 에피소드를 감지했다.
[정답 요지] 파지 성공 맥락인데 로봇 translation 위치가 작업 영역 밖(X=1.2m / Y=0.20m)인 정합성 위반. 조치: translation 축 작업영역 위반 플래그를 가진 Read Model 보강/격리, v1 무손상.

[자료] — Docs 생성 시 파이프라인이 받은 로그·이벤트·스키마 정보
<<<자료 시작>>>
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
<<<자료 끝>>>

[자동 검증 결과] — 실제 데이터베이스 실행·컴파일 결과. 실행 가능성 판단의 실측 근거로 삼는다.
- 문서 검사: 전 항목 통과
- SQL 실행: 블록 2개 중 2개 실행 성공
- 코드 컴파일: 파일 4개 중 4개 통과

[Docs] — 채점 대상 문서 전문
<<<Docs 시작>>>
---
docId: dq-반려동물용품_CR01_강아지공룡알장난감_02020
generatedAt: 2026-08-11T08:06:10.156Z
targetReadModel: read_grip_result
sqlDialect: postgres
sufficientEvidence: true
apiVersion:
  from: v1
  to: v2
  affectedEndpoints:
    - "POST /multimodal"
    - "POST /grip-result"
    - "POST /insert-all"
    - "POST /grip-result-v2"
evidenceSources: []
constraints:
  - "v1 자산(테이블/엔드포인트/프로젝터 name) 무손상"
  - "PK (scene_key, attempt_num) 유지"
  - "TypeScript any 금지"
  - "식별자 전체 단어"
  - "DDL 실행·API 컷오버는 인간 승인 후에만 (human-in-the-loop)"
  - "Read Model 테이블명은 read_ 접두 스네이크 케이스"
---

# Self-Adaptive CQRS Docs — read_grip_result

> 결론(TL;DR): `read_grip_result`을(를) 재생성한다 — gripSucceed=1(성 성공)인데 robotTfTranslation 이 workspace 범위 밖인 모순 이상. _02020: X=1.2m (범위 [-0.5, 0.5]m), _02021: Y=0.2m (범위 [0.65, 0.95]m). (이상 유형: sensor_baseline_deviation · 심각도: warning)

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

### Status
proposed

### Context (근거)
- (level 40, `sensor.observe.triggered`) [윈도우 1] R5 poseConsistency: s=1 성공인데 robotTfTranslation x=1.200 이 워크스페이스 [-0.50, 0.50] m 밖 / R5 poseConsistency: s=1 성공인데 robotTfTranslation y=0.200 이 워크스페이스 [0.65, 0.95] m 밖 / [2차 지목] R5 poseConsistency: s=1 성공인데 robotTfTranslation x=1.200 이 워크스페이스 [-0.50, 0.50] m 밖 / R5 poseConsistency: s=1 성공인데 robotTfTranslation y=0.200 이 워크스페이스 [0.65, 0.95] m 밖 → read_grip_result 의 robot_tf 컬럼 이 jsonb 타입이라 구조적 Zod 검증만 거치고, physical workspace bounds(semantic validation) 가 누락되어 이상값 조용히 통과.
- 자동 폴백 문서: LLM 권고 생성이 재시도까지 실패해 결정론 폴백이 최소 근거만 수록했다 — 분석 재실행으로 완전한 권고를 재생성하라.
- gripSucceed=1(성 성공)인데 robotTfTranslation 이 workspace 범위 밖인 모순 이상. _02020: X=1.2m (범위 [-0.5, 0.5]m), _02021: Y=0.2m (범위 [0.65, 0.95]m).

### Decision Drivers
- -

### Considered Options
#### 분석 재실행으로 상세 권고 재생성
- 접근: LLM 권고 생성이 실패해 최소 근거만 수록했다 — 동일 근거로 분석 사이클을 재실행해 완전한 권고(옵션 비교·SQL·코드)를 재생성한다.
- 제안 필드: -
- 트레이드오프: 재실행 비용 외 없음(근거 로그·이벤트는 보존됨).

### Decision Outcome
분석 재실행으로 상세 권고 재생성 — LLM 생성 실패로 결정론 폴백이 lane 기본 조치를 선정

### Consequences
- (−) 본 권고는 결정론 폴백 산출물로, 옵션 비교·코드 스니펫이 없다(재실행 권장).

### Non-Goals
- 신규 스키마·코드 변경의 확정(재실행 산출물의 몫)

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
  grip_outlier_flag smallint NOT NULL,
  occurred_at timestamptz NOT NULL,
  stream_id varchar NOT NULL,
  global_seq bigint NOT NULL,
  PRIMARY KEY (scene_key, attempt_num)
);
CREATE INDEX idx_grip_result_v2_outlier ON read_grip_result_v2 (grip_outlier_flag, occurred_at);
CREATE INDEX idx_grip_result_v2_time ON read_grip_result_v2 (occurred_at);
```

### 필드

```mschema
# Table: read_grip_result_v2
[
(scene_key:varchar, 장면 식별 키 = stream_id 제거 prefix, Primary Key),
(attempt_num:smallint, 동장면 내 시도 번호, Primary Key),
(object_name:varchar, payload.objects[0].class_name),
(grip_succeed:smallint, payload.grip_succeed (0/1)),
(robot_tf_translation_x:double precision, payload.robot_tf.translation_3x1[0] (X 축 평행이동)),
(robot_tf_translation_y:double precision, payload.robot_tf.translation_3x1[1] (Y 축 평행이동)),
(grip_outlier_flag:smallint, semantic workspace bounds deviation flag (1=out of bounds, 0=normal)),
(occurred_at:timestamptz, event.occurredAt),
(stream_id:varchar, event.streamId),
(global_seq:bigint, event.globalSeq)
]
```

### 투영 매핑 명세 (이벤트 → 컬럼)

> upsert 키: scene_key, attempt_num · 리플레이: projection_cursor 초기화 시 upsertKey(scene_key, attempt_num) 기준 오버라이드 적용. catch-up 재투영은 멱등 upsert 전제이므로 동일 키 이벤트는 기존 행 유지(overwrite=false) 또는 조건부 갱신만 허용.

| 원천 이벤트 | payload 필드 | 컬럼 | 변환 |
| --- | --- | --- | --- |
| GripAttemptRecorded | streamId | stream_id | verbatim |
| GripAttemptRecorded | globalSequence | global_seq | verbatim |
| GripAttemptRecorded | attemptNumber | attempt_num | verbatim |
| GripAttemptRecorded | occurredAt | occurred_at | verbatim |
| GripAttemptRecorded | gripSucceed | grip_succeed | boolean → smallint (0/1) |

파생 컬럼(이벤트 payload 아님):
- `scene_key` ← stream_id prefix 'grip-attempt:' 제거
- `grip_outlier_flag` ← if (robot_tf_translation_x ∉ [-0.5, 0.5] or robot_tf_translation_y ∉ [0.65, 0.95]) then 1 else 0

### Insight 카드 등록 (Insight Read DB 동기화)

> DDL 적용 시 아래 카드 등록도 함께 실행한다 — 다음 분석부터 신규 Read Model 이 LLM 컨텍스트에 노출된다.

```sql
INSERT INTO insight_entity (entity_name, kind, purpose, key_columns)
VALUES ('read_grip_result_v2', 'read_model', 'per-attempt workspace bounds validation & outlier flagging for grip attempts, extracting X/Y translation from robot_tf.translation_3x1 to enable semantic deviation queries without raw JSONB parsing.', 'scene_key, attempt_num')
ON CONFLICT (entity_name) DO UPDATE SET purpose = EXCLUDED.purpose, key_columns = EXCLUDED.key_columns;

INSERT INTO insight_field (entity_name, field_name, data_type, meaning, display_order)
VALUES
  ('read_grip_result_v2', 'scene_key', 'varchar', '장면 식별 키 = stream_id 제거 prefix', 1),
  ('read_grip_result_v2', 'attempt_num', 'smallint', '동장면 내 시도 번호', 2),
  ('read_grip_result_v2', 'object_name', 'varchar', 'payload.objects[0].class_name', 3),
  ('read_grip_result_v2', 'grip_succeed', 'smallint', 'payload.grip_succeed (0/1)', 4),
  ('read_grip_result_v2', 'robot_tf_translation_x', 'double precision', 'payload.robot_tf.translation_3x1[0] (X 축 평행이동)', 5),
  ('read_grip_result_v2', 'robot_tf_translation_y', 'double precision', 'payload.robot_tf.translation_3x1[1] (Y 축 평행이동)', 6),
  ('read_grip_result_v2', 'grip_outlier_flag', 'smallint', 'semantic workspace bounds deviation flag (1=out of bounds, 0=normal)', 7),
  ('read_grip_result_v2', 'occurred_at', 'timestamptz', 'event.occurredAt', 8),
  ('read_grip_result_v2', 'stream_id', 'varchar', 'event.streamId', 9),
  ('read_grip_result_v2', 'global_seq', 'bigint', 'event.globalSeq', 10)
ON CONFLICT (entity_name, field_name) DO UPDATE SET data_type = EXCLUDED.data_type, meaning = EXCLUDED.meaning, display_order = EXCLUDED.display_order;
```

## 3. API Versioning

> 실행 게이트: 아래 변경은 인간 승인 후에만 적용한다 (human-in-the-loop).

### Unreleased (v1 → v2)

#### Added
- 신규 Read Model 테이블 read_grip_result_v2, Drizzle 스키마, GripResultV2Projector, POST /grip-result-v2 라우트
#### Fixed
- semantic workspace bounds([-0.5, 0.5]m X / [0.65, 0.95]m Y) deviation flag(grip_outlier_flag) 추가하여 false-positive grip 적시성 걸러

### 마이그레이션 절차

- 하위호환 변경: -
- 파괴적 변경: 없음
- 컷오버 전 테스트: 1. v2 라우트 POST /projection/grip-result-v2 실행 시 CatchUpRunner 전수 투영 검증
2. read_grip_result_v2.grip_outlier_flag=1 행 존재 여부 확인 (기존 02020/02021 sceneKey 매핑)
3. v1 라우트 POST /projection/grip-result 실행 시 기존 jsonb robotTf 컬럼 무변영 검증
- 롤백 창/조건: v2 테이블 drop: DROP TABLE read_grip_result_v2; v2 Projector DI 제거, /grip-result-v2 라우트 삭제. v1 Read Model(jsonb) 및 기존 라우트/서비스 메서드는 원복 상태 유지.
- Insight 카드 등록: §2의 카드 등록 SQL을 DDL과 함께 적용(카탈로그 동기화)

### 사유·호환성

- 사유: 기존 v1 Read Model은 robot_tf jsonb 컬럼만 저장하여 semantic workspace bounds 검증이 누락되어 gripSucceed=1 이상값이 통과 [corr:02020][corr:02021]. v2는 translation_3x1[0/1]을 분리된 double precision 컬럼으로 추출하고 workspace limits([-0.5, 0.5]m X / [0.65, 0.95]m Y)를 직접 계산하여 grip_outlier_flag를 세팅. false-positive grip과 sensor baseline deviation을 적시성 걸러.
- 트리거 근거: [corr:02020] ⚠ consistency [반려동물용품_CR01_강아지공룡알장난감_02020#1] gripSucceed=1(성공)인데 robotTfTranslationX=1.2 작업범위 [-0.5, 0.5]m 밖 — 잡을 수 없는 위치에서 성공은 모순
[corr:02021] ⚠ consistency [반려동물용품_CR01_강아지공룡알장난감_02021#1] gripSucceed=1(성공)인데 robotTfTranslationY=0.2 작업범위 [0.65, 0.95]m 밖 — 잡을 수 없는 위치에서 성공은 모순
- v1 호환성: v1 테이블·프로젝터·라우트·서비스 메서드/타입은 무손상 유지. v2는 신규 테이블(read_grip_result_v2)과 독립 프로젝터(GripResultV2Projector)로 배선만 추가하여 backward-compatible.

### 변경 파일

- `src/shared/database/schema/index.ts` (modifyFile) — 신규 v2 테이블 export 배선. 기존 v1 export는 보존.
- `src/projection/projection.service.ts` (modifyFile) — 신규 v2 Projector DI 배선 및 catchUpGripResultV2 메서드 추가. 기존 v1 메서드/타입은 무손상.
- `src/projection/projection.controller.ts` (modifyFile) — 신규 v2 라우트 POST /grip-result-v2 배선. 기존 v1 엔드포인트는 보존.

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

    robotTfTranslationX: doublePrecision("robot_tf_translation_x"),
    robotTfTranslationY: doublePrecision("robot_tf_translation_y"),

    gripOutlierFlag: smallint("grip_outlier_flag").notNull(),

    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),

    streamId: varchar("stream_id").notNull(),
    globalSeq: bigint("global_seq", { mode: "number" }).notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.sceneKey, t.attemptNum] }),
    index("idx_grip_result_v2_outlier").on(t.gripOutlierFlag, t.occurredAt),
    index("idx_grip_result_v2_time").on(t.occurredAt),
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
import { readGripResultV2 } from '@/shared/database/schema/service/read-grip-result-v2';
import { LogAction, LogContext } from '@/shared/logger/logging-context';

type ReadGripResultV2Insert = InferInsertModel<typeof readGripResultV2>;

// Semantic workspace bounds for validation
const WORKSPACE_X_MIN = -0.5;
const WORKSPACE_X_MAX = 0.5;
const WORKSPACE_Y_MIN = 0.65;
const WORKSPACE_Y_MAX = 0.95;

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

    if (payload.objects.length === 0) {
      this.logger.error(
        {
          action: LogAction.MAP_FAILED,
          [LogContext.EVENT_ID]: event.eventId,
          [LogContext.STREAM_ID]: event.streamId,
        },
        "objects 비어 있음",
      );

      throw new Error(`grip-result-v2 map: empty objects in event ${event.eventId}`);
    }

    const translation = payload.robot_tf.translation_3x1;
    const txVal = translation[0];
    const tyVal = translation[1];

    const isOutlierX = txVal < WORKSPACE_X_MIN || txVal > WORKSPACE_X_MAX;
    const isOutlierY = tyVal < WORKSPACE_Y_MIN || tyVal > WORKSPACE_Y_MAX;
    const outlierFlag = payload.grip_succeed === 1 && (isOutlierX || isOutlierY) ? 1 : 0;

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
      robotTfTranslationX: txVal,
      robotTfTranslationY: tyVal,
      gripOutlierFlag: outlierFlag,
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
          gripSucceed: row.gripSucceed,
          robotTfTranslationX: row.robotTfTranslationX,
          robotTfTranslationY: row.robotTfTranslationY,
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
export * from "./service/read-grip-result-v2";

// src/projection/projection.service.ts (의존성 주입 추가)
constructor(
  // ... 기존 의존성 ...
  private readonly gripResultV2: GripResultV2Projector,
) {
  this.logger.setContext(ProjectionService.name);
}

catchUpGripResultV2(): Promise<ProjectionResult> {
  return this.runner.run(this.gripResultV2);
}

// src/projection/projection.controller.ts (라우트 추가)
@Post("/grip-result-v2")
gripResultV2(): Promise<ProjectionResult> {
  // NOTE: Reset projection cursor to 0 before calling catchUpGripResultV2() to force full replay for baseline deviation validation.
  this.logger.info(
    {
      action: LogAction.PROJECTION_REQUEST,
      [LogContext.ROUTE]: "POST /projection/grip-result-v2",
    },
    "projection 요청 수신",
  );

  return this.projectionService.catchUpGripResultV2();
}

// src/projection/projection.module.ts (providers 등록)
@Module({
  providers: [
    // ... 기존 ...
    GripResultV2Projector,
  ],
})
export class ProjectionModule {}
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
import { MultiModalProjector } from '@/projection/projector/multimodal.projector';
import { ProjectionResult } from '@/projection/projector/projector';
import { CatchUpRunner } from '@/projection/runner/catch-up.runner';
import { GripResultV2Projector } from '@/projection/projector/grip-result-v2.projector';
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

  @Post("/insert-all")
  insertAll(): Promise<InsertAndProjectionAllResult> {
    this.logger.info(
      { action: LogAction.PROJECTION_REQUEST },
      "projection 요청 수신",
    );

    return this.projectionService.insertAllAndProjectAll();
  }

  @Post("/grip-result-v2")
  gripResultV2(): Promise<ProjectionResult> {
    this.logger.info(
      {
        action: LogAction.PROJECTION_REQUEST,
        [LogContext.ROUTE]: "POST /projection/grip-result-v2",
      },
      "v2 projection 요청 수신",
    );

    return this.projectionService.catchUpGripResultV2();
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
당신은 이벤트 소싱 + CQRS 기반 Physical AI 데이터 플랫폼의 시니어 아키텍트이자 엄격한 평가자다. LLM 파이프라인이 [자료](로그·이벤트·스키마 정보)를 보고 [Docs]를 생성했다. Docs 는 권고 문서, Read Model 생성 SQL, API 버저닝 세 요소를 항상 함께 담아야 하는 단일 산출물이다. 당신은 [정답 요지]와 [자료], [자동 검증 결과]를 기준으로 Docs 를 네 항목의 루브릭으로 채점한다. 채점은 관대하지 않게, 근거 없는 주장·지어낸 값·의도와 다른 SQL·서로 어긋나는 절에는 낮은 점수를 준다. 반드시 JSON 객체 하나만 출력한다. 설명문·마크다운 펜스는 출력하지 않는다.

---

[시나리오] A2-type-mismatch
[상황] 운영 중 시스템이 적재 검증 실패(zod 거부) 로그를 감지했다.
[정답 요지] grip_succeed 가 타입/도메인 위반(문자열 "true", 도메인 밖 정수 2)으로 zod 검증에 걸려 적재가 거부됨. JSON 자체는 유효. 조치: 거부 건을 추적할 수 있는 Read Model/검증 로그 보강과 클라이언트 타입 정규화 권고, v1 무손상.

[자료] — Docs 생성 시 파이프라인이 받은 로그·이벤트·스키마 정보
<<<자료 시작>>>
<logging_context>
## 이상 로그 맥락 (±N 윈도우)
> 빈도: 최근 1h — `insert.request`(level 30) 1회, `insert.file.failed`(level 40) 1회, `insert.batch.start`(level 30) 1회, `log.delete.request`(level 30) 1회, `log.delete.done`(level 30) 1회, `insert.file.ok`(level 20) 50회, `-`(level 30) 1회.

| time | level | action | correlation_id | stream_id | attempt | global_seq | msg | detail |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 01:49:10.542 | 30 | insert.request | 4714dd7b-ed3a-4520-be3e-818c082b6086 | - | - | - | Insert Event Store 요청 수신 | - |
| 01:49:10.542 | 30 | insert.batch.start | 4714dd7b-ed3a-4520-be3e-818c082b6086 | - | - | - | Toy-Data 적재 시작 | - |
| 01:49:10.548 | 20 | insert.file.ok | 4714dd7b-ed3a-4520-be3e-818c082b6086 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00051 | 2 | 1 | 이벤트 append | - |
| 01:49:10.548 | 20 | insert.file.ok | 4714dd7b-ed3a-4520-be3e-818c082b6086 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00051 | 2 | 1 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00051_02_20230923.json |
| 01:49:10.549 | 20 | insert.file.ok | 4714dd7b-ed3a-4520-be3e-818c082b6086 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00055 | 3 | 2 | 이벤트 append | - |
| 01:49:10.549 | 20 | insert.file.ok | 4714dd7b-ed3a-4520-be3e-818c082b6086 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00055 | 3 | 2 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00055_03_20230923.json |
| 01:49:10.550 | 20 | insert.file.ok | 4714dd7b-ed3a-4520-be3e-818c082b6086 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00056 | 2 | 3 | 이벤트 append | - |
| 01:49:10.550 | 20 | insert.file.ok | 4714dd7b-ed3a-4520-be3e-818c082b6086 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00056 | 2 | 3 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00056_02_20230923.json |
| 01:49:10.552 | 20 | insert.file.ok | 4714dd7b-ed3a-4520-be3e-818c082b6086 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00061 | 3 | 5 | 이벤트 append | - |
| 01:49:10.552 | 20 | insert.file.ok | 4714dd7b-ed3a-4520-be3e-818c082b6086 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00059 | 2 | 4 | 이벤트 append | - |
| 01:49:10.552 | 20 | insert.file.ok | 4714dd7b-ed3a-4520-be3e-818c082b6086 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00059 | 2 | 4 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00059_02_20230923.json |
| 01:49:10.552 | 20 | insert.file.ok | 4714dd7b-ed3a-4520-be3e-818c082b6086 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00061 | 3 | 5 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00061_03_20230923.json |
| 01:49:10.553 | 20 | insert.file.ok | 4714dd7b-ed3a-4520-be3e-818c082b6086 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00071 | 3 | 6 | 이벤트 append | - |
| 01:49:10.553 | 20 | insert.file.ok | 4714dd7b-ed3a-4520-be3e-818c082b6086 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00071 | 3 | 6 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00071_03_20230923.json |
| 01:49:10.554 | 20 | insert.file.ok | 4714dd7b-ed3a-4520-be3e-818c082b6086 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00072 | 1 | 7 | 이벤트 append | - |
| 01:49:10.554 | 20 | insert.file.ok | 4714dd7b-ed3a-4520-be3e-818c082b6086 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00072 | 1 | 7 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00072_01_20230923.json |
| 01:49:10.555 | 20 | insert.file.ok | 4714dd7b-ed3a-4520-be3e-818c082b6086 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00074 | 3 | 8 | 이벤트 append | - |
| 01:49:10.555 | 20 | insert.file.ok | 4714dd7b-ed3a-4520-be3e-818c082b6086 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00074 | 3 | 8 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00074_03_20230923.json |
| 01:49:10.556 | 20 | insert.file.ok | 4714dd7b-ed3a-4520-be3e-818c082b6086 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00079 | 2 | 9 | 이벤트 append | - |
| 01:49:10.556 | 20 | insert.file.ok | 4714dd7b-ed3a-4520-be3e-818c082b6086 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00079 | 2 | 9 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00079_02_20230923.json |
| 01:49:10.557 | 20 | insert.file.ok | 4714dd7b-ed3a-4520-be3e-818c082b6086 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00080 | 2 | 10 | 이벤트 append | - |
| 01:49:10.557 | 20 | insert.file.ok | 4714dd7b-ed3a-4520-be3e-818c082b6086 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00080 | 2 | 10 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00080_02_20230923.json |
| 01:49:10.558 | 20 | insert.file.ok | 4714dd7b-ed3a-4520-be3e-818c082b6086 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00097 | 1 | 11 | 이벤트 append | - |
| 01:49:10.558 | 20 | insert.file.ok | 4714dd7b-ed3a-4520-be3e-818c082b6086 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00097 | 1 | 11 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00097_01_20230923.json |
| 01:49:10.559 | 20 | insert.file.ok | 4714dd7b-ed3a-4520-be3e-818c082b6086 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00100 | 2 | 12 | 이벤트 append | - |
| 01:49:10.559 | 20 | insert.file.ok | 4714dd7b-ed3a-4520-be3e-818c082b6086 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00100 | 2 | 12 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00100_02_20230923.json |
| 01:49:10.560 | 20 | insert.file.ok | 4714dd7b-ed3a-4520-be3e-818c082b6086 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00103 | 1 | 13 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00103_01_20230923.json |
| 01:49:10.560 | 20 | insert.file.ok | 4714dd7b-ed3a-4520-be3e-818c082b6086 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00103 | 1 | 13 | 이벤트 append | - |
| 01:49:10.561 | 20 | insert.file.ok | 4714dd7b-ed3a-4520-be3e-818c082b6086 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00103 | 2 | 14 | 이벤트 append | - |
| 01:49:10.561 | 20 | insert.file.ok | 4714dd7b-ed3a-4520-be3e-818c082b6086 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00103 | 2 | 14 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00103_02_20230923.json |
| 01:49:10.561 | 20 | insert.file.ok | 4714dd7b-ed3a-4520-be3e-818c082b6086 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00106 | 1 | 15 | 이벤트 append | - |
| 01:49:10.561 | 20 | insert.file.ok | 4714dd7b-ed3a-4520-be3e-818c082b6086 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00106 | 1 | 15 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00106_01_20230923.json |
| 01:49:10.562 | 20 | insert.file.ok | 4714dd7b-ed3a-4520-be3e-818c082b6086 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00108 | 2 | 16 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00108_02_20230923.json |
| 01:49:10.562 | 20 | insert.file.ok | 4714dd7b-ed3a-4520-be3e-818c082b6086 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00108 | 2 | 16 | 이벤트 append | - |
| 01:49:10.563 | 20 | insert.file.ok | 4714dd7b-ed3a-4520-be3e-818c082b6086 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00110 | 3 | 18 | 이벤트 append | - |
| 01:49:10.563 | 20 | insert.file.ok | 4714dd7b-ed3a-4520-be3e-818c082b6086 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00109 | 1 | 17 | 이벤트 append | - |
| 01:49:10.563 | 20 | insert.file.ok | 4714dd7b-ed3a-4520-be3e-818c082b6086 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00109 | 1 | 17 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00109_01_20230923.json |
| 01:49:10.564 | 20 | insert.file.ok | 4714dd7b-ed3a-4520-be3e-818c082b6086 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00110 | 3 | 18 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00110_03_20230923.json |
| 01:49:10.565 | 20 | insert.file.ok | 4714dd7b-ed3a-4520-be3e-818c082b6086 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00117 | 3 | 20 | 이벤트 append | - |
| 01:49:10.565 | 20 | insert.file.ok | 4714dd7b-ed3a-4520-be3e-818c082b6086 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00112 | 3 | 19 | 이벤트 append | - |
| 01:49:10.565 | 20 | insert.file.ok | 4714dd7b-ed3a-4520-be3e-818c082b6086 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00112 | 3 | 19 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00112_03_20230923.json |
| 01:49:10.565 | 20 | insert.file.ok | 4714dd7b-ed3a-4520-be3e-818c082b6086 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00117 | 3 | 20 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00117_03_20230923.json |
| 01:49:10.566 | 20 | insert.file.ok | 4714dd7b-ed3a-4520-be3e-818c082b6086 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00120 | 2 | 21 | 이벤트 append | - |
| 01:49:10.566 | 20 | insert.file.ok | 4714dd7b-ed3a-4520-be3e-818c082b6086 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00120 | 2 | 21 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00120_02_20230923.json |
| 01:49:10.567 | 20 | insert.file.ok | 4714dd7b-ed3a-4520-be3e-818c082b6086 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00121 | 2 | 22 | 이벤트 append | - |
| 01:49:10.567 | 20 | insert.file.ok | 4714dd7b-ed3a-4520-be3e-818c082b6086 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00121 | 2 | 22 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00121_02_20230923.json |
| 01:49:10.568 | 20 | insert.file.ok | 4714dd7b-ed3a-4520-be3e-818c082b6086 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00133 | 1 | 23 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00133_01_20230923.json |
| 01:49:10.568 | 20 | insert.file.ok | 4714dd7b-ed3a-4520-be3e-818c082b6086 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00133 | 1 | 23 | 이벤트 append | - |
| 01:49:10.568 | 20 | insert.file.ok | 4714dd7b-ed3a-4520-be3e-818c082b6086 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00133 | 2 | 24 | 이벤트 append | - |
| 01:49:10.569 | 20 | insert.file.ok | 4714dd7b-ed3a-4520-be3e-818c082b6086 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00134 | 1 | 25 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00134_01_20230923.json |
| 01:49:10.569 | 20 | insert.file.ok | 4714dd7b-ed3a-4520-be3e-818c082b6086 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00133 | 2 | 24 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00133_02_20230923.json |
| 01:49:10.569 | 20 | insert.file.ok | 4714dd7b-ed3a-4520-be3e-818c082b6086 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00134 | 1 | 25 | 이벤트 append | - |
| 01:49:10.570 | 40 | insert.file.failed | 4714dd7b-ed3a-4520-be3e-818c082b6086 | - | - | - | toy-data 파일 적재 실패 ← 트립 앵커 | reason=[   {     "expected": "number",     "code": "invalid_type",     "path": [       "grip_succeed"     ],     "message": "Invalid input: expected number, received string"   } ] · file=반려동물용품_CR01_강아지공룡알장난감_02002_01_20230923.json |
| 01:49:10.571 | 30 | insert.batch.done | 4714dd7b-ed3a-4520-be3e-818c082b6086 | - | - | - | toy-data 적재 완료 | - |
| 01:49:10.571 | 40 | insert.file.failed | 4714dd7b-ed3a-4520-be3e-818c082b6086 | - | - | - | toy-data 파일 적재 실패 | reason=[   {     "origin": "number",     "code": "too_big",     "maximum": 1,     "inclusive": true,     "path": [       "grip_succeed"     ],     "message": "Too big: expected number to be <=1"   } ] · file=반려동물용품_CR01_강아지공룡알장난감_02003_01_20230923.json |
| 01:49:10.571 | 30 | - | 4714dd7b-ed3a-4520-be3e-818c082b6086 | - | - | - | request completed | - |
| 01:49:10.574 | 30 | projection.request | 5980a819-dec5-42a3-8a11-879c329ed7dc | - | - | - | projection 요청 수신 | - |
| 01:49:10.575 | 20 | - | 5980a819-dec5-42a3-8a11-879c329ed7dc | - | - | - | 커서 조회 | projector=multimodal-projector |
| 01:49:10.575 | 30 | projection.start | 5980a819-dec5-42a3-8a11-879c329ed7dc | - | - | - | catch-up 시작 | projector=multimodal-projector |
| 01:49:10.577 | 20 | projection.event.mapped | 5980a819-dec5-42a3-8a11-879c329ed7dc | - | 2 | 1 | 이벤트 매핑 | projector=multimodal-projector |
| 01:49:10.577 | 20 | - | 5980a819-dec5-42a3-8a11-879c329ed7dc | - | - | - | 이벤트 조회 | - |
| 01:49:10.579 | 20 | projection.event.mapped | 5980a819-dec5-42a3-8a11-879c329ed7dc | - | 3 | 2 | 이벤트 매핑 | projector=multimodal-projector |
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
- SQL 실행: 블록 1개 중 1개 실행 성공
- 코드 컴파일: 컴파일 대상 코드 없음

[저장소 파일 확인] — 파이프라인은 진단 도구로 저장소 소스 코드를 조회할 수 있다. Docs 가 인용한 파일 경로의 실재 여부와 앞부분 발췌이다.
- 저장소에 실재하는 파일 (2건): src/insert/dto/toy-data.dto.ts, src/insert/insert.service.ts
- 저장소에 없는 파일 (0건): 없음

<<<src/insert/dto/toy-data.dto.ts 앞부분 80행>>>
import { z } from 'zod';

const cameraIntrinsicSchema = z.object({
  codx: z.number().nullable(),
  cody: z.number(),
  cx: z.number(),
  cy: z.number(),
  fx: z.number(),
  fy: z.number(),
  k1: z.number(),
  k2: z.number(),
  k3: z.number(),
  k4: z.number(),
  k5: z.number(),
  k6: z.number(),
  p1: z.number(),
  p2: z.number(),
});

const cameraInfoSchema = z.object({
  camera_intrinsic_param: cameraIntrinsicSchema,
  camera_name: z.string(),
  camera_type: z.string(),
});

const grip2dPoseSchema = z.object({
  xl: z.number(),
  xr: z.number(),
  yl: z.number(),
  yr: z.number(),
});

const grip3dPoseSchema = z.object({
  x1: z.number(),
  x2: z.number(),
  x3: z.number(),
  x4: z.number(),
  x5: z.number(),
  x6: z.number(),
  x7: z.number(),
  x8: z.number(),
  y1: z.number(),
  y2: z.number(),
  y3: z.number(),
  y4: z.number(),
  y5: z.number(),
  y6: z.number(),
  y7: z.number(),
  y8: z.number(),
  z1: z.number(),
  z2: z.number(),
  z3: z.number(),
  z4: z.number(),
  z5: z.number(),
  z6: z.number(),
  z7: z.number(),
  z8: z.number(),
});

const gripDataSchema = z.object({
  grip_2d_pose: grip2dPoseSchema,
  grip_3d_pose: grip3dPoseSchema,
});

const objectsSchema = z.object({
  annotation_type: z.string(),
  class_name: z.string(),
  package_type: z.string(),
  object_properties: z.array(z.string()),
  id: z.number().int(),
  segmentation_points: z.array(z.array(z.array(z.number()))),
});

const robotTfSchema = z.object({
  rotation_3x3: z.array(z.number()).length(9),
  translation_3x1: z.array(z.number()).length(3),
});

const humanAnnotationSchema = z.object({
  annotation_type: z.string(),
<<<발췌 끝>>>

<<<src/insert/insert.service.ts 앞부분 80행>>>
import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { detectPayloadDrift } from '@/insert/drift/payload-drift.detector';
import { toyDataSchema } from '@/insert/dto/toy-data.dto';
import { ParsedFileName, parseToyDataFileName } from '@/insert/parser/toy-data-file-name.parser';
import { EVENT_STORE_REPOSITORY, type EventStoreRepository } from '@/insert/repository/event-store.repository';
import { LogAction, LogContext } from '@/shared/logger/logging-context';

// 평가 러너가 시나리오별 데이터 폴더를 바꿔 끼울 수 있게 env 로 연다(미설정 시 원본 toy-data).
const TOY_DATA_DIR: string = path.resolve(
  process.cwd(),
  process.env.TOY_DATA_DIRECTORY ?? "data/toy-data",
);

export type InsertFailure = { file: string; reason: string };

export type InsertResult = {
  totalFiles: number;
  inserted: number;
  skipped: number;
  failed: InsertFailure[];
};

@Injectable()
export class InsertService {
  constructor(
    private readonly logger: PinoLogger,
    @Inject(EVENT_STORE_REPOSITORY)
    private readonly eventStore: EventStoreRepository,
  ) {
    this.logger.setContext(InsertService.name);
  }

  async insertToyData(): Promise<InsertResult> {
    const startedAt: number = Date.now();
    const entries: string[] = await this.listToyDataFiles();

    this.logger.info(
      {
        action: LogAction.INSERT_BATCH_START,
        [LogContext.TOTAL_FILES]: entries.length,
      },
      "Toy-Data 적재 시작",
    );

    const result: InsertResult = {
      totalFiles: entries.length,
      inserted: 0,
      skipped: 0,
      failed: [],
    };

    // key 단위 dedup: 파일 N개에 같은 신규 키가 있어도 배치 끝에 warn 1회만.
    const batchDrifts = new Map<string, string>();

    for (const file of entries) {
      await this.insertOneFile(file, result, batchDrifts);
    }

    this.reportPayloadDrift(batchDrifts);

    this.logger.info(
      {
        action: LogAction.INSERT_BATCH_DONE,
        [LogContext.TOTAL_FILES]: result.totalFiles,
        [LogContext.INSERTED]: result.inserted,
        [LogContext.SKIPPED]: result.skipped,
        [LogContext.FAILED]: result.failed.length,
        [LogContext.DURATION_MS]: Date.now() - startedAt,
      },
      "toy-data 적재 완료",
    );

    return result;
  }

  // 배치 동안 모은 payload 스키마 드리프트를 warn 1회로 발행한다(level 40 → prejudge 트립).
  // 신규 키는 toyDataSchema.parse 에서 유실되므로 재투영으로도 복구 불가 — Read Model 후보 신호다.
<<<발췌 끝>>>

[Docs] — 채점 대상 문서 전문
<<<Docs 시작>>>
---
docId: analysis-4714dd7b-ed3a-4520-be3e-818c082b6086
generatedAt: 2026-08-11T01:49:13.247Z
targetReadModel: read_grip_result
sqlDialect: postgres
sufficientEvidence: true
apiVersion:
  from: null
  to: null
  affectedEndpoints: []
evidenceSources:
  - { origin: developer-logging, anchorId: "4714dd7b-ed3a-4520-be3e-818c082b6086" }
constraints:
  - "v1 자산(테이블/엔드포인트/프로젝터 name) 무손상"
  - "PK (scene_key, attempt_num) 유지"
  - "TypeScript any 금지"
  - "식별자 전체 단어"
  - "DDL 실행·API 컷오버는 인간 승인 후에만 (human-in-the-loop)"
  - "Read Model 테이블명은 read_ 접두 스네이크 케이스"
---

# Self-Adaptive CQRS Docs — read_grip_result

> 결론(TL;DR): `read_grip_result`을(를) 보강한다 — Toy-Data 적재 요청 중 Zod 스키마 검증 단계에서 grip_succeed 필드의 타입/범위 불일치로 다수 파일이 거절되었으나 batch는 정상 완료되어 투영에는 영향이 없음. (이상 유형: 적재 Zod 검증 실패 · 심각도: warning)

<logging_context>

## 이상 로그 맥락 (±N 윈도우)
> 빈도: 최근 1h — `insert.request`(level 30) 1회, `insert.file.failed`(level 40) 1회, `insert.batch.start`(level 30) 1회, `log.delete.request`(level 30) 1회, `log.delete.done`(level 30) 1회, `insert.file.ok`(level 20) 50회, `-`(level 30) 1회.

| time | level | action | correlation_id | stream_id | attempt | global_seq | msg | detail |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 01:49:10.542 | 30 | insert.request | 4714dd7b-ed3a-4520-be3e-818c082b6086 | - | - | - | Insert Event Store 요청 수신 | - |
| 01:49:10.542 | 30 | insert.batch.start | 4714dd7b-ed3a-4520-be3e-818c082b6086 | - | - | - | Toy-Data 적재 시작 | - |
| 01:49:10.548 | 20 | insert.file.ok | 4714dd7b-ed3a-4520-be3e-818c082b6086 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00051 | 2 | 1 | 이벤트 append | - |
| 01:49:10.548 | 20 | insert.file.ok | 4714dd7b-ed3a-4520-be3e-818c082b6086 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00051 | 2 | 1 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00051_02_20230923.json |
| 01:49:10.549 | 20 | insert.file.ok | 4714dd7b-ed3a-4520-be3e-818c082b6086 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00055 | 3 | 2 | 이벤트 append | - |
| 01:49:10.549 | 20 | insert.file.ok | 4714dd7b-ed3a-4520-be3e-818c082b6086 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00055 | 3 | 2 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00055_03_20230923.json |
| 01:49:10.550 | 20 | insert.file.ok | 4714dd7b-ed3a-4520-be3e-818c082b6086 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00056 | 2 | 3 | 이벤트 append | - |
| 01:49:10.550 | 20 | insert.file.ok | 4714dd7b-ed3a-4520-be3e-818c082b6086 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00056 | 2 | 3 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00056_02_20230923.json |
| 01:49:10.552 | 20 | insert.file.ok | 4714dd7b-ed3a-4520-be3e-818c082b6086 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00061 | 3 | 5 | 이벤트 append | - |
| 01:49:10.552 | 20 | insert.file.ok | 4714dd7b-ed3a-4520-be3e-818c082b6086 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00059 | 2 | 4 | 이벤트 append | - |
| 01:49:10.552 | 20 | insert.file.ok | 4714dd7b-ed3a-4520-be3e-818c082b6086 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00059 | 2 | 4 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00059_02_20230923.json |
| 01:49:10.552 | 20 | insert.file.ok | 4714dd7b-ed3a-4520-be3e-818c082b6086 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00061 | 3 | 5 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00061_03_20230923.json |
| 01:49:10.553 | 20 | insert.file.ok | 4714dd7b-ed3a-4520-be3e-818c082b6086 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00071 | 3 | 6 | 이벤트 append | - |
| 01:49:10.553 | 20 | insert.file.ok | 4714dd7b-ed3a-4520-be3e-818c082b6086 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00071 | 3 | 6 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00071_03_20230923.json |
| 01:49:10.554 | 20 | insert.file.ok | 4714dd7b-ed3a-4520-be3e-818c082b6086 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00072 | 1 | 7 | 이벤트 append | - |
| 01:49:10.554 | 20 | insert.file.ok | 4714dd7b-ed3a-4520-be3e-818c082b6086 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00072 | 1 | 7 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00072_01_20230923.json |
| 01:49:10.555 | 20 | insert.file.ok | 4714dd7b-ed3a-4520-be3e-818c082b6086 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00074 | 3 | 8 | 이벤트 append | - |
| 01:49:10.555 | 20 | insert.file.ok | 4714dd7b-ed3a-4520-be3e-818c082b6086 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00074 | 3 | 8 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00074_03_20230923.json |
| 01:49:10.556 | 20 | insert.file.ok | 4714dd7b-ed3a-4520-be3e-818c082b6086 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00079 | 2 | 9 | 이벤트 append | - |
| 01:49:10.556 | 20 | insert.file.ok | 4714dd7b-ed3a-4520-be3e-818c082b6086 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00079 | 2 | 9 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00079_02_20230923.json |
| 01:49:10.557 | 20 | insert.file.ok | 4714dd7b-ed3a-4520-be3e-818c082b6086 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00080 | 2 | 10 | 이벤트 append | - |
| 01:49:10.557 | 20 | insert.file.ok | 4714dd7b-ed3a-4520-be3e-818c082b6086 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00080 | 2 | 10 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00080_02_20230923.json |
| 01:49:10.558 | 20 | insert.file.ok | 4714dd7b-ed3a-4520-be3e-818c082b6086 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00097 | 1 | 11 | 이벤트 append | - |
| 01:49:10.558 | 20 | insert.file.ok | 4714dd7b-ed3a-4520-be3e-818c082b6086 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00097 | 1 | 11 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00097_01_20230923.json |
| 01:49:10.559 | 20 | insert.file.ok | 4714dd7b-ed3a-4520-be3e-818c082b6086 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00100 | 2 | 12 | 이벤트 append | - |
| 01:49:10.559 | 20 | insert.file.ok | 4714dd7b-ed3a-4520-be3e-818c082b6086 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00100 | 2 | 12 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00100_02_20230923.json |
| 01:49:10.560 | 20 | insert.file.ok | 4714dd7b-ed3a-4520-be3e-818c082b6086 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00103 | 1 | 13 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00103_01_20230923.json |
| 01:49:10.560 | 20 | insert.file.ok | 4714dd7b-ed3a-4520-be3e-818c082b6086 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00103 | 1 | 13 | 이벤트 append | - |
| 01:49:10.561 | 20 | insert.file.ok | 4714dd7b-ed3a-4520-be3e-818c082b6086 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00103 | 2 | 14 | 이벤트 append | - |
| 01:49:10.561 | 20 | insert.file.ok | 4714dd7b-ed3a-4520-be3e-818c082b6086 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00103 | 2 | 14 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00103_02_20230923.json |
| 01:49:10.561 | 20 | insert.file.ok | 4714dd7b-ed3a-4520-be3e-818c082b6086 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00106 | 1 | 15 | 이벤트 append | - |
| 01:49:10.561 | 20 | insert.file.ok | 4714dd7b-ed3a-4520-be3e-818c082b6086 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00106 | 1 | 15 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00106_01_20230923.json |
| 01:49:10.562 | 20 | insert.file.ok | 4714dd7b-ed3a-4520-be3e-818c082b6086 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00108 | 2 | 16 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00108_02_20230923.json |
| 01:49:10.562 | 20 | insert.file.ok | 4714dd7b-ed3a-4520-be3e-818c082b6086 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00108 | 2 | 16 | 이벤트 append | - |
| 01:49:10.563 | 20 | insert.file.ok | 4714dd7b-ed3a-4520-be3e-818c082b6086 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00110 | 3 | 18 | 이벤트 append | - |
| 01:49:10.563 | 20 | insert.file.ok | 4714dd7b-ed3a-4520-be3e-818c082b6086 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00109 | 1 | 17 | 이벤트 append | - |
| 01:49:10.563 | 20 | insert.file.ok | 4714dd7b-ed3a-4520-be3e-818c082b6086 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00109 | 1 | 17 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00109_01_20230923.json |
| 01:49:10.564 | 20 | insert.file.ok | 4714dd7b-ed3a-4520-be3e-818c082b6086 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00110 | 3 | 18 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00110_03_20230923.json |
| 01:49:10.565 | 20 | insert.file.ok | 4714dd7b-ed3a-4520-be3e-818c082b6086 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00117 | 3 | 20 | 이벤트 append | - |
| 01:49:10.565 | 20 | insert.file.ok | 4714dd7b-ed3a-4520-be3e-818c082b6086 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00112 | 3 | 19 | 이벤트 append | - |
| 01:49:10.565 | 20 | insert.file.ok | 4714dd7b-ed3a-4520-be3e-818c082b6086 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00112 | 3 | 19 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00112_03_20230923.json |
| 01:49:10.565 | 20 | insert.file.ok | 4714dd7b-ed3a-4520-be3e-818c082b6086 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00117 | 3 | 20 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00117_03_20230923.json |
| 01:49:10.566 | 20 | insert.file.ok | 4714dd7b-ed3a-4520-be3e-818c082b6086 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00120 | 2 | 21 | 이벤트 append | - |
| 01:49:10.566 | 20 | insert.file.ok | 4714dd7b-ed3a-4520-be3e-818c082b6086 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00120 | 2 | 21 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00120_02_20230923.json |
| 01:49:10.567 | 20 | insert.file.ok | 4714dd7b-ed3a-4520-be3e-818c082b6086 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00121 | 2 | 22 | 이벤트 append | - |
| 01:49:10.567 | 20 | insert.file.ok | 4714dd7b-ed3a-4520-be3e-818c082b6086 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00121 | 2 | 22 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00121_02_20230923.json |
| 01:49:10.568 | 20 | insert.file.ok | 4714dd7b-ed3a-4520-be3e-818c082b6086 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00133 | 1 | 23 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00133_01_20230923.json |
| 01:49:10.568 | 20 | insert.file.ok | 4714dd7b-ed3a-4520-be3e-818c082b6086 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00133 | 1 | 23 | 이벤트 append | - |
| 01:49:10.568 | 20 | insert.file.ok | 4714dd7b-ed3a-4520-be3e-818c082b6086 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00133 | 2 | 24 | 이벤트 append | - |
| 01:49:10.569 | 20 | insert.file.ok | 4714dd7b-ed3a-4520-be3e-818c082b6086 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00134 | 1 | 25 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00134_01_20230923.json |
| 01:49:10.569 | 20 | insert.file.ok | 4714dd7b-ed3a-4520-be3e-818c082b6086 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00133 | 2 | 24 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00133_02_20230923.json |
| 01:49:10.569 | 20 | insert.file.ok | 4714dd7b-ed3a-4520-be3e-818c082b6086 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00134 | 1 | 25 | 이벤트 append | - |
| 01:49:10.570 | 40 | insert.file.failed | 4714dd7b-ed3a-4520-be3e-818c082b6086 | - | - | - | toy-data 파일 적재 실패 ← 트립 앵커 | reason=[   {     "expected": "number",     "code": "invalid_type",     "path": [       "grip_succeed"     ],     "message": "Invalid input: expected number, received string"   } ] · file=반려동물용품_CR01_강아지공룡알장난감_02002_01_20230923.json |
| 01:49:10.571 | 30 | insert.batch.done | 4714dd7b-ed3a-4520-be3e-818c082b6086 | - | - | - | toy-data 적재 완료 | - |
| 01:49:10.571 | 40 | insert.file.failed | 4714dd7b-ed3a-4520-be3e-818c082b6086 | - | - | - | toy-data 파일 적재 실패 | reason=[   {     "origin": "number",     "code": "too_big",     "maximum": 1,     "inclusive": true,     "path": [       "grip_succeed"     ],     "message": "Too big: expected number to be <=1"   } ] · file=반려동물용품_CR01_강아지공룡알장난감_02003_01_20230923.json |
| 01:49:10.571 | 30 | - | 4714dd7b-ed3a-4520-be3e-818c082b6086 | - | - | - | request completed | - |
| 01:49:10.574 | 30 | projection.request | 5980a819-dec5-42a3-8a11-879c329ed7dc | - | - | - | projection 요청 수신 | - |
| 01:49:10.575 | 20 | - | 5980a819-dec5-42a3-8a11-879c329ed7dc | - | - | - | 커서 조회 | projector=multimodal-projector |
| 01:49:10.575 | 30 | projection.start | 5980a819-dec5-42a3-8a11-879c329ed7dc | - | - | - | catch-up 시작 | projector=multimodal-projector |
| 01:49:10.577 | 20 | projection.event.mapped | 5980a819-dec5-42a3-8a11-879c329ed7dc | - | 2 | 1 | 이벤트 매핑 | projector=multimodal-projector |
| 01:49:10.577 | 20 | - | 5980a819-dec5-42a3-8a11-879c329ed7dc | - | - | - | 이벤트 조회 | - |
| 01:49:10.579 | 20 | projection.event.mapped | 5980a819-dec5-42a3-8a11-879c329ed7dc | - | 3 | 2 | 이벤트 매핑 | projector=multimodal-projector |

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
- (level 40, `insert.file.failed`) toy-data 파일 적재 실패 ← 트립 앵커 · reason=[ { expected: number, code: invalid_type, path: [ grip_succeed ], message: Invalid input: expected number, received string } ] · file=반려동물용품_CR01_강아지공룡알장난감_02002_01_20230923.json → 원천 파일의 grip_succeed 필드 타입 위반(문자형 입력)으로 Zod 검증이 거절됨. [corr:4714dd7b-ed3a-4520-be3e-818c082b6086]
- (level 40, `insert.file.failed`) toy-data 파일 적재 실패 · reason=[ { origin: number, code: too_big, maximum: 1, inclusive: true, path: [ grip_succeed ], message: Too big: expected number to be <=1 } ] · file=반려동물용품_CR01_강아지공룡알장난감_02003_01_20230923.json → 원천 파일의 grip_succeed 필드 범위 초과(>1)로 Zod 검증이 거절됨. [corr:4714dd7b-ed3a-4520-be3e-818c082b6086]
- src/insert/dto/toy-data.dto.ts의 toyDataSchema 정의(grip_succeed: z.number().int().min(0).max(1))는 엄격히 타입/범위를 강제하나, 실제 적재 요청 payload의 grip_succeed 값이 문자형 또는 초과치로 유입됨. [corr:4714dd7b-ed3a-4520-be3e-818c082b6086]
- read_grip_result 스키마의 grip_succeed:smallint 컬럼은 Read Model 적재 단계가 아닌 영구 저장 단계이므로, Zod 거절 시 해당 파일은 ES 미유입되어 Read Model 구조에 아무 영향이 없음. [corr:4714dd7b-ed3a-4520-be3e-818c082b6086]
- GripResultProjector.map() 호출 시 toyDataSchema.parse(event.payload) 실패 시 throw err로 투영이 차단되나, 이는 시스템의 의도된 방어 동작이며 결함 추적용 신규 테이블이나 스키마 완화를 권고하지. [corr:4714dd7b-ed3a-4520-be3e-818c082b6086]

### Decision Drivers
- Data Integrity Preservation (원천 데이터 무해화 원칙 준수)
- System Boundary Enforcement (Zod 검증 실패으로 ES 미유입 고지)
- Operational Overhead (재투영/audit 오버헤드 최소화)
- Upstream Correction Workflow (external 정화 연필 명확성)

### Considered Options
#### 거절 유지 + 원천 데이터 수정 요청 (권장)
- 접근: src/insert/dto/toy-data.dto.ts Zod 스키마를 현 strict 모드로 고정. 적재 실패 로그(insert.file.failed)를 모니터링 대시보더로 전환해 upstream 데이터 정화 요청을 자동화.
- 제안 필드: toyDataSchema.grip_succeed, insert.service.ts.rejectCounter
- 트레이드오프: 재투영 비용 제로, 원천 데이터 무해화 원칙 준수, 단 외부 수정 워크플로우 연필 필요.
```typescript
// src/insert/dto/toy-data.dto.ts (유지) grip_succeed: z.number().int().min(0).max(1), // src/insert/insert.service.ts (보강) catch(error) { this.logger.warn({ action: LogAction.FILE_REJECTED, reason: error.message }, "적재 거절 → upstream 수정 요청 trigger"); throw error; }
```

#### 무유입 검증 절차 (SQL 격리 확인)
- 접근: event_store 조회 시 failed scene/attempt 키에 대한 미유입(0건)을 검증 SQL 실행으로 정성화.
- 제안 필드: event_store.stream_id, event_store.attempt_num
- 트레이드오프: 커서 전진 무의미하나 일관성 보장, audit phase 오버헤드 미미함.
```typescript
SELECT count(*) FROM event_store WHERE stream_id = 'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02002' AND attempt_num = 1; -- 기대값 0
```

### Decision Outcome
거절 유지 + 원천 데이터 수정 요청 (권장)

### Consequences
- (+) Read Model 오염 차단
- (+) ES 미유입 일관성 보장
- (+) audit SQL 검증으로 격리 확신
- (−) 원천 데이터 수정 지연 시 투영 누락 발생
- (−) external workflow 연필 필요

### Non-Goals
- Zod 스키마 완화(optional 화)
- z.coerce/기본값 치환
- 결함 추적용 신규 테이블 생성

## 2. Read Model 생성 SQL (Read Model DDL)

> 실행 게이트: 아래 변경은 인간 승인 후에만 적용한다 (human-in-the-loop).

### 격리(containment) SQL — 신규 Read Model DDL 불필요, 결함 데이터 무해화가 조치다

```sql
-- 무유입 검증: zod 거절된 파일의 이벤트가 event_store 에 유입되지 않았음을 확인한다 (기대값 0)
SELECT count(*) AS rejected_event_count FROM event_store WHERE (stream_id, attempt_num) IN (('grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02002', 1), ('grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02003', 1));
```

## 3. API Versioning

### 버전 영향

변 변경 없음. Zod 검증 로직과 Read Model 스키마·엔드포인트가 불변이며, 격리 권고는 운영 관행(모니터링/SQL 검증)에 머무므로 API 계약이 그대로 유지된다.

## Guardrails (constraints)

- v1 자산(테이블/엔드포인트/프로젝터 name) 무손상
- PK (scene_key, attempt_num) 유지
- TypeScript any 금지
- 식별자 전체 단어
- DDL 실행·API 컷오버는 인간 승인 후에만 (human-in-the-loop)
- Read Model 테이블명은 read_ 접두 스네이크 케이스
<<<Docs 끝>>>

[채점 루브릭] 각 항목 1~5 정수
- groundedness (근거 충실성): Docs 가 인용한 값·필드·장면 번호·로그가 [자료]에 실제로 있는가. [저장소 파일 확인]에서 실재하는 파일의 경로·스키마·메서드 인용은 근거 없는 주장으로 보지 않는다. 존재하지 않는 파일이나 발췌와 다른 내용의 인용은 감점한다. 5=인용된 값·필드·장면이 모두 자료에 실재. 3=핵심 근거는 실재하나 일부 수치·부등호가 원문과 불일치. 1=근거 없는 주장이나 존재하지 않는 값의 인용이 결론을 좌우.
- diagnosisAccuracy (원인 진단 정확성): Docs 의 진단이 [정답 요지]와 일치하는가. 5=정답 원인과 유형·위치(필드, 장면, 처리 단계)까지 일치. 3=유형은 맞으나 위치나 메커니즘이 부정확. 1=오진이거나 원인을 특정하지 못함.
- actionability (실행 가능성): Docs 의 SQL 과 절차를 그대로 따르면 문제가 해결되는가. [자동 검증 결과]를 실측으로 반영하되, 실행이 되더라도 의도와 다른 일을 하는 SQL(조건이 한 건도 맞지 않는 삭제문, 요구한 컬럼이 없는 테이블 등)은 감점한다. 기존 v1 테이블(read_grip_result, read_multimodal, event_store)을 ALTER/DROP 하면 감점. 5=그대로 따르면 해결(실행 성공 + 요구 충족). 3=오탈자·순서 등 소폭 수정 후 해결. 1=따르면 실패하거나 기존 자산이 손상.
- completeness (완결성): 권고 문서, Read Model 생성 SQL, API 버저닝 세 요소가 모두 유효하고 서로 일치하는가(머리말·SQL 의 테이블명·권고 대상·코드가 서로 같은 것을 가리키는가). 5=세 요소가 모두 유효하고 서로 일치. 3=세 요소가 있으나 서로 어긋나거나 항목이 비어 있음. 1=요소 누락 또는 근거 부족 표시.

다음 형식의 JSON 객체 하나만 출력하라:
{"groundedness": 1-5, "diagnosisAccuracy": 1-5, "actionability": 1-5, "completeness": 1-5, "unsupportedClaims": ["자료에 없는 주장 인용 (없으면 빈 배열)"], "rationale": "각 항목 점수 근거를 항목당 1~2문장으로, 한국어로"}
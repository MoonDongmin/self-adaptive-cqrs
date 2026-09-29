당신은 이벤트 소싱 + CQRS 기반 Physical AI 데이터 플랫폼의 시니어 아키텍트이자 엄격한 평가자다. LLM 파이프라인이 [자료](로그·이벤트·스키마 정보)를 보고 [Docs]를 생성했다. Docs 는 권고 문서, Read Model 생성 SQL, API 버저닝 세 요소를 항상 함께 담아야 하는 단일 산출물이다. 당신은 [정답 요지]와 [자료], [자동 검증 결과]를 기준으로 Docs 를 네 항목의 루브릭으로 채점한다. 채점은 관대하지 않게, 근거 없는 주장·지어낸 값·의도와 다른 SQL·서로 어긋나는 절에는 낮은 점수를 준다. 실행·컴파일이 통과했다는 사실만으로 실행 가능성이나 완결성에 높은 점수를 주지 않는다. SQL 과 코드 블록을 실제로 읽고 루브릭의 점검 항목을 하나씩 확인한다. 반드시 JSON 객체 하나만 출력한다. 설명문·마크다운 펜스는 출력하지 않는다.

---

[시나리오] A2-type-mismatch
[상황] 운영 중 시스템이 적재 검증 실패(zod 거부) 로그를 감지했다.
[정답 요지] grip_succeed 가 타입/도메인 위반(문자열 "true", 도메인 밖 정수 2)으로 zod 검증에 걸려 적재가 거부됨. JSON 자체는 유효. 조치: 거부 건을 추적할 수 있는 Read Model/검증 로그 보강과 클라이언트 타입 정규화 권고, v1 무손상.

[자료] — Docs 생성 시 파이프라인이 받은 로그·이벤트·스키마 정보
<<<자료 시작>>>
<logging_context>
## 이상 로그 맥락 (±N 윈도우)
> 빈도: 최근 1h — `insert.request`(level 30) 1회, `insert.file.failed`(level 40) 1회, `insert.batch.start`(level 30) 1회, `log.delete.request`(level 30) 1회, `log.delete.done`(level 30) 1회, `insert.file.ok`(level 20) 50회, `insight.cards.request`(level 30) 2회, `-`(level 30) 3회, `insight.card.rendered`(level 20) 6회, `-`(level 20) 8회.

| time | level | action | correlation_id | stream_id | attempt | global_seq | msg | detail |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 19:40:46.563 | 30 | insert.request | ac26991b-9f8d-4831-b386-957e1b997958 | - | - | - | Insert Event Store 요청 수신 | - |
| 19:40:46.564 | 30 | insert.batch.start | ac26991b-9f8d-4831-b386-957e1b997958 | - | - | - | Toy-Data 적재 시작 | - |
| 19:40:46.569 | 20 | insert.file.ok | ac26991b-9f8d-4831-b386-957e1b997958 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00051 | 2 | 1 | 이벤트 append | - |
| 19:40:46.569 | 20 | insert.file.ok | ac26991b-9f8d-4831-b386-957e1b997958 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00051 | 2 | 1 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00051_02_20230923.json |
| 19:40:46.570 | 20 | insert.file.ok | ac26991b-9f8d-4831-b386-957e1b997958 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00055 | 3 | 2 | 이벤트 append | - |
| 19:40:46.570 | 20 | insert.file.ok | ac26991b-9f8d-4831-b386-957e1b997958 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00055 | 3 | 2 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00055_03_20230923.json |
| 19:40:46.571 | 20 | insert.file.ok | ac26991b-9f8d-4831-b386-957e1b997958 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00056 | 2 | 3 | 이벤트 append | - |
| 19:40:46.571 | 20 | insert.file.ok | ac26991b-9f8d-4831-b386-957e1b997958 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00056 | 2 | 3 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00056_02_20230923.json |
| 19:40:46.572 | 20 | insert.file.ok | ac26991b-9f8d-4831-b386-957e1b997958 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00059 | 2 | 4 | 이벤트 append | - |
| 19:40:46.572 | 20 | insert.file.ok | ac26991b-9f8d-4831-b386-957e1b997958 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00059 | 2 | 4 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00059_02_20230923.json |
| 19:40:46.573 | 20 | insert.file.ok | ac26991b-9f8d-4831-b386-957e1b997958 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00061 | 3 | 5 | 이벤트 append | - |
| 19:40:46.573 | 20 | insert.file.ok | ac26991b-9f8d-4831-b386-957e1b997958 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00061 | 3 | 5 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00061_03_20230923.json |
| 19:40:46.574 | 20 | insert.file.ok | ac26991b-9f8d-4831-b386-957e1b997958 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00071 | 3 | 6 | 이벤트 append | - |
| 19:40:46.574 | 20 | insert.file.ok | ac26991b-9f8d-4831-b386-957e1b997958 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00071 | 3 | 6 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00071_03_20230923.json |
| 19:40:46.575 | 20 | insert.file.ok | ac26991b-9f8d-4831-b386-957e1b997958 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00072 | 1 | 7 | 이벤트 append | - |
| 19:40:46.575 | 20 | insert.file.ok | ac26991b-9f8d-4831-b386-957e1b997958 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00072 | 1 | 7 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00072_01_20230923.json |
| 19:40:46.576 | 20 | insert.file.ok | ac26991b-9f8d-4831-b386-957e1b997958 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00079 | 2 | 9 | 이벤트 append | - |
| 19:40:46.576 | 20 | insert.file.ok | ac26991b-9f8d-4831-b386-957e1b997958 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00074 | 3 | 8 | 이벤트 append | - |
| 19:40:46.576 | 20 | insert.file.ok | ac26991b-9f8d-4831-b386-957e1b997958 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00074 | 3 | 8 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00074_03_20230923.json |
| 19:40:46.576 | 20 | insert.file.ok | ac26991b-9f8d-4831-b386-957e1b997958 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00079 | 2 | 9 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00079_02_20230923.json |
| 19:40:46.577 | 20 | insert.file.ok | ac26991b-9f8d-4831-b386-957e1b997958 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00080 | 2 | 10 | 이벤트 append | - |
| 19:40:46.577 | 20 | insert.file.ok | ac26991b-9f8d-4831-b386-957e1b997958 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00080 | 2 | 10 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00080_02_20230923.json |
| 19:40:46.578 | 20 | insert.file.ok | ac26991b-9f8d-4831-b386-957e1b997958 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00097 | 1 | 11 | 이벤트 append | - |
| 19:40:46.578 | 20 | insert.file.ok | ac26991b-9f8d-4831-b386-957e1b997958 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00097 | 1 | 11 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00097_01_20230923.json |
| 19:40:46.579 | 20 | insert.file.ok | ac26991b-9f8d-4831-b386-957e1b997958 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00100 | 2 | 12 | 이벤트 append | - |
| 19:40:46.579 | 20 | insert.file.ok | ac26991b-9f8d-4831-b386-957e1b997958 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00100 | 2 | 12 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00100_02_20230923.json |
| 19:40:46.580 | 20 | insert.file.ok | ac26991b-9f8d-4831-b386-957e1b997958 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00103 | 1 | 13 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00103_01_20230923.json |
| 19:40:46.580 | 20 | insert.file.ok | ac26991b-9f8d-4831-b386-957e1b997958 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00103 | 1 | 13 | 이벤트 append | - |
| 19:40:46.580 | 20 | insert.file.ok | ac26991b-9f8d-4831-b386-957e1b997958 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00103 | 2 | 14 | 이벤트 append | - |
| 19:40:46.580 | 20 | insert.file.ok | ac26991b-9f8d-4831-b386-957e1b997958 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00103 | 2 | 14 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00103_02_20230923.json |
| 19:40:46.581 | 20 | insert.file.ok | ac26991b-9f8d-4831-b386-957e1b997958 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00106 | 1 | 15 | 이벤트 append | - |
| 19:40:46.581 | 20 | insert.file.ok | ac26991b-9f8d-4831-b386-957e1b997958 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00106 | 1 | 15 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00106_01_20230923.json |
| 19:40:46.582 | 20 | insert.file.ok | ac26991b-9f8d-4831-b386-957e1b997958 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00108 | 2 | 16 | 이벤트 append | - |
| 19:40:46.582 | 20 | insert.file.ok | ac26991b-9f8d-4831-b386-957e1b997958 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00108 | 2 | 16 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00108_02_20230923.json |
| 19:40:46.583 | 20 | insert.file.ok | ac26991b-9f8d-4831-b386-957e1b997958 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00109 | 1 | 17 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00109_01_20230923.json |
| 19:40:46.583 | 20 | insert.file.ok | ac26991b-9f8d-4831-b386-957e1b997958 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00109 | 1 | 17 | 이벤트 append | - |
| 19:40:46.584 | 20 | insert.file.ok | ac26991b-9f8d-4831-b386-957e1b997958 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00112 | 3 | 19 | 이벤트 append | - |
| 19:40:46.584 | 20 | insert.file.ok | ac26991b-9f8d-4831-b386-957e1b997958 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00110 | 3 | 18 | 이벤트 append | - |
| 19:40:46.584 | 20 | insert.file.ok | ac26991b-9f8d-4831-b386-957e1b997958 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00110 | 3 | 18 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00110_03_20230923.json |
| 19:40:46.584 | 20 | insert.file.ok | ac26991b-9f8d-4831-b386-957e1b997958 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00112 | 3 | 19 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00112_03_20230923.json |
| 19:40:46.585 | 20 | insert.file.ok | ac26991b-9f8d-4831-b386-957e1b997958 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00117 | 3 | 20 | 이벤트 append | - |
| 19:40:46.585 | 20 | insert.file.ok | ac26991b-9f8d-4831-b386-957e1b997958 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00117 | 3 | 20 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00117_03_20230923.json |
| 19:40:46.586 | 20 | insert.file.ok | ac26991b-9f8d-4831-b386-957e1b997958 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00121 | 2 | 22 | 이벤트 append | - |
| 19:40:46.586 | 20 | insert.file.ok | ac26991b-9f8d-4831-b386-957e1b997958 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00120 | 2 | 21 | 이벤트 append | - |
| 19:40:46.586 | 20 | insert.file.ok | ac26991b-9f8d-4831-b386-957e1b997958 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00120 | 2 | 21 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00120_02_20230923.json |
| 19:40:46.586 | 20 | insert.file.ok | ac26991b-9f8d-4831-b386-957e1b997958 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00121 | 2 | 22 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00121_02_20230923.json |
| 19:40:46.587 | 20 | insert.file.ok | ac26991b-9f8d-4831-b386-957e1b997958 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00133 | 1 | 23 | 이벤트 append | - |
| 19:40:46.587 | 20 | insert.file.ok | ac26991b-9f8d-4831-b386-957e1b997958 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00133 | 1 | 23 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00133_01_20230923.json |
| 19:40:46.588 | 20 | insert.file.ok | ac26991b-9f8d-4831-b386-957e1b997958 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00133 | 2 | 24 | 이벤트 append | - |
| 19:40:46.588 | 20 | insert.file.ok | ac26991b-9f8d-4831-b386-957e1b997958 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00133 | 2 | 24 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00133_02_20230923.json |
| 19:40:46.589 | 20 | insert.file.ok | ac26991b-9f8d-4831-b386-957e1b997958 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00134 | 1 | 25 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00134_01_20230923.json |
| 19:40:46.589 | 20 | insert.file.ok | ac26991b-9f8d-4831-b386-957e1b997958 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00134 | 1 | 25 | 이벤트 append | - |
| 19:40:46.589 | 40 | insert.file.failed | ac26991b-9f8d-4831-b386-957e1b997958 | - | - | - | toy-data 파일 적재 실패 ← 트립 앵커 | reason=[   {     "expected": "number",     "code": "invalid_type",     "path": [       "grip_succeed"     ],     "message": "Invalid input: expected number, received string"   } ] · file=반려동물용품_CR01_강아지공룡알장난감_02002_01_20230923.json |
| 19:40:46.590 | 40 | insert.file.failed | ac26991b-9f8d-4831-b386-957e1b997958 | - | - | - | toy-data 파일 적재 실패 | reason=[   {     "origin": "number",     "code": "too_big",     "maximum": 1,     "inclusive": true,     "path": [       "grip_succeed"     ],     "message": "Too big: expected number to be <=1"   } ] · file=반려동물용품_CR01_강아지공룡알장난감_02003_01_20230923.json |
| 19:40:46.590 | 30 | insert.batch.done | ac26991b-9f8d-4831-b386-957e1b997958 | - | - | - | toy-data 적재 완료 | - |
| 19:40:46.591 | 30 | - | ac26991b-9f8d-4831-b386-957e1b997958 | - | - | - | request completed | - |
| 19:40:46.593 | 30 | projection.request | a60f2102-3814-4f3e-b87d-c0ed9f9b5c1c | - | - | - | projection 요청 수신 | - |
| 19:40:46.595 | 20 | - | a60f2102-3814-4f3e-b87d-c0ed9f9b5c1c | - | - | - | 커서 조회 | projector=multimodal-projector |
| 19:40:46.595 | 30 | projection.start | a60f2102-3814-4f3e-b87d-c0ed9f9b5c1c | - | - | - | catch-up 시작 | projector=multimodal-projector |
| 19:40:46.596 | 20 | - | a60f2102-3814-4f3e-b87d-c0ed9f9b5c1c | - | - | - | 이벤트 조회 | - |
| 19:40:46.597 | 20 | projection.event.mapped | a60f2102-3814-4f3e-b87d-c0ed9f9b5c1c | - | 2 | 1 | 이벤트 매핑 | projector=multimodal-projector |
| 19:40:46.598 | 20 | projection.event.mapped | a60f2102-3814-4f3e-b87d-c0ed9f9b5c1c | - | 2 | 3 | 이벤트 매핑 | projector=multimodal-projector |
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
- 저장소에 실재하는 파일 (1건): src/insert/dto/toy-data.dto.ts
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

[Docs] — 채점 대상 문서 전문
<<<Docs 시작>>>
---
docId: analysis-ac26991b-9f8d-4831-b386-957e1b997958
generatedAt: 2026-08-11T19:40:49.012Z
targetReadModel: read_grip_result
sqlDialect: postgres
sufficientEvidence: true
apiVersion:
  from: null
  to: null
  affectedEndpoints: []
evidenceSources:
  - { origin: developer-logging, anchorId: "ac26991b-9f8d-4831-b386-957e1b997958" }
constraints:
  - "v1 자산(테이블/엔드포인트/프로젝터 name) 무손상"
  - "PK (scene_key, attempt_num) 유지"
  - "TypeScript any 금지"
  - "식별자 전체 단어"
  - "DDL 실행·API 컷오버는 인간 승인 후에만 (human-in-the-loop)"
  - "Read Model 테이블명은 read_ 접두 스네이크 케이스"
---

# Self-Adaptive CQRS Docs — read_grip_result

> 결론(TL;DR): `read_grip_result`을(를) 보강한다 — toy-data 적재(batch) 중 2건의 파일에서 grip_succeed 필드 값이 이벤트 스키마(GripAttemptRecorded)를 위배하여 적재 검증 실패(insert.file.failed)가 발생. 나머지 파일과 후속 투영은 정상 진행. (이상 유형: 이벤트 스키마 위배(Payload Type Mismatch) · 심각도: warning)

<logging_context>

## 이상 로그 맥락 (±N 윈도우)
> 빈도: 최근 1h — `insert.request`(level 30) 1회, `insert.file.failed`(level 40) 1회, `insert.batch.start`(level 30) 1회, `log.delete.request`(level 30) 1회, `log.delete.done`(level 30) 1회, `insert.file.ok`(level 20) 50회, `insight.cards.request`(level 30) 2회, `-`(level 30) 3회, `insight.card.rendered`(level 20) 6회, `-`(level 20) 8회.

| time | level | action | correlation_id | stream_id | attempt | global_seq | msg | detail |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 19:40:46.563 | 30 | insert.request | ac26991b-9f8d-4831-b386-957e1b997958 | - | - | - | Insert Event Store 요청 수신 | - |
| 19:40:46.564 | 30 | insert.batch.start | ac26991b-9f8d-4831-b386-957e1b997958 | - | - | - | Toy-Data 적재 시작 | - |
| 19:40:46.569 | 20 | insert.file.ok | ac26991b-9f8d-4831-b386-957e1b997958 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00051 | 2 | 1 | 이벤트 append | - |
| 19:40:46.569 | 20 | insert.file.ok | ac26991b-9f8d-4831-b386-957e1b997958 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00051 | 2 | 1 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00051_02_20230923.json |
| 19:40:46.570 | 20 | insert.file.ok | ac26991b-9f8d-4831-b386-957e1b997958 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00055 | 3 | 2 | 이벤트 append | - |
| 19:40:46.570 | 20 | insert.file.ok | ac26991b-9f8d-4831-b386-957e1b997958 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00055 | 3 | 2 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00055_03_20230923.json |
| 19:40:46.571 | 20 | insert.file.ok | ac26991b-9f8d-4831-b386-957e1b997958 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00056 | 2 | 3 | 이벤트 append | - |
| 19:40:46.571 | 20 | insert.file.ok | ac26991b-9f8d-4831-b386-957e1b997958 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00056 | 2 | 3 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00056_02_20230923.json |
| 19:40:46.572 | 20 | insert.file.ok | ac26991b-9f8d-4831-b386-957e1b997958 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00059 | 2 | 4 | 이벤트 append | - |
| 19:40:46.572 | 20 | insert.file.ok | ac26991b-9f8d-4831-b386-957e1b997958 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00059 | 2 | 4 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00059_02_20230923.json |
| 19:40:46.573 | 20 | insert.file.ok | ac26991b-9f8d-4831-b386-957e1b997958 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00061 | 3 | 5 | 이벤트 append | - |
| 19:40:46.573 | 20 | insert.file.ok | ac26991b-9f8d-4831-b386-957e1b997958 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00061 | 3 | 5 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00061_03_20230923.json |
| 19:40:46.574 | 20 | insert.file.ok | ac26991b-9f8d-4831-b386-957e1b997958 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00071 | 3 | 6 | 이벤트 append | - |
| 19:40:46.574 | 20 | insert.file.ok | ac26991b-9f8d-4831-b386-957e1b997958 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00071 | 3 | 6 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00071_03_20230923.json |
| 19:40:46.575 | 20 | insert.file.ok | ac26991b-9f8d-4831-b386-957e1b997958 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00072 | 1 | 7 | 이벤트 append | - |
| 19:40:46.575 | 20 | insert.file.ok | ac26991b-9f8d-4831-b386-957e1b997958 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00072 | 1 | 7 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00072_01_20230923.json |
| 19:40:46.576 | 20 | insert.file.ok | ac26991b-9f8d-4831-b386-957e1b997958 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00079 | 2 | 9 | 이벤트 append | - |
| 19:40:46.576 | 20 | insert.file.ok | ac26991b-9f8d-4831-b386-957e1b997958 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00074 | 3 | 8 | 이벤트 append | - |
| 19:40:46.576 | 20 | insert.file.ok | ac26991b-9f8d-4831-b386-957e1b997958 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00074 | 3 | 8 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00074_03_20230923.json |
| 19:40:46.576 | 20 | insert.file.ok | ac26991b-9f8d-4831-b386-957e1b997958 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00079 | 2 | 9 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00079_02_20230923.json |
| 19:40:46.577 | 20 | insert.file.ok | ac26991b-9f8d-4831-b386-957e1b997958 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00080 | 2 | 10 | 이벤트 append | - |
| 19:40:46.577 | 20 | insert.file.ok | ac26991b-9f8d-4831-b386-957e1b997958 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00080 | 2 | 10 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00080_02_20230923.json |
| 19:40:46.578 | 20 | insert.file.ok | ac26991b-9f8d-4831-b386-957e1b997958 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00097 | 1 | 11 | 이벤트 append | - |
| 19:40:46.578 | 20 | insert.file.ok | ac26991b-9f8d-4831-b386-957e1b997958 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00097 | 1 | 11 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00097_01_20230923.json |
| 19:40:46.579 | 20 | insert.file.ok | ac26991b-9f8d-4831-b386-957e1b997958 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00100 | 2 | 12 | 이벤트 append | - |
| 19:40:46.579 | 20 | insert.file.ok | ac26991b-9f8d-4831-b386-957e1b997958 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00100 | 2 | 12 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00100_02_20230923.json |
| 19:40:46.580 | 20 | insert.file.ok | ac26991b-9f8d-4831-b386-957e1b997958 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00103 | 1 | 13 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00103_01_20230923.json |
| 19:40:46.580 | 20 | insert.file.ok | ac26991b-9f8d-4831-b386-957e1b997958 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00103 | 1 | 13 | 이벤트 append | - |
| 19:40:46.580 | 20 | insert.file.ok | ac26991b-9f8d-4831-b386-957e1b997958 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00103 | 2 | 14 | 이벤트 append | - |
| 19:40:46.580 | 20 | insert.file.ok | ac26991b-9f8d-4831-b386-957e1b997958 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00103 | 2 | 14 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00103_02_20230923.json |
| 19:40:46.581 | 20 | insert.file.ok | ac26991b-9f8d-4831-b386-957e1b997958 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00106 | 1 | 15 | 이벤트 append | - |
| 19:40:46.581 | 20 | insert.file.ok | ac26991b-9f8d-4831-b386-957e1b997958 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00106 | 1 | 15 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00106_01_20230923.json |
| 19:40:46.582 | 20 | insert.file.ok | ac26991b-9f8d-4831-b386-957e1b997958 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00108 | 2 | 16 | 이벤트 append | - |
| 19:40:46.582 | 20 | insert.file.ok | ac26991b-9f8d-4831-b386-957e1b997958 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00108 | 2 | 16 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00108_02_20230923.json |
| 19:40:46.583 | 20 | insert.file.ok | ac26991b-9f8d-4831-b386-957e1b997958 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00109 | 1 | 17 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00109_01_20230923.json |
| 19:40:46.583 | 20 | insert.file.ok | ac26991b-9f8d-4831-b386-957e1b997958 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00109 | 1 | 17 | 이벤트 append | - |
| 19:40:46.584 | 20 | insert.file.ok | ac26991b-9f8d-4831-b386-957e1b997958 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00112 | 3 | 19 | 이벤트 append | - |
| 19:40:46.584 | 20 | insert.file.ok | ac26991b-9f8d-4831-b386-957e1b997958 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00110 | 3 | 18 | 이벤트 append | - |
| 19:40:46.584 | 20 | insert.file.ok | ac26991b-9f8d-4831-b386-957e1b997958 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00110 | 3 | 18 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00110_03_20230923.json |
| 19:40:46.584 | 20 | insert.file.ok | ac26991b-9f8d-4831-b386-957e1b997958 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00112 | 3 | 19 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00112_03_20230923.json |
| 19:40:46.585 | 20 | insert.file.ok | ac26991b-9f8d-4831-b386-957e1b997958 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00117 | 3 | 20 | 이벤트 append | - |
| 19:40:46.585 | 20 | insert.file.ok | ac26991b-9f8d-4831-b386-957e1b997958 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00117 | 3 | 20 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00117_03_20230923.json |
| 19:40:46.586 | 20 | insert.file.ok | ac26991b-9f8d-4831-b386-957e1b997958 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00121 | 2 | 22 | 이벤트 append | - |
| 19:40:46.586 | 20 | insert.file.ok | ac26991b-9f8d-4831-b386-957e1b997958 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00120 | 2 | 21 | 이벤트 append | - |
| 19:40:46.586 | 20 | insert.file.ok | ac26991b-9f8d-4831-b386-957e1b997958 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00120 | 2 | 21 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00120_02_20230923.json |
| 19:40:46.586 | 20 | insert.file.ok | ac26991b-9f8d-4831-b386-957e1b997958 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00121 | 2 | 22 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00121_02_20230923.json |
| 19:40:46.587 | 20 | insert.file.ok | ac26991b-9f8d-4831-b386-957e1b997958 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00133 | 1 | 23 | 이벤트 append | - |
| 19:40:46.587 | 20 | insert.file.ok | ac26991b-9f8d-4831-b386-957e1b997958 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00133 | 1 | 23 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00133_01_20230923.json |
| 19:40:46.588 | 20 | insert.file.ok | ac26991b-9f8d-4831-b386-957e1b997958 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00133 | 2 | 24 | 이벤트 append | - |
| 19:40:46.588 | 20 | insert.file.ok | ac26991b-9f8d-4831-b386-957e1b997958 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00133 | 2 | 24 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00133_02_20230923.json |
| 19:40:46.589 | 20 | insert.file.ok | ac26991b-9f8d-4831-b386-957e1b997958 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00134 | 1 | 25 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00134_01_20230923.json |
| 19:40:46.589 | 20 | insert.file.ok | ac26991b-9f8d-4831-b386-957e1b997958 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00134 | 1 | 25 | 이벤트 append | - |
| 19:40:46.589 | 40 | insert.file.failed | ac26991b-9f8d-4831-b386-957e1b997958 | - | - | - | toy-data 파일 적재 실패 ← 트립 앵커 | reason=[   {     "expected": "number",     "code": "invalid_type",     "path": [       "grip_succeed"     ],     "message": "Invalid input: expected number, received string"   } ] · file=반려동물용품_CR01_강아지공룡알장난감_02002_01_20230923.json |
| 19:40:46.590 | 40 | insert.file.failed | ac26991b-9f8d-4831-b386-957e1b997958 | - | - | - | toy-data 파일 적재 실패 | reason=[   {     "origin": "number",     "code": "too_big",     "maximum": 1,     "inclusive": true,     "path": [       "grip_succeed"     ],     "message": "Too big: expected number to be <=1"   } ] · file=반려동물용품_CR01_강아지공룡알장난감_02003_01_20230923.json |
| 19:40:46.590 | 30 | insert.batch.done | ac26991b-9f8d-4831-b386-957e1b997958 | - | - | - | toy-data 적재 완료 | - |
| 19:40:46.591 | 30 | - | ac26991b-9f8d-4831-b386-957e1b997958 | - | - | - | request completed | - |
| 19:40:46.593 | 30 | projection.request | a60f2102-3814-4f3e-b87d-c0ed9f9b5c1c | - | - | - | projection 요청 수신 | - |
| 19:40:46.595 | 20 | - | a60f2102-3814-4f3e-b87d-c0ed9f9b5c1c | - | - | - | 커서 조회 | projector=multimodal-projector |
| 19:40:46.595 | 30 | projection.start | a60f2102-3814-4f3e-b87d-c0ed9f9b5c1c | - | - | - | catch-up 시작 | projector=multimodal-projector |
| 19:40:46.596 | 20 | - | a60f2102-3814-4f3e-b87d-c0ed9f9b5c1c | - | - | - | 이벤트 조회 | - |
| 19:40:46.597 | 20 | projection.event.mapped | a60f2102-3814-4f3e-b87d-c0ed9f9b5c1c | - | 2 | 1 | 이벤트 매핑 | projector=multimodal-projector |
| 19:40:46.598 | 20 | projection.event.mapped | a60f2102-3814-4f3e-b87d-c0ed9f9b5c1c | - | 2 | 3 | 이벤트 매핑 | projector=multimodal-projector |

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
- (level 40, `insert.file.failed`) toy-data 파일 적재 실패 ← 트립 앵커 · file=반려동물용품_CR01_강아지공룡알장난감_02002_01_20230923.json [corr:ac26991b-9f8d-4831-b386-957e1b997958] → 원천 파일의 grip_succeed 필드 누락/타입 위반 [corr:ac26991b-9f8d-4831-b386-957e1b997958] [corr:ac26991b-9f8d-4831-b386-957e1b997958]
- (level 40, `insert.file.failed`) toy-data 파일 적재 실패 · file=반려동물용품_CR01_강아지공룡알장난감_02003_01_20230923.json [corr:ac26991b-9f8d-4831-b386-957e1b997958] → 원천 파일의 grip_succeed 필드 누락/타입 위반 [corr:ac26991b-9f8d-4831-b386-957e1b997958] [corr:ac26991b-9f8d-4831-b386-957e1b997958]
- GripAttemptRecorded Insight 카드의 grip_succeed:number 정의와 src/insert/dto/toy-data.dto.ts 의 z.number().int().min(0).max(1) 검증 로직이 일치하나, 적재 단계 Zod 거절(insert.file.failed)은 원천 파일의 필드 타입/치 범위 위배로 Read Model 구조는 정상이다. [corr:ac26991b-9f8d-4831-b386-957e1b997958]
- insert.file.failed 발생 시 event_store 미유입이므로 read_grip_result 및 read_multimodal 테이블의 커서/행 상태는 무해화되지, 결함 데이터는 적재 단계 차단된 원천 파일만 해당된다. [corr:ac26991b-9f8d-4831-b386-957e1b997958]
- GripResultProjector.map 의 toyDataSchema.parse(event.payload) 는 미유입 이벤트가 도달하지 않아 투영 실패(poison event) 발생을 배제, 시스템의 intended Zod 방어 동작이 정지 상태이므로 Read Model 보강은 결함 격리 권고만 해당된다. [corr:ac26991b-9f8d-4831-b386-957e1b997958]

### Decision Drivers
- System Integrity (Zod rejection as intended defense)
- Source Data Fidelity (preserve original defect for correction request)
- Operational Overhead (minimize DB/Code changes)

### Considered Options
#### sourceDataCorrection
- 접근: 유지 Zod 거절 + 원천 파일 수정 요청
- 제안 필드: toyDataSchema, insertService
- 트레이드오프: Zero code risk, preserves integrity, requires external workflow
```typescript
(existing toyDataSchema validation remains unchanged)
```

#### noInflowVerification
- 접근: 무유입 검증 SQL 추가
- 제안 필드: eventStoreReaderRepository
- 트레이드오프: Adds DB overhead, confirms boundary correctly
```typescript
SELECT count(*) FROM event_store WHERE stream_id = 'grip-attempt:02002' AND attempt_num = 1; -- 기대값 0
```

#### schemaRelaxation
- 접근: zod coerce/optional 화
- 제안 필드: toyDataSchema
- 트레이드오프: Violates defector value harmless principle, masks source defects, fails Driver System Integrity
```typescript
(기각 대안)
```

### Decision Outcome
sourceDataCorrection

### Consequences
- (+) Maintains strict payload validation
- (+) Prevents poisoned Read Model state
- (+) Clear audit trail for data correction
- (−) Requires external workflow for file correction
- (−) Batch processing pauses until corrected (acceptable per lane)

### Non-Goals
- Modifying Zod schema to coerce defaults
- Altering projector logic to skip failed events
- Creating new tracking tables

## 2. Read Model 생성 SQL (Read Model DDL)

> 실행 게이트: 아래 변경은 인간 승인 후에만 적용한다 (human-in-the-loop).

### 격리(containment) SQL — 신규 Read Model DDL 불필요, 결함 데이터 무해화가 조치다

```sql
-- 무유입 검증: zod 거절된 파일의 이벤트가 event_store 에 유입되지 않았음을 확인한다 (기대값 0)
SELECT count(*) AS rejected_event_count FROM event_store WHERE (stream_id, attempt_num) IN (('grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02002', 1), ('grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02003', 1));
```

## 3. API Versioning

### 버전 영향

변 변경 없음. 스키마와 엔드포인트가 불변이며, Zod 검증 로직(toyDataSchema)이 그대로 유지되어 적재 단계의 방어 동작은 시스템 의도된 정지 상태이므로 외부 버전 호환이 필요하지.

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
- actionability (실행 가능성): Docs 의 SQL 과 절차를 그대로 따르면 문제가 해결되는가. [자동 검증 결과]를 실측으로 반영하되, 실행·컴파일이 되더라도 의도와 다른 일을 하는 코드는 감점한다. 반드시 다음을 직접 확인한다: (1) 프로젝션 로직이 DDL 의 NOT NULL 컬럼에 null 이나 TODO 를 넣어 실제 적재 시 실패하지 않는가, (2) upsert 의 excluded. 뒤 식별자가 DDL 의 실제 컬럼명(snake_case)인가, (3) 비율·평균 계산이 정수 나눗셈으로 0/1 만 저장되지 않는가, (4) 정답이 요구한 값(성공률·실패율 등)이 실제 컬럼으로 존재하는가, (5) CHECK 제약이 플래그로 격리해야 할 바로 그 행의 적재를 막아 설계와 모순되지 않는가, (6) 기각했다고 쓴 조치(DELETE 등)를 즉시 격리 SQL 로 그대로 싣지 않았는가, (7) 기존 v1 테이블(read_grip_result, read_multimodal, event_store)의 행을 ALTER/DROP/DELETE 하지 않는가, (8) 정답 요지가 Read Model 보강을 요구하는데 검증용 SELECT 만 있지 않은가. 5=그대로 따르면 해결(실행 성공 + 요구 충족, 위 결함 없음). 4=위 결함 중 사소한 것 1개. 3=오탈자·순서·식별자 등 소폭 수정 후 해결. 2=따르면 적재·투영이 실패하거나 요구한 값을 얻지 못함. 1=따르면 기존 자산이 손상되거나 무관함.
- completeness (완결성): 권고 문서, Read Model 생성 SQL, API 버저닝 세 요소가 모두 유효하고 서로 일치하는가. 반드시 다음을 직접 확인한다: (1) TL;DR·머리말의 대상 테이블과 DDL 의 테이블명이 같은가, (2) 권고(Decision Outcome, Non-Goals)와 실제 SQL·코드가 모순되지 않는가(예: '보강한다'고 쓰고 '구조 변경 없음'이라 함, '기존 확장'이라 쓰고 신규 테이블을 만듦), (3) 코드 블록 사이의 클래스명·파일명·라우트명·export 경로가 서로 같은가, (4) DDL 의 nullable 과 ORM 스키마의 notNull 이 일치하는가, (5) 권고 절이 '재실행 권장'·'최소 근거만 수록' 같은 대체 스텁이 아닌가, (6) API 버저닝 절이 비어 있거나 문장이 끊기지 않았는가. 5=세 요소가 모두 유효하고 서로 일치. 4=사소한 불일치 1개. 3=세 요소가 있으나 서로 어긋나거나 항목이 비어 있음. 2=한 요소가 실질적으로 비어 있음(예: DDL 절에 검증 SELECT 만). 1=요소 누락 또는 근거 부족 표시.

다음 형식의 JSON 객체 하나만 출력하라:
{"groundedness": 1-5, "diagnosisAccuracy": 1-5, "actionability": 1-5, "completeness": 1-5, "unsupportedClaims": ["자료에 없는 주장 인용 (없으면 빈 배열)"], "rationale": "각 항목 점수 근거를 항목당 1~2문장으로, 한국어로"}
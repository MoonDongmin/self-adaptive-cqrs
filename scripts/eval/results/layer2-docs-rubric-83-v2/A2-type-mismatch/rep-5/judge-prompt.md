당신은 이벤트 소싱 + CQRS 기반 Physical AI 데이터 플랫폼의 시니어 아키텍트이자 엄격한 평가자다. LLM 파이프라인이 [자료](로그·이벤트·스키마 정보)를 보고 [Docs]를 생성했다. Docs 는 권고 문서, Read Model 생성 SQL, API 버저닝 세 요소를 항상 함께 담아야 하는 단일 산출물이다. 당신은 [정답 요지]와 [자료], [자동 검증 결과]를 기준으로 Docs 를 네 항목의 루브릭으로 채점한다. 채점은 관대하지 않게, 근거 없는 주장·지어낸 값·의도와 다른 SQL·서로 어긋나는 절에는 낮은 점수를 준다. 실행·컴파일이 통과했다는 사실만으로 실행 가능성이나 완결성에 높은 점수를 주지 않는다. SQL 과 코드 블록을 실제로 읽고 루브릭의 점검 항목을 하나씩 확인한다. 반드시 JSON 객체 하나만 출력한다. 설명문·마크다운 펜스는 출력하지 않는다.

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
| 03:48:23.361 | 30 | insert.request | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | - | - | - | Insert Event Store 요청 수신 | - |
| 03:48:23.361 | 30 | insert.batch.start | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | - | - | - | Toy-Data 적재 시작 | - |
| 03:48:23.366 | 20 | insert.file.ok | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00051 | 2 | 1 | 이벤트 append | - |
| 03:48:23.366 | 20 | insert.file.ok | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00051 | 2 | 1 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00051_02_20230923.json |
| 03:48:23.367 | 20 | insert.file.ok | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00055 | 3 | 2 | 이벤트 append | - |
| 03:48:23.367 | 20 | insert.file.ok | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00055 | 3 | 2 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00055_03_20230923.json |
| 03:48:23.368 | 20 | insert.file.ok | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00056 | 2 | 3 | 이벤트 append | - |
| 03:48:23.368 | 20 | insert.file.ok | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00056 | 2 | 3 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00056_02_20230923.json |
| 03:48:23.370 | 20 | insert.file.ok | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00061 | 3 | 5 | 이벤트 append | - |
| 03:48:23.370 | 20 | insert.file.ok | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00059 | 2 | 4 | 이벤트 append | - |
| 03:48:23.370 | 20 | insert.file.ok | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00059 | 2 | 4 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00059_02_20230923.json |
| 03:48:23.370 | 20 | insert.file.ok | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00061 | 3 | 5 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00061_03_20230923.json |
| 03:48:23.371 | 20 | insert.file.ok | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00071 | 3 | 6 | 이벤트 append | - |
| 03:48:23.371 | 20 | insert.file.ok | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00071 | 3 | 6 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00071_03_20230923.json |
| 03:48:23.372 | 20 | insert.file.ok | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00072 | 1 | 7 | 이벤트 append | - |
| 03:48:23.372 | 20 | insert.file.ok | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00072 | 1 | 7 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00072_01_20230923.json |
| 03:48:23.373 | 20 | insert.file.ok | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00079 | 2 | 9 | 이벤트 append | - |
| 03:48:23.373 | 20 | insert.file.ok | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00074 | 3 | 8 | 이벤트 append | - |
| 03:48:23.373 | 20 | insert.file.ok | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00074 | 3 | 8 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00074_03_20230923.json |
| 03:48:23.373 | 20 | insert.file.ok | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00079 | 2 | 9 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00079_02_20230923.json |
| 03:48:23.374 | 20 | insert.file.ok | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00080 | 2 | 10 | 이벤트 append | - |
| 03:48:23.374 | 20 | insert.file.ok | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00080 | 2 | 10 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00080_02_20230923.json |
| 03:48:23.375 | 20 | insert.file.ok | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00097 | 1 | 11 | 이벤트 append | - |
| 03:48:23.375 | 20 | insert.file.ok | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00097 | 1 | 11 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00097_01_20230923.json |
| 03:48:23.376 | 20 | insert.file.ok | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00100 | 2 | 12 | 이벤트 append | - |
| 03:48:23.376 | 20 | insert.file.ok | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00100 | 2 | 12 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00100_02_20230923.json |
| 03:48:23.377 | 20 | insert.file.ok | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00103 | 1 | 13 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00103_01_20230923.json |
| 03:48:23.377 | 20 | insert.file.ok | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00103 | 1 | 13 | 이벤트 append | - |
| 03:48:23.378 | 20 | insert.file.ok | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00103 | 2 | 14 | 이벤트 append | - |
| 03:48:23.378 | 20 | insert.file.ok | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00103 | 2 | 14 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00103_02_20230923.json |
| 03:48:23.378 | 20 | insert.file.ok | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00106 | 1 | 15 | 이벤트 append | - |
| 03:48:23.378 | 20 | insert.file.ok | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00106 | 1 | 15 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00106_01_20230923.json |
| 03:48:23.380 | 20 | insert.file.ok | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00108 | 2 | 16 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00108_02_20230923.json |
| 03:48:23.380 | 20 | insert.file.ok | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00108 | 2 | 16 | 이벤트 append | - |
| 03:48:23.381 | 20 | insert.file.ok | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00110 | 3 | 18 | 이벤트 append | - |
| 03:48:23.381 | 20 | insert.file.ok | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00109 | 1 | 17 | 이벤트 append | - |
| 03:48:23.381 | 20 | insert.file.ok | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00109 | 1 | 17 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00109_01_20230923.json |
| 03:48:23.381 | 20 | insert.file.ok | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00110 | 3 | 18 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00110_03_20230923.json |
| 03:48:23.382 | 20 | insert.file.ok | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00112 | 3 | 19 | 이벤트 append | - |
| 03:48:23.382 | 20 | insert.file.ok | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00112 | 3 | 19 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00112_03_20230923.json |
| 03:48:23.383 | 20 | insert.file.ok | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00117 | 3 | 20 | 이벤트 append | - |
| 03:48:23.383 | 20 | insert.file.ok | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00117 | 3 | 20 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00117_03_20230923.json |
| 03:48:23.384 | 20 | insert.file.ok | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00121 | 2 | 22 | 이벤트 append | - |
| 03:48:23.384 | 20 | insert.file.ok | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00120 | 2 | 21 | 이벤트 append | - |
| 03:48:23.384 | 20 | insert.file.ok | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00120 | 2 | 21 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00120_02_20230923.json |
| 03:48:23.384 | 20 | insert.file.ok | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00121 | 2 | 22 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00121_02_20230923.json |
| 03:48:23.385 | 20 | insert.file.ok | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00133 | 1 | 23 | 이벤트 append | - |
| 03:48:23.385 | 20 | insert.file.ok | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00133 | 1 | 23 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00133_01_20230923.json |
| 03:48:23.386 | 20 | insert.file.ok | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00133 | 2 | 24 | 이벤트 append | - |
| 03:48:23.386 | 20 | insert.file.ok | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00133 | 2 | 24 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00133_02_20230923.json |
| 03:48:23.387 | 40 | insert.file.failed | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | - | - | - | toy-data 파일 적재 실패 ← 트립 앵커 | reason=[   {     "expected": "number",     "code": "invalid_type",     "path": [       "grip_succeed"     ],     "message": "Invalid input: expected number, received string"   } ] · file=반려동물용품_CR01_강아지공룡알장난감_02002_01_20230923.json |
| 03:48:23.387 | 20 | insert.file.ok | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00134 | 1 | 25 | 이벤트 append | - |
| 03:48:23.387 | 20 | insert.file.ok | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00134 | 1 | 25 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00134_01_20230923.json |
| 03:48:23.388 | 40 | insert.file.failed | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | - | - | - | toy-data 파일 적재 실패 | reason=[   {     "origin": "number",     "code": "too_big",     "maximum": 1,     "inclusive": true,     "path": [       "grip_succeed"     ],     "message": "Too big: expected number to be <=1"   } ] · file=반려동물용품_CR01_강아지공룡알장난감_02003_01_20230923.json |
| 03:48:23.389 | 30 | insert.batch.done | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | - | - | - | toy-data 적재 완료 | - |
| 03:48:23.389 | 30 | - | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | - | - | - | request completed | - |
| 03:48:23.391 | 30 | projection.request | 2b78926f-f3ec-4308-a39b-22d8d25b878c | - | - | - | projection 요청 수신 | - |
| 03:48:23.393 | 20 | - | 2b78926f-f3ec-4308-a39b-22d8d25b878c | - | - | - | 커서 조회 | projector=multimodal-projector |
| 03:48:23.393 | 30 | projection.start | 2b78926f-f3ec-4308-a39b-22d8d25b878c | - | - | - | catch-up 시작 | projector=multimodal-projector |
| 03:48:23.394 | 20 | - | 2b78926f-f3ec-4308-a39b-22d8d25b878c | - | - | - | 이벤트 조회 | - |
| 03:48:23.395 | 20 | projection.event.mapped | 2b78926f-f3ec-4308-a39b-22d8d25b878c | - | 2 | 1 | 이벤트 매핑 | projector=multimodal-projector |
| 03:48:23.396 | 20 | projection.event.mapped | 2b78926f-f3ec-4308-a39b-22d8d25b878c | - | 3 | 2 | 이벤트 매핑 | projector=multimodal-projector |
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
docId: analysis-64cfdb18-ddbd-4492-95a4-9a350e21c3b7
generatedAt: 2026-08-13T03:48:30.986Z
targetReadModel: read_grip_result
sqlDialect: postgres
sufficientEvidence: true
apiVersion:
  from: null
  to: null
  affectedEndpoints: []
evidenceSources:
  - { origin: developer-logging, anchorId: "64cfdb18-ddbd-4492-95a4-9a350e21c3b7" }
constraints:
  - "v1 자산(테이블/엔드포인트/프로젝터 name) 무손상"
  - "PK (scene_key, attempt_num) 유지"
  - "TypeScript any 금지"
  - "식별자 전체 단어"
  - "DDL 실행·API 컷오버는 인간 승인 후에만 (human-in-the-loop)"
  - "Read Model 테이블명은 read_ 접두 스네이크 케이스"
---

# Self-Adaptive CQRS Docs — read_grip_result

> 결론(TL;DR): `read_grip_result`을(를) 보강한다 — Toy-Data 배치 적재 중 2개 파일의 grip_succeed 필드 데이터가 ingestion Zod(number, 0~1)를 위반. 파일 단위 격으로 나머지 배치와 후속 투영은 정상 진전. (이상 유형: 페이로드 스키마 불일치 · 심각도: warning)

<logging_context>

## 이상 로그 맥락 (±N 윈도우)
> 빈도: 최근 1h — `insert.request`(level 30) 1회, `insert.file.failed`(level 40) 1회, `insert.batch.start`(level 30) 1회, `log.delete.request`(level 30) 1회, `log.delete.done`(level 30) 1회, `insert.file.ok`(level 20) 50회, `-`(level 30) 1회.

| time | level | action | correlation_id | stream_id | attempt | global_seq | msg | detail |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 03:48:23.361 | 30 | insert.request | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | - | - | - | Insert Event Store 요청 수신 | - |
| 03:48:23.361 | 30 | insert.batch.start | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | - | - | - | Toy-Data 적재 시작 | - |
| 03:48:23.366 | 20 | insert.file.ok | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00051 | 2 | 1 | 이벤트 append | - |
| 03:48:23.366 | 20 | insert.file.ok | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00051 | 2 | 1 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00051_02_20230923.json |
| 03:48:23.367 | 20 | insert.file.ok | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00055 | 3 | 2 | 이벤트 append | - |
| 03:48:23.367 | 20 | insert.file.ok | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00055 | 3 | 2 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00055_03_20230923.json |
| 03:48:23.368 | 20 | insert.file.ok | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00056 | 2 | 3 | 이벤트 append | - |
| 03:48:23.368 | 20 | insert.file.ok | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00056 | 2 | 3 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00056_02_20230923.json |
| 03:48:23.370 | 20 | insert.file.ok | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00061 | 3 | 5 | 이벤트 append | - |
| 03:48:23.370 | 20 | insert.file.ok | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00059 | 2 | 4 | 이벤트 append | - |
| 03:48:23.370 | 20 | insert.file.ok | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00059 | 2 | 4 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00059_02_20230923.json |
| 03:48:23.370 | 20 | insert.file.ok | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00061 | 3 | 5 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00061_03_20230923.json |
| 03:48:23.371 | 20 | insert.file.ok | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00071 | 3 | 6 | 이벤트 append | - |
| 03:48:23.371 | 20 | insert.file.ok | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00071 | 3 | 6 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00071_03_20230923.json |
| 03:48:23.372 | 20 | insert.file.ok | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00072 | 1 | 7 | 이벤트 append | - |
| 03:48:23.372 | 20 | insert.file.ok | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00072 | 1 | 7 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00072_01_20230923.json |
| 03:48:23.373 | 20 | insert.file.ok | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00079 | 2 | 9 | 이벤트 append | - |
| 03:48:23.373 | 20 | insert.file.ok | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00074 | 3 | 8 | 이벤트 append | - |
| 03:48:23.373 | 20 | insert.file.ok | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00074 | 3 | 8 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00074_03_20230923.json |
| 03:48:23.373 | 20 | insert.file.ok | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00079 | 2 | 9 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00079_02_20230923.json |
| 03:48:23.374 | 20 | insert.file.ok | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00080 | 2 | 10 | 이벤트 append | - |
| 03:48:23.374 | 20 | insert.file.ok | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00080 | 2 | 10 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00080_02_20230923.json |
| 03:48:23.375 | 20 | insert.file.ok | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00097 | 1 | 11 | 이벤트 append | - |
| 03:48:23.375 | 20 | insert.file.ok | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00097 | 1 | 11 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00097_01_20230923.json |
| 03:48:23.376 | 20 | insert.file.ok | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00100 | 2 | 12 | 이벤트 append | - |
| 03:48:23.376 | 20 | insert.file.ok | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00100 | 2 | 12 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00100_02_20230923.json |
| 03:48:23.377 | 20 | insert.file.ok | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00103 | 1 | 13 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00103_01_20230923.json |
| 03:48:23.377 | 20 | insert.file.ok | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00103 | 1 | 13 | 이벤트 append | - |
| 03:48:23.378 | 20 | insert.file.ok | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00103 | 2 | 14 | 이벤트 append | - |
| 03:48:23.378 | 20 | insert.file.ok | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00103 | 2 | 14 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00103_02_20230923.json |
| 03:48:23.378 | 20 | insert.file.ok | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00106 | 1 | 15 | 이벤트 append | - |
| 03:48:23.378 | 20 | insert.file.ok | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00106 | 1 | 15 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00106_01_20230923.json |
| 03:48:23.380 | 20 | insert.file.ok | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00108 | 2 | 16 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00108_02_20230923.json |
| 03:48:23.380 | 20 | insert.file.ok | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00108 | 2 | 16 | 이벤트 append | - |
| 03:48:23.381 | 20 | insert.file.ok | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00110 | 3 | 18 | 이벤트 append | - |
| 03:48:23.381 | 20 | insert.file.ok | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00109 | 1 | 17 | 이벤트 append | - |
| 03:48:23.381 | 20 | insert.file.ok | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00109 | 1 | 17 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00109_01_20230923.json |
| 03:48:23.381 | 20 | insert.file.ok | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00110 | 3 | 18 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00110_03_20230923.json |
| 03:48:23.382 | 20 | insert.file.ok | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00112 | 3 | 19 | 이벤트 append | - |
| 03:48:23.382 | 20 | insert.file.ok | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00112 | 3 | 19 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00112_03_20230923.json |
| 03:48:23.383 | 20 | insert.file.ok | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00117 | 3 | 20 | 이벤트 append | - |
| 03:48:23.383 | 20 | insert.file.ok | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00117 | 3 | 20 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00117_03_20230923.json |
| 03:48:23.384 | 20 | insert.file.ok | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00121 | 2 | 22 | 이벤트 append | - |
| 03:48:23.384 | 20 | insert.file.ok | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00120 | 2 | 21 | 이벤트 append | - |
| 03:48:23.384 | 20 | insert.file.ok | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00120 | 2 | 21 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00120_02_20230923.json |
| 03:48:23.384 | 20 | insert.file.ok | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00121 | 2 | 22 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00121_02_20230923.json |
| 03:48:23.385 | 20 | insert.file.ok | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00133 | 1 | 23 | 이벤트 append | - |
| 03:48:23.385 | 20 | insert.file.ok | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00133 | 1 | 23 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00133_01_20230923.json |
| 03:48:23.386 | 20 | insert.file.ok | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00133 | 2 | 24 | 이벤트 append | - |
| 03:48:23.386 | 20 | insert.file.ok | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00133 | 2 | 24 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00133_02_20230923.json |
| 03:48:23.387 | 40 | insert.file.failed | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | - | - | - | toy-data 파일 적재 실패 ← 트립 앵커 | reason=[   {     "expected": "number",     "code": "invalid_type",     "path": [       "grip_succeed"     ],     "message": "Invalid input: expected number, received string"   } ] · file=반려동물용품_CR01_강아지공룡알장난감_02002_01_20230923.json |
| 03:48:23.387 | 20 | insert.file.ok | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00134 | 1 | 25 | 이벤트 append | - |
| 03:48:23.387 | 20 | insert.file.ok | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00134 | 1 | 25 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00134_01_20230923.json |
| 03:48:23.388 | 40 | insert.file.failed | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | - | - | - | toy-data 파일 적재 실패 | reason=[   {     "origin": "number",     "code": "too_big",     "maximum": 1,     "inclusive": true,     "path": [       "grip_succeed"     ],     "message": "Too big: expected number to be <=1"   } ] · file=반려동물용품_CR01_강아지공룡알장난감_02003_01_20230923.json |
| 03:48:23.389 | 30 | insert.batch.done | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | - | - | - | toy-data 적재 완료 | - |
| 03:48:23.389 | 30 | - | 64cfdb18-ddbd-4492-95a4-9a350e21c3b7 | - | - | - | request completed | - |
| 03:48:23.391 | 30 | projection.request | 2b78926f-f3ec-4308-a39b-22d8d25b878c | - | - | - | projection 요청 수신 | - |
| 03:48:23.393 | 20 | - | 2b78926f-f3ec-4308-a39b-22d8d25b878c | - | - | - | 커서 조회 | projector=multimodal-projector |
| 03:48:23.393 | 30 | projection.start | 2b78926f-f3ec-4308-a39b-22d8d25b878c | - | - | - | catch-up 시작 | projector=multimodal-projector |
| 03:48:23.394 | 20 | - | 2b78926f-f3ec-4308-a39b-22d8d25b878c | - | - | - | 이벤트 조회 | - |
| 03:48:23.395 | 20 | projection.event.mapped | 2b78926f-f3ec-4308-a39b-22d8d25b878c | - | 2 | 1 | 이벤트 매핑 | projector=multimodal-projector |
| 03:48:23.396 | 20 | projection.event.mapped | 2b78926f-f3ec-4308-a39b-22d8d25b878c | - | 3 | 2 | 이벤트 매핑 | projector=multimodal-projector |

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
- (level 40, `insert.file.failed`) toy-data 파일 적재 실패 ← 트립 앵커 → 원천 파일의 필수 필드 누락/타입 위반 [corr:64cfdb18-ddbd-4492-95a4-9a350e21c3b7]
- (level 40, `insert.file.failed`) toy-data 파일 적재 실패 → 원천 파일의 필수 필드 누락/타입 위반 [corr:64cfdb18-ddbd-4492-95a4-9a350e21c3b7]
- Insight 카드 read_grip_result 의 grip_succeed:smallint 은 Read Model 저장 정션이지만, 적재 검증은 src/insert/dto/toy-data.dto.ts 의 toyDataSchema.grip_succeed: z.number().int().min(0).max(1) 이다. 로그의 invalid_type(string 대 number) 과 too_big(>1) 은 원천 데이터 불일치이므로 Read Model 구조 부재가 아님 [corr:64cfdb18-ddbd-4492-95a4-9a350e21c3b7].
- GripResultProjector.map() 의 toyDataSchema.parse(event.payload) 호출은 Zod 실패 시 에러를 throw 하므로, insert.file.failed 이벤트는 event_store 미유입 상태다. 따라서 read_grip_result 와 read_multimodal 테이블의 grip_succeed, image_2d_uri 등 컬럼이 결함 값에 오염되지 않음 [corr:64cfdb18-ddbd-4492-95a4-9a350e21c3b7].
- MultiModalProjector.checkIntegrity() 와 GripResultProjector 의 정합성 검사는 미실행 경로이므로 Read Model 보강을 위한 코드 수정은 필요하지 않음.

### Decision Drivers
- Zod 거절은 시스템 의도된 방어 동작이다
- 결함 이벤트는 event_store 미유입 상태다
- Read Model 구조는 정상이다
- 원천 데이터 수정 요청이 최선책이다

### Considered Options
#### 거절 유지 + 원천 데이터 수정 요청 (권장)
- 접근: src/insert/dto/toy-data.dto.ts Zod 검증(z.number().int().min(0).max(1)) 그대로 유지, 원천 파지 시도 데이터 수정 요청
- 제안 필드: toyDataSchema.grip_succeed
- 트레이드오프: 재투영·비용·리스크 제로, 시스템 의도된 방어 동작 준수, 원천 데이터 수정 요청 필요
```typescript
export const toyDataSchema = z.object({ ... grip_succeed: z.number().int().min(0).max(1), ... });
```

#### 무유입 검증 절차
- 접근: 적재 완료(insert.batch.done) 후 event_store 조회로 결함 파일 미유입 확인
- 제안 필드: containmentSql
- 트레이드오프: 추가 SELECT 오버헤드, guarantees no phantom events slipped through
```typescript
SELECT count(*) FROM event_store WHERE stream_id = 'grip-attempt:02002' AND attempt_num = 1 OR stream_id = 'grip-attempt:02003' AND attempt_num = 1; -- 기대값 0
```

#### 거절 모니터링/알림 보강
- 접근: ingestion logger batch-level failure summary emission
- 제안 필드: LogAction, PinoLogger
- 트레이드오프: operational visibility only, no structural impact
```typescript
this.logger.error({ action: LogAction.BATCH_FAILED }, `적재 실패: ${failedFiles.join(', ')}`);
```

### Decision Outcome
거절 유지 + 원천 데이터 수정 요청

### Consequences
- (+) RM integrity preserved
- (+) defect traceability maintained via ingestion logs
- (−) Requires external data pipeline correction
- (−) temporary batch gap in ES/RM for affected scenes

### Non-Goals
- Modifying Zod schema to coerce/replace values
- adding new tracking tables
- altering projector logic

## 2. Read Model 생성 SQL (Read Model DDL)

> 실행 게이트: 아래 변경은 인간 승인 후에만 적용한다 (human-in-the-loop).

### 격리(containment) SQL — 신규 Read Model DDL 불필요, 결함 데이터 무해화가 조치다

```sql
-- 무유입 검증: zod 거절된 파일의 이벤트가 event_store 에 유입되지 않았음을 확인한다 (기대값 0)
SELECT count(*) AS rejected_event_count FROM event_store WHERE (stream_id, attempt_num) IN (('grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02002', 1), ('grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02003', 1));
```

## 3. API Versioning

### 버전 영향

변 변경 없음. Zod 검증 스키마(toy-data.dto.ts)와 Read Model 정션(read_grip_result, read_multimodal)이 그대로 유지되며, API 엔드포인트/스키마 호환성도 무변.

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
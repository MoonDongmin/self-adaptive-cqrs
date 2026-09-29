당신은 이벤트 소싱 + CQRS 기반 Physical AI 데이터 플랫폼의 시니어 아키텍트이자 엄격한 평가자다. LLM 파이프라인이 [자료](로그·이벤트·스키마 정보)를 보고 [Docs]를 생성했다. Docs 는 권고 문서, Read Model 생성 SQL, API 버저닝 세 요소를 항상 함께 담아야 하는 단일 산출물이다. 당신은 [정답 요지]와 [자료], [자동 검증 결과]를 기준으로 Docs 를 네 항목의 루브릭으로 채점한다. 채점은 관대하지 않게, 근거 없는 주장·지어낸 값·의도와 다른 SQL·서로 어긋나는 절에는 낮은 점수를 준다. 반드시 JSON 객체 하나만 출력한다. 설명문·마크다운 펜스는 출력하지 않는다.

---

[시나리오] A1-payload-drift
[상황] 운영 중 시스템이 경고 수준의 이상 로그를 감지했다.
[정답 요지] 적재 payload 최상위에 스키마 밖 신규 필드(gripper_temperature, conveyor_speed)가 유입되어 적재 시 유실됨(payload.schema.drift). 조치: 기존 v1 테이블은 건드리지 않고 신규 키를 담는 새 Read Model(또는 v2)을 만들고 API 를 v2 로 병행 운영.

[자료] — Docs 생성 시 파이프라인이 받은 로그·이벤트·스키마 정보
<<<자료 시작>>>
<logging_context>
## 이상 로그 맥락 (±N 윈도우)
> 빈도: 최근 1h — `insert.request`(level 30) 1회, `insert.batch.start`(level 30) 1회, `log.delete.request`(level 30) 1회, `payload.schema.drift`(level 40) 1회, `log.delete.done`(level 30) 1회, `insert.file.ok`(level 20) 54회, `-`(level 30) 2회, `insert.batch.done`(level 30) 1회.

| time | level | action | correlation_id | stream_id | attempt | global_seq | msg | detail |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 18:58:13.523 | 30 | insert.request | e18ec5e8-31f8-42c6-b105-533fdc7373ad | - | - | - | Insert Event Store 요청 수신 | - |
| 18:58:13.523 | 30 | insert.batch.start | e18ec5e8-31f8-42c6-b105-533fdc7373ad | - | - | - | Toy-Data 적재 시작 | - |
| 18:58:13.528 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00001 | 1 | 1 | 이벤트 append | - |
| 18:58:13.528 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00001 | 1 | 1 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00001_01_20230923.json |
| 18:58:13.529 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00002 | 3 | 2 | 이벤트 append | - |
| 18:58:13.529 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00002 | 3 | 2 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00002_03_20230923.json |
| 18:58:13.529 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00005 | 3 | 3 | 이벤트 append | - |
| 18:58:13.529 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00005 | 3 | 3 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00005_03_20230923.json |
| 18:58:13.531 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00009 | 1 | 4 | 이벤트 append | - |
| 18:58:13.531 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00009 | 1 | 4 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00009_01_20230923.json |
| 18:58:13.531 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00009 | 3 | 5 | 이벤트 append | - |
| 18:58:13.531 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00009 | 3 | 5 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00009_03_20230923.json |
| 18:58:13.532 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00011 | 2 | 6 | 이벤트 append | - |
| 18:58:13.532 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00011 | 2 | 6 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00011_02_20230923.json |
| 18:58:13.533 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00011 | 3 | 7 | 이벤트 append | - |
| 18:58:13.533 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00011 | 3 | 7 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00011_03_20230923.json |
| 18:58:13.534 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00015 | 1 | 8 | 이벤트 append | - |
| 18:58:13.534 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00015 | 1 | 8 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00015_01_20230923.json |
| 18:58:13.535 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00018 | 1 | 9 | 이벤트 append | - |
| 18:58:13.535 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00018 | 1 | 9 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00018_01_20230923.json |
| 18:58:13.535 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00019 | 3 | 10 | 이벤트 append | - |
| 18:58:13.535 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00019 | 3 | 10 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00019_03_20230923.json |
| 18:58:13.536 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00021 | 2 | 11 | 이벤트 append | - |
| 18:58:13.536 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00021 | 2 | 11 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00021_02_20230923.json |
| 18:58:13.537 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00026 | 2 | 12 | 이벤트 append | - |
| 18:58:13.537 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00026 | 2 | 12 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00026_02_20230923.json |
| 18:58:13.537 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00027 | 2 | 13 | 이벤트 append | - |
| 18:58:13.537 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00027 | 2 | 13 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00027_02_20230923.json |
| 18:58:13.538 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00027 | 3 | 14 | 이벤트 append | - |
| 18:58:13.538 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00027 | 3 | 14 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00027_03_20230923.json |
| 18:58:13.539 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00029 | 3 | 15 | 이벤트 append | - |
| 18:58:13.539 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00029 | 3 | 15 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00029_03_20230923.json |
| 18:58:13.539 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00030 | 2 | 16 | 이벤트 append | - |
| 18:58:13.539 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00030 | 2 | 16 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00030_02_20230923.json |
| 18:58:13.540 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00036 | 3 | 17 | 이벤트 append | - |
| 18:58:13.540 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00036 | 3 | 17 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00036_03_20230923.json |
| 18:58:13.541 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00039 | 2 | 18 | 이벤트 append | - |
| 18:58:13.541 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00039 | 2 | 18 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00039_02_20230923.json |
| 18:58:13.541 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00041 | 2 | 19 | 이벤트 append | - |
| 18:58:13.541 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00041 | 2 | 19 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00041_02_20230923.json |
| 18:58:13.542 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00047 | 1 | 20 | 이벤트 append | - |
| 18:58:13.542 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00047 | 1 | 20 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00047_01_20230923.json |
| 18:58:13.542 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00051 | 2 | 21 | 이벤트 append | - |
| 18:58:13.543 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00051 | 2 | 21 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00051_02_20230923.json |
| 18:58:13.543 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00055 | 3 | 22 | 이벤트 append | - |
| 18:58:13.543 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00055 | 3 | 22 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00055_03_20230923.json |
| 18:58:13.544 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00056 | 2 | 23 | 이벤트 append | - |
| 18:58:13.544 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00056 | 2 | 23 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00056_02_20230923.json |
| 18:58:13.545 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00059 | 2 | 24 | 이벤트 append | - |
| 18:58:13.545 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00059 | 2 | 24 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00059_02_20230923.json |
| 18:58:13.545 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00061 | 3 | 25 | 이벤트 append | - |
| 18:58:13.545 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00061 | 3 | 25 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00061_03_20230923.json |
| 18:58:13.546 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02000 | 1 | 26 | 이벤트 append | - |
| 18:58:13.546 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02000 | 1 | 26 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_02000_01_20230923.json |
| 18:58:13.546 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02001 | 1 | 27 | 이벤트 append | - |
| 18:58:13.546 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02001 | 1 | 27 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_02001_01_20230923.json |
| 18:58:13.547 | 40 | payload.schema.drift | e18ec5e8-31f8-42c6-b105-533fdc7373ad | - | - | - | payload 에 스키마가 모르는 신규 키 유입 — 적재 시 유실됨(Read Model 후보) ← 트립 앵커 | newKeys={"conveyor_speed": "1.2", "gripper_temperature": "36.5"} |
| 18:58:13.547 | 30 | insert.batch.done | e18ec5e8-31f8-42c6-b105-533fdc7373ad | - | - | - | toy-data 적재 완료 | - |
| 18:58:13.547 | 30 | - | e18ec5e8-31f8-42c6-b105-533fdc7373ad | - | - | - | request completed | - |
| 18:58:13.549 | 30 | projection.request | 3edf385f-e53f-4eb8-a11b-9044ae88fa9b | - | - | - | projection 요청 수신 | - |
| 18:58:13.550 | 20 | - | 3edf385f-e53f-4eb8-a11b-9044ae88fa9b | - | - | - | 커서 조회 | projector=multimodal-projector |
| 18:58:13.550 | 30 | projection.start | 3edf385f-e53f-4eb8-a11b-9044ae88fa9b | - | - | - | catch-up 시작 | projector=multimodal-projector |
| 18:58:13.551 | 20 | - | 3edf385f-e53f-4eb8-a11b-9044ae88fa9b | - | - | - | 이벤트 조회 | - |
| 18:58:13.552 | 20 | projection.event.mapped | 3edf385f-e53f-4eb8-a11b-9044ae88fa9b | - | 1 | 1 | 이벤트 매핑 | projector=multimodal-projector |
| 18:58:13.553 | 20 | projection.event.mapped | 3edf385f-e53f-4eb8-a11b-9044ae88fa9b | - | 3 | 2 | 이벤트 매핑 | projector=multimodal-projector |
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
docId: analysis-e18ec5e8-31f8-42c6-b105-533fdc7373ad
generatedAt: 2026-08-11T18:58:20.933Z
targetReadModel: read_sensor_drift_v1
sqlDialect: postgres
sufficientEvidence: true
apiVersion:
  from: v1
  to: v2
  affectedEndpoints:
    - "POST /multimodal"
    - "POST /grip-result"
    - "POST /sensor-drift"
    - "POST /insert-all"
evidenceSources:
  - { origin: developer-logging, anchorId: "e18ec5e8-31f8-42c6-b105-533fdc7373ad" }
constraints:
  - "v1 자산(테이블/엔드포인트/프로젝터 name) 무손상"
  - "PK (scene_key, attempt_num) 유지"
  - "TypeScript any 금지"
  - "식별자 전체 단어"
  - "DDL 실행·API 컷오버는 인간 승인 후에만 (human-in-the-loop)"
  - "Read Model 테이블명은 read_ 접두 스네이크 케이스"
---

# Self-Adaptive CQRS Docs — read_sensor_drift_v1

> 결론(TL;DR): `read_sensor_drift_v1`을(를) 재생성한다 — 적재(batch insert) 파일 54건은 event_store append 성공하나, payload 스키마 검증 단계에서 conveyor_speed와 gripper_temperature 신규 키가 발견되며 Read Model 미적 반영으로 인해 투영 시 데이터 유실 경고 발생. (이상 유형: 스키마 드리프트(신규 키 유입) · 심각도: warning)

<logging_context>

## 이상 로그 맥락 (±N 윈도우)
> 빈도: 최근 1h — `insert.request`(level 30) 1회, `insert.batch.start`(level 30) 1회, `log.delete.request`(level 30) 1회, `payload.schema.drift`(level 40) 1회, `log.delete.done`(level 30) 1회, `insert.file.ok`(level 20) 54회, `-`(level 30) 2회, `insert.batch.done`(level 30) 1회.

| time | level | action | correlation_id | stream_id | attempt | global_seq | msg | detail |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 18:58:13.523 | 30 | insert.request | e18ec5e8-31f8-42c6-b105-533fdc7373ad | - | - | - | Insert Event Store 요청 수신 | - |
| 18:58:13.523 | 30 | insert.batch.start | e18ec5e8-31f8-42c6-b105-533fdc7373ad | - | - | - | Toy-Data 적재 시작 | - |
| 18:58:13.528 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00001 | 1 | 1 | 이벤트 append | - |
| 18:58:13.528 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00001 | 1 | 1 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00001_01_20230923.json |
| 18:58:13.529 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00002 | 3 | 2 | 이벤트 append | - |
| 18:58:13.529 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00002 | 3 | 2 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00002_03_20230923.json |
| 18:58:13.529 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00005 | 3 | 3 | 이벤트 append | - |
| 18:58:13.529 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00005 | 3 | 3 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00005_03_20230923.json |
| 18:58:13.531 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00009 | 1 | 4 | 이벤트 append | - |
| 18:58:13.531 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00009 | 1 | 4 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00009_01_20230923.json |
| 18:58:13.531 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00009 | 3 | 5 | 이벤트 append | - |
| 18:58:13.531 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00009 | 3 | 5 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00009_03_20230923.json |
| 18:58:13.532 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00011 | 2 | 6 | 이벤트 append | - |
| 18:58:13.532 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00011 | 2 | 6 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00011_02_20230923.json |
| 18:58:13.533 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00011 | 3 | 7 | 이벤트 append | - |
| 18:58:13.533 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00011 | 3 | 7 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00011_03_20230923.json |
| 18:58:13.534 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00015 | 1 | 8 | 이벤트 append | - |
| 18:58:13.534 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00015 | 1 | 8 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00015_01_20230923.json |
| 18:58:13.535 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00018 | 1 | 9 | 이벤트 append | - |
| 18:58:13.535 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00018 | 1 | 9 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00018_01_20230923.json |
| 18:58:13.535 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00019 | 3 | 10 | 이벤트 append | - |
| 18:58:13.535 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00019 | 3 | 10 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00019_03_20230923.json |
| 18:58:13.536 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00021 | 2 | 11 | 이벤트 append | - |
| 18:58:13.536 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00021 | 2 | 11 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00021_02_20230923.json |
| 18:58:13.537 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00026 | 2 | 12 | 이벤트 append | - |
| 18:58:13.537 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00026 | 2 | 12 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00026_02_20230923.json |
| 18:58:13.537 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00027 | 2 | 13 | 이벤트 append | - |
| 18:58:13.537 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00027 | 2 | 13 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00027_02_20230923.json |
| 18:58:13.538 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00027 | 3 | 14 | 이벤트 append | - |
| 18:58:13.538 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00027 | 3 | 14 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00027_03_20230923.json |
| 18:58:13.539 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00029 | 3 | 15 | 이벤트 append | - |
| 18:58:13.539 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00029 | 3 | 15 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00029_03_20230923.json |
| 18:58:13.539 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00030 | 2 | 16 | 이벤트 append | - |
| 18:58:13.539 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00030 | 2 | 16 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00030_02_20230923.json |
| 18:58:13.540 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00036 | 3 | 17 | 이벤트 append | - |
| 18:58:13.540 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00036 | 3 | 17 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00036_03_20230923.json |
| 18:58:13.541 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00039 | 2 | 18 | 이벤트 append | - |
| 18:58:13.541 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00039 | 2 | 18 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00039_02_20230923.json |
| 18:58:13.541 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00041 | 2 | 19 | 이벤트 append | - |
| 18:58:13.541 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00041 | 2 | 19 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00041_02_20230923.json |
| 18:58:13.542 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00047 | 1 | 20 | 이벤트 append | - |
| 18:58:13.542 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00047 | 1 | 20 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00047_01_20230923.json |
| 18:58:13.542 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00051 | 2 | 21 | 이벤트 append | - |
| 18:58:13.543 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00051 | 2 | 21 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00051_02_20230923.json |
| 18:58:13.543 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00055 | 3 | 22 | 이벤트 append | - |
| 18:58:13.543 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00055 | 3 | 22 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00055_03_20230923.json |
| 18:58:13.544 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00056 | 2 | 23 | 이벤트 append | - |
| 18:58:13.544 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00056 | 2 | 23 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00056_02_20230923.json |
| 18:58:13.545 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00059 | 2 | 24 | 이벤트 append | - |
| 18:58:13.545 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00059 | 2 | 24 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00059_02_20230923.json |
| 18:58:13.545 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00061 | 3 | 25 | 이벤트 append | - |
| 18:58:13.545 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00061 | 3 | 25 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00061_03_20230923.json |
| 18:58:13.546 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02000 | 1 | 26 | 이벤트 append | - |
| 18:58:13.546 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02000 | 1 | 26 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_02000_01_20230923.json |
| 18:58:13.546 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02001 | 1 | 27 | 이벤트 append | - |
| 18:58:13.546 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02001 | 1 | 27 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_02001_01_20230923.json |
| 18:58:13.547 | 40 | payload.schema.drift | e18ec5e8-31f8-42c6-b105-533fdc7373ad | - | - | - | payload 에 스키마가 모르는 신규 키 유입 — 적재 시 유실됨(Read Model 후보) ← 트립 앵커 | newKeys={"conveyor_speed": "1.2", "gripper_temperature": "36.5"} |
| 18:58:13.547 | 30 | insert.batch.done | e18ec5e8-31f8-42c6-b105-533fdc7373ad | - | - | - | toy-data 적재 완료 | - |
| 18:58:13.547 | 30 | - | e18ec5e8-31f8-42c6-b105-533fdc7373ad | - | - | - | request completed | - |
| 18:58:13.549 | 30 | projection.request | 3edf385f-e53f-4eb8-a11b-9044ae88fa9b | - | - | - | projection 요청 수신 | - |
| 18:58:13.550 | 20 | - | 3edf385f-e53f-4eb8-a11b-9044ae88fa9b | - | - | - | 커서 조회 | projector=multimodal-projector |
| 18:58:13.550 | 30 | projection.start | 3edf385f-e53f-4eb8-a11b-9044ae88fa9b | - | - | - | catch-up 시작 | projector=multimodal-projector |
| 18:58:13.551 | 20 | - | 3edf385f-e53f-4eb8-a11b-9044ae88fa9b | - | - | - | 이벤트 조회 | - |
| 18:58:13.552 | 20 | projection.event.mapped | 3edf385f-e53f-4eb8-a11b-9044ae88fa9b | - | 1 | 1 | 이벤트 매핑 | projector=multimodal-projector |
| 18:58:13.553 | 20 | projection.event.mapped | 3edf385f-e53f-4eb8-a11b-9044ae88fa9b | - | 3 | 2 | 이벤트 매핑 | projector=multimodal-projector |

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
- (level 40, `payload.schema.drift`) payload 에 스키마가 모르는 신규 키 유입 — 적재 시 유실됨(Read Model 후보) ← 트립 앵커 → 기존 Read Model의 스키마에 conveyor_speed와 gripper_temperature 미등재로, 투영 시 매핑 실패/데이터 유실 경고 발생. [corr:e18ec5e8-31f8-42c6-b105-533fdc7373ad]
- Insight 카드 read_grip_result 의 object_name, grip_succeed 등 기존 컬럼만 정의, conveyor_speed 및 gripper_temperature 미등재 [corr:e18ec5e8-31f8-42c6-b105-533fdc7373ad]
- Insight 카드 read_multimodal 의 image_2d_file_name, video_file_name 등 기존 컬럼만 정의, 신규 키 미등재 [corr:e18ec5e8-31f8-42c6-b105-533fdc7373ad]
- src/insert/dto/toy-data.dto.ts 의 toyDataSchema 에는 두 키 미정의, Zod 검증 통과 시 payload 객체에 신규 키 유입됨 [corr:e18ec5e8-31f8-42c6-b105-533fdc7373ad]
- src/projection/projector/grip-result.projector.ts 의 map() 메서드 는 payload 필드 매핑이 고정된 기존 키만 참조, 신규 키 배제 [corr:e18ec5e8-31f8-42c6-b105-533fdc7373ad]
- src/projection/projector/multimodal.projector.ts 의 map() 메서드 도 동일하게 신규 키 배제 [corr:e18ec5e8-31f8-42c6-b105-533fdc7373ad]
- 적재(insert.file.ok) 성공으로 ES 에 54건 기록됨, 투영(projection.request) 시작 시 기존 프로젝트르 매핑 실패 경고 발생 [corr:e18ec5e8-31f8-42c6-b105-533fdc7373ad]

### Decision Drivers
- 도메인 정합성 유지 (기존 Read Model 스키마 변경 금지)
- 데이터 유실 최소화 (신규 키 투영 필수)
- API 호환성 보전 (기존 엔드포인트 무변)

### Considered Options
#### newReadModel
- 접근: src/shared/database/schema/service/read-sensor-drift-v1.ts Drizzle 스키마 생성, src/projection/projector/sensor-drift.projector.ts 신규 프로젝트르 구현(map() 추출 conveyor_speed, gripper_temperature).
- 제안 필드: read_sensor_drift_v1 테이블, SensorDriftProjector
- 트레이드오프: DB 확장 비용 발생, 기존 Read Model 무변.
```typescript
export const readSensorDriftV1 = pgTable("read_sensor_drift_v1", { sceneKey: varchar("scene_key").notNull(), attemptNum: smallint("attempt_num").notNull(), occurredAt: timestamp("occurred_at"), conveyorSpeed: doublePrecision("conveyor_speed"), gripperTemperature: doublePrecision("gripper_temperature"), streamId: varchar("stream_id"), globalSeq: bigint("global_seq", { mode: "number" }), }, (t) => [primaryKey({ columns: [t.sceneKey, t.attemptNum] })]);
```

#### versionSwitch
- 접근: src/shared/database/schema/service/read-grip-result.ts 추가 컬럼 conveyorSpeed, gripperTemperature.
- 제안 필드: read_grip_result.conveyorSpeed, read_grip_result.gripperTemperature
- 트레이드오프: 스키마 호환성 문제, 기존 클라이언트 API 연동 끊김.
```typescript
export const readGripResult = pgTable("read_grip_result", { ... conveyorSpeed: doublePrecision("conveyor_speed"), gripperTemperature: doublePrecision("gripper_temperature"), }, (t) => [primaryKey({ columns: [t.sceneKey, t.attemptNum] })]);
```

### Decision Outcome
newReadModel — 신규 센서 치 데이터는 기존 Read Model 의 목적(파지 결과/미디어 링크)과 반대로, DB 확장이 무해화 및 확장이 용이함.

### Consequences
- (+) 신규 키 투영 완료
- (+) 기존 Read Model 무변
- (+) API 호환성 유지
- (−) DB 확장 비용 발생
- (−) 신규 Projector 등록/연소 관리 추가

### Non-Goals
- 기존 read_grip_result/read_multimodal 스키마 수정
- Zod DTO 변경으로 기본값 치환

## 2. Read Model 생성 SQL (Read Model DDL)

> 실행 게이트: 아래 변경은 인간 승인 후에만 적용한다 (human-in-the-loop).

- 대상: `read_sensor_drift_v1` · 키: scene_key, attempt_num · 원천 이벤트: GripAttemptRecorded

```sql
CREATE TABLE read_sensor_drift_v1 (
  scene_key varchar NOT NULL,
  attempt_num smallint NOT NULL,
  occurred_at timestamptz,
  conveyor_speed double precision,
  gripper_temperature double precision,
  stream_id varchar,
  global_seq bigint,
  PRIMARY KEY (scene_key, attempt_num)
);
```

### 필드

```mschema
# Table: read_sensor_drift_v1
[
(scene_key:varchar, 장면 식별 키 = stream_id 제거 prefix, Primary Key),
(attempt_num:smallint, 동일 장면 내 파지 시도 번호, Primary Key),
(occurred_at:timestamptz, 데이터 촬영 일자),
(conveyor_speed:double precision, 컨베이어 벨트 속도 (payload 드리프트 신규 키)),
(gripper_temperature:double precision, 그리퍼 온도 (payload 드리프트 신규 키)),
(stream_id:varchar, ES 스트림 ID — 추적 키),
(global_seq:bigint, 투영 출처 이벤트의 ES 전역 시퀀스 — 추적 키)
]
```

### Insight 카드 등록 (Insight Read DB 동기화)

> DDL 적용 시 아래 카드 등록도 함께 실행한다 — 다음 분석부터 신규 Read Model 이 LLM 컨텍스트에 노출된다.

```sql
INSERT INTO insight_entity (entity_name, kind, purpose, key_columns)
VALUES ('read_sensor_drift_v1', 'read_model', '신규 payload 드리프트 키(conveyor_speed, gripper_temperature) 시도별 원천 값 기록 및 베이스라인 추적', 'scene_key, attempt_num')
ON CONFLICT (entity_name) DO UPDATE SET purpose = EXCLUDED.purpose, key_columns = EXCLUDED.key_columns;

INSERT INTO insight_field (entity_name, field_name, data_type, meaning, display_order)
VALUES
  ('read_sensor_drift_v1', 'scene_key', 'varchar', '장면 식별 키 = stream_id 제거 prefix', 1),
  ('read_sensor_drift_v1', 'attempt_num', 'smallint', '동일 장면 내 파지 시도 번호', 2),
  ('read_sensor_drift_v1', 'occurred_at', 'timestamptz', '데이터 촬영 일자', 3),
  ('read_sensor_drift_v1', 'conveyor_speed', 'double precision', '컨베이어 벨트 속도 (payload 드리프트 신규 키)', 4),
  ('read_sensor_drift_v1', 'gripper_temperature', 'double precision', '그리퍼 온도 (payload 드리프트 신규 키)', 5),
  ('read_sensor_drift_v1', 'stream_id', 'varchar', 'ES 스트림 ID — 추적 키', 6),
  ('read_sensor_drift_v1', 'global_seq', 'bigint', '투영 출처 이벤트의 ES 전역 시퀀스 — 추적 키', 7)
ON CONFLICT (entity_name, field_name) DO UPDATE SET data_type = EXCLUDED.data_type, meaning = EXCLUDED.meaning, display_order = EXCLUDED.display_order;
```

## 3. API Versioning

> 실행 게이트: 아래 변경은 인간 승인 후에만 적용한다 (human-in-the-loop).

### Unreleased (v1 → v2)

#### Added
- 신규 Read Model 테이블 `read_sensor_drift_v1` (scene_key, attempt_num, occurred_at, conveyor_speed, gripper_temperature, stream_id, global_seq)
- `SensorDriftV1Projector` 구현으로 payload 드리프트 신규 키 매핑 및 DB upsert
- `ProjectionService.catchUpSensorDrift()` 메서드 및 `CatchUpAllResult` 타입 확장
- `ProjectionController` 라우트 `/sensor-drift` 엔드포인트 배선

### 마이그레이션 절차

- 하위호환 변경: 신규 테이블과 라우트/서비스 확장은 기존 v1 `read_grip_result`, `read_multimodal` 계약·테이블·라우트·프로젝터 클래스를 건드리지 않음. DI 만 추가 배선.
- 파괴적 변경: 없음
- 컷오버 전 테스트: batch insert 54건 append 성공 검증 → projection catch-up `/sensor-drift` 실행 시 `conveyor_speed`, `gripper_temperature` 매핑 경고 유무 확인 → DB 조회 시 scene_key/attempt_num 중복 업데이트 로직 정합성 검증.
- 롤백 창/조건: v2 롤백: `read_sensor_drift_v1` 테이블 DROP, `SensorDriftV1Projector` DI 제거, `/sensor-drift` 라우트 삭제, `ProjectionService.catchUpAll()` 타입/로직 revert.
- Insight 카드 등록: §2의 카드 등록 SQL을 DDL과 함께 적용(카탈로그 동기화)

### 사유·호환성

- 사유: payload 스키마 드리프트 감지(level 40)로 신규 키 `conveyor_speed`, `gripper_temperature` 가 유입되나 기존 Zod DTO 와 Read Model 테이블에 미미해 투영 시 데이터 유실 경고 발생. 새 테이블 `read_sensor_drift_v1` 과 `SensorDriftV1Projector` 를 추가해 센서 베이스라인을 포착하며 v1 계약은 보존된다.[corr:e18ec5e8-31f8-42c6-b105-533fdc7373ad]
- 트리거 근거: 타임스탬프 18:58:13.547 level 40 action payload.schema.drift correlation_id e18ec5e8-31f8-42c6-b105-533fdc7373ad msg 'payload 에 스키마가 모르는 신규 키 유입 — 적재 시 유실됨(Read Model 후보) ← 트립 앵커' detail 'newKeys={"conveyor_speed": "1.2", "gripper_temperature": "36.5"}' 에서 감지.[corr:e18ec5e8-31f8-42c6-b105-533fdc7373ad] v1 `src/insert/dto/toy-data.dto.ts` Zod 스키마에 두 키 미등재, 기존 `GripResultProjector` 와 `MultiModalProjector` 매핑 로직이 신규 필드를 무시해 Read Model 컬럼 부재로 인한 유실 경고 발생.[corr:e18ec5e8-31f8-42c6-b105-533fdc7373ad]
- v1 호환성: 기존 `read_grip_result`, `read_multimodal` 테이블/프로젝터/라우트 엔드포인트는 수정·삭제 금지. 신규 `SensorDriftV1Projector` 만 추가 DI 배선, `/sensor-drift` 라우트 추가, `ProjectionService.catchUpAll()` 확장을 통해 v1 호환 유지.[corr:e18ec5e8-31f8-42c6-b105-533fdc7373ad]

### 변경 파일

- `src/projection/projection.service.ts` (modifyFile) — `ProjectionService` DI 배선, `catchUpSensorDrift()` 메서드 추가, `CatchUpAllResult` 타입 확장.
- `src/projection/projection.controller.ts` (modifyFile) — `ProjectionController` 확정 설계 라우트 `/sensor-drift` 엔드포인트 배선.
- `src/shared/database/schema/index.ts` (modifyFile) — `schema/index.ts` 신규 Drizzle 테이블 export 배선.

## Optional — 부속 자료(컨텍스트 축소 시 생략 가능)

### 신규 Read Model — Drizzle 스키마

```ts
import { bigint, doublePrecision, pgTable, primaryKey, smallint, timestamp, varchar } from 'drizzle-orm/pg-core';

export const readSensorDriftV1 = pgTable(
  "read_sensor_drift_v1",
  {
    sceneKey: varchar("scene_key").notNull(),
    attemptNum: smallint("attempt_num").notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }),
    conveyorSpeed: doublePrecision("conveyor_speed"),
    gripperTemperature: doublePrecision("gripper_temperature"),
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
import { readSensorDriftV1 } from '@/shared/database/schema';
import { LogAction, LogContext } from '@/shared/logger/logging-context';

type SensorDriftV1ProjectorInsert = InferInsertModel<typeof readSensorDriftV1>;

function toNumberOrNull(value: unknown): number | null {
  if (value === undefined || value === null) {
    return null;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

@Injectable()
export class SensorDriftV1Projector implements Projector<SensorDriftV1ProjectorInsert> {
  readonly name: string = "sensor-drift-v1-projector";

  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(SensorDriftV1Projector.name);
  }

  map(event: EventStoreEventRow): SensorDriftV1ProjectorInsert {
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
      occurredAt: event.occurredAt,
      conveyorSpeed: toNumberOrNull(payload["conveyor_speed"]),
      gripperTemperature: toNumberOrNull(payload["gripper_temperature"]),
      streamId: event.streamId,
      globalSeq: event.globalSeq,
    };
  }

  async upsert(tx: DrizzleTx, row: SensorDriftV1ProjectorInsert): Promise<void> {
    await tx
      .insert(readSensorDriftV1)
      .values(row)
      .onConflictDoUpdate({
        target: [readSensorDriftV1.sceneKey, readSensorDriftV1.attemptNum],
        set: {
          occurredAt: row.occurredAt,
          conveyorSpeed: row.conveyorSpeed,
          gripperTemperature: row.gripperTemperature,
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
export * from "./service/read-sensor-drift";

// src/insert/dto/toy-data.dto.ts (확장)
import { z } from 'zod';
const cameraIntrinsicSchema = z.object({ codx: z.number().nullable(), cody: z.number(), cx: z.number(), cy: z.number(), fx: z.number(), fy: z.number(), k1: z.number(), k2: z.number(), k3: z.number(), k4: z.number(), k5: z.number(), k6: z.number(), p1: z.number(), p2: z.number() });
const cameraInfoSchema = z.object({ camera_intrinsic_param: cameraIntrinsicSchema, camera_name: z.string(), camera_type: z.string() });
const grip2dPoseSchema = z.object({ xl: z.number(), xr: z.number(), yl: z.number(), yr: z.number() });
const grip3dPoseSchema = z.object({ x1: z.number(), x2: z.number(), x3: z.number(), x4: z.number(), x5: z.number(), x6: z.number(), x7: z.number(), x8: z.number(), y1: z.number(), y2: z.number(), y3: z.number(), y4: z.number(), y5: z.number(), y6: z.number(), y7: z.number(), y8: z.number(), z1: z.number(), z2: z.number(), z3: z.number(), z4: z.number(), z5: z.number(), z6: z.number(), z7: z.number(), z8: z.number() });
const gripDataSchema = z.object({ grip_2d_pose: grip2dPoseSchema, grip_3d_pose: grip3dPoseSchema });
const objectsSchema = z.object({ annotation_type: z.string(), class_name: z.string(), package_type: z.string(), object_properties: z.array(z.string()), id: z.number().int(), segmentation_points: z.array(z.array(z.array(z.number()))) });
const robotTfSchema = z.object({ rotation_3x3: z.array(z.number()).length(9), translation_3x1: z.array(z.number()).length(3) });
const humanAnnotationSchema = z.object({ annotation_type: z.string(), id: z.number().int(), annotation_points: z.array(z.number()), num_keypoints: z.number().int() });
export const toyDataSchema = z.object({ "2D_image_file_name": z.string(), "3D_image_file_name": z.string(), video_file_name: z.string(), box_type: z.string(), camera_info: cameraInfoSchema, data_key: z.string(), grip_data: gripDataSchema, grip_succeed: z.number().int().min(0).max(1), objects: z.array(objectsSchema), robot_tf: robotTfSchema, human_annotation_grasp: z.array(humanAnnotationSchema), conveyor_speed: z.coerce.number().optional(), gripper_temperature: z.coerce.number().optional() });
export type ToyDataDto = z.infer<typeof toyDataSchema>;

// src/projection/projection.service.ts (확장)
import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { InsertResult, InsertService } from '@/insert/insert.service';
import { GripResultProjector } from '@/projection/projector/grip-result.projector';
import { MultiModalProjector } from '@/projection/projector/multimodal.projector';
import { SensorDriftProjector } from '@/projection/projector/sensor-drift.projector';
import { ProjectionResult } from '@/projection/projector/projector';
import { CatchUpRunner } from '@/projection/runner/catch-up.runner';
import { LogAction } from '@/shared/logger/logging-context';
export type CatchUpAllResult = { multimodal: ProjectionResult; gripResult: ProjectionResult; sensorDrift: ProjectionResult };
@Injectable()
export class ProjectionService {
  constructor(
    private readonly logger: PinoLogger,
    private readonly runner: CatchUpRunner,
    private readonly multimodal: MultiModalProjector,
    private readonly gripResult: GripResultProjector,
    private readonly sensorDrift: SensorDriftProjector,
    private readonly insertService: InsertService,
  ) { this.logger.setContext(ProjectionService.name); }
  catchUpMultimodal(): Promise<ProjectionResult> { return this.runner.run(this.multimodal); }
  catchUpGripResult(): Promise<ProjectionResult> { return this.runner.run(this.gripResult); }
  catchUpSensorDrift(): Promise<ProjectionResult> { return this.runner.run(this.sensorDrift); }
  async catchUpAll(): Promise<CatchUpAllResult> {
    this.logger.info({ action: LogAction.PROJECTION_START }, "전체 투영 시작");
    const multimodal = await this.catchUpMultimodal();
    const gripResult = await this.catchUpGripResult();
    const sensorDrift = await this.catchUpSensorDrift();
    this.logger.info({ action: LogAction.PROJECTION_DONE }, "전체 투영 완료");
    return { multimodal, gripResult, sensorDrift };
  }
}

// src/projection/projection.controller.ts (확장)
import { Controller, Post } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { InsertAndProjectionAllResult, ProjectionService } from '@/projection/projection.service';
import { ProjectionResult } from '@/projection/projector/projector';
import { LogAction, LogContext } from '@/shared/logger/logging-context';
@Controller("projection")
export class ProjectionController {
  constructor(private readonly logger: PinoLogger, private readonly projectionService: ProjectionService) { this.logger.setContext(ProjectionController.name); }
  @Post("/multimodal") multimodal(): Promise<ProjectionResult> { this.logger.info({ action: LogAction.PROJECTION_REQUEST, [LogContext.ROUTE]: "POST /projection/multimodal" }, "projection 요청 수신"); return this.projectionService.catchUpMultimodal(); }
  @Post("/grip-result") gripResult(): Promise<ProjectionResult> { this.logger.info({ action: LogAction.PROJECTION_REQUEST, [LogContext.ROUTE]: "POST /projection/grip-result" }, "projection 요청 수신"); return this.projectionService.catchUpGripResult(); }
  @Post("/sensor-drift") sensorDrift(): Promise<ProjectionResult> { this.logger.info({ action: LogAction.PROJECTION_REQUEST, [LogContext.ROUTE]: "POST /projection/sensor-drift" }, "projection 요청 수신"); return this.projectionService.catchUpSensorDrift(); }
  @Post("/insert-all") insertAll(): Promise<InsertAndProjectionAllResult> { this.logger.info({ action: LogAction.PROJECTION_REQUEST, [LogContext.ROUTE]: "POST /projection/insert-all" }, "projection 요청 수신"); return this.projectionService.insertAllAndProjectAll(); }
}

// src/projection/projection.module.ts (확장)
import { Module } from '@nestjs/common';
import { GripResultProjector } from '@/projection/projector/grip-result.projector';
import { MultiModalProjector } from '@/projection/projector/multimodal.projector';
import { SensorDriftProjector } from '@/projection/projector/sensor-drift.projector';
import { ProjectionService } from '@/projection/projection.service';
import { CatchUpRunner } from '@/projection/runner/catch-up.runner';
@Module({ providers: [ProjectionService, CatchUpRunner, GripResultProjector, MultiModalProjector, SensorDriftProjector] })
export class ProjectionModule {}
```

### 버전 교체 코드 — `src/projection/projection.service.ts` (modifyFile)

```typescript
import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { InsertResult, InsertService } from '@/insert/insert.service';
import { GripResultProjector } from '@/projection/projector/grip-result.projector';
import { MultiModalProjector } from '@/projection/projector/multimodal.projector';
import { SensorDriftV1Projector } from '@/projection/projector/sensor-drift-v1.projector';
import { ProjectionResult } from '@/projection/projector/projector';
import { CatchUpRunner } from '@/projection/runner/catch-up.runner';
import { LogAction } from '@/shared/logger/logging-context';

export type CatchUpAllResult = {
  multimodal: ProjectionResult;
  gripResult: ProjectionResult;
  sensorDrift: ProjectionResult;
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
    private readonly sensorDriftV1: SensorDriftV1Projector,
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

  catchUpSensorDrift(): Promise<ProjectionResult> {
    return this.runner.run(this.sensorDriftV1);
  }

  async catchUpAll(): Promise<CatchUpAllResult> {
    this.logger.info({ action: LogAction.PROJECTION_START }, "전체 투영 시작");

    const multimodal: ProjectionResult = await this.catchUpMultimodal();
    const gripResult: ProjectionResult = await this.catchUpGripResult();
    const sensorDrift: ProjectionResult = await this.catchUpSensorDrift();

    this.logger.info({ action: LogAction.PROJECTION_DONE }, "전체 투영 완료");

    return { multimodal, gripResult, sensorDrift };
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

  @Post("/sensor-drift")
  sensorDrift(): Promise<ProjectionResult> {
    this.logger.info(
      {
        action: LogAction.PROJECTION_REQUEST,
        [LogContext.ROUTE]: "POST /projection/sensor-drift",
      },
      "projection 요청 수신",
    );

    return this.projectionService.catchUpSensorDrift();
  }

  @Post("/insert-all")
  insertAll(): Promise<InsertAndProjectionAllResult> {
    this.logger.info(
      {
        action: LogAction.PROJECTION_REQUEST,
        [LogContext.ROUTE]: "POST /projection/insert-all",
      },
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
export * from "./service/read-multimodal";
export * from "./service/read-sensor-drift-v1";
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
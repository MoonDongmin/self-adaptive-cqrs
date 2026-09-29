당신은 이벤트 소싱 + CQRS 기반 Physical AI 데이터 플랫폼의 시니어 아키텍트이자 엄격한 평가자다. LLM 파이프라인이 [자료](로그·이벤트·스키마 정보)를 보고 [Docs]를 생성했다. Docs 는 권고 문서, Read Model 생성 SQL, API 버저닝 세 요소를 항상 함께 담아야 하는 단일 산출물이다. 당신은 [정답 요지]와 [자료], [자동 검증 결과]를 기준으로 Docs 를 네 항목의 루브릭으로 채점한다. 채점은 관대하지 않게, 근거 없는 주장·지어낸 값·의도와 다른 SQL·서로 어긋나는 절에는 낮은 점수를 준다. 실행·컴파일이 통과했다는 사실만으로 실행 가능성이나 완결성에 높은 점수를 주지 않는다. SQL 과 코드 블록을 실제로 읽고 루브릭의 점검 항목을 하나씩 확인한다. 반드시 JSON 객체 하나만 출력한다. 설명문·마크다운 펜스는 출력하지 않는다.

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
| 00:37:53.434 | 30 | insert.request | ef7a97a0-1c26-4340-a290-c7a592943c87 | - | - | - | Insert Event Store 요청 수신 | - |
| 00:37:53.434 | 30 | insert.batch.start | ef7a97a0-1c26-4340-a290-c7a592943c87 | - | - | - | Toy-Data 적재 시작 | - |
| 00:37:53.440 | 20 | insert.file.ok | ef7a97a0-1c26-4340-a290-c7a592943c87 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00001 | 1 | 1 | 이벤트 append | - |
| 00:37:53.440 | 20 | insert.file.ok | ef7a97a0-1c26-4340-a290-c7a592943c87 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00001 | 1 | 1 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00001_01_20230923.json |
| 00:37:53.441 | 20 | insert.file.ok | ef7a97a0-1c26-4340-a290-c7a592943c87 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00002 | 3 | 2 | 이벤트 append | - |
| 00:37:53.442 | 20 | insert.file.ok | ef7a97a0-1c26-4340-a290-c7a592943c87 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00002 | 3 | 2 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00002_03_20230923.json |
| 00:37:53.442 | 20 | insert.file.ok | ef7a97a0-1c26-4340-a290-c7a592943c87 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00005 | 3 | 3 | 이벤트 append | - |
| 00:37:53.442 | 20 | insert.file.ok | ef7a97a0-1c26-4340-a290-c7a592943c87 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00005 | 3 | 3 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00005_03_20230923.json |
| 00:37:53.444 | 20 | insert.file.ok | ef7a97a0-1c26-4340-a290-c7a592943c87 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00009 | 1 | 4 | 이벤트 append | - |
| 00:37:53.444 | 20 | insert.file.ok | ef7a97a0-1c26-4340-a290-c7a592943c87 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00009 | 1 | 4 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00009_01_20230923.json |
| 00:37:53.445 | 20 | insert.file.ok | ef7a97a0-1c26-4340-a290-c7a592943c87 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00009 | 3 | 5 | 이벤트 append | - |
| 00:37:53.445 | 20 | insert.file.ok | ef7a97a0-1c26-4340-a290-c7a592943c87 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00009 | 3 | 5 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00009_03_20230923.json |
| 00:37:53.446 | 20 | insert.file.ok | ef7a97a0-1c26-4340-a290-c7a592943c87 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00011 | 2 | 6 | 이벤트 append | - |
| 00:37:53.446 | 20 | insert.file.ok | ef7a97a0-1c26-4340-a290-c7a592943c87 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00011 | 2 | 6 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00011_02_20230923.json |
| 00:37:53.447 | 20 | insert.file.ok | ef7a97a0-1c26-4340-a290-c7a592943c87 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00011 | 3 | 7 | 이벤트 append | - |
| 00:37:53.447 | 20 | insert.file.ok | ef7a97a0-1c26-4340-a290-c7a592943c87 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00011 | 3 | 7 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00011_03_20230923.json |
| 00:37:53.448 | 20 | insert.file.ok | ef7a97a0-1c26-4340-a290-c7a592943c87 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00015 | 1 | 8 | 이벤트 append | - |
| 00:37:53.448 | 20 | insert.file.ok | ef7a97a0-1c26-4340-a290-c7a592943c87 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00015 | 1 | 8 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00015_01_20230923.json |
| 00:37:53.448 | 20 | insert.file.ok | ef7a97a0-1c26-4340-a290-c7a592943c87 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00018 | 1 | 9 | 이벤트 append | - |
| 00:37:53.448 | 20 | insert.file.ok | ef7a97a0-1c26-4340-a290-c7a592943c87 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00018 | 1 | 9 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00018_01_20230923.json |
| 00:37:53.449 | 20 | insert.file.ok | ef7a97a0-1c26-4340-a290-c7a592943c87 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00019 | 3 | 10 | 이벤트 append | - |
| 00:37:53.449 | 20 | insert.file.ok | ef7a97a0-1c26-4340-a290-c7a592943c87 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00019 | 3 | 10 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00019_03_20230923.json |
| 00:37:53.450 | 20 | insert.file.ok | ef7a97a0-1c26-4340-a290-c7a592943c87 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00021 | 2 | 11 | 이벤트 append | - |
| 00:37:53.450 | 20 | insert.file.ok | ef7a97a0-1c26-4340-a290-c7a592943c87 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00021 | 2 | 11 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00021_02_20230923.json |
| 00:37:53.451 | 20 | insert.file.ok | ef7a97a0-1c26-4340-a290-c7a592943c87 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00026 | 2 | 12 | 이벤트 append | - |
| 00:37:53.451 | 20 | insert.file.ok | ef7a97a0-1c26-4340-a290-c7a592943c87 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00026 | 2 | 12 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00026_02_20230923.json |
| 00:37:53.452 | 20 | insert.file.ok | ef7a97a0-1c26-4340-a290-c7a592943c87 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00027 | 2 | 13 | 이벤트 append | - |
| 00:37:53.452 | 20 | insert.file.ok | ef7a97a0-1c26-4340-a290-c7a592943c87 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00027 | 2 | 13 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00027_02_20230923.json |
| 00:37:53.453 | 20 | insert.file.ok | ef7a97a0-1c26-4340-a290-c7a592943c87 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00027 | 3 | 14 | 이벤트 append | - |
| 00:37:53.453 | 20 | insert.file.ok | ef7a97a0-1c26-4340-a290-c7a592943c87 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00027 | 3 | 14 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00027_03_20230923.json |
| 00:37:53.453 | 20 | insert.file.ok | ef7a97a0-1c26-4340-a290-c7a592943c87 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00029 | 3 | 15 | 이벤트 append | - |
| 00:37:53.453 | 20 | insert.file.ok | ef7a97a0-1c26-4340-a290-c7a592943c87 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00029 | 3 | 15 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00029_03_20230923.json |
| 00:37:53.454 | 20 | insert.file.ok | ef7a97a0-1c26-4340-a290-c7a592943c87 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00030 | 2 | 16 | 이벤트 append | - |
| 00:37:53.454 | 20 | insert.file.ok | ef7a97a0-1c26-4340-a290-c7a592943c87 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00030 | 2 | 16 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00030_02_20230923.json |
| 00:37:53.455 | 20 | insert.file.ok | ef7a97a0-1c26-4340-a290-c7a592943c87 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00036 | 3 | 17 | 이벤트 append | - |
| 00:37:53.455 | 20 | insert.file.ok | ef7a97a0-1c26-4340-a290-c7a592943c87 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00036 | 3 | 17 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00036_03_20230923.json |
| 00:37:53.456 | 20 | insert.file.ok | ef7a97a0-1c26-4340-a290-c7a592943c87 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00039 | 2 | 18 | 이벤트 append | - |
| 00:37:53.456 | 20 | insert.file.ok | ef7a97a0-1c26-4340-a290-c7a592943c87 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00039 | 2 | 18 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00039_02_20230923.json |
| 00:37:53.457 | 20 | insert.file.ok | ef7a97a0-1c26-4340-a290-c7a592943c87 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00041 | 2 | 19 | 이벤트 append | - |
| 00:37:53.457 | 20 | insert.file.ok | ef7a97a0-1c26-4340-a290-c7a592943c87 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00041 | 2 | 19 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00041_02_20230923.json |
| 00:37:53.458 | 20 | insert.file.ok | ef7a97a0-1c26-4340-a290-c7a592943c87 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00047 | 1 | 20 | 이벤트 append | - |
| 00:37:53.458 | 20 | insert.file.ok | ef7a97a0-1c26-4340-a290-c7a592943c87 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00047 | 1 | 20 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00047_01_20230923.json |
| 00:37:53.459 | 20 | insert.file.ok | ef7a97a0-1c26-4340-a290-c7a592943c87 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00051 | 2 | 21 | 이벤트 append | - |
| 00:37:53.459 | 20 | insert.file.ok | ef7a97a0-1c26-4340-a290-c7a592943c87 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00051 | 2 | 21 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00051_02_20230923.json |
| 00:37:53.460 | 20 | insert.file.ok | ef7a97a0-1c26-4340-a290-c7a592943c87 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00055 | 3 | 22 | 이벤트 append | - |
| 00:37:53.460 | 20 | insert.file.ok | ef7a97a0-1c26-4340-a290-c7a592943c87 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00055 | 3 | 22 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00055_03_20230923.json |
| 00:37:53.460 | 20 | insert.file.ok | ef7a97a0-1c26-4340-a290-c7a592943c87 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00056 | 2 | 23 | 이벤트 append | - |
| 00:37:53.460 | 20 | insert.file.ok | ef7a97a0-1c26-4340-a290-c7a592943c87 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00056 | 2 | 23 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00056_02_20230923.json |
| 00:37:53.461 | 20 | insert.file.ok | ef7a97a0-1c26-4340-a290-c7a592943c87 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00059 | 2 | 24 | 이벤트 append | - |
| 00:37:53.461 | 20 | insert.file.ok | ef7a97a0-1c26-4340-a290-c7a592943c87 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00059 | 2 | 24 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00059_02_20230923.json |
| 00:37:53.462 | 20 | insert.file.ok | ef7a97a0-1c26-4340-a290-c7a592943c87 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00061 | 3 | 25 | 이벤트 append | - |
| 00:37:53.462 | 20 | insert.file.ok | ef7a97a0-1c26-4340-a290-c7a592943c87 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00061 | 3 | 25 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00061_03_20230923.json |
| 00:37:53.463 | 20 | insert.file.ok | ef7a97a0-1c26-4340-a290-c7a592943c87 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02000 | 1 | 26 | 이벤트 append | - |
| 00:37:53.463 | 20 | insert.file.ok | ef7a97a0-1c26-4340-a290-c7a592943c87 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02000 | 1 | 26 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_02000_01_20230923.json |
| 00:37:53.464 | 20 | insert.file.ok | ef7a97a0-1c26-4340-a290-c7a592943c87 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02001 | 1 | 27 | 이벤트 append | - |
| 00:37:53.464 | 20 | insert.file.ok | ef7a97a0-1c26-4340-a290-c7a592943c87 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02001 | 1 | 27 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_02001_01_20230923.json |
| 00:37:53.464 | 40 | payload.schema.drift | ef7a97a0-1c26-4340-a290-c7a592943c87 | - | - | - | payload 에 스키마가 모르는 신규 키 유입 — 적재 시 유실됨(Read Model 후보) ← 트립 앵커 | newKeys={"conveyor_speed": "1.2", "gripper_temperature": "36.5"} |
| 00:37:53.464 | 30 | insert.batch.done | ef7a97a0-1c26-4340-a290-c7a592943c87 | - | - | - | toy-data 적재 완료 | - |
| 00:37:53.464 | 30 | - | ef7a97a0-1c26-4340-a290-c7a592943c87 | - | - | - | request completed | - |
| 00:37:53.466 | 30 | projection.request | 87032200-a31c-45a3-a2a6-1ab8f3ff1306 | - | - | - | projection 요청 수신 | - |
| 00:37:53.468 | 20 | - | 87032200-a31c-45a3-a2a6-1ab8f3ff1306 | - | - | - | 커서 조회 | projector=multimodal-projector |
| 00:37:53.468 | 30 | projection.start | 87032200-a31c-45a3-a2a6-1ab8f3ff1306 | - | - | - | catch-up 시작 | projector=multimodal-projector |
| 00:37:53.469 | 20 | - | 87032200-a31c-45a3-a2a6-1ab8f3ff1306 | - | - | - | 이벤트 조회 | - |
| 00:37:53.470 | 20 | projection.event.mapped | 87032200-a31c-45a3-a2a6-1ab8f3ff1306 | - | 1 | 1 | 이벤트 매핑 | projector=multimodal-projector |
| 00:37:53.471 | 20 | projection.event.mapped | 87032200-a31c-45a3-a2a6-1ab8f3ff1306 | - | 3 | 2 | 이벤트 매핑 | projector=multimodal-projector |
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
- 문서 검사: 실패 항목 hanCharacterFree
- SQL 실행: 블록 2개 중 2개 실행 성공
- 코드 컴파일: 파일 5개 중 5개 통과

[저장소 파일 확인] — 파이프라인은 진단 도구로 저장소 소스 코드를 조회할 수 있다. Docs 가 인용한 파일 경로의 실재 여부와 앞부분 발췌이다.
- 저장소에 실재하는 파일 (5건): src/insert/dto/toy-data.dto.ts, src/projection/projection.controller.ts, src/projection/projection.module.ts, src/projection/projection.service.ts, src/shared/database/schema/index.ts
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

<<<src/projection/projection.controller.ts 앞부분 80행>>>
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
      {
        action: LogAction.PROJECTION_REQUEST,
        [LogContext.ROUTE]: "POST /projection/insert-all",
      },
      "projection 요청 수신",
    );

    return this.projectionService.insertAllAndProjectAll();
  }
}

<<<발췌 끝>>>

<<<src/projection/projection.module.ts 앞부분 80행>>>
import { Module } from '@nestjs/common';
import { InsertModule } from '@/insert/insert.module';
import { KafkaSensorValuePublisher, SENSOR_VALUE_PUBLISHER } from '@/projection/kafka/sensor-value.publisher';
import { ProjectionController } from '@/projection/projection.controller';
import { ProjectionService } from '@/projection/projection.service';
import { GripResultProjector } from '@/projection/projector/grip-result.projector';
import { MultiModalProjector } from '@/projection/projector/multimodal.projector';
import { EVENT_STORE_READER } from '@/projection/repository/event-store-reader.repository';
import { EventStoreReaderRepositoryImpl } from '@/projection/repository/event-store-reader.repository.impl';
import { PROJECTION_CURSOR } from '@/projection/repository/projection-cursor.repository';
import { ProjectionCursorRepositoryImpl } from '@/projection/repository/projection-cursor.repository.impl';
import { CatchUpRunner } from '@/projection/runner/catch-up.runner';

@Module({
  imports: [InsertModule],
  controllers: [ProjectionController],
  providers: [
    ProjectionService,
    CatchUpRunner,
    MultiModalProjector,
    GripResultProjector,
    {
      provide: EVENT_STORE_READER,
      useClass: EventStoreReaderRepositoryImpl,
    },
    {
      provide: PROJECTION_CURSOR,
      useClass: ProjectionCursorRepositoryImpl,
    },
    {
      provide: SENSOR_VALUE_PUBLISHER,
      useClass: KafkaSensorValuePublisher,
    },
  ],
  exports: [ProjectionService],
})
export class ProjectionModule {}

<<<발췌 끝>>>

<<<src/projection/projection.service.ts 앞부분 80행>>>
import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { InsertResult, InsertService } from '@/insert/insert.service';
import { GripResultProjector } from '@/projection/projector/grip-result.projector';
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

<<<발췌 끝>>>

<<<src/shared/database/schema/index.ts 앞부분 80행>>>
export * from "./insight/insight-entity";
export * from "./insight/insight-field";
export * from "./log/log-cursor";
export * from "./log/log-event";
export * from "./service/event";
export * from "./service/projection-cursor";
export * from "./service/read-grip-result";
export * from "./service/read-multimodal";

<<<발췌 끝>>>

[Docs] — 채점 대상 문서 전문
<<<Docs 시작>>>
---
docId: analysis-ef7a97a0-1c26-4340-a290-c7a592943c87
generatedAt: 2026-08-11T00:37:55.834Z
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
  - { origin: developer-logging, anchorId: "ef7a97a0-1c26-4340-a290-c7a592943c87" }
constraints:
  - "v1 자산(테이블/엔드포인트/프로젝터 name) 무손상"
  - "PK (scene_key, attempt_num) 유지"
  - "TypeScript any 금지"
  - "식별자 전체 단어"
  - "DDL 실행·API 컷오버는 인간 승인 후에만 (human-in-the-loop)"
  - "Read Model 테이블명은 read_ 접두 스네이크 케이스"
---

# Self-Adaptive CQRS Docs — read_sensor_drift_v1

> 결론(TL;DR): `read_sensor_drift_v1`을(를) 재생성한다 — Toy-Data 적재 배치에서 27개 파일 성공적재 완료,但 payload 스키마 드리프트 감지(conveyor_speed, gripper_temperature 신규 키). 현 Read Model/이벤트 테이블에는 해당 환경/센서 변수 컬럼이 미정의되어 적재 단계 Zod 검증 실패로 데이터 유실됨. 투영은 정상 진행되나 영구 손실 발생. (이상 유형: 스키마 드리프트(신규 키 유입) · 심각도: warning)

<logging_context>

## 이상 로그 맥락 (±N 윈도우)
> 빈도: 최근 1h — `insert.request`(level 30) 1회, `insert.batch.start`(level 30) 1회, `log.delete.request`(level 30) 1회, `payload.schema.drift`(level 40) 1회, `log.delete.done`(level 30) 1회, `insert.file.ok`(level 20) 54회, `-`(level 30) 2회, `insert.batch.done`(level 30) 1회.

| time | level | action | correlation_id | stream_id | attempt | global_seq | msg | detail |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 00:37:53.434 | 30 | insert.request | ef7a97a0-1c26-4340-a290-c7a592943c87 | - | - | - | Insert Event Store 요청 수신 | - |
| 00:37:53.434 | 30 | insert.batch.start | ef7a97a0-1c26-4340-a290-c7a592943c87 | - | - | - | Toy-Data 적재 시작 | - |
| 00:37:53.440 | 20 | insert.file.ok | ef7a97a0-1c26-4340-a290-c7a592943c87 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00001 | 1 | 1 | 이벤트 append | - |
| 00:37:53.440 | 20 | insert.file.ok | ef7a97a0-1c26-4340-a290-c7a592943c87 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00001 | 1 | 1 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00001_01_20230923.json |
| 00:37:53.441 | 20 | insert.file.ok | ef7a97a0-1c26-4340-a290-c7a592943c87 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00002 | 3 | 2 | 이벤트 append | - |
| 00:37:53.442 | 20 | insert.file.ok | ef7a97a0-1c26-4340-a290-c7a592943c87 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00002 | 3 | 2 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00002_03_20230923.json |
| 00:37:53.442 | 20 | insert.file.ok | ef7a97a0-1c26-4340-a290-c7a592943c87 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00005 | 3 | 3 | 이벤트 append | - |
| 00:37:53.442 | 20 | insert.file.ok | ef7a97a0-1c26-4340-a290-c7a592943c87 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00005 | 3 | 3 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00005_03_20230923.json |
| 00:37:53.444 | 20 | insert.file.ok | ef7a97a0-1c26-4340-a290-c7a592943c87 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00009 | 1 | 4 | 이벤트 append | - |
| 00:37:53.444 | 20 | insert.file.ok | ef7a97a0-1c26-4340-a290-c7a592943c87 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00009 | 1 | 4 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00009_01_20230923.json |
| 00:37:53.445 | 20 | insert.file.ok | ef7a97a0-1c26-4340-a290-c7a592943c87 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00009 | 3 | 5 | 이벤트 append | - |
| 00:37:53.445 | 20 | insert.file.ok | ef7a97a0-1c26-4340-a290-c7a592943c87 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00009 | 3 | 5 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00009_03_20230923.json |
| 00:37:53.446 | 20 | insert.file.ok | ef7a97a0-1c26-4340-a290-c7a592943c87 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00011 | 2 | 6 | 이벤트 append | - |
| 00:37:53.446 | 20 | insert.file.ok | ef7a97a0-1c26-4340-a290-c7a592943c87 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00011 | 2 | 6 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00011_02_20230923.json |
| 00:37:53.447 | 20 | insert.file.ok | ef7a97a0-1c26-4340-a290-c7a592943c87 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00011 | 3 | 7 | 이벤트 append | - |
| 00:37:53.447 | 20 | insert.file.ok | ef7a97a0-1c26-4340-a290-c7a592943c87 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00011 | 3 | 7 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00011_03_20230923.json |
| 00:37:53.448 | 20 | insert.file.ok | ef7a97a0-1c26-4340-a290-c7a592943c87 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00015 | 1 | 8 | 이벤트 append | - |
| 00:37:53.448 | 20 | insert.file.ok | ef7a97a0-1c26-4340-a290-c7a592943c87 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00015 | 1 | 8 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00015_01_20230923.json |
| 00:37:53.448 | 20 | insert.file.ok | ef7a97a0-1c26-4340-a290-c7a592943c87 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00018 | 1 | 9 | 이벤트 append | - |
| 00:37:53.448 | 20 | insert.file.ok | ef7a97a0-1c26-4340-a290-c7a592943c87 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00018 | 1 | 9 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00018_01_20230923.json |
| 00:37:53.449 | 20 | insert.file.ok | ef7a97a0-1c26-4340-a290-c7a592943c87 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00019 | 3 | 10 | 이벤트 append | - |
| 00:37:53.449 | 20 | insert.file.ok | ef7a97a0-1c26-4340-a290-c7a592943c87 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00019 | 3 | 10 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00019_03_20230923.json |
| 00:37:53.450 | 20 | insert.file.ok | ef7a97a0-1c26-4340-a290-c7a592943c87 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00021 | 2 | 11 | 이벤트 append | - |
| 00:37:53.450 | 20 | insert.file.ok | ef7a97a0-1c26-4340-a290-c7a592943c87 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00021 | 2 | 11 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00021_02_20230923.json |
| 00:37:53.451 | 20 | insert.file.ok | ef7a97a0-1c26-4340-a290-c7a592943c87 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00026 | 2 | 12 | 이벤트 append | - |
| 00:37:53.451 | 20 | insert.file.ok | ef7a97a0-1c26-4340-a290-c7a592943c87 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00026 | 2 | 12 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00026_02_20230923.json |
| 00:37:53.452 | 20 | insert.file.ok | ef7a97a0-1c26-4340-a290-c7a592943c87 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00027 | 2 | 13 | 이벤트 append | - |
| 00:37:53.452 | 20 | insert.file.ok | ef7a97a0-1c26-4340-a290-c7a592943c87 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00027 | 2 | 13 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00027_02_20230923.json |
| 00:37:53.453 | 20 | insert.file.ok | ef7a97a0-1c26-4340-a290-c7a592943c87 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00027 | 3 | 14 | 이벤트 append | - |
| 00:37:53.453 | 20 | insert.file.ok | ef7a97a0-1c26-4340-a290-c7a592943c87 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00027 | 3 | 14 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00027_03_20230923.json |
| 00:37:53.453 | 20 | insert.file.ok | ef7a97a0-1c26-4340-a290-c7a592943c87 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00029 | 3 | 15 | 이벤트 append | - |
| 00:37:53.453 | 20 | insert.file.ok | ef7a97a0-1c26-4340-a290-c7a592943c87 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00029 | 3 | 15 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00029_03_20230923.json |
| 00:37:53.454 | 20 | insert.file.ok | ef7a97a0-1c26-4340-a290-c7a592943c87 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00030 | 2 | 16 | 이벤트 append | - |
| 00:37:53.454 | 20 | insert.file.ok | ef7a97a0-1c26-4340-a290-c7a592943c87 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00030 | 2 | 16 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00030_02_20230923.json |
| 00:37:53.455 | 20 | insert.file.ok | ef7a97a0-1c26-4340-a290-c7a592943c87 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00036 | 3 | 17 | 이벤트 append | - |
| 00:37:53.455 | 20 | insert.file.ok | ef7a97a0-1c26-4340-a290-c7a592943c87 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00036 | 3 | 17 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00036_03_20230923.json |
| 00:37:53.456 | 20 | insert.file.ok | ef7a97a0-1c26-4340-a290-c7a592943c87 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00039 | 2 | 18 | 이벤트 append | - |
| 00:37:53.456 | 20 | insert.file.ok | ef7a97a0-1c26-4340-a290-c7a592943c87 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00039 | 2 | 18 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00039_02_20230923.json |
| 00:37:53.457 | 20 | insert.file.ok | ef7a97a0-1c26-4340-a290-c7a592943c87 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00041 | 2 | 19 | 이벤트 append | - |
| 00:37:53.457 | 20 | insert.file.ok | ef7a97a0-1c26-4340-a290-c7a592943c87 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00041 | 2 | 19 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00041_02_20230923.json |
| 00:37:53.458 | 20 | insert.file.ok | ef7a97a0-1c26-4340-a290-c7a592943c87 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00047 | 1 | 20 | 이벤트 append | - |
| 00:37:53.458 | 20 | insert.file.ok | ef7a97a0-1c26-4340-a290-c7a592943c87 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00047 | 1 | 20 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00047_01_20230923.json |
| 00:37:53.459 | 20 | insert.file.ok | ef7a97a0-1c26-4340-a290-c7a592943c87 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00051 | 2 | 21 | 이벤트 append | - |
| 00:37:53.459 | 20 | insert.file.ok | ef7a97a0-1c26-4340-a290-c7a592943c87 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00051 | 2 | 21 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00051_02_20230923.json |
| 00:37:53.460 | 20 | insert.file.ok | ef7a97a0-1c26-4340-a290-c7a592943c87 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00055 | 3 | 22 | 이벤트 append | - |
| 00:37:53.460 | 20 | insert.file.ok | ef7a97a0-1c26-4340-a290-c7a592943c87 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00055 | 3 | 22 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00055_03_20230923.json |
| 00:37:53.460 | 20 | insert.file.ok | ef7a97a0-1c26-4340-a290-c7a592943c87 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00056 | 2 | 23 | 이벤트 append | - |
| 00:37:53.460 | 20 | insert.file.ok | ef7a97a0-1c26-4340-a290-c7a592943c87 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00056 | 2 | 23 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00056_02_20230923.json |
| 00:37:53.461 | 20 | insert.file.ok | ef7a97a0-1c26-4340-a290-c7a592943c87 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00059 | 2 | 24 | 이벤트 append | - |
| 00:37:53.461 | 20 | insert.file.ok | ef7a97a0-1c26-4340-a290-c7a592943c87 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00059 | 2 | 24 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00059_02_20230923.json |
| 00:37:53.462 | 20 | insert.file.ok | ef7a97a0-1c26-4340-a290-c7a592943c87 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00061 | 3 | 25 | 이벤트 append | - |
| 00:37:53.462 | 20 | insert.file.ok | ef7a97a0-1c26-4340-a290-c7a592943c87 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00061 | 3 | 25 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00061_03_20230923.json |
| 00:37:53.463 | 20 | insert.file.ok | ef7a97a0-1c26-4340-a290-c7a592943c87 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02000 | 1 | 26 | 이벤트 append | - |
| 00:37:53.463 | 20 | insert.file.ok | ef7a97a0-1c26-4340-a290-c7a592943c87 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02000 | 1 | 26 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_02000_01_20230923.json |
| 00:37:53.464 | 20 | insert.file.ok | ef7a97a0-1c26-4340-a290-c7a592943c87 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02001 | 1 | 27 | 이벤트 append | - |
| 00:37:53.464 | 20 | insert.file.ok | ef7a97a0-1c26-4340-a290-c7a592943c87 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02001 | 1 | 27 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_02001_01_20230923.json |
| 00:37:53.464 | 40 | payload.schema.drift | ef7a97a0-1c26-4340-a290-c7a592943c87 | - | - | - | payload 에 스키마가 모르는 신규 키 유입 — 적재 시 유실됨(Read Model 후보) ← 트립 앵커 | newKeys={"conveyor_speed": "1.2", "gripper_temperature": "36.5"} |
| 00:37:53.464 | 30 | insert.batch.done | ef7a97a0-1c26-4340-a290-c7a592943c87 | - | - | - | toy-data 적재 완료 | - |
| 00:37:53.464 | 30 | - | ef7a97a0-1c26-4340-a290-c7a592943c87 | - | - | - | request completed | - |
| 00:37:53.466 | 30 | projection.request | 87032200-a31c-45a3-a2a6-1ab8f3ff1306 | - | - | - | projection 요청 수신 | - |
| 00:37:53.468 | 20 | - | 87032200-a31c-45a3-a2a6-1ab8f3ff1306 | - | - | - | 커서 조회 | projector=multimodal-projector |
| 00:37:53.468 | 30 | projection.start | 87032200-a31c-45a3-a2a6-1ab8f3ff1306 | - | - | - | catch-up 시작 | projector=multimodal-projector |
| 00:37:53.469 | 20 | - | 87032200-a31c-45a3-a2a6-1ab8f3ff1306 | - | - | - | 이벤트 조회 | - |
| 00:37:53.470 | 20 | projection.event.mapped | 87032200-a31c-45a3-a2a6-1ab8f3ff1306 | - | 1 | 1 | 이벤트 매핑 | projector=multimodal-projector |
| 00:37:53.471 | 20 | projection.event.mapped | 87032200-a31c-45a3-a2a6-1ab8f3ff1306 | - | 3 | 2 | 이벤트 매핑 | projector=multimodal-projector |

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
- (level 40, `payload.schema.drift`) payload 에 스키마가 모르는 신규 키 유입 — 적재 시 유실됨(Read Model 후보) ← 트립 앵커 → Zod 검증 실패로 conveyor_speed, gripper_temperature 신규 키 거절, 이벤트 저장되지 → 기존 Read Model(read_grip_result, read_multimodal) 구조적 부족. [corr:ef7a97a0-1c26-4340-a290-c7a592943c87]
- Insight 카드 GripAttemptRecorded 및 read_grip_result/read_multimodal 스키마에 conveyor_speed, gripper_temperature 컬럼 미정의 [corr:ef7a97a0-1c26-4340-a290-c7a592943c87].
- src/insert/dto/toy-data.dto.ts 의 toyDataSchema 정의가 미포함 신규 키, GripResultProjector.map() 및 MultiModalProjector.map() 에서 payload = toyDataSchema.parse(event.payload) 실패 시 throw err 발생 [corr:ef7a97a0-1c26-4340-a290-c7a592943c87].
- 결과: 적재 단계 Zod 검증 실패(lane: insert.file.failed) → 데이터 유입 차단 → 기존 Read Model 에 투영된 행 존재하지.

### Decision Drivers
- Zod 검증 실패(lane: insert.file.failed)로 미유입 데이터 유지
- Defect Value Sanitization Principle(거절·격리 유지 + 원천 수정 요청)
- 기존 Read Model 구조적 부족(read_grip_result/read_multimodal 미정의 컬럼)
- API 버전 동수반 규칙(newReadModel 선택 시 versionSwitch 동반)

### Considered Options
#### 기존 보강
- 접근: src/insert/dto/toy-data.dto.ts Zod 스키마 보강 + read_grip_result/read_multimodal Drizzle 테이블 추가 컬럼 migration.
- 제안 필드: conveyor_speed, gripper_temperature
- 트레이드오프: 기존 Read Model 확장에 따른 DDL migration 비용, API 엔드포인트 응답 구조 변경 가능성, Zod coerce 권고 원칙 위함(필수 필드 누락 시 default 치환 금지). 실패 Driver 2 및 Driver 3.
```typescript
export const toyDataSchema = z.object({ ... conveyor_speed: z.number().optional(), gripper_temperature: z.number().optional() });
```

#### 신규 분리 (newReadModel)
- 접근: 신규 read_sensor_drift_v1 Read Model 생성 + 전용 Projector(SensorDriftProjector) 구현 + Zod 스키마 conveyor_speed, gripper_temperature optional 추가.
- 제안 필드: scene_key, attempt_num, conveyor_speed, gripper_temperature, occurred_at, stream_id, global_seq
- 트레이드오프: 신규 테이블·프로젝터 등록 부하, 기존 Read Model 무변 유지(무해화 원칙 준수), API 버전 동수반 필요. 성공 Driver 1, 2, 4.
```typescript
export const toyDataSchema = z.object({ "2D_image_file_name": z.string(), "3D_image_file_name": z.string(), video_file_name: z.string(), box_type: z.string(), camera_info: cameraInfoSchema, data_key: z.string(), grip_data: gripDataSchema, grip_succeed: z.number().int().min(0).max(1), objects: z.array(objectsSchema), robot_tf: robotTfSchema, human_annotation_grasp: z.array(humanAnnotationSchema), conveyor_speed: z.number().optional(), gripper_temperature: z.number().optional() });
```

### Decision Outcome
신규 분리 (newReadModel) - 기존 Read Model 확장을 Zod coerce/default 치환 권고 원칙 위반 및 DDL migration 복잡성 증가, 반면 신규 테이블 설계(read_sensor_drift_v1) 로깅 격리·무해화 원칙 준수 및 원천 데이터 수정 요청 경로 명확함.

### Consequences
- (+) 미유입 데이터 유지 확인 가능
- (+) 기존 Read Model 무변 유지
- (+) 원천 데이터 수정 요청 경로 명확한
- (+) API 버전 동수반으로 카탈로그 등록 가이드 동반
- (−) 신규 테이블·프로젝터 등록 부하
- (−) API 엔드포인트 확장에 따른 클라이언트 연동 작업 필요
- (−) Zod 스키ma optional 필드 추가 시 parse 로직 미세 조정

### Non-Goals
- 기존 Read Model(read_grip_result, read_multimodal) 컬럼 확장
- Zod coerce/default 치환 권고 원칙 적용
- poison event 식별·검증 SQL 직접 UPDATE

## 2. Read Model 생성 SQL (Read Model DDL)

> 실행 게이트: 아래 변경은 인간 승인 후에만 적용한다 (human-in-the-loop).

- 대상: `read_sensor_drift_v1` · 키: (scene_key, attempt_num) · 원천 이벤트: GripAttemptRecorded

```sql
CREATE TABLE read_sensor_drift_v1 (
  scene_key varchar NOT NULL,
  attempt_num smallint NOT NULL,
  conveyor_speed double precision,
  gripper_temperature double precision,
  occurred_at timestamptz,
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
(conveyor_speed:double precision, 컨네어 속도(센서 드리프트 신규 키)),
(gripper_temperature:double precision, 그리퍼 온도(센서 드리프트 신규 키)),
(occurred_at:timestamptz, 데이터 촬영 일자),
(stream_id:varchar, ES 스트림 ID — 추적 키),
(global_seq:bigint, 투영 출처 이벤트의 ES 전역 시퀀스 — 추적 키)
]
```

### 투영 매핑 명세 (이벤트 → 컬럼)

> upsert 키: scene_key,attempt_num · 리플레이: projection_cursor 초기화 시 0 설정. catch-up 전체 재투영 시 upsert 전제(멱idency) 필수로 동키 덮쓰기 보장.

| 원천 이벤트 | payload 필드 | 컬럼 | 변환 |
| --- | --- | --- | --- |
| GripAttemptRecorded | stream_id | stream_id | verbatim |
| GripAttemptRecorded | global_seq | global_seq | verbatim |

파생 컬럼(이벤트 payload 아님):
- `scene_key` ← stream_id prefix 'grip-attempt:' 제거
- `attempt_num` ← data_key 또는 stream_id 시도번호 추출 (예: _01_)
- `occurred_at` ← data_key 또는 stream_id 날짜 추출 (_YYYYMMDD) → ISO timestamp 변환

### Insight 카드 등록 (Insight Read DB 동기화)

> DDL 적용 시 아래 카드 등록도 함께 실행한다 — 다음 분석부터 신규 Read Model 이 LLM 컨텍스트에 노출된다.

```sql
INSERT INTO insight_entity (entity_name, kind, purpose, key_columns)
VALUES ('read_sensor_drift_v1', 'read_model', '수확 환경 센서 드리프트(conveyor_speed, gripper_temperature) 데이터 영구 보존 및 시도별 조회', '(scene_key, attempt_num)')
ON CONFLICT (entity_name) DO UPDATE SET purpose = EXCLUDED.purpose, key_columns = EXCLUDED.key_columns;

INSERT INTO insight_field (entity_name, field_name, data_type, meaning, display_order)
VALUES
  ('read_sensor_drift_v1', 'scene_key', 'varchar', '장면 식별 키 = stream_id 제거 prefix', 1),
  ('read_sensor_drift_v1', 'attempt_num', 'smallint', '동일 장면 내 파지 시도 번호', 2),
  ('read_sensor_drift_v1', 'conveyor_speed', 'double precision', '컨네어 속도(센서 드리프트 신규 키)', 3),
  ('read_sensor_drift_v1', 'gripper_temperature', 'double precision', '그리퍼 온도(센서 드리프트 신규 키)', 4),
  ('read_sensor_drift_v1', 'occurred_at', 'timestamptz', '데이터 촬영 일자', 5),
  ('read_sensor_drift_v1', 'stream_id', 'varchar', 'ES 스트림 ID — 추적 키', 6),
  ('read_sensor_drift_v1', 'global_seq', 'bigint', '투영 출처 이벤트의 ES 전역 시퀀스 — 추적 키', 7)
ON CONFLICT (entity_name, field_name) DO UPDATE SET data_type = EXCLUDED.data_type, meaning = EXCLUDED.meaning, display_order = EXCLUDED.display_order;
```

## 3. API Versioning

> 실행 게이트: 아래 변경은 인간 승인 후에만 적용한다 (human-in-the-loop).

### Unreleased (v1 → v2)

#### Added
- read_sensor_drift_v1 테이블 및 SensorDriftProjector 구현
- /projection/sensor-drift 라우트 배선
#### Changed
- toyDataSchema Zod 검증 optional 허용(conveyor_speed, gripper_temperature)

### 마이그레이션 절차

- 하위호환 변경: 기존 read_grip_result 및 read_multimodal 테이블/라우트/서비스 DI 일체 건드리지 않음[corr:ef7a97a0-1c26-4340-a290-c7a592943c87]; 신규 Read Model 동동 키 공유 but 독립 테이블로 분리, v1 데이터와 동시 보존 가능[corr:ef7a97a0-1c26-4340-a290-c7a592943c87]
- 파괴적 변경: 없음
- 컷오버 전 테스트: payload schema 드리프트 감지 로깅(level 40) 확인, SensorDriftProjector catch-up 실행 시 read_sensor_drift_v1 row count > 0 검증[corr:ef7a97a0-1c26-4340-a290-c7a592943c87]
- 롤백 창/조건: read_sensor_drift_v1 테이블 drop, SensorDriftProjector DI/라우트 제거, toyDataSchema revert[corr:ef7a97a0-1c26-4340-a290-c7a592943c87]
- Insight 카드 등록: §2의 카드 등록 SQL을 DDL과 함께 적용(카탈로그 동기화)

### 사유·호환성

- 사유: Payload schema drift 감지(conveyor_speed, gripper_temperature 신규 키)로 기존 Zod 검증이 미적은 필드 거절하여 적재 시 데이터 영구 손실 발생[corr:ef7a97a0-1c26-4340-a290-c7a592943c87]. v2는 신규 Read Model(read_sensor_drift_v1)과 Dedicated Projector(SensorDriftProjector)를 추가하여 센서 드리프트 변수를 보존, Zod 스키마도 optional 허용으로 검증 실패 차단[corr:ef7a97a0-1c26-4340-a290-c7a592943c87].
- 트리거 근거: time=00:37:53.464, level=40, action=payload.schema.drift, correlation_id=ef7a97a0-1c26-4340-a290-c7a592943c87, msg=payload 에 스키마가 모르는 신규 키 유입 — 적재 시 유실됨(Read Model 후보) ← 트립 앵커, detail=newKeys={"conveyor_speed": "1.2", "gripper_temperature": "36.5"}
- v1 호환성: 기존 read_grip_result 및 read_multimodal 테이블/프로젝터/라우트/서비스 DI는 일체 건드리지 않음[corr:ef7a97a0-1c26-4340-a290-c7a592943c87]. 신규 Read Model은 동동 키(scene_key, attempt_num)를 공유하지만 독립 테이블로 분리되어 v1 데이터와 동시 보존 가능[corr:ef7a97a0-1c26-4340-a290-c7a592943c87].

### 변경 파일

- `src/insert/dto/toy-data.dto.ts` (modifyFile) — Zod 검증 실패 원천 차단: payload 드리프트 신규 키(conveyor_speed, gripper_temperature) 추가 optional 허용으로 기존 적재 pipeline 호환성 유지[corr:ef7a97a0-1c26-4340-a290-c7a592943c87].
- `src/shared/database/schema/index.ts` (modifyFile) — 신규 Drizzle 테이블 export 배선[corr:ef7a97a0-1c26-4340-a290-c7a592943c87].
- `src/projection/projection.service.ts` (modifyFile) — SensorDriftProjector DI 배선, catch-up 메서드 추가, return type 확장[corr:ef7a97a0-1c26-4340-a290-c7a592943c87].
- `src/projection/projection.controller.ts` (modifyFile) — /sensor-drift 라우트 배선(확정 설계 경로 준수)[corr:ef7a97a0-1c26-4340-a290-c7a592943c87].

## Optional — 부속 자료(컨텍스트 축소 시 생략 가능)

### 신규 Read Model — Drizzle 스키마

```ts
import { bigint, doublePrecision, index, pgTable, primaryKey, smallint, timestamp, varchar } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const readSensorDrift = pgTable(
  "read_sensor_drift_v1",
  {
    sceneKey: varchar("scene_key").notNull(),
    attemptNum: smallint("attempt_num").notNull(),
    conveyorSpeed: doublePrecision("conveyor_speed"),
    gripperTemperature: doublePrecision("gripper_temperature"),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
    streamId: varchar("stream_id").notNull(),
    globalSeq: bigint("global_seq", { mode: "number" }).notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.sceneKey, t.attemptNum] }),
    index("idx_sensor_drift_scene").on(t.sceneKey),
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
import { readSensorDrift } from '@/shared/database/schema';
import { LogAction, LogContext } from '@/shared/logger/logging-context';

type ReadSensorDriftInsert = InferInsertModel<typeof readSensorDrift>;

@Injectable()
export class SensorDriftProjector implements Projector<ReadSensorDriftInsert> {
  readonly name: string = "sensor-drift-projector";

  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(SensorDriftProjector.name);
  }

  map(event: EventStoreEventRow): ReadSensorDriftInsert {
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
      conveyorSpeed: payload["conveyor_speed"] as number | undefined,
      gripperTemperature: payload["gripper_temperature"] as number | undefined,
      occurredAt: event.occurredAt,
      streamId: event.streamId,
      globalSeq: event.globalSeq,
    };
  }

  async upsert(tx: DrizzleTx, row: ReadSensorDriftInsert): Promise<void> {
    await tx
      .insert(readSensorDrift)
      .values(row)
      .onConflictDoUpdate({
        target: [readSensorDrift.sceneKey, readSensorDrift.attemptNum],
        set: {
          conveyorSpeed: row.conveyorSpeed,
          gripperTemperature: row.gripperTemperature,
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
// src/shared/database/schema/index.ts 추가 line:
export * from "./service/read-sensor-drift";

// src/projection/projection.service.ts 주입·catchUp<Name>():
private readonly sensorDrift: SensorDriftProjector,
catchUpSensorDrift(): Promise<ProjectionResult> { return this.runner.run(this.sensorDrift); }

// src/projection/projection.controller.ts @Post 라우트 (동일 PinoLogger.info 로깅):
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

// src/projection/projection.module.ts providers 등록:
SensorDriftProjector,

// src/insert/dto/toy-data.dto.ts zod 스키마 확장 (필드 drift 유입 대응):
export const toyDataSchema = z.object({
  "2D_image_file_name": z.string(),
  "3D_image_file_name": z.string(),
  video_file_name: z.string(),
  box_type: z.string(),
  camera_info: cameraInfoSchema,
  data_key: z.string(),
  grip_data: gripDataSchema,
  grip_succeed: z.number().int().min(0).max(1),
  objects: z.array(objectsSchema),
  robot_tf: robotTfSchema,
  human_annotation_grasp: z.array(humanAnnotationSchema),
  conveyor_speed: z.coerce.number().optional(),
  gripper_temperature: z.coerce.number().optional(),
});

export type ToyDataDto = z.infer<typeof toyDataSchema>;
```

### 버전 교체 코드 — `src/insert/dto/toy-data.dto.ts` (modifyFile)

```typescript
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
  id: z.number().int(),
  annotation_points: z.array(z.number()),
  num_keypoints: z.number().int(),
});

export const toyDataSchema = z.object({
  "2D_image_file_name": z.string(),
  "3D_image_file_name": z.string(),
  video_file_name: z.string(),
  box_type: z.string(),
  camera_info: cameraInfoSchema,
  data_key: z.string(),
  grip_data: gripDataSchema,
  grip_succeed: z.number().int().min(0).max(1),
  objects: z.array(objectsSchema),
  robot_tf: robotTfSchema,
  human_annotation_grasp: z.array(humanAnnotationSchema),
  conveyor_speed: z.number().nullable(),
  gripper_temperature: z.number().nullable(),
});

export type ToyDataDto = z.infer<typeof toyDataSchema>;
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

### 버전 교체 코드 — `src/projection/projection.service.ts` (modifyFile)

```typescript
import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { InsertResult, InsertService } from '@/insert/insert.service';
import { GripResultProjector } from '@/projection/projector/grip-result.projector';
import { MultiModalProjector } from '@/projection/projector/multimodal.projector';
import { SensorDriftProjector } from '@/projection/projector/sensor-drift.projector';
import { ProjectionResult } from '@/projection/projector/projector';
import { CatchUpRunner } from '@/projection/runner/catch-up.runner';
import { LogAction } from '@/shared/logger/logging-context';

export type CatchUpAllResult = {
  multimodal: ProjectionResult;
  gripResult: ProjectionResult;
  sensorDriftV1: ProjectionResult;
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
    private readonly sensorDriftV1: SensorDriftProjector,
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

  catchUpSensorDriftV1(): Promise<ProjectionResult> {
    return this.runner.run(this.sensorDriftV1);
  }

  async catchUpAll(): Promise<CatchUpAllResult> {
    this.logger.info({ action: LogAction.PROJECTION_START }, "전체 투영 시작");

    const multimodal: ProjectionResult = await this.catchUpMultimodal();
    const gripResult: ProjectionResult = await this.catchUpGripResult();
    const sensorDriftV1: ProjectionResult = await this.catchUpSensorDriftV1();

    this.logger.info({ action: LogAction.PROJECTION_DONE }, "전체 투영 완료");

    return { multimodal, gripResult, sensorDriftV1 };
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
  sensorDriftV1(): Promise<ProjectionResult> {
    this.logger.info(
      {
        action: LogAction.PROJECTION_REQUEST,
        [LogContext.ROUTE]: "POST /projection/sensor-drift",
      },
      "sensor drift projection 요청 수신",
    );

    return this.projectionService.catchUpSensorDriftV1();
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
- groundedness (근거 충실성): Docs 가 인용한 값·필드·장면 번호·로그가 [자료]에 실제로 있는가. [저장소 파일 확인]에서 실재하는 파일의 경로·스키마·메서드 인용은 근거 없는 주장으로 보지 않는다. 존재하지 않는 파일이나 발췌와 다른 내용의 인용은 감점한다. 5=인용된 값·필드·장면이 모두 자료에 실재. 3=핵심 근거는 실재하나 일부 수치·부등호가 원문과 불일치. 1=근거 없는 주장이나 존재하지 않는 값의 인용이 결론을 좌우.
- diagnosisAccuracy (원인 진단 정확성): Docs 의 진단이 [정답 요지]와 일치하는가. 5=정답 원인과 유형·위치(필드, 장면, 처리 단계)까지 일치. 3=유형은 맞으나 위치나 메커니즘이 부정확. 1=오진이거나 원인을 특정하지 못함.
- actionability (실행 가능성): Docs 의 SQL 과 절차를 그대로 따르면 문제가 해결되는가. [자동 검증 결과]를 실측으로 반영하되, 실행·컴파일이 되더라도 의도와 다른 일을 하는 코드는 감점한다. 반드시 다음을 직접 확인한다: (1) 프로젝션 로직이 DDL 의 NOT NULL 컬럼에 null 이나 TODO 를 넣어 실제 적재 시 실패하지 않는가, (2) upsert 의 excluded. 뒤 식별자가 DDL 의 실제 컬럼명(snake_case)인가, (3) 비율·평균 계산이 정수 나눗셈으로 0/1 만 저장되지 않는가, (4) 정답이 요구한 값(성공률·실패율 등)이 실제 컬럼으로 존재하는가, (5) CHECK 제약이 플래그로 격리해야 할 바로 그 행의 적재를 막아 설계와 모순되지 않는가, (6) 기각했다고 쓴 조치(DELETE 등)를 즉시 격리 SQL 로 그대로 싣지 않았는가, (7) 기존 v1 테이블(read_grip_result, read_multimodal, event_store)의 행을 ALTER/DROP/DELETE 하지 않는가, (8) 정답 요지가 Read Model 보강을 요구하는데 검증용 SELECT 만 있지 않은가. 5=그대로 따르면 해결(실행 성공 + 요구 충족, 위 결함 없음). 4=위 결함 중 사소한 것 1개. 3=오탈자·순서·식별자 등 소폭 수정 후 해결. 2=따르면 적재·투영이 실패하거나 요구한 값을 얻지 못함. 1=따르면 기존 자산이 손상되거나 무관함.
- completeness (완결성): 권고 문서, Read Model 생성 SQL, API 버저닝 세 요소가 모두 유효하고 서로 일치하는가. 반드시 다음을 직접 확인한다: (1) TL;DR·머리말의 대상 테이블과 DDL 의 테이블명이 같은가, (2) 권고(Decision Outcome, Non-Goals)와 실제 SQL·코드가 모순되지 않는가(예: '보강한다'고 쓰고 '구조 변경 없음'이라 함, '기존 확장'이라 쓰고 신규 테이블을 만듦), (3) 코드 블록 사이의 클래스명·파일명·라우트명·export 경로가 서로 같은가, (4) DDL 의 nullable 과 ORM 스키마의 notNull 이 일치하는가, (5) 권고 절이 '재실행 권장'·'최소 근거만 수록' 같은 대체 스텁이 아닌가, (6) API 버저닝 절이 비어 있거나 문장이 끊기지 않았는가. 5=세 요소가 모두 유효하고 서로 일치. 4=사소한 불일치 1개. 3=세 요소가 있으나 서로 어긋나거나 항목이 비어 있음. 2=한 요소가 실질적으로 비어 있음(예: DDL 절에 검증 SELECT 만). 1=요소 누락 또는 근거 부족 표시.

다음 형식의 JSON 객체 하나만 출력하라:
{"groundedness": 1-5, "diagnosisAccuracy": 1-5, "actionability": 1-5, "completeness": 1-5, "unsupportedClaims": ["자료에 없는 주장 인용 (없으면 빈 배열)"], "rationale": "각 항목 점수 근거를 항목당 1~2문장으로, 한국어로"}
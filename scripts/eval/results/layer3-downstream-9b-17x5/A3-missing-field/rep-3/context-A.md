---
docId: analysis-0e0dc39b-7edd-41f0-8a85-de26b45d9ba1
generatedAt: 2026-08-11T19:56:36.058Z
targetReadModel: read_grip_result
sqlDialect: postgres
sufficientEvidence: true
apiVersion:
  from: null
  to: null
  affectedEndpoints: []
evidenceSources:
  - { origin: developer-logging, anchorId: "0e0dc39b-7edd-41f0-8a85-de26b45d9ba1" }
constraints:
  - "v1 자산(테이블/엔드포인트/프로젝터 name) 무손상"
  - "PK (scene_key, attempt_num) 유지"
  - "TypeScript any 금지"
  - "식별자 전체 단어"
  - "DDL 실행·API 컷오버는 인간 승인 후에만 (human-in-the-loop)"
  - "Read Model 테이블명은 read_ 접두 스네이크 케이스"
---

# Self-Adaptive CQRS Docs — read_grip_result

> 결론(TL;DR): `read_grip_result`을(를) 보강한다 — Toy-Data 적재 배치에서 다수 파일은 성공이나, 두 특정 파일(`..._02004`, `..._02005`)에서 Zod 검증 실패로 적재가 거절되었다. 실패 원인은 `GripAttemptRecorded` 스키마에 필수로 요구된 `grip_data`와 `robot_tf` 키가 결결 누락或未定됨. 이는 적재 단계의 국국 격렬 실패이며, 배치 트랜잭션은 정상 완료되었고 후속 투영 요청은 unaffected하게 진행되었다. (이상 유형: 요청 충족 실패 · 심각도: warning)

<logging_context>

## 이상 로그 맥락 (±N 윈도우)
> 빈도: 최근 1h — `insert.request`(level 30) 1회, `insert.file.failed`(level 40) 1회, `insert.batch.start`(level 30) 1회, `log.delete.request`(level 30) 1회, `log.delete.done`(level 30) 1회, `insert.file.ok`(level 20) 50회, `-`(level 30) 1회.

| time | level | action | correlation_id | stream_id | attempt | global_seq | msg | detail |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 19:56:28.438 | 30 | insert.request | 0e0dc39b-7edd-41f0-8a85-de26b45d9ba1 | - | - | - | Insert Event Store 요청 수신 | - |
| 19:56:28.438 | 30 | insert.batch.start | 0e0dc39b-7edd-41f0-8a85-de26b45d9ba1 | - | - | - | Toy-Data 적재 시작 | - |
| 19:56:28.443 | 20 | insert.file.ok | 0e0dc39b-7edd-41f0-8a85-de26b45d9ba1 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00120 | 2 | 1 | 이벤트 append | - |
| 19:56:28.443 | 20 | insert.file.ok | 0e0dc39b-7edd-41f0-8a85-de26b45d9ba1 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00120 | 2 | 1 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00120_02_20230923.json |
| 19:56:28.444 | 20 | insert.file.ok | 0e0dc39b-7edd-41f0-8a85-de26b45d9ba1 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00121 | 2 | 2 | 이벤트 append | - |
| 19:56:28.444 | 20 | insert.file.ok | 0e0dc39b-7edd-41f0-8a85-de26b45d9ba1 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00121 | 2 | 2 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00121_02_20230923.json |
| 19:56:28.445 | 20 | insert.file.ok | 0e0dc39b-7edd-41f0-8a85-de26b45d9ba1 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00133 | 1 | 3 | 이벤트 append | - |
| 19:56:28.445 | 20 | insert.file.ok | 0e0dc39b-7edd-41f0-8a85-de26b45d9ba1 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00133 | 1 | 3 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00133_01_20230923.json |
| 19:56:28.446 | 20 | insert.file.ok | 0e0dc39b-7edd-41f0-8a85-de26b45d9ba1 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00133 | 2 | 4 | 이벤트 append | - |
| 19:56:28.446 | 20 | insert.file.ok | 0e0dc39b-7edd-41f0-8a85-de26b45d9ba1 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00133 | 2 | 4 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00133_02_20230923.json |
| 19:56:28.447 | 20 | insert.file.ok | 0e0dc39b-7edd-41f0-8a85-de26b45d9ba1 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00134 | 1 | 5 | 이벤트 append | - |
| 19:56:28.447 | 20 | insert.file.ok | 0e0dc39b-7edd-41f0-8a85-de26b45d9ba1 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00134 | 1 | 5 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00134_01_20230923.json |
| 19:56:28.449 | 20 | insert.file.ok | 0e0dc39b-7edd-41f0-8a85-de26b45d9ba1 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00134 | 2 | 6 | 이벤트 append | - |
| 19:56:28.449 | 20 | insert.file.ok | 0e0dc39b-7edd-41f0-8a85-de26b45d9ba1 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00134 | 2 | 6 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00134_02_20230923.json |
| 19:56:28.450 | 20 | insert.file.ok | 0e0dc39b-7edd-41f0-8a85-de26b45d9ba1 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00135 | 2 | 7 | 이벤트 append | - |
| 19:56:28.450 | 20 | insert.file.ok | 0e0dc39b-7edd-41f0-8a85-de26b45d9ba1 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00135 | 2 | 7 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00135_02_20230923.json |
| 19:56:28.451 | 20 | insert.file.ok | 0e0dc39b-7edd-41f0-8a85-de26b45d9ba1 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00154 | 1 | 9 | 이벤트 append | - |
| 19:56:28.451 | 20 | insert.file.ok | 0e0dc39b-7edd-41f0-8a85-de26b45d9ba1 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00147 | 1 | 8 | 이벤트 append | - |
| 19:56:28.451 | 20 | insert.file.ok | 0e0dc39b-7edd-41f0-8a85-de26b45d9ba1 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00147 | 1 | 8 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00147_01_20230923.json |
| 19:56:28.451 | 20 | insert.file.ok | 0e0dc39b-7edd-41f0-8a85-de26b45d9ba1 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00154 | 1 | 9 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00154_01_20230923.json |
| 19:56:28.452 | 20 | insert.file.ok | 0e0dc39b-7edd-41f0-8a85-de26b45d9ba1 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00155 | 2 | 10 | 이벤트 append | - |
| 19:56:28.452 | 20 | insert.file.ok | 0e0dc39b-7edd-41f0-8a85-de26b45d9ba1 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00155 | 2 | 10 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00155_02_20230923.json |
| 19:56:28.453 | 20 | insert.file.ok | 0e0dc39b-7edd-41f0-8a85-de26b45d9ba1 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00157 | 1 | 11 | 이벤트 append | - |
| 19:56:28.453 | 20 | insert.file.ok | 0e0dc39b-7edd-41f0-8a85-de26b45d9ba1 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00157 | 1 | 11 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00157_01_20230923.json |
| 19:56:28.454 | 20 | insert.file.ok | 0e0dc39b-7edd-41f0-8a85-de26b45d9ba1 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00163 | 2 | 12 | 이벤트 append | - |
| 19:56:28.454 | 20 | insert.file.ok | 0e0dc39b-7edd-41f0-8a85-de26b45d9ba1 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00163 | 2 | 12 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00163_02_20230923.json |
| 19:56:28.455 | 20 | insert.file.ok | 0e0dc39b-7edd-41f0-8a85-de26b45d9ba1 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00163 | 3 | 13 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00163_03_20230923.json |
| 19:56:28.455 | 20 | insert.file.ok | 0e0dc39b-7edd-41f0-8a85-de26b45d9ba1 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00163 | 3 | 13 | 이벤트 append | - |
| 19:56:28.456 | 20 | insert.file.ok | 0e0dc39b-7edd-41f0-8a85-de26b45d9ba1 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00167 | 3 | 14 | 이벤트 append | - |
| 19:56:28.456 | 20 | insert.file.ok | 0e0dc39b-7edd-41f0-8a85-de26b45d9ba1 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00167 | 3 | 14 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00167_03_20230923.json |
| 19:56:28.456 | 20 | insert.file.ok | 0e0dc39b-7edd-41f0-8a85-de26b45d9ba1 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00168 | 3 | 15 | 이벤트 append | - |
| 19:56:28.456 | 20 | insert.file.ok | 0e0dc39b-7edd-41f0-8a85-de26b45d9ba1 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00168 | 3 | 15 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00168_03_20230923.json |
| 19:56:28.457 | 20 | insert.file.ok | 0e0dc39b-7edd-41f0-8a85-de26b45d9ba1 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00169 | 2 | 16 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00169_02_20230923.json |
| 19:56:28.457 | 20 | insert.file.ok | 0e0dc39b-7edd-41f0-8a85-de26b45d9ba1 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00169 | 2 | 16 | 이벤트 append | - |
| 19:56:28.458 | 20 | insert.file.ok | 0e0dc39b-7edd-41f0-8a85-de26b45d9ba1 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00188 | 2 | 17 | 이벤트 append | - |
| 19:56:28.458 | 20 | insert.file.ok | 0e0dc39b-7edd-41f0-8a85-de26b45d9ba1 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00188 | 2 | 17 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00188_02_20230923.json |
| 19:56:28.459 | 20 | insert.file.ok | 0e0dc39b-7edd-41f0-8a85-de26b45d9ba1 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00189 | 3 | 18 | 이벤트 append | - |
| 19:56:28.459 | 20 | insert.file.ok | 0e0dc39b-7edd-41f0-8a85-de26b45d9ba1 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00189 | 3 | 18 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00189_03_20230923.json |
| 19:56:28.460 | 20 | insert.file.ok | 0e0dc39b-7edd-41f0-8a85-de26b45d9ba1 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00190 | 1 | 19 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00190_01_20230923.json |
| 19:56:28.460 | 20 | insert.file.ok | 0e0dc39b-7edd-41f0-8a85-de26b45d9ba1 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00190 | 1 | 19 | 이벤트 append | - |
| 19:56:28.460 | 20 | insert.file.ok | 0e0dc39b-7edd-41f0-8a85-de26b45d9ba1 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00190 | 3 | 20 | 이벤트 append | - |
| 19:56:28.461 | 20 | insert.file.ok | 0e0dc39b-7edd-41f0-8a85-de26b45d9ba1 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00192 | 1 | 21 | 이벤트 append | - |
| 19:56:28.461 | 20 | insert.file.ok | 0e0dc39b-7edd-41f0-8a85-de26b45d9ba1 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00190 | 3 | 20 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00190_03_20230923.json |
| 19:56:28.461 | 20 | insert.file.ok | 0e0dc39b-7edd-41f0-8a85-de26b45d9ba1 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00192 | 1 | 21 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00192_01_20230923.json |
| 19:56:28.462 | 20 | insert.file.ok | 0e0dc39b-7edd-41f0-8a85-de26b45d9ba1 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00197 | 3 | 22 | 이벤트 append | - |
| 19:56:28.462 | 20 | insert.file.ok | 0e0dc39b-7edd-41f0-8a85-de26b45d9ba1 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00197 | 3 | 22 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00197_03_20230923.json |
| 19:56:28.463 | 20 | insert.file.ok | 0e0dc39b-7edd-41f0-8a85-de26b45d9ba1 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00204 | 1 | 23 | 이벤트 append | - |
| 19:56:28.463 | 20 | insert.file.ok | 0e0dc39b-7edd-41f0-8a85-de26b45d9ba1 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00204 | 1 | 23 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00204_01_20230923.json |
| 19:56:28.464 | 20 | insert.file.ok | 0e0dc39b-7edd-41f0-8a85-de26b45d9ba1 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00206 | 1 | 24 | 이벤트 append | - |
| 19:56:28.464 | 20 | insert.file.ok | 0e0dc39b-7edd-41f0-8a85-de26b45d9ba1 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00206 | 1 | 24 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00206_01_20230923.json |
| 19:56:28.465 | 20 | insert.file.ok | 0e0dc39b-7edd-41f0-8a85-de26b45d9ba1 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00206 | 2 | 25 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00206_02_20230923.json |
| 19:56:28.465 | 20 | insert.file.ok | 0e0dc39b-7edd-41f0-8a85-de26b45d9ba1 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00206 | 2 | 25 | 이벤트 append | - |
| 19:56:28.465 | 40 | insert.file.failed | 0e0dc39b-7edd-41f0-8a85-de26b45d9ba1 | - | - | - | toy-data 파일 적재 실패 ← 트립 앵커 | reason=[   {     "expected": "object",     "code": "invalid_type",     "path": [       "grip_data"     ],     "message": "Invalid input: expected object, received undefined"   } ] · file=반려동물용품_CR01_강아지공룡알장난감_02004_01_20230923.json |
| 19:56:28.466 | 30 | insert.batch.done | 0e0dc39b-7edd-41f0-8a85-de26b45d9ba1 | - | - | - | toy-data 적재 완료 | - |
| 19:56:28.466 | 40 | insert.file.failed | 0e0dc39b-7edd-41f0-8a85-de26b45d9ba1 | - | - | - | toy-data 파일 적재 실패 | reason=[   {     "expected": "object",     "code": "invalid_type",     "path": [       "robot_tf"     ],     "message": "Invalid input: expected object, received undefined"   } ] · file=반려동물용품_CR01_강아지공룡알장난감_02005_01_20230923.json |
| 19:56:28.467 | 30 | - | 0e0dc39b-7edd-41f0-8a85-de26b45d9ba1 | - | - | - | request completed | - |
| 19:56:28.468 | 30 | projection.request | 05997b1d-d662-488e-89aa-0b907efdc331 | - | - | - | projection 요청 수신 | - |
| 19:56:28.470 | 20 | - | 05997b1d-d662-488e-89aa-0b907efdc331 | - | - | - | 커서 조회 | projector=multimodal-projector |
| 19:56:28.470 | 30 | projection.start | 05997b1d-d662-488e-89aa-0b907efdc331 | - | - | - | catch-up 시작 | projector=multimodal-projector |
| 19:56:28.472 | 20 | - | 05997b1d-d662-488e-89aa-0b907efdc331 | - | - | - | 이벤트 조회 | - |
| 19:56:28.472 | 20 | projection.event.mapped | 05997b1d-d662-488e-89aa-0b907efdc331 | - | 2 | 1 | 이벤트 매핑 | projector=multimodal-projector |
| 19:56:28.473 | 20 | projection.event.mapped | 05997b1d-d662-488e-89aa-0b907efdc331 | - | 2 | 2 | 이벤트 매핑 | projector=multimodal-projector |

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
- (level 40, `insert.file.failed`) toy-data 파일 적재 실패 ← 트립 앵커 · reason=[ { "expected": "object", "code": "invalid_type", "path": [ "grip_data" ], "message": "Invalid input: expected object, received undefined" } ] · file=반려동물용품_CR01_강아지공룡알장난감_02004_01_20230923.json → Zod 검증 실패로 원천 JSON 파일의 grip_data 필드 누락/타입 위반이 드러남. [corr:0e0dc39b-7edd-41f0-8a85-de26b45d9ba1]
- (level 40, `insert.file.failed`) toy-data 파일 적재 실패 · reason=[ { "expected": "object", "code": "invalid_type", "path": [ "robot_tf" ], "message": "Invalid input: expected object, received undefined" } ] · file=반려동물용품_CR01_강아지공룡알장난감_02005_01_20230923.json → Zod 검증 실패로 원천 JSON 파일의 robot_tf 필드 누락/타입 위반이 드러남. [corr:0e0dc39b-7edd-41f0-8a85-de26b45d9ba1]
- Insight 카드 GripAttemptRecorded 정의는 grip_data.grip_2d_pose, grip_data.grip_3d_pose, robot_tf.rotation_3x3, robot_tf.translation_3x1 로 필수 키를 요구하나, 원천 JSON 파일의 payload 가 이 키들을 결결 누락 또는 미설정으로 제공하여 Zod 적재 검증이 실패함. [corr:0e0dc39b-7edd-41f0-8a85-de26b45d9ba1]
- src/insert/dto/toy-data.dto.ts 의 toyDataSchema 정의가 grip_data 와 robot_tf 로 z.object() 강제 구조를 적용, GripResultProjector.map() (src/projection/projector/grip-result.projector.ts) 에서 toyDataSchema.parse(event.payload) 호출 시 Zod 거절이 throw 되어 ES 미유입 상태 유지. [corr:0e0dc39b-7edd-41f0-8a85-de26b45d9ba1]
- insert.batch.done 로그(19:56:28.466) 직후 projection.request(19:56:28.468) 시작, 성공적재된 파일들만 ES 에 존재하여 후속 투영 요청은 unaffected 하게 진행됨. [corr:0e0dc39b-7edd-41f0-8a85-de26b45d9ba1]

### Decision Drivers
- Zod 거절 은 시스템 의도한 방어 동작(원천 데이터 정성 검증)
- 결함 파일의 payload 미유입 ES → Read Model 구조 문제 아님
- Defect Value Sanitization Principle 준수 (z.coerce/기본값 치환 금지)
- downstream projection unaffected by batch isolation

### Considered Options
#### 거절 유지 + 원천 데이터 수정 요청
- 접근: src/insert/dto/toy-data.dto.ts Zod schema 유지, InsertService 실패 로깅 보강, 외부 데이터 파이프라인에 필드 누락 원인 분석 및 수정 요청.
- 제안 필드: Zod strict validation, External data pipeline fix
- 트레이드오프: 프로젝터/Read Model 코드를 건들지 않음. 시스템 무해화 원칙 준수. 대안으로 Zod schema 완화 시 downstream integrity violation 발생.
```typescript
// src/insert/dto/toy-data.dto.ts 유지 그대로
export const toyDataSchema = z.object({
  // ... grip_data, robot_tf 강제 정의 ...
});

// src/projection/projector/grip-result.projector.ts map 메소드
try {
  payload = toyDataSchema.parse(event.payload);
} catch (error) {
  this.logger.error({ action: LogAction.MAP_FAILED, err: error }, "이벤트 매핑(검증) 실패");
  throw error; // ES 미유입 유지
}
```

#### 무유입 검증 절차 보강
- 접근: InsertService batch 완료 시 event_store 조회로 실패 파일 stream_id/attempt_num 존재 여부 확인, 0 기대값 검증 로직 추가.
- 제안 필드: ES non-entry verification, Operational consistency check
- 트레이드오프: DB 조회 오버헤드 미미함. 운영 일관성 보장. 코드는 기존 catch-up runner 패턴 따름.
```typescript
// src/projection/repository/event-store-reader.repository.ts fetchAfter 보강
const expectedStreams = failedFileNames.map(f => ({
  streamId: `grip-attempt:${f.split('_01_')[0]}`,
  attemptNum: 1
}));
for (const target of expectedStreams) {
  const count = await tx.select(eventStore).where(
    and(eq(eventStore.stream_id, target.streamId), eq(eventStore.attempt_num, target.attemptNum))
  ).count();
  if (count > 0) throw new Error('Poison event leak detected');
}
```

#### Zod schema 완화 (기각 대안)
- 접근: toyDataSchema 필드 .optional() 적용.
- 제안 필드: DTO optional fields
- 트레이드오프: Defect Value Sanitization Principle 위반. Zod 거절 의도 파괴, Read Model 유입 시 integrity violation 발생.
```typescript
// src/insert/dto/toy-data.dto.ts 변경
export const toyDataSchema = z.object({
  grip_data: gripDataSchema.optional(),
  robot_tf: robotTfSchema.optional()
});
```

### Decision Outcome
거절 유지 + 원천 데이터 수정 요청

### Consequences
- (+) ES 오염 방지
- (+) downstream projection unaffected
- (+) Read Model schema 정합 유지
- (−) 외부 데이터 파이프라인 수정 지연 발생 가능
- (−) batch 처리 latency 증가(검증 로깅)

### Non-Goals
- Zod schema 구조 변경 (optional/coerce)
- 신규 Read Model 테이블 생성
- 결함 값 정상화/추후 투영 재개

## 2. Read Model 생성 SQL (Read Model DDL)

> 실행 게이트: 아래 변경은 인간 승인 후에만 적용한다 (human-in-the-loop).

### 격리(containment) SQL — 신규 Read Model DDL 불필요, 결함 데이터 무해화가 조치다

```sql
-- 무유입 검증: zod 거절된 파일의 이벤트가 event_store 에 유입되지 않았음을 확인한다 (기대값 0)
SELECT count(*) AS rejected_event_count FROM event_store WHERE (stream_id, attempt_num) IN (('grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02004', 1), ('grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02005', 1));
```

## 3. API Versioning

### 버전 영향

변 변경 없음. Read Model 및 Event Store 스키마, API 엔드포인트(POST /projection/insert-all) 가 그대로 유지. 격리 권고는 운영 관례(데이터 수정 요청)에 불과해 버전 호환성 영향이 제로.

## Guardrails (constraints)

- v1 자산(테이블/엔드포인트/프로젝터 name) 무손상
- PK (scene_key, attempt_num) 유지
- TypeScript any 금지
- 식별자 전체 단어
- DDL 실행·API 컷오버는 인간 승인 후에만 (human-in-the-loop)
- Read Model 테이블명은 read_ 접두 스네이크 케이스
---
docId: analysis-0069e24d-fc33-4d71-84a0-4aeab4ae354b
generatedAt: 2026-08-12T09:58:45.264Z
targetReadModel: read_grip_result
sqlDialect: postgres
sufficientEvidence: true
apiVersion:
  from: null
  to: null
  affectedEndpoints: []
evidenceSources:
  - { origin: developer-logging, anchorId: "0069e24d-fc33-4d71-84a0-4aeab4ae354b" }
constraints:
  - "v1 자산(테이블/엔드포인트/프로젝터 name) 무손상"
  - "PK (scene_key, attempt_num) 유지"
  - "TypeScript any 금지"
  - "식별자 전체 단어"
  - "DDL 실행·API 컷오버는 인간 승인 후에만 (human-in-the-loop)"
  - "Read Model 테이블명은 read_ 접두 스네이크 케이스"
---

# Self-Adaptive CQRS Docs — read_grip_result

> 결론(TL;DR): `read_grip_result`을(를) 보강한다 — Toy-Data 적재 배치에서 두 파일의 grip_succeed 필드 타입/치역 위 Zod ingest 스키마(number, <=1)를 위만. insert.file.failed는 파일 단위 try/catch이므로 실패한 파일은 event_store 미적립, 나머지 배치와 후속 투영은 정상 진행됨. (이상 유형: 적재 Zod 검증 실패(데이터 정재 거절) · 심각도: warning)

<logging_context>

## 이상 로그 맥락 (±N 윈도우)
> 빈도: 최근 1h — `insert.request`(level 30) 1회, `insert.file.failed`(level 40) 1회, `insert.batch.start`(level 30) 1회, `log.delete.request`(level 30) 1회, `log.delete.done`(level 30) 1회, `insert.file.ok`(level 20) 50회, `-`(level 30) 1회.

| time | level | action | correlation_id | stream_id | attempt | global_seq | msg | detail |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 09:58:42.813 | 30 | insert.batch.start | 0069e24d-fc33-4d71-84a0-4aeab4ae354b | - | - | - | Toy-Data 적재 시작 | - |
| 09:58:42.813 | 30 | insert.request | 0069e24d-fc33-4d71-84a0-4aeab4ae354b | - | - | - | Insert Event Store 요청 수신 | - |
| 09:58:42.818 | 20 | insert.file.ok | 0069e24d-fc33-4d71-84a0-4aeab4ae354b | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00051 | 2 | 1 | 이벤트 append | - |
| 09:58:42.818 | 20 | insert.file.ok | 0069e24d-fc33-4d71-84a0-4aeab4ae354b | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00051 | 2 | 1 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00051_02_20230923.json |
| 09:58:42.820 | 20 | insert.file.ok | 0069e24d-fc33-4d71-84a0-4aeab4ae354b | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00055 | 3 | 2 | 이벤트 append | - |
| 09:58:42.820 | 20 | insert.file.ok | 0069e24d-fc33-4d71-84a0-4aeab4ae354b | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00056 | 2 | 3 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00056_02_20230923.json |
| 09:58:42.820 | 20 | insert.file.ok | 0069e24d-fc33-4d71-84a0-4aeab4ae354b | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00055 | 3 | 2 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00055_03_20230923.json |
| 09:58:42.820 | 20 | insert.file.ok | 0069e24d-fc33-4d71-84a0-4aeab4ae354b | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00056 | 2 | 3 | 이벤트 append | - |
| 09:58:42.822 | 20 | insert.file.ok | 0069e24d-fc33-4d71-84a0-4aeab4ae354b | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00059 | 2 | 4 | 이벤트 append | - |
| 09:58:42.822 | 20 | insert.file.ok | 0069e24d-fc33-4d71-84a0-4aeab4ae354b | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00059 | 2 | 4 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00059_02_20230923.json |
| 09:58:42.823 | 20 | insert.file.ok | 0069e24d-fc33-4d71-84a0-4aeab4ae354b | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00061 | 3 | 5 | 이벤트 append | - |
| 09:58:42.823 | 20 | insert.file.ok | 0069e24d-fc33-4d71-84a0-4aeab4ae354b | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00061 | 3 | 5 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00061_03_20230923.json |
| 09:58:42.824 | 20 | insert.file.ok | 0069e24d-fc33-4d71-84a0-4aeab4ae354b | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00071 | 3 | 6 | 이벤트 append | - |
| 09:58:42.824 | 20 | insert.file.ok | 0069e24d-fc33-4d71-84a0-4aeab4ae354b | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00071 | 3 | 6 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00071_03_20230923.json |
| 09:58:42.825 | 20 | insert.file.ok | 0069e24d-fc33-4d71-84a0-4aeab4ae354b | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00074 | 3 | 8 | 이벤트 append | - |
| 09:58:42.825 | 20 | insert.file.ok | 0069e24d-fc33-4d71-84a0-4aeab4ae354b | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00072 | 1 | 7 | 이벤트 append | - |
| 09:58:42.825 | 20 | insert.file.ok | 0069e24d-fc33-4d71-84a0-4aeab4ae354b | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00072 | 1 | 7 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00072_01_20230923.json |
| 09:58:42.825 | 20 | insert.file.ok | 0069e24d-fc33-4d71-84a0-4aeab4ae354b | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00074 | 3 | 8 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00074_03_20230923.json |
| 09:58:42.827 | 20 | insert.file.ok | 0069e24d-fc33-4d71-84a0-4aeab4ae354b | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00079 | 2 | 9 | 이벤트 append | - |
| 09:58:42.827 | 20 | insert.file.ok | 0069e24d-fc33-4d71-84a0-4aeab4ae354b | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00079 | 2 | 9 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00079_02_20230923.json |
| 09:58:42.828 | 20 | insert.file.ok | 0069e24d-fc33-4d71-84a0-4aeab4ae354b | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00097 | 1 | 11 | 이벤트 append | - |
| 09:58:42.828 | 20 | insert.file.ok | 0069e24d-fc33-4d71-84a0-4aeab4ae354b | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00080 | 2 | 10 | 이벤트 append | - |
| 09:58:42.828 | 20 | insert.file.ok | 0069e24d-fc33-4d71-84a0-4aeab4ae354b | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00080 | 2 | 10 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00080_02_20230923.json |
| 09:58:42.828 | 20 | insert.file.ok | 0069e24d-fc33-4d71-84a0-4aeab4ae354b | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00097 | 1 | 11 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00097_01_20230923.json |
| 09:58:42.829 | 20 | insert.file.ok | 0069e24d-fc33-4d71-84a0-4aeab4ae354b | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00100 | 2 | 12 | 이벤트 append | - |
| 09:58:42.829 | 20 | insert.file.ok | 0069e24d-fc33-4d71-84a0-4aeab4ae354b | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00100 | 2 | 12 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00100_02_20230923.json |
| 09:58:42.830 | 20 | insert.file.ok | 0069e24d-fc33-4d71-84a0-4aeab4ae354b | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00103 | 1 | 13 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00103_01_20230923.json |
| 09:58:42.830 | 20 | insert.file.ok | 0069e24d-fc33-4d71-84a0-4aeab4ae354b | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00103 | 1 | 13 | 이벤트 append | - |
| 09:58:42.831 | 20 | insert.file.ok | 0069e24d-fc33-4d71-84a0-4aeab4ae354b | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00103 | 2 | 14 | 이벤트 append | - |
| 09:58:42.831 | 20 | insert.file.ok | 0069e24d-fc33-4d71-84a0-4aeab4ae354b | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00103 | 2 | 14 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00103_02_20230923.json |
| 09:58:42.832 | 20 | insert.file.ok | 0069e24d-fc33-4d71-84a0-4aeab4ae354b | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00108 | 2 | 16 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00108_02_20230923.json |
| 09:58:42.832 | 20 | insert.file.ok | 0069e24d-fc33-4d71-84a0-4aeab4ae354b | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00106 | 1 | 15 | 이벤트 append | - |
| 09:58:42.832 | 20 | insert.file.ok | 0069e24d-fc33-4d71-84a0-4aeab4ae354b | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00106 | 1 | 15 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00106_01_20230923.json |
| 09:58:42.832 | 20 | insert.file.ok | 0069e24d-fc33-4d71-84a0-4aeab4ae354b | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00108 | 2 | 16 | 이벤트 append | - |
| 09:58:42.833 | 20 | insert.file.ok | 0069e24d-fc33-4d71-84a0-4aeab4ae354b | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00109 | 1 | 17 | 이벤트 append | - |
| 09:58:42.833 | 20 | insert.file.ok | 0069e24d-fc33-4d71-84a0-4aeab4ae354b | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00109 | 1 | 17 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00109_01_20230923.json |
| 09:58:42.834 | 20 | insert.file.ok | 0069e24d-fc33-4d71-84a0-4aeab4ae354b | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00110 | 3 | 18 | 이벤트 append | - |
| 09:58:42.834 | 20 | insert.file.ok | 0069e24d-fc33-4d71-84a0-4aeab4ae354b | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00110 | 3 | 18 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00110_03_20230923.json |
| 09:58:42.835 | 20 | insert.file.ok | 0069e24d-fc33-4d71-84a0-4aeab4ae354b | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00112 | 3 | 19 | 이벤트 append | - |
| 09:58:42.835 | 20 | insert.file.ok | 0069e24d-fc33-4d71-84a0-4aeab4ae354b | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00112 | 3 | 19 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00112_03_20230923.json |
| 09:58:42.836 | 20 | insert.file.ok | 0069e24d-fc33-4d71-84a0-4aeab4ae354b | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00120 | 2 | 21 | 이벤트 append | - |
| 09:58:42.836 | 20 | insert.file.ok | 0069e24d-fc33-4d71-84a0-4aeab4ae354b | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00117 | 3 | 20 | 이벤트 append | - |
| 09:58:42.836 | 20 | insert.file.ok | 0069e24d-fc33-4d71-84a0-4aeab4ae354b | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00117 | 3 | 20 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00117_03_20230923.json |
| 09:58:42.836 | 20 | insert.file.ok | 0069e24d-fc33-4d71-84a0-4aeab4ae354b | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00120 | 2 | 21 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00120_02_20230923.json |
| 09:58:42.837 | 20 | insert.file.ok | 0069e24d-fc33-4d71-84a0-4aeab4ae354b | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00121 | 2 | 22 | 이벤트 append | - |
| 09:58:42.837 | 20 | insert.file.ok | 0069e24d-fc33-4d71-84a0-4aeab4ae354b | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00121 | 2 | 22 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00121_02_20230923.json |
| 09:58:42.838 | 20 | insert.file.ok | 0069e24d-fc33-4d71-84a0-4aeab4ae354b | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00133 | 1 | 23 | 이벤트 append | - |
| 09:58:42.838 | 20 | insert.file.ok | 0069e24d-fc33-4d71-84a0-4aeab4ae354b | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00133 | 1 | 23 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00133_01_20230923.json |
| 09:58:42.839 | 20 | insert.file.ok | 0069e24d-fc33-4d71-84a0-4aeab4ae354b | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00133 | 2 | 24 | 이벤트 append | - |
| 09:58:42.839 | 20 | insert.file.ok | 0069e24d-fc33-4d71-84a0-4aeab4ae354b | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00133 | 2 | 24 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00133_02_20230923.json |
| 09:58:42.840 | 20 | insert.file.ok | 0069e24d-fc33-4d71-84a0-4aeab4ae354b | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00134 | 1 | 25 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00134_01_20230923.json |
| 09:58:42.840 | 20 | insert.file.ok | 0069e24d-fc33-4d71-84a0-4aeab4ae354b | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00134 | 1 | 25 | 이벤트 append | - |
| 09:58:42.840 | 40 | insert.file.failed | 0069e24d-fc33-4d71-84a0-4aeab4ae354b | - | - | - | toy-data 파일 적재 실패 ← 트립 앵커 | reason=[   {     "expected": "number",     "code": "invalid_type",     "path": [       "grip_succeed"     ],     "message": "Invalid input: expected number, received string"   } ] · file=반려동물용품_CR01_강아지공룡알장난감_02002_01_20230923.json |
| 09:58:42.841 | 30 | insert.batch.done | 0069e24d-fc33-4d71-84a0-4aeab4ae354b | - | - | - | toy-data 적재 완료 | - |
| 09:58:42.841 | 40 | insert.file.failed | 0069e24d-fc33-4d71-84a0-4aeab4ae354b | - | - | - | toy-data 파일 적재 실패 | reason=[   {     "origin": "number",     "code": "too_big",     "maximum": 1,     "inclusive": true,     "path": [       "grip_succeed"     ],     "message": "Too big: expected number to be <=1"   } ] · file=반려동물용품_CR01_강아지공룡알장난감_02003_01_20230923.json |
| 09:58:42.842 | 30 | - | 0069e24d-fc33-4d71-84a0-4aeab4ae354b | - | - | - | request completed | - |
| 09:58:42.844 | 30 | projection.request | 18c3da13-2efb-42a7-948f-7c9850bcd3a8 | - | - | - | projection 요청 수신 | - |
| 09:58:42.846 | 30 | projection.start | 18c3da13-2efb-42a7-948f-7c9850bcd3a8 | - | - | - | catch-up 시작 | projector=multimodal-projector |
| 09:58:42.846 | 20 | - | 18c3da13-2efb-42a7-948f-7c9850bcd3a8 | - | - | - | 커서 조회 | projector=multimodal-projector |
| 09:58:42.848 | 20 | - | 18c3da13-2efb-42a7-948f-7c9850bcd3a8 | - | - | - | 이벤트 조회 | - |
| 09:58:42.848 | 20 | projection.event.mapped | 18c3da13-2efb-42a7-948f-7c9850bcd3a8 | - | 2 | 1 | 이벤트 매핑 | projector=multimodal-projector |
| 09:58:42.849 | 20 | projection.event.mapped | 18c3da13-2efb-42a7-948f-7c9850bcd3a8 | - | 3 | 2 | 이벤트 매핑 | projector=multimodal-projector |

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
- (level 40, `insert.file.failed`) toy-data 파일 적재 실패 ← 트립 앵커 · reason=[ { "expected": "number", "code": "invalid_type" } ] · file=반려ჩᆼ물용품_CR01_강아지공룡알장난감_02002_01_20230923.json → 원천 파일의 grip_succeed 필드 타입 위반(string) 및 치역 초과로 Zod ingest 검증이 거절됨. [corr:0069e24d-fc33-4d71-84a0-4aeab4ae354b]
- (level 40, `insert.file.failed`) toy-data 파일 적재 실패 · reason=[ { "origin": "number", "code": "too_big" } ] · file=반려ჩᆼ물용품_CR01_강아지공룡알장난감_02003_01_20230923.json → 원천 파일의 grip_succeed 필드 누락/치역 초과(>1)로 Zod ingest 검증이 거절됨. [corr:0069e24d-fc33-4d71-84a0-4aeab4ae354b]
- src/insert/dto/toy-data.dto.ts 의 toyDataSchema 정의는 grip_succeed: z.number().int().min(0).max(1) 로, 로그의 string 입력과 >1 값이 명확히 원천 데이터 정재 위만.
- src/projection/projector/grip-result.projector.ts 의 map() 메서드 는 toyDataSchema.parse(event.payload) 호출 시 try/catch 가 거절 시 에러 던지고 ES 적재가 중단해, 실패한 파일은 Event Store 미적립.
- read_grip_result 스키마 의 grip_succeed: smallint 컬럼 은 정상 투영만 적재되므로 Read Model 구조는 무결하며, 부족 아님.

### Decision Drivers
- Zod 검증 의도(원천 데이터 정재)
- Event Store 무유입 보장
- Read Model 구조 안정성
- 시스템 방어 동작 유지

### Considered Options
#### 거절 유지 + 원천 데이터 수정 요청 (권장)
- 접근: src/insert/dto/toy-data.dto.ts Zod 스키마 변경 안 함. upstream _02002, _02003 파일 정재 요청.
- 제안 필드: toyDataSchema.grip_succeed
- 트레이드오프: 재투영 비용 0, 리스크 원천 데이터 수정 지연
```typescript
// no schema modification required; Zod strict validation remains as intended defense
```

#### 무유입 검증 절차
- 접근: batch 완료 후 event_store 조회로 실패 scene/attempt 의 미유입 확인.
- 제안 필드: containmentSql
- 트레이드오프: DB 쿼리 오버헤드 소량, 리스크 false positive 방지
```typescript
SELECT count(*) FROM event_store WHERE stream_id = 'grip-attempt:반려ჩᆼ물용품_CR01_강아지공룡알장난감_02002' AND attempt_num = 1; -- 기대값 0
```

#### 거절 모니터링/알림 보강
- 접근: insert.file.failed level 40 로그 감지 → upstream correction dashboard trigger.
- 제안 필드: alerting
- 트레이드오프: 운영 인프rastructure 확만, 리스크 자동 정재 지연
```typescript
// logger.error({ action: LogAction.FILE_FAILED, ... }) already emits; enhance downstream alert router
```

### Decision Outcome
거절 유지 + 원천 데이터 수정 요청 (권장)

### Consequences
- (+) ES integrity 유지
- (+) downstream projection safe
- (+) Read Model schema 불변
- (−) upstream 정재 workflow 필요
- (−) batch retry 지연 가능

### Non-Goals
- Zod 스키마 coerce/기본값 치환
- Read Model 컬럼 수정으로 결함 추적
- poison event 식별 SQL UPDATE

## 2. Read Model 생성 SQL (Read Model DDL)

> 실행 게이트: 아래 변경은 인간 승인 후에만 적용한다 (human-in-the-loop).

### 격리(containment) SQL — 신규 Read Model DDL 불필요, 결함 데이터 무해화가 조치다

```sql
-- 무유입 검증: zod 거절된 파일의 이벤트가 event_store 에 유입되지 않았음을 확인한다 (기대값 0)
SELECT count(*) AS rejected_event_count FROM event_store WHERE (stream_id, attempt_num) IN (('grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02002', 1), ('grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02003', 1));
```

## 3. API Versioning

### 버전 영향

변 변경 없음. Zod 스키마·엔드포인트·Read Model 테이블 정의가 그대로 유지; 격리 SQL은 운영/검증용일 뿐 API 계약 영향이 없음.

## Guardrails (constraints)

- v1 자산(테이블/엔드포인트/프로젝터 name) 무손상
- PK (scene_key, attempt_num) 유지
- TypeScript any 금지
- 식별자 전체 단어
- DDL 실행·API 컷오버는 인간 승인 후에만 (human-in-the-loop)
- Read Model 테이블명은 read_ 접두 스네이크 케이스
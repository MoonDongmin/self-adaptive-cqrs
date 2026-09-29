---
docId: analysis-991f7605-5256-4d4d-a029-fe5ae0cb9662
generatedAt: 2026-08-14T18:15:30.848Z
targetReadModel: toy-data_insert_validation
sqlDialect: postgres
sufficientEvidence: true
apiVersion:
  from: null
  to: null
  affectedEndpoints: []
evidenceSources:
  - { origin: developer-logging, anchorId: "991f7605-5256-4d4d-a029-fe5ae0cb9662" }
constraints:
  - "v1 자산(테이블/엔드포인트/프로젝터 name) 무손상"
  - "PK (scene_key, attempt_num) 유지"
  - "TypeScript any 금지"
  - "식별자 전체 단어"
  - "DDL 실행·API 컷오버는 인간 승인 후에만 (human-in-the-loop)"
  - "Read Model 테이블명은 read_ 접두 스네이크 케이스"
---

# Self-Adaptive CQRS Docs — toy-data_insert_validation

> 결론(TL;DR): `toy-data_insert_validation`을(를) 보강한다 — toy-data 적재 요청에서 두 파일(camera_intrinsic_param.cody/fx 필드 null 유인)이 Zod 스키마 검증 실패(insert.file.failed)로 event_store append가 차단되었으나, 배치 트랜잭션은 롤백되지 않고 후속 투영(projection)이 정상 진행. (이상 유형: 적재 Zod 검증 실패(Null 유인) · 심각도: warning)

<logging_context>

## 이상 로그 맥락 (±N 윈도우)
> 빈도: 최근 1h — `insert.request`(level 30) 1회, `insert.file.failed`(level 40) 1회, `insert.batch.start`(level 30) 1회, `log.delete.request`(level 30) 1회, `log.delete.done`(level 30) 1회, `insert.file.ok`(level 20) 50회, `-`(level 30) 1회.

| time | level | action | correlation_id | stream_id | attempt | global_seq | msg | detail |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 18:15:22.984 | 30 | insert.request | 991f7605-5256-4d4d-a029-fe5ae0cb9662 | - | - | - | Insert Event Store 요청 수신 | - |
| 18:15:22.984 | 30 | insert.batch.start | 991f7605-5256-4d4d-a029-fe5ae0cb9662 | - | - | - | Toy-Data 적재 시작 | - |
| 18:15:22.989 | 20 | insert.file.ok | 991f7605-5256-4d4d-a029-fe5ae0cb9662 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00297 | 3 | 1 | 이벤트 append | - |
| 18:15:22.989 | 20 | insert.file.ok | 991f7605-5256-4d4d-a029-fe5ae0cb9662 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00297 | 3 | 1 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00297_03_20230923.json |
| 18:15:22.990 | 20 | insert.file.ok | 991f7605-5256-4d4d-a029-fe5ae0cb9662 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00301 | 3 | 2 | 이벤트 append | - |
| 18:15:22.990 | 20 | insert.file.ok | 991f7605-5256-4d4d-a029-fe5ae0cb9662 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00301 | 3 | 2 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00301_03_20230923.json |
| 18:15:22.991 | 20 | insert.file.ok | 991f7605-5256-4d4d-a029-fe5ae0cb9662 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00302 | 2 | 3 | 이벤트 append | - |
| 18:15:22.991 | 20 | insert.file.ok | 991f7605-5256-4d4d-a029-fe5ae0cb9662 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00302 | 2 | 3 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00302_02_20230923.json |
| 18:15:22.992 | 20 | insert.file.ok | 991f7605-5256-4d4d-a029-fe5ae0cb9662 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00304 | 2 | 4 | 이벤트 append | - |
| 18:15:22.992 | 20 | insert.file.ok | 991f7605-5256-4d4d-a029-fe5ae0cb9662 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00304 | 2 | 4 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00304_02_20230923.json |
| 18:15:22.993 | 20 | insert.file.ok | 991f7605-5256-4d4d-a029-fe5ae0cb9662 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00304 | 3 | 5 | 이벤트 append | - |
| 18:15:22.993 | 20 | insert.file.ok | 991f7605-5256-4d4d-a029-fe5ae0cb9662 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00304 | 3 | 5 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00304_03_20230923.json |
| 18:15:22.994 | 20 | insert.file.ok | 991f7605-5256-4d4d-a029-fe5ae0cb9662 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00308 | 1 | 6 | 이벤트 append | - |
| 18:15:22.994 | 20 | insert.file.ok | 991f7605-5256-4d4d-a029-fe5ae0cb9662 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00308 | 1 | 6 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00308_01_20230923.json |
| 18:15:22.995 | 20 | insert.file.ok | 991f7605-5256-4d4d-a029-fe5ae0cb9662 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00317 | 2 | 7 | 이벤트 append | - |
| 18:15:22.995 | 20 | insert.file.ok | 991f7605-5256-4d4d-a029-fe5ae0cb9662 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00317 | 2 | 7 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00317_02_20230923.json |
| 18:15:22.996 | 20 | insert.file.ok | 991f7605-5256-4d4d-a029-fe5ae0cb9662 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00320 | 1 | 8 | 이벤트 append | - |
| 18:15:22.996 | 20 | insert.file.ok | 991f7605-5256-4d4d-a029-fe5ae0cb9662 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00320 | 1 | 8 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00320_01_20230923.json |
| 18:15:22.997 | 20 | insert.file.ok | 991f7605-5256-4d4d-a029-fe5ae0cb9662 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00323 | 1 | 9 | 이벤트 append | - |
| 18:15:22.997 | 20 | insert.file.ok | 991f7605-5256-4d4d-a029-fe5ae0cb9662 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00323 | 1 | 9 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00323_01_20230923.json |
| 18:15:22.998 | 20 | insert.file.ok | 991f7605-5256-4d4d-a029-fe5ae0cb9662 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00328 | 1 | 11 | 이벤트 append | - |
| 18:15:22.998 | 20 | insert.file.ok | 991f7605-5256-4d4d-a029-fe5ae0cb9662 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00327 | 3 | 10 | 이벤트 append | - |
| 18:15:22.998 | 20 | insert.file.ok | 991f7605-5256-4d4d-a029-fe5ae0cb9662 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00327 | 3 | 10 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00327_03_20230923.json |
| 18:15:22.998 | 20 | insert.file.ok | 991f7605-5256-4d4d-a029-fe5ae0cb9662 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00328 | 1 | 11 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00328_01_20230923.json |
| 18:15:23.002 | 20 | insert.file.ok | 991f7605-5256-4d4d-a029-fe5ae0cb9662 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00336 | 3 | 12 | 이벤트 append | - |
| 18:15:23.002 | 20 | insert.file.ok | 991f7605-5256-4d4d-a029-fe5ae0cb9662 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00336 | 3 | 12 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00336_03_20231010.json |
| 18:15:23.003 | 20 | insert.file.ok | 991f7605-5256-4d4d-a029-fe5ae0cb9662 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00338 | 3 | 13 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00338_03_20231010.json |
| 18:15:23.003 | 20 | insert.file.ok | 991f7605-5256-4d4d-a029-fe5ae0cb9662 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00338 | 3 | 13 | 이벤트 append | - |
| 18:15:23.004 | 20 | insert.file.ok | 991f7605-5256-4d4d-a029-fe5ae0cb9662 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00340 | 2 | 14 | 이벤트 append | - |
| 18:15:23.004 | 20 | insert.file.ok | 991f7605-5256-4d4d-a029-fe5ae0cb9662 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00340 | 2 | 14 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00340_02_20231010.json |
| 18:15:23.004 | 20 | insert.file.ok | 991f7605-5256-4d4d-a029-fe5ae0cb9662 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00340 | 3 | 15 | 이벤트 append | - |
| 18:15:23.004 | 20 | insert.file.ok | 991f7605-5256-4d4d-a029-fe5ae0cb9662 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00340 | 3 | 15 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00340_03_20231010.json |
| 18:15:23.005 | 20 | insert.file.ok | 991f7605-5256-4d4d-a029-fe5ae0cb9662 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00343 | 3 | 16 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00343_03_20231010.json |
| 18:15:23.005 | 20 | insert.file.ok | 991f7605-5256-4d4d-a029-fe5ae0cb9662 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00343 | 3 | 16 | 이벤트 append | - |
| 18:15:23.006 | 20 | insert.file.ok | 991f7605-5256-4d4d-a029-fe5ae0cb9662 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00344 | 1 | 17 | 이벤트 append | - |
| 18:15:23.006 | 20 | insert.file.ok | 991f7605-5256-4d4d-a029-fe5ae0cb9662 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00344 | 1 | 17 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00344_01_20231010.json |
| 18:15:23.007 | 20 | insert.file.ok | 991f7605-5256-4d4d-a029-fe5ae0cb9662 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00349 | 1 | 18 | 이벤트 append | - |
| 18:15:23.007 | 20 | insert.file.ok | 991f7605-5256-4d4d-a029-fe5ae0cb9662 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00349 | 1 | 18 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00349_01_20231010.json |
| 18:15:23.008 | 20 | insert.file.ok | 991f7605-5256-4d4d-a029-fe5ae0cb9662 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00370 | 1 | 20 | 이벤트 append | - |
| 18:15:23.008 | 20 | insert.file.ok | 991f7605-5256-4d4d-a029-fe5ae0cb9662 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00364 | 3 | 19 | 이벤트 append | - |
| 18:15:23.008 | 20 | insert.file.ok | 991f7605-5256-4d4d-a029-fe5ae0cb9662 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00364 | 3 | 19 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00364_03_20231010.json |
| 18:15:23.008 | 20 | insert.file.ok | 991f7605-5256-4d4d-a029-fe5ae0cb9662 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00370 | 1 | 20 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00370_01_20231010.json |
| 18:15:23.009 | 20 | insert.file.ok | 991f7605-5256-4d4d-a029-fe5ae0cb9662 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00373 | 2 | 21 | 이벤트 append | - |
| 18:15:23.009 | 20 | insert.file.ok | 991f7605-5256-4d4d-a029-fe5ae0cb9662 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00373 | 2 | 21 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00373_02_20231010.json |
| 18:15:23.010 | 20 | insert.file.ok | 991f7605-5256-4d4d-a029-fe5ae0cb9662 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00380 | 2 | 23 | 이벤트 append | - |
| 18:15:23.010 | 20 | insert.file.ok | 991f7605-5256-4d4d-a029-fe5ae0cb9662 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00377 | 3 | 22 | 이벤트 append | - |
| 18:15:23.010 | 20 | insert.file.ok | 991f7605-5256-4d4d-a029-fe5ae0cb9662 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00377 | 3 | 22 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00377_03_20231010.json |
| 18:15:23.010 | 20 | insert.file.ok | 991f7605-5256-4d4d-a029-fe5ae0cb9662 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00380 | 2 | 23 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00380_02_20231010.json |
| 18:15:23.011 | 20 | insert.file.ok | 991f7605-5256-4d4d-a029-fe5ae0cb9662 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00381 | 2 | 24 | 이벤트 append | - |
| 18:15:23.011 | 20 | insert.file.ok | 991f7605-5256-4d4d-a029-fe5ae0cb9662 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00381 | 2 | 24 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00381_02_20231010.json |
| 18:15:23.012 | 20 | insert.file.ok | 991f7605-5256-4d4d-a029-fe5ae0cb9662 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00387 | 2 | 25 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00387_02_20231010.json |
| 18:15:23.012 | 20 | insert.file.ok | 991f7605-5256-4d4d-a029-fe5ae0cb9662 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00387 | 2 | 25 | 이벤트 append | - |
| 18:15:23.012 | 40 | insert.file.failed | 991f7605-5256-4d4d-a029-fe5ae0cb9662 | - | - | - | toy-data 파일 적재 실패 ← 트립 앵커 | reason=[   {     "expected": "number",     "code": "invalid_type",     "path": [       "camera_info",       "camera_intrinsic_param",       "cody"     ],     "message": "Invalid input: expected number, received null"   } ] · file=반려동물용품_CR01_강아지공룡알장난감_02024_01_20230923.json |
| 18:15:23.013 | 30 | insert.batch.done | 991f7605-5256-4d4d-a029-fe5ae0cb9662 | - | - | - | toy-data 적재 완료 | - |
| 18:15:23.013 | 40 | insert.file.failed | 991f7605-5256-4d4d-a029-fe5ae0cb9662 | - | - | - | toy-data 파일 적재 실패 | reason=[   {     "expected": "number",     "code": "invalid_type",     "path": [       "camera_info",       "camera_intrinsic_param",       "fx"     ],     "message": "Invalid input: expected number, received null"   } ] · file=반려동물용품_CR01_강아지공룡알장난감_02025_01_20230923.json |
| 18:15:23.014 | 30 | - | 991f7605-5256-4d4d-a029-fe5ae0cb9662 | - | - | - | request completed | - |
| 18:15:23.015 | 30 | projection.request | cc95342e-8655-4afc-8d78-61edc0f5e304 | - | - | - | projection 요청 수신 | - |
| 18:15:23.017 | 30 | projection.start | cc95342e-8655-4afc-8d78-61edc0f5e304 | - | - | - | catch-up 시작 | projector=multimodal-projector |
| 18:15:23.017 | 20 | - | cc95342e-8655-4afc-8d78-61edc0f5e304 | - | - | - | 커서 조회 | projector=multimodal-projector |
| 18:15:23.018 | 20 | - | cc95342e-8655-4afc-8d78-61edc0f5e304 | - | - | - | 이벤트 조회 | - |
| 18:15:23.019 | 20 | projection.event.mapped | cc95342e-8655-4afc-8d78-61edc0f5e304 | - | 3 | 1 | 이벤트 매핑 | projector=multimodal-projector |
| 18:15:23.020 | 20 | projection.event.mapped | cc95342e-8655-4afc-8d78-61edc0f5e304 | - | 3 | 2 | 이벤트 매핑 | projector=multimodal-projector |

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
- (level 40, `insert.file.failed`) toy-data 파일 적재 실패 ← 트립 앵커 → 원천 payload의 camera_intrinsic_param.cody 필드 null 유인하여 Zod number 검증 실패 [corr:991f7605-5256-4d4d-a029-fe5ae0cb9662]
- (level 40, `insert.file.failed`) toy-data 파일 적재 실패 → 원천 payload의 camera_intrinsic_param.fx 필드 null 유인하여 Zod number 검증 실패 [corr:991f7605-5256-4d4d-a029-fe5ae0cb9662]
- src/insert/dto/toy-data.dto.ts의 cameraIntrinsicSchema 정의에서 cody: z.number()와 fx: z.number()는 .nullable() 미부여, null 유인 시 Zod 검증 실패(invalid_type) 발생 [corr:991f7605-5256-4d4d-a029-fe5ae0cb9662].
- insert.file.failed 로그는 detail에 reason=[... path: camera_info.camera_intrinsic_param.cody ...]를 명시, 적재 단계에서 Zod 거절이 원천 데이터의 필드 누락/타입 위반으로 판명 [corr:991f7605-5256-4d4d-a029-fe5ae0cb9662].
- src/projection/projector/multimodal.projector.ts의 map() 메서드는 toyDataSchema.parse(event.payload)를 호출하나, insert.file.failed로 ES append가 차단된 이벤트는 EventStoreReaderRepository.fetchAfter() 조회 시 미존재, 투영은 정상 이벤트만 진행 [corr:991f7605-5256-4d4d-a029-fe5ae0cb9662].
- read_multimodal 스키마의 image_2d_uri/video_uri 컬럼은 현재 projector에서 null 고정, Zod 실패와 Read Model 구조 결함은 무관한 사안 [corr:991f7605-5256-4d4d-a029-fe5ae0cb9662].

### Decision Drivers
- 원천 데이터 무해화 vs 검증 유지 (Zod 거절은 시스템 의도된 방어)
- ES 미유입 상태의 격리 전략 (무유입 검증 SQL 필요)
- API/Read Model 스키마 변경 최소화 (기존 정성 유지)
- 운영 가시성 및 추적ability (원천 수정 요청 고지 vs 자동 처리)

### Considered Options
#### 거절 유지 + 원천 데이터 수정 요청 권고
- 접근: toyDataSchema 검증 로직 그대로 유지, 실패 파일 목록(..._02024, ..._02025)을 CLI/ops script에서 고지 및 원천 수정 요청
- 제안 필드: cody, fx
- 트레이드오프: Zero core code change, relies on external data fix, highest reliability against silent corruption
```typescript
async reportFailedFiles(failedList: string[]): Promise<void> { console.log('Zod 검증 실패 원천 데이터 수정 요청:', failedList); }
```

#### 무유입 검증 절차 보강
- 접근: InsertService 또는 CatchUpRunner에 verifyNoEntry() 메서드 추가. SQL로 미유입 확인 및 audit log 발행
- 제안 필드: stream_id, attempt_num
- 트레이드오프: Adds operational overhead, ensures audit trail, no schema change
```typescript
async verifyNoEntry(sceneKey: string, attemptNum: number): Promise<void> { const count = await db.select({ count: sql`count(*)` }).from(eventStore).where(sql`stream_id = 'grip-attempt:${sceneKey}' AND attempt_num = ${attemptNum}`).run(); if (count > 0) throw new Error(`무유입 검증 실패: stream=${sceneKey} attempt=${attemptNum} 존재`); }
```

### Decision Outcome
거절 유지 + 원천 데이터 수정 요청 권고

### Consequences
- (+) ES 미유입 상태 명확히 격리, Read Model 오염 방지
- (+) Zod 검증 로직 일관성 유지, 시스템 의도된 방어 동작 관측
- (+) Zero core code change, 배포 안정성 확보
- (−) 원천 데이터 수정 요청 고지 및 재적재 지연 발생
- (−) ops/CLI 스크립트 관리 추가 부담
- (−) 미유입 검증 SQL 미구현 시 audit trail 부재

### Non-Goals
- Zod 스키마 완화(optional 화) 또는 default value 주입
- 결함 추적용 신규 테이블/컬럼 추가
- Read Model 구조 변경(read_multimodal URI 매핑 보강 등)

## 2. Read Model 생성 SQL (Read Model DDL)

> 실행 게이트: 아래 변경은 인간 승인 후에만 적용한다 (human-in-the-loop).

### 격리(containment) SQL — 신규 Read Model DDL 불필요, 결함 데이터 무해화가 조치다

```sql
-- 무유입 검증: zod 거절된 파일의 이벤트가 event_store 에 유입되지 않았음을 확인한다 (기대값 0)
SELECT count(*) AS rejected_event_count FROM event_store WHERE (stream_id, attempt_num) IN (('grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02024', 1), ('grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02025', 1));
```

## 3. API Versioning

### 버전 영향

변경 없음. toyDataSchema 검증 규칙과 insert.file.failed 이벤트 발행 로직이 그대로 유지, Read Model 테이블/엔드포인트 불변.

## Guardrails (constraints)

- v1 자산(테이블/엔드포인트/프로젝터 name) 무손상
- PK (scene_key, attempt_num) 유지
- TypeScript any 금지
- 식별자 전체 단어
- DDL 실행·API 컷오버는 인간 승인 후에만 (human-in-the-loop)
- Read Model 테이블명은 read_ 접두 스네이크 케이스
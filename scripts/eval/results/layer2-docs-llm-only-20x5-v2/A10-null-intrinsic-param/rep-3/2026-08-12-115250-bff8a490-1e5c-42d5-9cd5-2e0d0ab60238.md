---
docId: analysis-bff8a490-1e5c-42d5-9cd5-2e0d0ab60238
generatedAt: 2026-08-12T02:52:53.392Z
targetReadModel: read_grip_result
sqlDialect: postgres
sufficientEvidence: true
apiVersion:
  from: null
  to: null
  affectedEndpoints: []
evidenceSources:
  - { origin: developer-logging, anchorId: "bff8a490-1e5c-42d5-9cd5-2e0d0ab60238" }
constraints:
  - "v1 자산(테이블/엔드포인트/프로젝터 name) 무손상"
  - "PK (scene_key, attempt_num) 유지"
  - "TypeScript any 금지"
  - "식별자 전체 단어"
  - "DDL 실행·API 컷오버는 인간 승인 후에만 (human-in-the-loop)"
  - "Read Model 테이블명은 read_ 접두 스네이크 케이스"
---

# Self-Adaptive CQRS Docs — read_grip_result

> 결론(TL;DR): `read_grip_result`을(를) 보강한다 — Toy-Data batch 적재 중 2개 파일의 camera_intrinsic_param 필드(cody/fx)가 null 값으로 유입되어 Zod number 타입 검증 실패. file-level try/catch 적용해 batch는 정상 완료됨. (이상 유형: 적재 스키마 검증 실패(타입 불일치) · 심각도: warning)

<logging_context>

## 이상 로그 맥락 (±N 윈도우)
> 빈도: 최근 1h — `insert.request`(level 30) 1회, `insert.file.failed`(level 40) 1회, `insert.batch.start`(level 30) 1회, `log.delete.request`(level 30) 1회, `log.delete.done`(level 30) 1회, `insert.file.ok`(level 20) 50회, `-`(level 30) 1회.

| time | level | action | correlation_id | stream_id | attempt | global_seq | msg | detail |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 02:52:50.961 | 30 | insert.request | bff8a490-1e5c-42d5-9cd5-2e0d0ab60238 | - | - | - | Insert Event Store 요청 수신 | - |
| 02:52:50.962 | 30 | insert.batch.start | bff8a490-1e5c-42d5-9cd5-2e0d0ab60238 | - | - | - | Toy-Data 적재 시작 | - |
| 02:52:50.967 | 20 | insert.file.ok | bff8a490-1e5c-42d5-9cd5-2e0d0ab60238 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00297 | 3 | 1 | 이벤트 append | - |
| 02:52:50.967 | 20 | insert.file.ok | bff8a490-1e5c-42d5-9cd5-2e0d0ab60238 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00297 | 3 | 1 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00297_03_20230923.json |
| 02:52:50.968 | 20 | insert.file.ok | bff8a490-1e5c-42d5-9cd5-2e0d0ab60238 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00301 | 3 | 2 | 이벤트 append | - |
| 02:52:50.968 | 20 | insert.file.ok | bff8a490-1e5c-42d5-9cd5-2e0d0ab60238 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00301 | 3 | 2 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00301_03_20230923.json |
| 02:52:50.969 | 20 | insert.file.ok | bff8a490-1e5c-42d5-9cd5-2e0d0ab60238 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00302 | 2 | 3 | 이벤트 append | - |
| 02:52:50.969 | 20 | insert.file.ok | bff8a490-1e5c-42d5-9cd5-2e0d0ab60238 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00302 | 2 | 3 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00302_02_20230923.json |
| 02:52:50.970 | 20 | insert.file.ok | bff8a490-1e5c-42d5-9cd5-2e0d0ab60238 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00304 | 2 | 4 | 이벤트 append | - |
| 02:52:50.970 | 20 | insert.file.ok | bff8a490-1e5c-42d5-9cd5-2e0d0ab60238 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00304 | 2 | 4 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00304_02_20230923.json |
| 02:52:50.972 | 20 | insert.file.ok | bff8a490-1e5c-42d5-9cd5-2e0d0ab60238 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00304 | 3 | 5 | 이벤트 append | - |
| 02:52:50.972 | 20 | insert.file.ok | bff8a490-1e5c-42d5-9cd5-2e0d0ab60238 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00304 | 3 | 5 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00304_03_20230923.json |
| 02:52:50.973 | 20 | insert.file.ok | bff8a490-1e5c-42d5-9cd5-2e0d0ab60238 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00308 | 1 | 6 | 이벤트 append | - |
| 02:52:50.973 | 20 | insert.file.ok | bff8a490-1e5c-42d5-9cd5-2e0d0ab60238 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00308 | 1 | 6 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00308_01_20230923.json |
| 02:52:50.974 | 20 | insert.file.ok | bff8a490-1e5c-42d5-9cd5-2e0d0ab60238 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00317 | 2 | 7 | 이벤트 append | - |
| 02:52:50.974 | 20 | insert.file.ok | bff8a490-1e5c-42d5-9cd5-2e0d0ab60238 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00317 | 2 | 7 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00317_02_20230923.json |
| 02:52:50.975 | 20 | insert.file.ok | bff8a490-1e5c-42d5-9cd5-2e0d0ab60238 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00320 | 1 | 8 | 이벤트 append | - |
| 02:52:50.975 | 20 | insert.file.ok | bff8a490-1e5c-42d5-9cd5-2e0d0ab60238 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00320 | 1 | 8 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00320_01_20230923.json |
| 02:52:50.976 | 20 | insert.file.ok | bff8a490-1e5c-42d5-9cd5-2e0d0ab60238 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00323 | 1 | 9 | 이벤트 append | - |
| 02:52:50.976 | 20 | insert.file.ok | bff8a490-1e5c-42d5-9cd5-2e0d0ab60238 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00323 | 1 | 9 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00323_01_20230923.json |
| 02:52:50.977 | 20 | insert.file.ok | bff8a490-1e5c-42d5-9cd5-2e0d0ab60238 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00327 | 3 | 10 | 이벤트 append | - |
| 02:52:50.977 | 20 | insert.file.ok | bff8a490-1e5c-42d5-9cd5-2e0d0ab60238 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00327 | 3 | 10 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00327_03_20230923.json |
| 02:52:50.978 | 20 | insert.file.ok | bff8a490-1e5c-42d5-9cd5-2e0d0ab60238 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00336 | 3 | 12 | 이벤트 append | - |
| 02:52:50.978 | 20 | insert.file.ok | bff8a490-1e5c-42d5-9cd5-2e0d0ab60238 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00328 | 1 | 11 | 이벤트 append | - |
| 02:52:50.978 | 20 | insert.file.ok | bff8a490-1e5c-42d5-9cd5-2e0d0ab60238 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00328 | 1 | 11 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00328_01_20230923.json |
| 02:52:50.978 | 20 | insert.file.ok | bff8a490-1e5c-42d5-9cd5-2e0d0ab60238 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00336 | 3 | 12 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00336_03_20231010.json |
| 02:52:50.979 | 20 | insert.file.ok | bff8a490-1e5c-42d5-9cd5-2e0d0ab60238 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00338 | 3 | 13 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00338_03_20231010.json |
| 02:52:50.979 | 20 | insert.file.ok | bff8a490-1e5c-42d5-9cd5-2e0d0ab60238 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00338 | 3 | 13 | 이벤트 append | - |
| 02:52:50.980 | 20 | insert.file.ok | bff8a490-1e5c-42d5-9cd5-2e0d0ab60238 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00340 | 2 | 14 | 이벤트 append | - |
| 02:52:50.980 | 20 | insert.file.ok | bff8a490-1e5c-42d5-9cd5-2e0d0ab60238 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00340 | 2 | 14 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00340_02_20231010.json |
| 02:52:50.981 | 20 | insert.file.ok | bff8a490-1e5c-42d5-9cd5-2e0d0ab60238 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00340 | 3 | 15 | 이벤트 append | - |
| 02:52:50.981 | 20 | insert.file.ok | bff8a490-1e5c-42d5-9cd5-2e0d0ab60238 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00340 | 3 | 15 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00340_03_20231010.json |
| 02:52:50.982 | 20 | insert.file.ok | bff8a490-1e5c-42d5-9cd5-2e0d0ab60238 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00343 | 3 | 16 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00343_03_20231010.json |
| 02:52:50.982 | 20 | insert.file.ok | bff8a490-1e5c-42d5-9cd5-2e0d0ab60238 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00343 | 3 | 16 | 이벤트 append | - |
| 02:52:50.983 | 20 | insert.file.ok | bff8a490-1e5c-42d5-9cd5-2e0d0ab60238 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00349 | 1 | 18 | 이벤트 append | - |
| 02:52:50.983 | 20 | insert.file.ok | bff8a490-1e5c-42d5-9cd5-2e0d0ab60238 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00344 | 1 | 17 | 이벤트 append | - |
| 02:52:50.983 | 20 | insert.file.ok | bff8a490-1e5c-42d5-9cd5-2e0d0ab60238 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00344 | 1 | 17 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00344_01_20231010.json |
| 02:52:50.983 | 20 | insert.file.ok | bff8a490-1e5c-42d5-9cd5-2e0d0ab60238 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00349 | 1 | 18 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00349_01_20231010.json |
| 02:52:50.984 | 20 | insert.file.ok | bff8a490-1e5c-42d5-9cd5-2e0d0ab60238 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00364 | 3 | 19 | 이벤트 append | - |
| 02:52:50.984 | 20 | insert.file.ok | bff8a490-1e5c-42d5-9cd5-2e0d0ab60238 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00364 | 3 | 19 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00364_03_20231010.json |
| 02:52:50.985 | 20 | insert.file.ok | bff8a490-1e5c-42d5-9cd5-2e0d0ab60238 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00370 | 1 | 20 | 이벤트 append | - |
| 02:52:50.985 | 20 | insert.file.ok | bff8a490-1e5c-42d5-9cd5-2e0d0ab60238 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00370 | 1 | 20 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00370_01_20231010.json |
| 02:52:50.986 | 20 | insert.file.ok | bff8a490-1e5c-42d5-9cd5-2e0d0ab60238 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00373 | 2 | 21 | 이벤트 append | - |
| 02:52:50.986 | 20 | insert.file.ok | bff8a490-1e5c-42d5-9cd5-2e0d0ab60238 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00373 | 2 | 21 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00373_02_20231010.json |
| 02:52:50.987 | 20 | insert.file.ok | bff8a490-1e5c-42d5-9cd5-2e0d0ab60238 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00380 | 2 | 23 | 이벤트 append | - |
| 02:52:50.987 | 20 | insert.file.ok | bff8a490-1e5c-42d5-9cd5-2e0d0ab60238 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00377 | 3 | 22 | 이벤트 append | - |
| 02:52:50.987 | 20 | insert.file.ok | bff8a490-1e5c-42d5-9cd5-2e0d0ab60238 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00377 | 3 | 22 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00377_03_20231010.json |
| 02:52:50.987 | 20 | insert.file.ok | bff8a490-1e5c-42d5-9cd5-2e0d0ab60238 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00380 | 2 | 23 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00380_02_20231010.json |
| 02:52:50.988 | 20 | insert.file.ok | bff8a490-1e5c-42d5-9cd5-2e0d0ab60238 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00381 | 2 | 24 | 이벤트 append | - |
| 02:52:50.988 | 20 | insert.file.ok | bff8a490-1e5c-42d5-9cd5-2e0d0ab60238 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00381 | 2 | 24 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00381_02_20231010.json |
| 02:52:50.989 | 20 | insert.file.ok | bff8a490-1e5c-42d5-9cd5-2e0d0ab60238 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00387 | 2 | 25 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00387_02_20231010.json |
| 02:52:50.989 | 20 | insert.file.ok | bff8a490-1e5c-42d5-9cd5-2e0d0ab60238 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00387 | 2 | 25 | 이벤트 append | - |
| 02:52:50.989 | 40 | insert.file.failed | bff8a490-1e5c-42d5-9cd5-2e0d0ab60238 | - | - | - | toy-data 파일 적재 실패 ← 트립 앵커 | reason=[   {     "expected": "number",     "code": "invalid_type",     "path": [       "camera_info",       "camera_intrinsic_param",       "cody"     ],     "message": "Invalid input: expected number, received null"   } ] · file=반려동물용품_CR01_강아지공룡알장난감_02024_01_20230923.json |
| 02:52:50.991 | 30 | insert.batch.done | bff8a490-1e5c-42d5-9cd5-2e0d0ab60238 | - | - | - | toy-data 적재 완료 | - |
| 02:52:50.991 | 40 | insert.file.failed | bff8a490-1e5c-42d5-9cd5-2e0d0ab60238 | - | - | - | toy-data 파일 적재 실패 | reason=[   {     "expected": "number",     "code": "invalid_type",     "path": [       "camera_info",       "camera_intrinsic_param",       "fx"     ],     "message": "Invalid input: expected number, received null"   } ] · file=반려동물용품_CR01_강아지공룡알장난감_02025_01_20230923.json |
| 02:52:50.991 | 30 | - | bff8a490-1e5c-42d5-9cd5-2e0d0ab60238 | - | - | - | request completed | - |
| 02:52:50.994 | 30 | projection.request | 7983ee16-5a65-4d22-af11-6c186c66343b | - | - | - | projection 요청 수신 | - |
| 02:52:50.995 | 20 | - | 7983ee16-5a65-4d22-af11-6c186c66343b | - | - | - | 커서 조회 | projector=multimodal-projector |
| 02:52:50.995 | 30 | projection.start | 7983ee16-5a65-4d22-af11-6c186c66343b | - | - | - | catch-up 시작 | projector=multimodal-projector |
| 02:52:50.997 | 20 | - | 7983ee16-5a65-4d22-af11-6c186c66343b | - | - | - | 이벤트 조회 | - |
| 02:52:50.997 | 20 | projection.event.mapped | 7983ee16-5a65-4d22-af11-6c186c66343b | - | 3 | 1 | 이벤트 매핑 | projector=multimodal-projector |
| 02:52:50.998 | 20 | projection.event.mapped | 7983ee16-5a65-4d22-af11-6c186c66343b | - | 3 | 2 | 이벤트 매핑 | projector=multimodal-projector |

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
- (level 40, `insert.file.failed`) toy-data 파일 적재 실패 ← 트립 앵커 → camera_info.camera_intrinsic_param.cody 필드(null)가 Zod number 타입 검증 실패로 원천 파일의 필수 필드 누락/타입 위반 발생 [corr:bff8a490-1e5c-42d5-9cd5-2e0d0ab60238]
- (level 40, `insert.file.failed`) toy-data 파일 적재 실패 → camera_info.camera_intrinsic_param.fx 필드(null)가 Zod number 타입 검증 실패로 원천 파일의 필수 필드 누락/타입 위반 발생 [corr:bff8a490-1e5c-42d5-9cd5-2e0d0ab60238]
- Insight 카드 camera_info.camera_intrinsic_param는 object 타입으로, cody/fx 필드가 필수 number여나 적재 로직에서 null 유입되어 zod 거절
- src/insert/dto/toy-data.dto.ts의 cameraIntrinsicSchema 정의는 cody: z.number()와 fx: z.number()로 nullable 허용이 배제된 상태
- GripResultProjector.map()에서 toyDataSchema.parse(event.payload) 실패 시 throw err가 발생하나, 적재 서비스의 file-level try/catch로 batch는 정상 완료됨. 결함 이벤트는 event_store 미유입이므로 Read Model(read_grip_result, read_multimodal) 구조는 무영

### Decision Drivers
- 원천 데이터 결함 격리 우선 (Read Model 구조 문제 아님)
- Zod 거절 의도된 방어 동작 준수 (무해화 원칙: 기본값/더미값 치환 금지)
- Read Model 스키마·엔드포인트 무변 유지
- 실시간 적재 가용이 최소화

### Considered Options
#### 거절 유지 + 원천 데이터 수정 요청 (권장)
- 접근: Zod strict 검증 로직(src/insert/dto/toy-data.dto.ts) 그대로 유지. 실패 파일 목록 모니터링 보강 및 원천 데이터 수리 요청 프로세스 연계.
- 제안 필드: toyDataSchema.cody, toyDataSchema.fx
- 트레이드오프: Read Model/Projector 코드 변경 제로; 데이터 무해화 원칙 완벽 준수; 단, 원천 데이터 수정 지연 시 투영 가용이 발생.
```typescript
// src/insert/dto/toy-data.dto.ts 유지 그대로. 실패 파일 추적 로직은 insert.service.ts 내 file-level catch 블록에서 failedFiles.push(fileName) 추가.
```

#### 무유입 검증 절차 (SQL 격리 확인)
- 접근: event_store 조회를 실패된 stream/attempt 조합의 미유입(0건)을 공식적으로 검증하여 격리 상태 확정.
- 제안 필드: containmentSql
- 트레이드오프: SQL 검증 추가 오버헤드 소량; 원천 데이터 결함 추적 고증 제공; Read Model 구조는 무변. (기각 대안: Driver 1에서 졌음)
```typescript
SELECT count(*) FROM event_store WHERE stream_id = 'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02024' AND attempt_num = 1; -- 기대값 0
```

### Decision Outcome
거절 유지 + 원천 데이터 수정 요청 (권장)

### Consequences
- (+) Zod 검증 실패으로 원천 결함 즉시 차단
- (+) Read Model 무해화 원칙 준수
- (+) Projector 로직 변경 제로
- (−) 원천 데이터 수리 지연 시 해당 scene/attempt 투영 가용이 발생
- (−) failed file 목록 관리 추가 부하

### Non-Goals
- Zod 스키마 완화(optional 화)
- 기본값/더미값 주입
- 결함 추적용 신규 테이블 생성
- Read Model 컬럼 추가/수정

## 2. Read Model 생성 SQL (Read Model DDL)

> 실행 게이트: 아래 변경은 인간 승인 후에만 적용한다 (human-in-the-loop).

### 격리(containment) SQL — 신규 Read Model DDL 불필요, 결함 데이터 무해화가 조치다

```sql
-- 무유입 검증: zod 거절된 파일의 이벤트가 event_store 에 유입되지 않았음을 확인한다 (기대값 0)
SELECT count(*) AS rejected_event_count FROM event_store WHERE (stream_id, attempt_num) IN (('grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02024', 1), ('grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02025', 1));
```

## 3. API Versioning

### 버전 영향

변 변경 없음. Read Model 스키마·엔드포인트·적재 검증 로직이 그대로 유지; 결함 데이터는 원천 수정 요청으로 처리.

## Guardrails (constraints)

- v1 자산(테이블/엔드포인트/프로젝터 name) 무손상
- PK (scene_key, attempt_num) 유지
- TypeScript any 금지
- 식별자 전체 단어
- DDL 실행·API 컷오버는 인간 승인 후에만 (human-in-the-loop)
- Read Model 테이블명은 read_ 접두 스네이크 케이스
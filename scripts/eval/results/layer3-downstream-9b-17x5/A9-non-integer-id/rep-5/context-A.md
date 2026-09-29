---
docId: analysis-7a4d68a1-3b98-4a36-b959-42062ac6ee0b
generatedAt: 2026-08-15T04:54:29.473Z
targetReadModel: unknown
sqlDialect: postgres
sufficientEvidence: true
apiVersion:
  from: null
  to: null
  affectedEndpoints: []
evidenceSources:
  - { origin: developer-logging, anchorId: "7a4d68a1-3b98-4a36-b959-42062ac6ee0b" }
constraints:
  - "v1 자산(테이블/엔드포인트/프로젝터 name) 무손상"
  - "PK (scene_key, attempt_num) 유지"
  - "TypeScript any 금지"
  - "식별자 전체 단어"
  - "DDL 실행·API 컷오버는 인간 승인 후에만 (human-in-the-loop)"
  - "Read Model 테이블명은 read_ 접두 스네이크 케이스"
---

# Self-Adaptive CQRS Docs — unknown

> 결론(TL;DR): `unknown`을(를) 보강한다 — Toy-data 적재 배치 진행 중 2개 파일에서 Zod 스키마 검증 실패(id, num_keypoints 필드의 number vs int 타입 불일치)가 발생. 해당 파일들은 적재 단계에서 reject 처리되어 event_store에 append되지, 나머지 파일과 후속 투영 파이프라인은 정상 진행. 배치 완료 및 투영 재개 성공. (이상 유형: 적재 검증 실패(타입 드리프트) · 심각도: warning)

<logging_context>

## 이상 로그 맥락 (±N 윈도우)
> 빈도: 최근 1h — `insert.request`(level 30) 1회, `insert.file.failed`(level 40) 1회, `insert.batch.start`(level 30) 1회, `log.delete.request`(level 30) 1회, `log.delete.done`(level 30) 1회, `insert.file.ok`(level 20) 50회, `-`(level 30) 1회.

| time | level | action | correlation_id | stream_id | attempt | global_seq | msg | detail |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 04:54:21.980 | 30 | insert.request | 7a4d68a1-3b98-4a36-b959-42062ac6ee0b | - | - | - | Insert Event Store 요청 수신 | - |
| 04:54:21.981 | 30 | insert.batch.start | 7a4d68a1-3b98-4a36-b959-42062ac6ee0b | - | - | - | Toy-Data 적재 시작 | - |
| 04:54:21.986 | 20 | insert.file.ok | 7a4d68a1-3b98-4a36-b959-42062ac6ee0b | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00258 | 2 | 1 | 이벤트 append | - |
| 04:54:21.986 | 20 | insert.file.ok | 7a4d68a1-3b98-4a36-b959-42062ac6ee0b | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00258 | 2 | 1 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00258_02_20230923.json |
| 04:54:21.987 | 20 | insert.file.ok | 7a4d68a1-3b98-4a36-b959-42062ac6ee0b | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00262 | 2 | 2 | 이벤트 append | - |
| 04:54:21.987 | 20 | insert.file.ok | 7a4d68a1-3b98-4a36-b959-42062ac6ee0b | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00262 | 2 | 2 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00262_02_20230923.json |
| 04:54:21.988 | 20 | insert.file.ok | 7a4d68a1-3b98-4a36-b959-42062ac6ee0b | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00262 | 3 | 3 | 이벤트 append | - |
| 04:54:21.988 | 20 | insert.file.ok | 7a4d68a1-3b98-4a36-b959-42062ac6ee0b | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00262 | 3 | 3 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00262_03_20230923.json |
| 04:54:21.989 | 20 | insert.file.ok | 7a4d68a1-3b98-4a36-b959-42062ac6ee0b | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00263 | 2 | 4 | 이벤트 append | - |
| 04:54:21.989 | 20 | insert.file.ok | 7a4d68a1-3b98-4a36-b959-42062ac6ee0b | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00263 | 2 | 4 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00263_02_20230923.json |
| 04:54:21.990 | 20 | insert.file.ok | 7a4d68a1-3b98-4a36-b959-42062ac6ee0b | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00267 | 1 | 5 | 이벤트 append | - |
| 04:54:21.990 | 20 | insert.file.ok | 7a4d68a1-3b98-4a36-b959-42062ac6ee0b | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00267 | 1 | 5 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00267_01_20230923.json |
| 04:54:21.991 | 20 | insert.file.ok | 7a4d68a1-3b98-4a36-b959-42062ac6ee0b | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00269 | 2 | 6 | 이벤트 append | - |
| 04:54:21.991 | 20 | insert.file.ok | 7a4d68a1-3b98-4a36-b959-42062ac6ee0b | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00269 | 2 | 6 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00269_02_20230923.json |
| 04:54:21.992 | 20 | insert.file.ok | 7a4d68a1-3b98-4a36-b959-42062ac6ee0b | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00275 | 1 | 7 | 이벤트 append | - |
| 04:54:21.992 | 20 | insert.file.ok | 7a4d68a1-3b98-4a36-b959-42062ac6ee0b | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00275 | 1 | 7 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00275_01_20230923.json |
| 04:54:21.993 | 20 | insert.file.ok | 7a4d68a1-3b98-4a36-b959-42062ac6ee0b | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00275 | 3 | 8 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00275_03_20230923.json |
| 04:54:21.993 | 20 | insert.file.ok | 7a4d68a1-3b98-4a36-b959-42062ac6ee0b | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00275 | 3 | 8 | 이벤트 append | - |
| 04:54:21.994 | 20 | insert.file.ok | 7a4d68a1-3b98-4a36-b959-42062ac6ee0b | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00278 | 3 | 9 | 이벤트 append | - |
| 04:54:21.994 | 20 | insert.file.ok | 7a4d68a1-3b98-4a36-b959-42062ac6ee0b | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00278 | 3 | 9 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00278_03_20230923.json |
| 04:54:21.995 | 20 | insert.file.ok | 7a4d68a1-3b98-4a36-b959-42062ac6ee0b | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00280 | 1 | 10 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00280_01_20230923.json |
| 04:54:21.995 | 20 | insert.file.ok | 7a4d68a1-3b98-4a36-b959-42062ac6ee0b | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00280 | 1 | 10 | 이벤트 append | - |
| 04:54:21.996 | 20 | insert.file.ok | 7a4d68a1-3b98-4a36-b959-42062ac6ee0b | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00281 | 1 | 11 | 이벤트 append | - |
| 04:54:21.996 | 20 | insert.file.ok | 7a4d68a1-3b98-4a36-b959-42062ac6ee0b | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00281 | 1 | 11 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00281_01_20230923.json |
| 04:54:21.997 | 20 | insert.file.ok | 7a4d68a1-3b98-4a36-b959-42062ac6ee0b | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00287 | 3 | 13 | 이벤트 append | - |
| 04:54:21.997 | 20 | insert.file.ok | 7a4d68a1-3b98-4a36-b959-42062ac6ee0b | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00286 | 3 | 12 | 이벤트 append | - |
| 04:54:21.997 | 20 | insert.file.ok | 7a4d68a1-3b98-4a36-b959-42062ac6ee0b | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00286 | 3 | 12 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00286_03_20230923.json |
| 04:54:21.997 | 20 | insert.file.ok | 7a4d68a1-3b98-4a36-b959-42062ac6ee0b | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00287 | 3 | 13 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00287_03_20230923.json |
| 04:54:21.998 | 20 | insert.file.ok | 7a4d68a1-3b98-4a36-b959-42062ac6ee0b | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00291 | 3 | 14 | 이벤트 append | - |
| 04:54:21.998 | 20 | insert.file.ok | 7a4d68a1-3b98-4a36-b959-42062ac6ee0b | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00291 | 3 | 14 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00291_03_20230923.json |
| 04:54:21.999 | 20 | insert.file.ok | 7a4d68a1-3b98-4a36-b959-42062ac6ee0b | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00295 | 1 | 15 | 이벤트 append | - |
| 04:54:21.999 | 20 | insert.file.ok | 7a4d68a1-3b98-4a36-b959-42062ac6ee0b | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00295 | 1 | 15 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00295_01_20230923.json |
| 04:54:22.000 | 20 | insert.file.ok | 7a4d68a1-3b98-4a36-b959-42062ac6ee0b | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00297 | 3 | 16 | 이벤트 append | - |
| 04:54:22.000 | 20 | insert.file.ok | 7a4d68a1-3b98-4a36-b959-42062ac6ee0b | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00297 | 3 | 16 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00297_03_20230923.json |
| 04:54:22.001 | 20 | insert.file.ok | 7a4d68a1-3b98-4a36-b959-42062ac6ee0b | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00301 | 3 | 17 | 이벤트 append | - |
| 04:54:22.001 | 20 | insert.file.ok | 7a4d68a1-3b98-4a36-b959-42062ac6ee0b | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00302 | 2 | 18 | 이벤트 append | - |
| 04:54:22.001 | 20 | insert.file.ok | 7a4d68a1-3b98-4a36-b959-42062ac6ee0b | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00301 | 3 | 17 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00301_03_20230923.json |
| 04:54:22.002 | 20 | insert.file.ok | 7a4d68a1-3b98-4a36-b959-42062ac6ee0b | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00302 | 2 | 18 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00302_02_20230923.json |
| 04:54:22.002 | 20 | insert.file.ok | 7a4d68a1-3b98-4a36-b959-42062ac6ee0b | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00304 | 2 | 19 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00304_02_20230923.json |
| 04:54:22.002 | 20 | insert.file.ok | 7a4d68a1-3b98-4a36-b959-42062ac6ee0b | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00304 | 2 | 19 | 이벤트 append | - |
| 04:54:22.003 | 20 | insert.file.ok | 7a4d68a1-3b98-4a36-b959-42062ac6ee0b | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00304 | 3 | 20 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00304_03_20230923.json |
| 04:54:22.003 | 20 | insert.file.ok | 7a4d68a1-3b98-4a36-b959-42062ac6ee0b | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00304 | 3 | 20 | 이벤트 append | - |
| 04:54:22.004 | 20 | insert.file.ok | 7a4d68a1-3b98-4a36-b959-42062ac6ee0b | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00308 | 1 | 21 | 이벤트 append | - |
| 04:54:22.004 | 20 | insert.file.ok | 7a4d68a1-3b98-4a36-b959-42062ac6ee0b | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00308 | 1 | 21 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00308_01_20230923.json |
| 04:54:22.005 | 20 | insert.file.ok | 7a4d68a1-3b98-4a36-b959-42062ac6ee0b | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00320 | 1 | 23 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00320_01_20230923.json |
| 04:54:22.005 | 20 | insert.file.ok | 7a4d68a1-3b98-4a36-b959-42062ac6ee0b | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00317 | 2 | 22 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00317_02_20230923.json |
| 04:54:22.005 | 20 | insert.file.ok | 7a4d68a1-3b98-4a36-b959-42062ac6ee0b | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00320 | 1 | 23 | 이벤트 append | - |
| 04:54:22.005 | 20 | insert.file.ok | 7a4d68a1-3b98-4a36-b959-42062ac6ee0b | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00317 | 2 | 22 | 이벤트 append | - |
| 04:54:22.006 | 20 | insert.file.ok | 7a4d68a1-3b98-4a36-b959-42062ac6ee0b | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00323 | 1 | 24 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00323_01_20230923.json |
| 04:54:22.006 | 20 | insert.file.ok | 7a4d68a1-3b98-4a36-b959-42062ac6ee0b | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00323 | 1 | 24 | 이벤트 append | - |
| 04:54:22.007 | 40 | insert.file.failed | 7a4d68a1-3b98-4a36-b959-42062ac6ee0b | - | - | - | toy-data 파일 적재 실패 ← 트립 앵커 | reason=[   {     "expected": "int",     "format": "safeint",     "code": "invalid_type",     "path": [       "objects",       0,       "id"     ],     "message": "Invalid input: expected int, received number"   } ] · file=반려동물용품_CR01_강아지공룡알장난감_02022_01_20230923.json |
| 04:54:22.007 | 20 | insert.file.ok | 7a4d68a1-3b98-4a36-b959-42062ac6ee0b | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00327 | 3 | 25 | 이벤트 append | - |
| 04:54:22.007 | 20 | insert.file.ok | 7a4d68a1-3b98-4a36-b959-42062ac6ee0b | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00327 | 3 | 25 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00327_03_20230923.json |
| 04:54:22.008 | 40 | insert.file.failed | 7a4d68a1-3b98-4a36-b959-42062ac6ee0b | - | - | - | toy-data 파일 적재 실패 | reason=[   {     "expected": "int",     "format": "safeint",     "code": "invalid_type",     "path": [       "human_annotation_grasp",       0,       "num_keypoints"     ],     "message": "Invalid input: expected int, received number"   } ] · file=반려동물용품_CR01_강아지공룡알장난감_02023_01_20230923.json |
| 04:54:22.009 | 30 | - | 7a4d68a1-3b98-4a36-b959-42062ac6ee0b | - | - | - | request completed | - |
| 04:54:22.009 | 30 | insert.batch.done | 7a4d68a1-3b98-4a36-b959-42062ac6ee0b | - | - | - | toy-data 적재 완료 | - |
| 04:54:22.011 | 30 | projection.request | de82a3cc-f0e7-4494-9baf-c3aeefac5034 | - | - | - | projection 요청 수신 | - |
| 04:54:22.021 | 30 | projection.start | de82a3cc-f0e7-4494-9baf-c3aeefac5034 | - | - | - | catch-up 시작 | projector=multimodal-projector |
| 04:54:22.021 | 20 | - | de82a3cc-f0e7-4494-9baf-c3aeefac5034 | - | - | - | 커서 조회 | projector=multimodal-projector |
| 04:54:22.023 | 20 | projection.event.mapped | de82a3cc-f0e7-4494-9baf-c3aeefac5034 | - | 2 | 1 | 이벤트 매핑 | projector=multimodal-projector |
| 04:54:22.023 | 20 | - | de82a3cc-f0e7-4494-9baf-c3aeefac5034 | - | - | - | 이벤트 조회 | - |
| 04:54:22.025 | 20 | projection.event.mapped | de82a3cc-f0e7-4494-9baf-c3aeefac5034 | - | 2 | 2 | 이벤트 매핑 | projector=multimodal-projector |

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
- (level 40, `insert.file.failed`) toy-data 파일 적재 실패 — reason=[
  {
    "expected": "int",
    "format": "safeint",
    "code": "invalid_type",
    "path": [
      "objects",
      0,
      "id"
    ],
    "message": "Invalid input: expected int, received number"
  }
] · file=반려동물용품_CR01_강아지공룡알장난감_02022_01_20230923.json → 구조적 부족 아님 — 소스 파일의 JSON 데이터 타입 불일치(수정형/부트 vs 정수)로 Zod 검증 실패, 적재 단계에서 해당 파일만 스킵고 배치는 정상 완료 [corr:7a4d68a1-3b98-4a36-b959-42062ac6ee0b]
- (level 40, `insert.file.failed`) toy-data 파일 적재 실패 — reason=[
  {
    "expected": "int",
    "format": "safeint",
    "code": "invalid_type",
    "path": [
      "human_annotation_grasp",
      0,
      "num_keypoints"
    ],
    "message": "Invalid input: expected int, received number"
  }
] · file=반려동물용품_CR01_강아지공룡알장난감_02023_01_20230923.json → 구조적 부족 아님 — 소스 파일의 JSON 데이터 타입 불일치(수정형/부트 vs 정수)로 Zod 검증 실패, 적재 단계에서 해당 파일만 스킵고 배치는 정상 완료 [corr:7a4d68a1-3b98-4a36-b959-42062ac6ee0b]
- 자동 폴백 문서: LLM 권고 생성이 재시도까지 실패해 결정론 폴백이 최소 근거만 수록했다 — 분석 재실행으로 완전한 권고를 재생성하라.
- Toy-data 적재 배치 진행 중 2개 파일에서 Zod 스키마 검증 실패(id, num_keypoints 필드의 number vs int 타입 불일치)가 발생. 해당 파일들은 적재 단계에서 reject 처리되어 event_store에 append되지, 나머지 파일과 후속 투영 파이프라인은 정상 진행. 배치 완료 및 투영 재개 성공.

### Decision Drivers
- -

### Considered Options
#### 거절 유지 + 원천 데이터 수정 요청
- 접근: 적재 단계 zod 거절은 시스템이 의도한 방어 동작이다 — 거절을 유지하고 원천 파일의 결함(필수 필드 누락/타입 위반)을 수정 요청한다.
- 제안 필드: -
- 트레이드오프: Read Model 변경 없음. 원천 수정 전까지 해당 레코드는 조회 불가(무유입 검증 SQL 로 격리 상태 확인).

### Decision Outcome
거절 유지 + 원천 데이터 수정 요청 — LLM 생성 실패로 결정론 폴백이 lane 기본 조치를 선정

### Consequences
- (−) 본 권고는 결정론 폴백 산출물로, 옵션 비교·코드 스니펫이 없다(재실행 권장).

### Non-Goals
- 신규 스키마·코드 변경의 확정(재실행 산출물의 몫)

## 2. Read Model 생성 SQL (Read Model DDL)

> 실행 게이트: 아래 변경은 인간 승인 후에만 적용한다 (human-in-the-loop).

### 격리(containment) SQL — 신규 Read Model DDL 불필요, 결함 데이터 무해화가 조치다

```sql
-- 무유입 검증: zod 거절된 파일의 이벤트가 event_store 에 유입되지 않았음을 확인한다 (기대값 0)
SELECT count(*) AS rejected_event_count FROM event_store WHERE (stream_id, attempt_num) IN (('grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02022', 1), ('grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02023', 1));
```

## 3. API Versioning

### 버전 영향

API 버전 변경 없음 — 본 문서는 결정론 폴백 최소 권고로, 스키마·엔드포인트 변경을 확정하지 않는다.

## Guardrails (constraints)

- v1 자산(테이블/엔드포인트/프로젝터 name) 무손상
- PK (scene_key, attempt_num) 유지
- TypeScript any 금지
- 식별자 전체 단어
- DDL 실행·API 컷오버는 인간 승인 후에만 (human-in-the-loop)
- Read Model 테이블명은 read_ 접두 스네이크 케이스
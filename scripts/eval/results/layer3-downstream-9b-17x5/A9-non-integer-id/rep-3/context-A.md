---
docId: analysis-aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e
generatedAt: 2026-08-12T02:37:24.563Z
targetReadModel: read_grip_result
sqlDialect: postgres
sufficientEvidence: true
apiVersion:
  from: null
  to: null
  affectedEndpoints: []
evidenceSources:
  - { origin: developer-logging, anchorId: "aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e" }
constraints:
  - "v1 자산(테이블/엔드포인트/프로젝터 name) 무손상"
  - "PK (scene_key, attempt_num) 유지"
  - "TypeScript any 금지"
  - "식별자 전체 단어"
  - "DDL 실행·API 컷오버는 인간 승인 후에만 (human-in-the-loop)"
  - "Read Model 테이블명은 read_ 접두 스네이크 케이스"
---

# Self-Adaptive CQRS Docs — read_grip_result

> 결론(TL;DR): `read_grip_result`을(를) 보강한다 — toy-data 배치 적재 중 2개 파일의 payload 내 특정 중첩 키(id, num_keypoints)가 number 타입을 제공해 Zod int 기대 검증 실패. 실패 파일은 event_store 미접적, 나머지 배치 정상 진행. (이상 유형: 적재 Zod 거절 · 심각도: warning)

<logging_context>

## 이상 로그 맥락 (±N 윈도우)
> 빈도: 최근 1h — `insert.request`(level 30) 1회, `insert.file.failed`(level 40) 1회, `insert.batch.start`(level 30) 1회, `log.delete.request`(level 30) 1회, `log.delete.done`(level 30) 1회, `insert.file.ok`(level 20) 50회, `-`(level 30) 1회.

| time | level | action | correlation_id | stream_id | attempt | global_seq | msg | detail |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 02:37:16.934 | 30 | insert.request | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | - | - | - | Insert Event Store 요청 수신 | - |
| 02:37:16.934 | 30 | insert.batch.start | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | - | - | - | Toy-Data 적재 시작 | - |
| 02:37:16.939 | 20 | insert.file.ok | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00258 | 2 | 1 | 이벤트 append | - |
| 02:37:16.939 | 20 | insert.file.ok | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00258 | 2 | 1 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00258_02_20230923.json |
| 02:37:16.940 | 20 | insert.file.ok | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00262 | 2 | 2 | 이벤트 append | - |
| 02:37:16.940 | 20 | insert.file.ok | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00262 | 2 | 2 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00262_02_20230923.json |
| 02:37:16.941 | 20 | insert.file.ok | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00262 | 3 | 3 | 이벤트 append | - |
| 02:37:16.941 | 20 | insert.file.ok | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00262 | 3 | 3 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00262_03_20230923.json |
| 02:37:16.942 | 20 | insert.file.ok | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00263 | 2 | 4 | 이벤트 append | - |
| 02:37:16.942 | 20 | insert.file.ok | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00263 | 2 | 4 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00263_02_20230923.json |
| 02:37:16.943 | 20 | insert.file.ok | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00267 | 1 | 5 | 이벤트 append | - |
| 02:37:16.943 | 20 | insert.file.ok | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00267 | 1 | 5 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00267_01_20230923.json |
| 02:37:16.944 | 20 | insert.file.ok | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00275 | 1 | 7 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00275_01_20230923.json |
| 02:37:16.944 | 20 | insert.file.ok | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00269 | 2 | 6 | 이벤트 append | - |
| 02:37:16.944 | 20 | insert.file.ok | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00269 | 2 | 6 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00269_02_20230923.json |
| 02:37:16.944 | 20 | insert.file.ok | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00275 | 1 | 7 | 이벤트 append | - |
| 02:37:16.945 | 20 | insert.file.ok | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00275 | 3 | 8 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00275_03_20230923.json |
| 02:37:16.945 | 20 | insert.file.ok | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00275 | 3 | 8 | 이벤트 append | - |
| 02:37:16.946 | 20 | insert.file.ok | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00278 | 3 | 9 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00278_03_20230923.json |
| 02:37:16.946 | 20 | insert.file.ok | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00278 | 3 | 9 | 이벤트 append | - |
| 02:37:16.947 | 20 | insert.file.ok | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00280 | 1 | 10 | 이벤트 append | - |
| 02:37:16.947 | 20 | insert.file.ok | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00280 | 1 | 10 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00280_01_20230923.json |
| 02:37:16.948 | 20 | insert.file.ok | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00281 | 1 | 11 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00281_01_20230923.json |
| 02:37:16.948 | 20 | insert.file.ok | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00281 | 1 | 11 | 이벤트 append | - |
| 02:37:16.949 | 20 | insert.file.ok | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00286 | 3 | 12 | 이벤트 append | - |
| 02:37:16.949 | 20 | insert.file.ok | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00286 | 3 | 12 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00286_03_20230923.json |
| 02:37:16.950 | 20 | insert.file.ok | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00287 | 3 | 13 | 이벤트 append | - |
| 02:37:16.950 | 20 | insert.file.ok | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00287 | 3 | 13 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00287_03_20230923.json |
| 02:37:16.950 | 20 | insert.file.ok | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00291 | 3 | 14 | 이벤트 append | - |
| 02:37:16.950 | 20 | insert.file.ok | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00291 | 3 | 14 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00291_03_20230923.json |
| 02:37:16.951 | 20 | insert.file.ok | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00295 | 1 | 15 | 이벤트 append | - |
| 02:37:16.951 | 20 | insert.file.ok | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00295 | 1 | 15 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00295_01_20230923.json |
| 02:37:16.952 | 20 | insert.file.ok | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00297 | 3 | 16 | 이벤트 append | - |
| 02:37:16.952 | 20 | insert.file.ok | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00297 | 3 | 16 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00297_03_20230923.json |
| 02:37:16.953 | 20 | insert.file.ok | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00302 | 2 | 18 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00302_02_20230923.json |
| 02:37:16.953 | 20 | insert.file.ok | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00301 | 3 | 17 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00301_03_20230923.json |
| 02:37:16.953 | 20 | insert.file.ok | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00302 | 2 | 18 | 이벤트 append | - |
| 02:37:16.953 | 20 | insert.file.ok | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00301 | 3 | 17 | 이벤트 append | - |
| 02:37:16.954 | 20 | insert.file.ok | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00304 | 2 | 19 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00304_02_20230923.json |
| 02:37:16.954 | 20 | insert.file.ok | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00304 | 2 | 19 | 이벤트 append | - |
| 02:37:16.955 | 20 | insert.file.ok | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00304 | 3 | 20 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00304_03_20230923.json |
| 02:37:16.955 | 20 | insert.file.ok | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00304 | 3 | 20 | 이벤트 append | - |
| 02:37:16.956 | 20 | insert.file.ok | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00308 | 1 | 21 | 이벤트 append | - |
| 02:37:16.956 | 20 | insert.file.ok | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00308 | 1 | 21 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00308_01_20230923.json |
| 02:37:16.957 | 20 | insert.file.ok | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00317 | 2 | 22 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00317_02_20230923.json |
| 02:37:16.957 | 20 | insert.file.ok | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00317 | 2 | 22 | 이벤트 append | - |
| 02:37:16.958 | 20 | insert.file.ok | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00320 | 1 | 23 | 이벤트 append | - |
| 02:37:16.958 | 20 | insert.file.ok | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00320 | 1 | 23 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00320_01_20230923.json |
| 02:37:16.959 | 20 | insert.file.ok | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00327 | 3 | 25 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00327_03_20230923.json |
| 02:37:16.959 | 20 | insert.file.ok | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00323 | 1 | 24 | 이벤트 append | - |
| 02:37:16.959 | 20 | insert.file.ok | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00323 | 1 | 24 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00323_01_20230923.json |
| 02:37:16.959 | 20 | insert.file.ok | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00327 | 3 | 25 | 이벤트 append | - |
| 02:37:16.960 | 40 | insert.file.failed | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | - | - | - | toy-data 파일 적재 실패 ← 트립 앵커 | reason=[   {     "expected": "int",     "format": "safeint",     "code": "invalid_type",     "path": [       "objects",       0,       "id"     ],     "message": "Invalid input: expected int, received number"   } ] · file=반려동물용품_CR01_강아지공룡알장난감_02022_01_20230923.json |
| 02:37:16.961 | 40 | insert.file.failed | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | - | - | - | toy-data 파일 적재 실패 | reason=[   {     "expected": "int",     "format": "safeint",     "code": "invalid_type",     "path": [       "human_annotation_grasp",       0,       "num_keypoints"     ],     "message": "Invalid input: expected int, received number"   } ] · file=반려동물용품_CR01_강아지공룡알장난감_02023_01_20230923.json |
| 02:37:16.961 | 30 | - | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | - | - | - | request completed | - |
| 02:37:16.961 | 30 | insert.batch.done | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | - | - | - | toy-data 적재 완료 | - |
| 02:37:16.964 | 30 | projection.request | 2ff759e4-d475-46d8-986b-14e67206ecd5 | - | - | - | projection 요청 수신 | - |
| 02:37:16.966 | 20 | - | 2ff759e4-d475-46d8-986b-14e67206ecd5 | - | - | - | 커서 조회 | projector=multimodal-projector |
| 02:37:16.966 | 30 | projection.start | 2ff759e4-d475-46d8-986b-14e67206ecd5 | - | - | - | catch-up 시작 | projector=multimodal-projector |
| 02:37:16.967 | 20 | - | 2ff759e4-d475-46d8-986b-14e67206ecd5 | - | - | - | 이벤트 조회 | - |
| 02:37:16.968 | 20 | projection.event.mapped | 2ff759e4-d475-46d8-986b-14e67206ecd5 | - | 2 | 1 | 이벤트 매핑 | projector=multimodal-projector |
| 02:37:16.969 | 20 | projection.event.mapped | 2ff759e4-d475-46d8-986b-14e67206ecd5 | - | 2 | 2 | 이벤트 매핑 | projector=multimodal-projector |

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
- (level 40, `insert.file.failed`) toy-data 파일 적재 실패 ← 트립 앵커 → 원천 JSON payload의 objects[0].id 필드가 number 타입(예: float) 유입으로 Zod int 기대 검증 거절. [corr:aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e]
- (level 40, `insert.file.failed`) toy-data 파일 적재 실패 → 원천 JSON payload의 human_annotation_grasp[0].num_keypoints 필드가 number 타입 유입으로 Zod int 기대 검증 거절. [corr:aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e]
- src/insert/dto/toy-data.dto.ts 의 objects[].id 및 human_annotation_grasp[].num_keypoints 정의는 z.number().int() 로 엄격히 정수 타입을 요구하나, 로그 detail 의 reason code invalid_type 과 message received number 는 부호부 실수(float) 유입을 드러남.
- 적재 단계 Zod 거절(insert.file.failed) 로 해당 파일들은 event_store 에 미적재되었으므로, read_grip_result 의 object_name, humanAnnotationGrasp 컬럼이나 read_multimodal 의 image_2d_file_name 등 Read Model 구조는 정상 유지됨.
- GripResultProjector.map() 의 toyDataSchema.parse(event.payload) 호출은 미유입 이벤트 기준 never 도달, 따라서 Read Model 투영 로직의 결함이 아님.

### Decision Drivers
- Zod 거절 의도 유지(시스템 방어)
- 무유입 ES 검증 보장
- 원천 데이터 정성화 요청 명확히 유도
- Read Model 구조·엔드포인트 보존

### Considered Options
#### 무유입 검증 절차
- 접근: src/insert/monitoring/validation.ts 신규 감시 스크립트 도입. batch.done 후 failed file list 의 stream_id/attempt_num 매칭으로 ES 미유입 확인 SELECT 실행.
- 제안 필드: containmentSql, failedFileList
- 트레이드오프: 영(0)의 런타임 부하, 다만 감시 도구 별도 배포 필요.
```typescript
const verifyNoIngestion = async (streamId: string, attemptNum: number): Promise<boolean> => { const rows = await db.select({ count: sql`count(*)`.as('count') }).from(eventStoreTable).where(sql`stream_id = ${streamId} AND attempt_num = ${attemptNum}`).execute(); return rows[0].count === 0; };
```

#### 거절 유지 + 원천 데이터 수정 요청
- 접근: src/insert/insert.service.ts 의 failed handler 보강. Zod 거절 catch 블록에서 file path 와 rejected field path 를 logger.info 로 방출, operator 의 payload 정성화 재시도 권고.
- 제안 필드: alertPayload, sourceFilePath
- 트레이드오프: 서비스 코드 수정 소량, operator 가시성 개입 필요.
```typescript
if (error instanceof ZodError) { const filePath = failedFile.path; this.logger.info({ action: LogAction.FILE_REJECTED, sourcePath: filePath }, 'Zod 거절: 원천 payload 타입 정성화 요청 권고'); };
```

### Decision Outcome
거절 유지 + 원천 데이터 수정 요청 (권장)

### Consequences
- (+) ES 무해화 보장
- (+) Read Model 구조 오염 방지
- (+) operator 의 payload 정성화 workflow 명확히 유도
- (−) batch 처리 latency 증가(이미 system handled)
- (−) manual payload correction 필요

### Non-Goals
- Zod schema coercion(optional/defautl) 적용
- 신규 감시 테이블 생성
- Read Model 컬럼 확장

## 2. Read Model 생성 SQL (Read Model DDL)

> 실행 게이트: 아래 변경은 인간 승인 후에만 적용한다 (human-in-the-loop).

### 격리(containment) SQL — 신규 Read Model DDL 불필요, 결함 데이터 무해화가 조치다

```sql
-- 무유입 검증: zod 거절된 파일의 이벤트가 event_store 에 유입되지 않았음을 확인한다 (기대값 0)
SELECT count(*) AS rejected_event_count FROM event_store WHERE (stream_id, attempt_num) IN (('grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02022', 1), ('grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02023', 1));
```

## 3. API Versioning

### 버전 영향

변 변경 없음. 스키마·엔드포인트가 불변. 격리 SQL은 운영/감시 도구만 사용하며 DB 구조를 건드리지 않음. Zod 거절 의도 유지로 API contract 동일.

## Guardrails (constraints)

- v1 자산(테이블/엔드포인트/프로젝터 name) 무손상
- PK (scene_key, attempt_num) 유지
- TypeScript any 금지
- 식별자 전체 단어
- DDL 실행·API 컷오버는 인간 승인 후에만 (human-in-the-loop)
- Read Model 테이블명은 read_ 접두 스네이크 케이스
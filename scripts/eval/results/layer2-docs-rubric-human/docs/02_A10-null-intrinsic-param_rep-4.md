---
docId: analysis-bfa4a659-ddb6-4039-a2c1-1ed7eca0a83d
generatedAt: 2026-08-12T20:08:38.562Z
targetReadModel: read_grip_result, read_multimodal
sqlDialect: postgres
sufficientEvidence: true
apiVersion:
  from: null
  to: null
  affectedEndpoints: []
evidenceSources:
  - { origin: developer-logging, anchorId: "bfa4a659-ddb6-4039-a2c1-1ed7eca0a83d" }
  - { origin: developer-logging, anchorId: "4e64c52c-f10a-48fa-90fe-ce3314152c10" }
constraints:
  - "v1 자산(테이블/엔드포인트/프로젝터 name) 무손상"
  - "PK (scene_key, attempt_num) 유지"
  - "TypeScript any 금지"
  - "식별자 전체 단어"
  - "DDL 실행·API 컷오버는 인간 승인 후에만 (human-in-the-loop)"
  - "Read Model 테이블명은 read_ 접두 스네이크 케이스"
---

# Self-Adaptive CQRS Docs — read_grip_result, read_multimodal

> 결론(TL;DR): `read_grip_result, read_multimodal`을(를) 보강한다 — Toy-Data 배치 적재 중 두 파일의 camera_intrinsic_param 필드(cody, fx)가 null 값으로 전달되어 Zod number 타입 검증 실패(insert.file.failed). 파일 단위 거절로 event_store append는 차단되나 배치 트랜잭션은 롤백되지 않고 후속 투영(projection.start)은 정상 진행. (이상 유형: Payload Null-Value Violation · 심각도: warning)

<logging_context>

## 이상 로그 맥락 (±N 윈도우)
> 빈도: 최근 1h — `insert.request`(level 30) 1회, `insert.file.failed`(level 40) 1회, `insert.batch.start`(level 30) 1회, `log.delete.request`(level 30) 1회, `log.delete.done`(level 30) 1회, `insert.file.ok`(level 20) 50회, `-`(level 30) 1회.

| time | level | action | correlation_id | stream_id | attempt | global_seq | msg | detail |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 20:08:35.906 | 30 | insert.request | bfa4a659-ddb6-4039-a2c1-1ed7eca0a83d | - | - | - | Insert Event Store 요청 수신 | - |
| 20:08:35.906 | 30 | insert.batch.start | bfa4a659-ddb6-4039-a2c1-1ed7eca0a83d | - | - | - | Toy-Data 적재 시작 | - |
| 20:08:35.911 | 20 | insert.file.ok | bfa4a659-ddb6-4039-a2c1-1ed7eca0a83d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00297 | 3 | 1 | 이벤트 append | - |
| 20:08:35.911 | 20 | insert.file.ok | bfa4a659-ddb6-4039-a2c1-1ed7eca0a83d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00297 | 3 | 1 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00297_03_20230923.json |
| 20:08:35.912 | 20 | insert.file.ok | bfa4a659-ddb6-4039-a2c1-1ed7eca0a83d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00301 | 3 | 2 | 이벤트 append | - |
| 20:08:35.912 | 20 | insert.file.ok | bfa4a659-ddb6-4039-a2c1-1ed7eca0a83d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00301 | 3 | 2 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00301_03_20230923.json |
| 20:08:35.914 | 20 | insert.file.ok | bfa4a659-ddb6-4039-a2c1-1ed7eca0a83d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00302 | 2 | 3 | 이벤트 append | - |
| 20:08:35.914 | 20 | insert.file.ok | bfa4a659-ddb6-4039-a2c1-1ed7eca0a83d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00302 | 2 | 3 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00302_02_20230923.json |
| 20:08:35.915 | 20 | insert.file.ok | bfa4a659-ddb6-4039-a2c1-1ed7eca0a83d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00304 | 2 | 4 | 이벤트 append | - |
| 20:08:35.915 | 20 | insert.file.ok | bfa4a659-ddb6-4039-a2c1-1ed7eca0a83d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00304 | 2 | 4 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00304_02_20230923.json |
| 20:08:35.916 | 20 | insert.file.ok | bfa4a659-ddb6-4039-a2c1-1ed7eca0a83d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00308 | 1 | 6 | 이벤트 append | - |
| 20:08:35.916 | 20 | insert.file.ok | bfa4a659-ddb6-4039-a2c1-1ed7eca0a83d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00304 | 3 | 5 | 이벤트 append | - |
| 20:08:35.916 | 20 | insert.file.ok | bfa4a659-ddb6-4039-a2c1-1ed7eca0a83d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00304 | 3 | 5 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00304_03_20230923.json |
| 20:08:35.916 | 20 | insert.file.ok | bfa4a659-ddb6-4039-a2c1-1ed7eca0a83d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00308 | 1 | 6 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00308_01_20230923.json |
| 20:08:35.917 | 20 | insert.file.ok | bfa4a659-ddb6-4039-a2c1-1ed7eca0a83d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00317 | 2 | 7 | 이벤트 append | - |
| 20:08:35.917 | 20 | insert.file.ok | bfa4a659-ddb6-4039-a2c1-1ed7eca0a83d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00317 | 2 | 7 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00317_02_20230923.json |
| 20:08:35.919 | 20 | insert.file.ok | bfa4a659-ddb6-4039-a2c1-1ed7eca0a83d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00320 | 1 | 8 | 이벤트 append | - |
| 20:08:35.919 | 20 | insert.file.ok | bfa4a659-ddb6-4039-a2c1-1ed7eca0a83d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00320 | 1 | 8 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00320_01_20230923.json |
| 20:08:35.920 | 20 | insert.file.ok | bfa4a659-ddb6-4039-a2c1-1ed7eca0a83d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00323 | 1 | 9 | 이벤트 append | - |
| 20:08:35.920 | 20 | insert.file.ok | bfa4a659-ddb6-4039-a2c1-1ed7eca0a83d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00323 | 1 | 9 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00323_01_20230923.json |
| 20:08:35.921 | 20 | insert.file.ok | bfa4a659-ddb6-4039-a2c1-1ed7eca0a83d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00327 | 3 | 10 | 이벤트 append | - |
| 20:08:35.921 | 20 | insert.file.ok | bfa4a659-ddb6-4039-a2c1-1ed7eca0a83d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00327 | 3 | 10 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00327_03_20230923.json |
| 20:08:35.922 | 20 | insert.file.ok | bfa4a659-ddb6-4039-a2c1-1ed7eca0a83d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00328 | 1 | 11 | 이벤트 append | - |
| 20:08:35.922 | 20 | insert.file.ok | bfa4a659-ddb6-4039-a2c1-1ed7eca0a83d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00328 | 1 | 11 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00328_01_20230923.json |
| 20:08:35.923 | 20 | insert.file.ok | bfa4a659-ddb6-4039-a2c1-1ed7eca0a83d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00336 | 3 | 12 | 이벤트 append | - |
| 20:08:35.923 | 20 | insert.file.ok | bfa4a659-ddb6-4039-a2c1-1ed7eca0a83d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00336 | 3 | 12 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00336_03_20231010.json |
| 20:08:35.924 | 20 | insert.file.ok | bfa4a659-ddb6-4039-a2c1-1ed7eca0a83d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00338 | 3 | 13 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00338_03_20231010.json |
| 20:08:35.924 | 20 | insert.file.ok | bfa4a659-ddb6-4039-a2c1-1ed7eca0a83d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00338 | 3 | 13 | 이벤트 append | - |
| 20:08:35.925 | 20 | insert.file.ok | bfa4a659-ddb6-4039-a2c1-1ed7eca0a83d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00340 | 2 | 14 | 이벤트 append | - |
| 20:08:35.925 | 20 | insert.file.ok | bfa4a659-ddb6-4039-a2c1-1ed7eca0a83d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00340 | 2 | 14 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00340_02_20231010.json |
| 20:08:35.925 | 20 | insert.file.ok | bfa4a659-ddb6-4039-a2c1-1ed7eca0a83d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00340 | 3 | 15 | 이벤트 append | - |
| 20:08:35.925 | 20 | insert.file.ok | bfa4a659-ddb6-4039-a2c1-1ed7eca0a83d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00340 | 3 | 15 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00340_03_20231010.json |
| 20:08:35.926 | 20 | insert.file.ok | bfa4a659-ddb6-4039-a2c1-1ed7eca0a83d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00343 | 3 | 16 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00343_03_20231010.json |
| 20:08:35.926 | 20 | insert.file.ok | bfa4a659-ddb6-4039-a2c1-1ed7eca0a83d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00343 | 3 | 16 | 이벤트 append | - |
| 20:08:35.927 | 20 | insert.file.ok | bfa4a659-ddb6-4039-a2c1-1ed7eca0a83d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00344 | 1 | 17 | 이벤트 append | - |
| 20:08:35.927 | 20 | insert.file.ok | bfa4a659-ddb6-4039-a2c1-1ed7eca0a83d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00344 | 1 | 17 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00344_01_20231010.json |
| 20:08:35.928 | 20 | insert.file.ok | bfa4a659-ddb6-4039-a2c1-1ed7eca0a83d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00349 | 1 | 18 | 이벤트 append | - |
| 20:08:35.928 | 20 | insert.file.ok | bfa4a659-ddb6-4039-a2c1-1ed7eca0a83d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00349 | 1 | 18 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00349_01_20231010.json |
| 20:08:35.929 | 20 | insert.file.ok | bfa4a659-ddb6-4039-a2c1-1ed7eca0a83d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00370 | 1 | 20 | 이벤트 append | - |
| 20:08:35.929 | 20 | insert.file.ok | bfa4a659-ddb6-4039-a2c1-1ed7eca0a83d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00364 | 3 | 19 | 이벤트 append | - |
| 20:08:35.929 | 20 | insert.file.ok | bfa4a659-ddb6-4039-a2c1-1ed7eca0a83d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00364 | 3 | 19 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00364_03_20231010.json |
| 20:08:35.929 | 20 | insert.file.ok | bfa4a659-ddb6-4039-a2c1-1ed7eca0a83d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00370 | 1 | 20 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00370_01_20231010.json |
| 20:08:35.930 | 20 | insert.file.ok | bfa4a659-ddb6-4039-a2c1-1ed7eca0a83d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00373 | 2 | 21 | 이벤트 append | - |
| 20:08:35.930 | 20 | insert.file.ok | bfa4a659-ddb6-4039-a2c1-1ed7eca0a83d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00373 | 2 | 21 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00373_02_20231010.json |
| 20:08:35.931 | 20 | insert.file.ok | bfa4a659-ddb6-4039-a2c1-1ed7eca0a83d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00377 | 3 | 22 | 이벤트 append | - |
| 20:08:35.931 | 20 | insert.file.ok | bfa4a659-ddb6-4039-a2c1-1ed7eca0a83d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00377 | 3 | 22 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00377_03_20231010.json |
| 20:08:35.932 | 20 | insert.file.ok | bfa4a659-ddb6-4039-a2c1-1ed7eca0a83d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00380 | 2 | 23 | 이벤트 append | - |
| 20:08:35.932 | 20 | insert.file.ok | bfa4a659-ddb6-4039-a2c1-1ed7eca0a83d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00380 | 2 | 23 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00380_02_20231010.json |
| 20:08:35.933 | 20 | insert.file.ok | bfa4a659-ddb6-4039-a2c1-1ed7eca0a83d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00387 | 2 | 25 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00387_02_20231010.json |
| 20:08:35.933 | 20 | insert.file.ok | bfa4a659-ddb6-4039-a2c1-1ed7eca0a83d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00381 | 2 | 24 | 이벤트 append | - |
| 20:08:35.933 | 20 | insert.file.ok | bfa4a659-ddb6-4039-a2c1-1ed7eca0a83d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00381 | 2 | 24 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00381_02_20231010.json |
| 20:08:35.933 | 20 | insert.file.ok | bfa4a659-ddb6-4039-a2c1-1ed7eca0a83d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00387 | 2 | 25 | 이벤트 append | - |
| 20:08:35.934 | 40 | insert.file.failed | bfa4a659-ddb6-4039-a2c1-1ed7eca0a83d | - | - | - | toy-data 파일 적재 실패 ← 트립 앵커 | reason=[   {     "expected": "number",     "code": "invalid_type",     "path": [       "camera_info",       "camera_intrinsic_param",       "cody"     ],     "message": "Invalid input: expected number, received null"   } ] · file=반려동물용품_CR01_강아지공룡알장난감_02024_01_20230923.json |
| 20:08:35.935 | 30 | insert.batch.done | bfa4a659-ddb6-4039-a2c1-1ed7eca0a83d | - | - | - | toy-data 적재 완료 | - |
| 20:08:35.935 | 40 | insert.file.failed | bfa4a659-ddb6-4039-a2c1-1ed7eca0a83d | - | - | - | toy-data 파일 적재 실패 | reason=[   {     "expected": "number",     "code": "invalid_type",     "path": [       "camera_info",       "camera_intrinsic_param",       "fx"     ],     "message": "Invalid input: expected number, received null"   } ] · file=반려동물용품_CR01_강아지공룡알장난감_02025_01_20230923.json |
| 20:08:35.935 | 30 | - | bfa4a659-ddb6-4039-a2c1-1ed7eca0a83d | - | - | - | request completed | - |
| 20:08:35.938 | 30 | projection.request | 4e64c52c-f10a-48fa-90fe-ce3314152c10 | - | - | - | projection 요청 수신 | - |
| 20:08:35.939 | 20 | - | 4e64c52c-f10a-48fa-90fe-ce3314152c10 | - | - | - | 커서 조회 | projector=multimodal-projector |
| 20:08:35.940 | 30 | projection.start | 4e64c52c-f10a-48fa-90fe-ce3314152c10 | - | - | - | catch-up 시작 | projector=multimodal-projector |
| 20:08:35.941 | 20 | - | 4e64c52c-f10a-48fa-90fe-ce3314152c10 | - | - | - | 이벤트 조회 | - |
| 20:08:35.942 | 20 | projection.event.mapped | 4e64c52c-f10a-48fa-90fe-ce3314152c10 | - | 3 | 1 | 이벤트 매핑 | projector=multimodal-projector |
| 20:08:35.943 | 20 | projection.event.mapped | 4e64c52c-f10a-48fa-90fe-ce3314152c10 | - | 2 | 3 | 이벤트 매핑 | projector=multimodal-projector |

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
- (level 40, `insert.file.failed`) toy-data 파일 적재 실패 ← 트립 앵커 → 원천 payload의 camera_intrinsic_param.cody 필드(null)가 Zod number 검증에 거절되어 이벤트 append 차단. [corr:bfa4a659-ddb6-4039-a2c1-1ed7eca0a83d]
- (level 40, `insert.file.failed`) toy-data 파일 적재 실패 → 원천 payload의 camera_intrinsic_param.fx 필드(null)가 Zod number 검증에 거절되어 이벤트 append 차단. [corr:bfa4a659-ddb6-4039-a2c1-1ed7eca0a83d]
- (level 30, `insert.batch.done`) toy-data 적재 완료 → 파일 단위 거절이 발생하지만 배치 트랜잭션은 롤백되지 않고 정상 종료. [corr:bfa4a659-ddb6-4039-a2c1-1ed7eca0a83d]
- (level 30, `projection.start`) catch-up 시작 → 거절된 파일의 미유입에도 후속 투영은 정상 진행. [corr:4e64c52c-f10a-48fa-90fe-ce3314152c10]
- Zod 스키마(src/insert/dto/toy-data.dto.ts)에서 cody와 fx가 .nullable() 누락되어 null 값 유입 시 즉시 거절([corr:bfa4a659-ddb6-4039-a2c1-1ed7eca0a83d]).
- 적재 로직은 파일 단위 try/catch로 거절 처리, event_store append는 차단되나 배치 트랜잭션 롤백/투영 정지(poison event)가 아님([corr:bfa4a659-ddb6-4039-a2c1-1ed7eca0a83d]).
- Read Model(read_grip_result, read_multimodal) 스키마는 정상, 결함 데이터는 미유입 상태이므로 Read Model 구조/컬럼 부재가 아님.
- 후속 투영(projection.start [corr:4e64c52c-f10a-48fa-90fe-ce3314152c10])은 미유입 거절 파일 건너뛰고 정상 진행.

### Decision Drivers
- Zod 검증 의도 유지 (방어 동작)
- 미유입 상태 보장 (Read Model 오염 방지)
- 원천 데이터 수정 요청 신뢰
- 시스템 로직 변경 최소화

### Considered Options
#### 거절 유지 및 원천 데이터 수정 요청
- 접근: Zod 스키마(toyDataSchema)는 그대로 유지(방어 동작). 적재 실패 로그(insert.file.failed)를 운영/보관 팀에 전달하여 원천 JSON 파일의 cody/fx null 보충 요청.
- 제안 필드: src/insert/dto/toy-data.dto.ts, src/projection/projector/multimodal.projector.ts
- 트레이드오프: 재투영 비용 0, 리스크 원천 데이터 수정 지연. 정합성 검증(zod) 유지로 Read Model 오염 방지.
```typescript
// Zod 스키마 toyDataSchema.cody/fx 유지: z.number() (no nullable)
```

#### 무유입 검증 절차
- 접근: 적재 실패(insert.file.failed) 발생 시, 해당 파일명에서 scene_key/attempt_num 추출하여 event_store 미유입을 SQL로 검증.
- 제안 필드: src/projection/repository/event-store-reader.repository.ts, src/shared/database/schema/service/read-multimodal.ts
- 트레이드오프: 추가 SQL 조회 오버헤드 발생, but guarantees no-influx state before projection catch-up.
```typescript
const verifyNoInflux = async (tx: DrizzleTx, streamIdPrefix: string, sceneNum: string, attemptNum: number) => { return tx.select(count).from(eventStore).where(and(eq(streamId, `grip-attempt:${streamIdPrefix}_${sceneNum}`), eq(attemptNum, attemptNum))).run(); };
```

#### 거절 모니터링/알림 보강
- 접근: insert.file.failed 로그 레벨/메시지를 감지하여 별도 알림 queue 또는 dashboard trigger 연동.
- 제안 필드: src/shared/logger/logging-context.ts, monitoring/service
- 트레이드오프: 시스템 로직 변경 0, but relies on external monitoring infrastructure.
```typescript
// logEvent.level === 40 && logEvent.action === 'insert.file.failed' -> alertQueue.push(logEvent)
```

### Decision Outcome
거절 유지 및 원천 데이터 수정 요청

### Consequences
- (+) Read Model 오염 방지
- (+) Zod 검증 의도 유지
- (+) 재투영 오버헤드 0
- (−) 원천 데이터 수정 지연 발생
- (−) 외 프로세스 연동 필요

### Non-Goals
- 기각 대안: default 값 주입/스키마 완화/신규 추적 테이블
- Read Model 컬럼 추가/수정
- 프로젝터 map() 로직 변경

## 2. Read Model 생성 SQL (Read Model DDL)

> 실행 게이트: 아래 변경은 인간 승인 후에만 적용한다 (human-in-the-loop).

### 격리(containment) SQL — 신규 Read Model DDL 불필요, 결함 데이터 무해화가 조치다

```sql
-- 무유입 검증: zod 거절된 파일의 이벤트가 event_store 에 유입되지 않았음을 확인한다 (기대값 0)
SELECT count(*) AS rejected_event_count FROM event_store WHERE (stream_id, attempt_num) IN (('grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02024', 1), ('grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02025', 1));
```

## 3. API Versioning

### 버전 영향

변 변경 없음. Zod 검증 스키마(toyDataSchema)와 Read Model 테이블/엔드포인트가 그대로 유지, 원천 데이터 수정 요청은 외부 프로세스이므로 API 버전 영향이 발생하지.

## Guardrails (constraints)

- v1 자산(테이블/엔드포인트/프로젝터 name) 무손상
- PK (scene_key, attempt_num) 유지
- TypeScript any 금지
- 식별자 전체 단어
- DDL 실행·API 컷오버는 인간 승인 후에만 (human-in-the-loop)
- Read Model 테이블명은 read_ 접두 스네이크 케이스
---
docId: analysis-416d5c44-4f0f-4a2a-bcdb-285a7f908cf3
generatedAt: 2026-08-14T04:43:39.331Z
targetReadModel: read_grip_result
sqlDialect: postgres
sufficientEvidence: true
apiVersion:
  from: null
  to: null
  affectedEndpoints: []
evidenceSources:
  - { origin: developer-logging, anchorId: "416d5c44-4f0f-4a2a-bcdb-285a7f908cf3" }
constraints:
  - "v1 자산(테이블/엔드포인트/프로젝터 name) 무손상"
  - "PK (scene_key, attempt_num) 유지"
  - "TypeScript any 금지"
  - "식별자 전체 단어"
  - "DDL 실행·API 컷오버는 인간 승인 후에만 (human-in-the-loop)"
  - "Read Model 테이블명은 read_ 접두 스네이크 케이스"
---

# Self-Adaptive CQRS Docs — read_grip_result

> 결론(TL;DR): `read_grip_result`을(를) 보강한다 — Toy-Data JSON 파일 군의 event_store 적재(batch ingestion) 중, 두 파일(camera intrinsic param cody/fx 필드)이 null 값 유입으로 Zod 검증(expected number)에 거절됨. 파일 단위 try/catch 실패이므로 배치 트랜잭션 롤백/투영 차단은 없었으며 성공 파일은 정상 append 후 projection 진행. (이상 유형: 적재 Zod 거절 · 심각도: warning)

<logging_context>

## 이상 로그 맥락 (±N 윈도우)
> 빈도: 최근 1h — `insert.request`(level 30) 1회, `insert.file.failed`(level 40) 1회, `insert.batch.start`(level 30) 1회, `log.delete.request`(level 30) 1회, `log.delete.done`(level 30) 1회, `insert.file.ok`(level 20) 50회, `-`(level 30) 1회.

| time | level | action | correlation_id | stream_id | attempt | global_seq | msg | detail |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 04:43:31.597 | 30 | insert.request | 416d5c44-4f0f-4a2a-bcdb-285a7f908cf3 | - | - | - | Insert Event Store 요청 수신 | - |
| 04:43:31.597 | 30 | insert.batch.start | 416d5c44-4f0f-4a2a-bcdb-285a7f908cf3 | - | - | - | Toy-Data 적재 시작 | - |
| 04:43:31.602 | 20 | insert.file.ok | 416d5c44-4f0f-4a2a-bcdb-285a7f908cf3 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00297 | 3 | 1 | 이벤트 append | - |
| 04:43:31.602 | 20 | insert.file.ok | 416d5c44-4f0f-4a2a-bcdb-285a7f908cf3 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00297 | 3 | 1 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00297_03_20230923.json |
| 04:43:31.603 | 20 | insert.file.ok | 416d5c44-4f0f-4a2a-bcdb-285a7f908cf3 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00301 | 3 | 2 | 이벤트 append | - |
| 04:43:31.603 | 20 | insert.file.ok | 416d5c44-4f0f-4a2a-bcdb-285a7f908cf3 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00301 | 3 | 2 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00301_03_20230923.json |
| 04:43:31.604 | 20 | insert.file.ok | 416d5c44-4f0f-4a2a-bcdb-285a7f908cf3 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00302 | 2 | 3 | 이벤트 append | - |
| 04:43:31.604 | 20 | insert.file.ok | 416d5c44-4f0f-4a2a-bcdb-285a7f908cf3 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00302 | 2 | 3 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00302_02_20230923.json |
| 04:43:31.605 | 20 | insert.file.ok | 416d5c44-4f0f-4a2a-bcdb-285a7f908cf3 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00304 | 2 | 4 | 이벤트 append | - |
| 04:43:31.605 | 20 | insert.file.ok | 416d5c44-4f0f-4a2a-bcdb-285a7f908cf3 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00304 | 2 | 4 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00304_02_20230923.json |
| 04:43:31.606 | 20 | insert.file.ok | 416d5c44-4f0f-4a2a-bcdb-285a7f908cf3 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00304 | 3 | 5 | 이벤트 append | - |
| 04:43:31.606 | 20 | insert.file.ok | 416d5c44-4f0f-4a2a-bcdb-285a7f908cf3 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00304 | 3 | 5 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00304_03_20230923.json |
| 04:43:31.607 | 20 | insert.file.ok | 416d5c44-4f0f-4a2a-bcdb-285a7f908cf3 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00308 | 1 | 6 | 이벤트 append | - |
| 04:43:31.607 | 20 | insert.file.ok | 416d5c44-4f0f-4a2a-bcdb-285a7f908cf3 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00308 | 1 | 6 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00308_01_20230923.json |
| 04:43:31.608 | 20 | insert.file.ok | 416d5c44-4f0f-4a2a-bcdb-285a7f908cf3 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00320 | 1 | 8 | 이벤트 append | - |
| 04:43:31.608 | 20 | insert.file.ok | 416d5c44-4f0f-4a2a-bcdb-285a7f908cf3 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00317 | 2 | 7 | 이벤트 append | - |
| 04:43:31.608 | 20 | insert.file.ok | 416d5c44-4f0f-4a2a-bcdb-285a7f908cf3 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00317 | 2 | 7 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00317_02_20230923.json |
| 04:43:31.608 | 20 | insert.file.ok | 416d5c44-4f0f-4a2a-bcdb-285a7f908cf3 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00320 | 1 | 8 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00320_01_20230923.json |
| 04:43:31.609 | 20 | insert.file.ok | 416d5c44-4f0f-4a2a-bcdb-285a7f908cf3 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00323 | 1 | 9 | 이벤트 append | - |
| 04:43:31.609 | 20 | insert.file.ok | 416d5c44-4f0f-4a2a-bcdb-285a7f908cf3 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00323 | 1 | 9 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00323_01_20230923.json |
| 04:43:31.610 | 20 | insert.file.ok | 416d5c44-4f0f-4a2a-bcdb-285a7f908cf3 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00327 | 3 | 10 | 이벤트 append | - |
| 04:43:31.610 | 20 | insert.file.ok | 416d5c44-4f0f-4a2a-bcdb-285a7f908cf3 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00327 | 3 | 10 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00327_03_20230923.json |
| 04:43:31.611 | 20 | insert.file.ok | 416d5c44-4f0f-4a2a-bcdb-285a7f908cf3 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00328 | 1 | 11 | 이벤트 append | - |
| 04:43:31.611 | 20 | insert.file.ok | 416d5c44-4f0f-4a2a-bcdb-285a7f908cf3 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00328 | 1 | 11 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00328_01_20230923.json |
| 04:43:31.612 | 20 | insert.file.ok | 416d5c44-4f0f-4a2a-bcdb-285a7f908cf3 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00338 | 3 | 13 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00338_03_20231010.json |
| 04:43:31.612 | 20 | insert.file.ok | 416d5c44-4f0f-4a2a-bcdb-285a7f908cf3 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00336 | 3 | 12 | 이벤트 append | - |
| 04:43:31.612 | 20 | insert.file.ok | 416d5c44-4f0f-4a2a-bcdb-285a7f908cf3 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00336 | 3 | 12 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00336_03_20231010.json |
| 04:43:31.612 | 20 | insert.file.ok | 416d5c44-4f0f-4a2a-bcdb-285a7f908cf3 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00338 | 3 | 13 | 이벤트 append | - |
| 04:43:31.613 | 20 | insert.file.ok | 416d5c44-4f0f-4a2a-bcdb-285a7f908cf3 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00340 | 2 | 14 | 이벤트 append | - |
| 04:43:31.613 | 20 | insert.file.ok | 416d5c44-4f0f-4a2a-bcdb-285a7f908cf3 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00340 | 2 | 14 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00340_02_20231010.json |
| 04:43:31.614 | 20 | insert.file.ok | 416d5c44-4f0f-4a2a-bcdb-285a7f908cf3 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00340 | 3 | 15 | 이벤트 append | - |
| 04:43:31.614 | 20 | insert.file.ok | 416d5c44-4f0f-4a2a-bcdb-285a7f908cf3 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00340 | 3 | 15 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00340_03_20231010.json |
| 04:43:31.615 | 20 | insert.file.ok | 416d5c44-4f0f-4a2a-bcdb-285a7f908cf3 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00343 | 3 | 16 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00343_03_20231010.json |
| 04:43:31.615 | 20 | insert.file.ok | 416d5c44-4f0f-4a2a-bcdb-285a7f908cf3 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00343 | 3 | 16 | 이벤트 append | - |
| 04:43:31.616 | 20 | insert.file.ok | 416d5c44-4f0f-4a2a-bcdb-285a7f908cf3 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00344 | 1 | 17 | 이벤트 append | - |
| 04:43:31.616 | 20 | insert.file.ok | 416d5c44-4f0f-4a2a-bcdb-285a7f908cf3 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00344 | 1 | 17 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00344_01_20231010.json |
| 04:43:31.617 | 20 | insert.file.ok | 416d5c44-4f0f-4a2a-bcdb-285a7f908cf3 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00349 | 1 | 18 | 이벤트 append | - |
| 04:43:31.617 | 20 | insert.file.ok | 416d5c44-4f0f-4a2a-bcdb-285a7f908cf3 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00349 | 1 | 18 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00349_01_20231010.json |
| 04:43:31.618 | 20 | insert.file.ok | 416d5c44-4f0f-4a2a-bcdb-285a7f908cf3 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00370 | 1 | 20 | 이벤트 append | - |
| 04:43:31.618 | 20 | insert.file.ok | 416d5c44-4f0f-4a2a-bcdb-285a7f908cf3 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00364 | 3 | 19 | 이벤트 append | - |
| 04:43:31.618 | 20 | insert.file.ok | 416d5c44-4f0f-4a2a-bcdb-285a7f908cf3 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00364 | 3 | 19 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00364_03_20231010.json |
| 04:43:31.618 | 20 | insert.file.ok | 416d5c44-4f0f-4a2a-bcdb-285a7f908cf3 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00370 | 1 | 20 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00370_01_20231010.json |
| 04:43:31.619 | 20 | insert.file.ok | 416d5c44-4f0f-4a2a-bcdb-285a7f908cf3 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00373 | 2 | 21 | 이벤트 append | - |
| 04:43:31.619 | 20 | insert.file.ok | 416d5c44-4f0f-4a2a-bcdb-285a7f908cf3 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00373 | 2 | 21 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00373_02_20231010.json |
| 04:43:31.620 | 20 | insert.file.ok | 416d5c44-4f0f-4a2a-bcdb-285a7f908cf3 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00377 | 3 | 22 | 이벤트 append | - |
| 04:43:31.620 | 20 | insert.file.ok | 416d5c44-4f0f-4a2a-bcdb-285a7f908cf3 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00377 | 3 | 22 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00377_03_20231010.json |
| 04:43:31.621 | 20 | insert.file.ok | 416d5c44-4f0f-4a2a-bcdb-285a7f908cf3 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00381 | 2 | 24 | 이벤트 append | - |
| 04:43:31.621 | 20 | insert.file.ok | 416d5c44-4f0f-4a2a-bcdb-285a7f908cf3 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00380 | 2 | 23 | 이벤트 append | - |
| 04:43:31.621 | 20 | insert.file.ok | 416d5c44-4f0f-4a2a-bcdb-285a7f908cf3 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00380 | 2 | 23 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00380_02_20231010.json |
| 04:43:31.621 | 20 | insert.file.ok | 416d5c44-4f0f-4a2a-bcdb-285a7f908cf3 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00381 | 2 | 24 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00381_02_20231010.json |
| 04:43:31.622 | 20 | insert.file.ok | 416d5c44-4f0f-4a2a-bcdb-285a7f908cf3 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00387 | 2 | 25 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00387_02_20231010.json |
| 04:43:31.622 | 20 | insert.file.ok | 416d5c44-4f0f-4a2a-bcdb-285a7f908cf3 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00387 | 2 | 25 | 이벤트 append | - |
| 04:43:31.622 | 40 | insert.file.failed | 416d5c44-4f0f-4a2a-bcdb-285a7f908cf3 | - | - | - | toy-data 파일 적재 실패 ← 트립 앵커 | reason=[   {     "expected": "number",     "code": "invalid_type",     "path": [       "camera_info",       "camera_intrinsic_param",       "cody"     ],     "message": "Invalid input: expected number, received null"   } ] · file=반려동물용품_CR01_강아지공룡알장난감_02024_01_20230923.json |
| 04:43:31.623 | 30 | insert.batch.done | 416d5c44-4f0f-4a2a-bcdb-285a7f908cf3 | - | - | - | toy-data 적재 완료 | - |
| 04:43:31.623 | 40 | insert.file.failed | 416d5c44-4f0f-4a2a-bcdb-285a7f908cf3 | - | - | - | toy-data 파일 적재 실패 | reason=[   {     "expected": "number",     "code": "invalid_type",     "path": [       "camera_info",       "camera_intrinsic_param",       "fx"     ],     "message": "Invalid input: expected number, received null"   } ] · file=반려동물용품_CR01_강아지공룡알장난감_02025_01_20230923.json |
| 04:43:31.624 | 30 | - | 416d5c44-4f0f-4a2a-bcdb-285a7f908cf3 | - | - | - | request completed | - |
| 04:43:31.626 | 30 | projection.request | dd7cceb6-8ae4-4333-ae3d-417985652f76 | - | - | - | projection 요청 수신 | - |
| 04:43:31.628 | 30 | projection.start | dd7cceb6-8ae4-4333-ae3d-417985652f76 | - | - | - | catch-up 시작 | projector=multimodal-projector |
| 04:43:31.628 | 20 | - | dd7cceb6-8ae4-4333-ae3d-417985652f76 | - | - | - | 커서 조회 | projector=multimodal-projector |
| 04:43:31.629 | 20 | - | dd7cceb6-8ae4-4333-ae3d-417985652f76 | - | - | - | 이벤트 조회 | - |
| 04:43:31.629 | 20 | projection.event.mapped | dd7cceb6-8ae4-4333-ae3d-417985652f76 | - | 3 | 1 | 이벤트 매핑 | projector=multimodal-projector |
| 04:43:31.631 | 20 | projection.event.mapped | dd7cceb6-8ae4-4333-ae3d-417985652f76 | - | 3 | 2 | 이벤트 매핑 | projector=multimodal-projector |

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
- (level 40, `insert.file.failed`) toy-data 파일 적재 실패 ← 트립 앵커 → 원천 JSON 파일의 필수 필드(cody) 누락/타입 위반(null)으로 Zod 검증에 거절됨. [corr:416d5c44-4f0f-4a2a-bcdb-285a7f908cf3] [corr:416d5c44-4f0f-4a2a-bcdb-285a7f908cf3]
- (level 40, `insert.file.failed`) toy-data 파일 적재 실패 → 원천 JSON 파일의 필수 필드(fx) 누락/타입 위반(null)으로 Zod 검증에 거절됨. [corr:416d5c44-4f0f-4a2a-bcdb-285a7f908cf3] [corr:416d5c44-4f0f-4a2a-bcdb-285a7f908cf3]
- toyDataSchema에서 camera_info.camera_intrinsic_param.cody와 fx는 .nullable() 또는 .default()가 누락되어 strict number 검증이 강제됨. [corr:416d5c44-4f0f-4a2a-bcdb-285a7f908cf3]
- 적재 로직의 파일 단위 try/catch 실패로, 거절된 payload는 event_store에 미유입되며 성공 파일은 정상 append 후 projection 진행됨. [corr:416d5c44-4f0f-4a2a-bcdb-285a7f908cf3]
- Read Model(read_grip_result, read_multimodal) 구조는 정합하나, Zod 거절로 인한 원천 데이터 결함이 시스템의 의도된 방어 동작이 유발됨. [corr:416d5c44-4f0f-4a2a-bcdb-285a7f908cf3]

### Decision Drivers
- 원천 데이터 품질 보장 (Zod 엄격한 검증 유지)
- 시스템 무해화 원칙 (거절 유지 + 원천 수정 요청)
- 추적 가시성 (무유입 검증 절차)
- 운영 부하 최소화 (기각 대안 배제)

### Considered Options
#### 거절 유지 + 원천 데이터 수정 요청
- 접근: toyDataSchema Zod 검증 스키마 미수전, insert.service.ts 파일 단위 실패 로직 그대로 유지.
- 제안 필드: toyDataSchema.cody, toyDataSchema.fx
- 트레이드오프: 재투영/리스크 0, 운영 부하 최소, 단 외부 데이터 수정 요청 워크플로 필요.
```typescript
// cody: z.number(), fx: z.number() (유지 현 strict)
```

#### 무유입 검증 절차
- 접근: event_store 조회를 실패 파일의 미존재 확인.
- 제안 필드: event_store.stream_id, event_store.attempt_num
- 트레이드오프: DB 조회 오버헤드 발생, 정합성 확인만 제공.
```typescript
SELECT count(*) FROM event_store WHERE stream_id = 'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02024' AND attempt_num = 1; -- 기대값 0
```

#### 거절 모니터링/알림 보강
- 접근: insert.file.failed 로그 패턴 감지 시 downstream alert trigger.
- 제안 필드: log.insert.file.failed
- 트레이드오프: 알림 시스템 연동 필요, 원천 데이터 자체는 미수정.
```typescript
// log.monitor('insert.file.failed') -> triggerAlert()
```

### Decision Outcome
거절 유지 + 원천 데이터 수정 요청

### Consequences
- (+) Read Model 무해화 원칙 준수
- (+) Zod 엄격한 검증으로 원천 품질 보장
- (−) 외원 데이터 수정 워크플로 필요
- (−) 수동 알림/모니터링 연동 추가

### Non-Goals
- Zod 스키마 완화(optional 화)
- Default 값 주입으로 적재 통과
- 신규 추적용 테이블 생성

## 2. Read Model 생성 SQL (Read Model DDL)

> 실행 게이트: 아래 변경은 인간 승인 후에만 적용한다 (human-in-the-loop).

### 격리(containment) SQL — 신규 Read Model DDL 불필요, 결함 데이터 무해화가 조치다

```sql
-- 무유입 검증: zod 거절된 파일의 이벤트가 event_store 에 유입되지 않았음을 확인한다 (기대값 0)
SELECT count(*) AS rejected_event_count FROM event_store WHERE (stream_id, attempt_num) IN (('grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02024', 1), ('grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02025', 1));
```

## 3. API Versioning

### 버전 영향

변 변경 없음. Zod 검증 스키마(toyDataSchema)와 적재 로직(insert.service.ts 패턴)이 그대로 유지하며, Read Model 구조/엔드포인트가 무변.

## Guardrails (constraints)

- v1 자산(테이블/엔드포인트/프로젝터 name) 무손상
- PK (scene_key, attempt_num) 유지
- TypeScript any 금지
- 식별자 전체 단어
- DDL 실행·API 컷오버는 인간 승인 후에만 (human-in-the-loop)
- Read Model 테이블명은 read_ 접두 스네이크 케이스
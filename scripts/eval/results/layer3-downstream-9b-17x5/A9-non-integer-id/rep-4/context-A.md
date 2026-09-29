---
docId: analysis-c3ed0664-1205-4435-a0c6-21507e8db831
generatedAt: 2026-08-14T12:21:09.857Z
targetReadModel: read_grip_result
sqlDialect: postgres
sufficientEvidence: true
apiVersion:
  from: null
  to: null
  affectedEndpoints: []
evidenceSources:
  - { origin: developer-logging, anchorId: "c3ed0664-1205-4435-a0c6-21507e8db831" }
constraints:
  - "v1 자산(테이블/엔드포인트/프로젝터 name) 무손상"
  - "PK (scene_key, attempt_num) 유지"
  - "TypeScript any 금지"
  - "식별자 전체 단어"
  - "DDL 실행·API 컷오버는 인간 승인 후에만 (human-in-the-loop)"
  - "Read Model 테이블명은 read_ 접두 스네이크 케이스"
---

# Self-Adaptive CQRS Docs — read_grip_result

> 결론(TL;DR): `read_grip_result`을(를) 보강한다 — toy-data 적재 요청 중 2건의 payload 필드(int vs number 타입 불일치) Zod 검증 거절. 파일 단위 try/catch 전략으로 실패 파일은 event_store 미-append, 나머지 배치는 정상 완료 및 투영 이어짐. (이상 유형: 요청 충족 실패 · 심각도: warning)

<logging_context>

## 이상 로그 맥락 (±N 윈도우)
> 빈도: 최근 1h — `insert.request`(level 30) 1회, `insert.file.failed`(level 40) 1회, `insert.batch.start`(level 30) 1회, `log.delete.request`(level 30) 1회, `log.delete.done`(level 30) 1회, `insert.file.ok`(level 20) 50회, `-`(level 30) 1회.

| time | level | action | correlation_id | stream_id | attempt | global_seq | msg | detail |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 12:21:01.992 | 30 | insert.request | c3ed0664-1205-4435-a0c6-21507e8db831 | - | - | - | Insert Event Store 요청 수신 | - |
| 12:21:01.992 | 30 | insert.batch.start | c3ed0664-1205-4435-a0c6-21507e8db831 | - | - | - | Toy-Data 적재 시작 | - |
| 12:21:02.004 | 20 | insert.file.ok | c3ed0664-1205-4435-a0c6-21507e8db831 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00258 | 2 | 1 | 이벤트 append | - |
| 12:21:02.004 | 20 | insert.file.ok | c3ed0664-1205-4435-a0c6-21507e8db831 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00258 | 2 | 1 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00258_02_20230923.json |
| 12:21:02.005 | 20 | insert.file.ok | c3ed0664-1205-4435-a0c6-21507e8db831 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00262 | 2 | 2 | 이벤트 append | - |
| 12:21:02.005 | 20 | insert.file.ok | c3ed0664-1205-4435-a0c6-21507e8db831 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00262 | 2 | 2 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00262_02_20230923.json |
| 12:21:02.006 | 20 | insert.file.ok | c3ed0664-1205-4435-a0c6-21507e8db831 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00262 | 3 | 3 | 이벤트 append | - |
| 12:21:02.006 | 20 | insert.file.ok | c3ed0664-1205-4435-a0c6-21507e8db831 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00262 | 3 | 3 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00262_03_20230923.json |
| 12:21:02.007 | 20 | insert.file.ok | c3ed0664-1205-4435-a0c6-21507e8db831 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00263 | 2 | 4 | 이벤트 append | - |
| 12:21:02.007 | 20 | insert.file.ok | c3ed0664-1205-4435-a0c6-21507e8db831 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00263 | 2 | 4 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00263_02_20230923.json |
| 12:21:02.008 | 20 | insert.file.ok | c3ed0664-1205-4435-a0c6-21507e8db831 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00267 | 1 | 5 | 이벤트 append | - |
| 12:21:02.008 | 20 | insert.file.ok | c3ed0664-1205-4435-a0c6-21507e8db831 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00267 | 1 | 5 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00267_01_20230923.json |
| 12:21:02.009 | 20 | insert.file.ok | c3ed0664-1205-4435-a0c6-21507e8db831 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00269 | 2 | 6 | 이벤트 append | - |
| 12:21:02.009 | 20 | insert.file.ok | c3ed0664-1205-4435-a0c6-21507e8db831 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00269 | 2 | 6 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00269_02_20230923.json |
| 12:21:02.010 | 20 | insert.file.ok | c3ed0664-1205-4435-a0c6-21507e8db831 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00275 | 1 | 7 | 이벤트 append | - |
| 12:21:02.010 | 20 | insert.file.ok | c3ed0664-1205-4435-a0c6-21507e8db831 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00275 | 1 | 7 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00275_01_20230923.json |
| 12:21:02.011 | 20 | insert.file.ok | c3ed0664-1205-4435-a0c6-21507e8db831 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00275 | 3 | 8 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00275_03_20230923.json |
| 12:21:02.011 | 20 | insert.file.ok | c3ed0664-1205-4435-a0c6-21507e8db831 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00275 | 3 | 8 | 이벤트 append | - |
| 12:21:02.012 | 20 | insert.file.ok | c3ed0664-1205-4435-a0c6-21507e8db831 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00278 | 3 | 9 | 이벤트 append | - |
| 12:21:02.012 | 20 | insert.file.ok | c3ed0664-1205-4435-a0c6-21507e8db831 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00278 | 3 | 9 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00278_03_20230923.json |
| 12:21:02.013 | 20 | insert.file.ok | c3ed0664-1205-4435-a0c6-21507e8db831 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00280 | 1 | 10 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00280_01_20230923.json |
| 12:21:02.013 | 20 | insert.file.ok | c3ed0664-1205-4435-a0c6-21507e8db831 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00280 | 1 | 10 | 이벤트 append | - |
| 12:21:02.014 | 20 | insert.file.ok | c3ed0664-1205-4435-a0c6-21507e8db831 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00281 | 1 | 11 | 이벤트 append | - |
| 12:21:02.014 | 20 | insert.file.ok | c3ed0664-1205-4435-a0c6-21507e8db831 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00281 | 1 | 11 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00281_01_20230923.json |
| 12:21:02.015 | 20 | insert.file.ok | c3ed0664-1205-4435-a0c6-21507e8db831 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00287 | 3 | 13 | 이벤트 append | - |
| 12:21:02.015 | 20 | insert.file.ok | c3ed0664-1205-4435-a0c6-21507e8db831 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00286 | 3 | 12 | 이벤트 append | - |
| 12:21:02.015 | 20 | insert.file.ok | c3ed0664-1205-4435-a0c6-21507e8db831 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00286 | 3 | 12 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00286_03_20230923.json |
| 12:21:02.015 | 20 | insert.file.ok | c3ed0664-1205-4435-a0c6-21507e8db831 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00287 | 3 | 13 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00287_03_20230923.json |
| 12:21:02.016 | 20 | insert.file.ok | c3ed0664-1205-4435-a0c6-21507e8db831 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00291 | 3 | 14 | 이벤트 append | - |
| 12:21:02.016 | 20 | insert.file.ok | c3ed0664-1205-4435-a0c6-21507e8db831 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00291 | 3 | 14 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00291_03_20230923.json |
| 12:21:02.017 | 20 | insert.file.ok | c3ed0664-1205-4435-a0c6-21507e8db831 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00295 | 1 | 15 | 이벤트 append | - |
| 12:21:02.017 | 20 | insert.file.ok | c3ed0664-1205-4435-a0c6-21507e8db831 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00295 | 1 | 15 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00295_01_20230923.json |
| 12:21:02.018 | 20 | insert.file.ok | c3ed0664-1205-4435-a0c6-21507e8db831 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00297 | 3 | 16 | 이벤트 append | - |
| 12:21:02.018 | 20 | insert.file.ok | c3ed0664-1205-4435-a0c6-21507e8db831 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00297 | 3 | 16 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00297_03_20230923.json |
| 12:21:02.019 | 20 | insert.file.ok | c3ed0664-1205-4435-a0c6-21507e8db831 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00301 | 3 | 17 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00301_03_20230923.json |
| 12:21:02.019 | 20 | insert.file.ok | c3ed0664-1205-4435-a0c6-21507e8db831 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00302 | 2 | 18 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00302_02_20230923.json |
| 12:21:02.019 | 20 | insert.file.ok | c3ed0664-1205-4435-a0c6-21507e8db831 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00301 | 3 | 17 | 이벤트 append | - |
| 12:21:02.019 | 20 | insert.file.ok | c3ed0664-1205-4435-a0c6-21507e8db831 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00302 | 2 | 18 | 이벤트 append | - |
| 12:21:02.020 | 20 | insert.file.ok | c3ed0664-1205-4435-a0c6-21507e8db831 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00304 | 2 | 19 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00304_02_20230923.json |
| 12:21:02.020 | 20 | insert.file.ok | c3ed0664-1205-4435-a0c6-21507e8db831 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00304 | 2 | 19 | 이벤트 append | - |
| 12:21:02.021 | 20 | insert.file.ok | c3ed0664-1205-4435-a0c6-21507e8db831 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00304 | 3 | 20 | 이벤트 append | - |
| 12:21:02.021 | 20 | insert.file.ok | c3ed0664-1205-4435-a0c6-21507e8db831 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00304 | 3 | 20 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00304_03_20230923.json |
| 12:21:02.022 | 20 | insert.file.ok | c3ed0664-1205-4435-a0c6-21507e8db831 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00317 | 2 | 22 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00317_02_20230923.json |
| 12:21:02.022 | 20 | insert.file.ok | c3ed0664-1205-4435-a0c6-21507e8db831 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00308 | 1 | 21 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00308_01_20230923.json |
| 12:21:02.022 | 20 | insert.file.ok | c3ed0664-1205-4435-a0c6-21507e8db831 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00317 | 2 | 22 | 이벤트 append | - |
| 12:21:02.022 | 20 | insert.file.ok | c3ed0664-1205-4435-a0c6-21507e8db831 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00308 | 1 | 21 | 이벤트 append | - |
| 12:21:02.023 | 20 | insert.file.ok | c3ed0664-1205-4435-a0c6-21507e8db831 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00320 | 1 | 23 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00320_01_20230923.json |
| 12:21:02.023 | 20 | insert.file.ok | c3ed0664-1205-4435-a0c6-21507e8db831 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00320 | 1 | 23 | 이벤트 append | - |
| 12:21:02.024 | 20 | insert.file.ok | c3ed0664-1205-4435-a0c6-21507e8db831 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00323 | 1 | 24 | 이벤트 append | - |
| 12:21:02.024 | 20 | insert.file.ok | c3ed0664-1205-4435-a0c6-21507e8db831 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00327 | 3 | 25 | 이벤트 append | - |
| 12:21:02.024 | 20 | insert.file.ok | c3ed0664-1205-4435-a0c6-21507e8db831 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00323 | 1 | 24 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00323_01_20230923.json |
| 12:21:02.025 | 40 | insert.file.failed | c3ed0664-1205-4435-a0c6-21507e8db831 | - | - | - | toy-data 파일 적재 실패 ← 트립 앵커 | reason=[   {     "expected": "int",     "format": "safeint",     "code": "invalid_type",     "path": [       "objects",       0,       "id"     ],     "message": "Invalid input: expected int, received number"   } ] · file=반려동물용품_CR01_강아지공룡알장난감_02022_01_20230923.json |
| 12:21:02.025 | 20 | insert.file.ok | c3ed0664-1205-4435-a0c6-21507e8db831 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00327 | 3 | 25 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00327_03_20230923.json |
| 12:21:02.026 | 30 | - | c3ed0664-1205-4435-a0c6-21507e8db831 | - | - | - | request completed | - |
| 12:21:02.026 | 30 | insert.batch.done | c3ed0664-1205-4435-a0c6-21507e8db831 | - | - | - | toy-data 적재 완료 | - |
| 12:21:02.026 | 40 | insert.file.failed | c3ed0664-1205-4435-a0c6-21507e8db831 | - | - | - | toy-data 파일 적재 실패 | reason=[   {     "expected": "int",     "format": "safeint",     "code": "invalid_type",     "path": [       "human_annotation_grasp",       0,       "num_keypoints"     ],     "message": "Invalid input: expected int, received number"   } ] · file=반려동물용품_CR01_강아지공룡알장난감_02023_01_20230923.json |
| 12:21:02.029 | 30 | projection.request | a84f616b-87fb-46c8-a503-da4210a76c6e | - | - | - | projection 요청 수신 | - |
| 12:21:02.031 | 30 | projection.start | a84f616b-87fb-46c8-a503-da4210a76c6e | - | - | - | catch-up 시작 | projector=multimodal-projector |
| 12:21:02.031 | 20 | - | a84f616b-87fb-46c8-a503-da4210a76c6e | - | - | - | 커서 조회 | projector=multimodal-projector |
| 12:21:02.033 | 20 | - | a84f616b-87fb-46c8-a503-da4210a76c6e | - | - | - | 이벤트 조회 | - |
| 12:21:02.033 | 20 | projection.event.mapped | a84f616b-87fb-46c8-a503-da4210a76c6e | - | 2 | 1 | 이벤트 매핑 | projector=multimodal-projector |
| 12:21:02.035 | 20 | projection.event.mapped | a84f616b-87fb-46c8-a503-da4210a76c6e | - | 2 | 2 | 이벤트 매핑 | projector=multimodal-projector |

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
- (level 40, `insert.file.failed`) toy-data 파일 적재 실패 ← 트립 앵커 → Zod 검증(id) 거절로 원천 파일의 필드 타입(int vs number) 불일치/필수 필드 누락이 드러남. Read Model 구조는 무관. [corr:c3ed0664-1205-4435-a0c6-21507e8db831]
- (level 40, `insert.file.failed`) toy-data 파일 적재 실패 → Zod 검증(num_keypoints) 거절로 원천 파일의 필드 타입(int vs number) 불일치/필수 필드 누락이 드러남. Read Model 구조는 무관. [corr:c3ed0664-1205-4435-a0c6-21507e8db831]
- src/insert/dto/toy-data.dto.ts 의 objects[].id 와 human_annotation_grasp[].num_keypoints 정의가 z.number().int() 로 엄격히 정수 타입을 요구한다.
- GripAttemptRecorded Insight 카드의 objects[].id:number 및 human_annotation_grasp[].num_keypoints:number 는 Read Model 의 재료가 아닌 원천 payload 의 스키마 정의이므로, Zod 거절은 적재 단계 차단 동작이다.
- GripResultProjector.map() 호출 시 toyDataSchema.parse() 가 실패하면 에러가 throw 되어 event_store append 가 중단되어 Read Model(read_grip_result, read_multimodal) 투영에는 관여하지 않는다.
- image2dUri/videoUri 의 null 상태는 MultiModalProjector.map() 의 초기 설계 관행이며 이번 실패와 무관한 구조적 결함이다.

### Decision Drivers
- 원천 데이터 정성화 보장 (Zod 거절은 시스템 의도된 방어)
- 적재(Ingestion) 와 투영(Projection) boundary 명확히 분리
- Read Model 스키마/엔드포인트 무변 유지

### Considered Options
#### 원천 데이터 정성화 요청 (권장)
- 접근: Zod .int() 엄격함 유지, 실패 파일 목록 모니터링/alert 보강
- 제안 필드: failedFileList, alertChannel
- 트레이드오프: DB 부하 0, 원천 수정 필요
```typescript
if (failedFiles.length > 0) logger.warn({ action: LogAction.FILE_REJECTED }, 'Zod 검증 거절: 원천 payload 타입(int vs number) 불일치 발생. 파일 목록 [' + failedFiles.join(', ') + '] 에 대한 필드(id, num_keypoints) 정수 변환 요청.');
```

#### 무유입 검증 절차
- 접근: batch 완료 후 event_store 조회로 미투영 확인
- 제안 필드: uninsertedCount
- 트레이드오프: DB round-trip 추가, 일관성 보장
```typescript
const uninserted = await db.runQuery('SELECT count(*) FROM event_store WHERE stream_id IN ('grip-attempt:02022', 'grip-attempt:02023') AND attempt_num = 1;');
```

### Decision Outcome
원천 데이터 정성화 요청 (권장)

### Consequences
- (+) Projection pipeline 무중장 유지
- (+) Zod 엄격함 검증으로 Read Model 오염 차단
- (−) 해당 scene_key(attempt 01) 의 Read Model 투영 공백 발생
- (−) 외부 데이터 파이프라인 수정 지연 가능

### Non-Goals
- Read Model 컬럼 추가/수식
- Zod coerce/defaults 주입
- projector map 로직 변경

## 2. Read Model 생성 SQL (Read Model DDL)

> 실행 게이트: 아래 변경은 인간 승인 후에만 적용한다 (human-in-the-loop).

### 격리(containment) SQL — 신규 Read Model DDL 불필요, 결함 데이터 무해화가 조치다

```sql
-- 무유입 검증: zod 거절된 파일의 이벤트가 event_store 에 유입되지 않았음을 확인한다 (기대값 0)
SELECT count(*) AS rejected_event_count FROM event_store WHERE (stream_id, attempt_num) IN (('grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02022', 1), ('grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02023', 1));
```

## 3. API Versioning

### 버전 영향

변 변경 없음. Zod 검증 스키마(toy-data.dto.ts) 와 Read Model 정시(read_grip_result, read_multimodal) 가 그대로 유지되며, 적재 거절 관행은 기존 시스템 의도된 방어 동작이므로 API 엔드포인트/스펙트 무변.

## Guardrails (constraints)

- v1 자산(테이블/엔드포인트/프로젝터 name) 무손상
- PK (scene_key, attempt_num) 유지
- TypeScript any 금지
- 식별자 전체 단어
- DDL 실행·API 컷오버는 인간 승인 후에만 (human-in-the-loop)
- Read Model 테이블명은 read_ 접두 스네이크 케이스
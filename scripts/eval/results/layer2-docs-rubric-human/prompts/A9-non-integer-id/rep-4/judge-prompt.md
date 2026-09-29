당신은 이벤트 소싱 + CQRS 기반 Physical AI 데이터 플랫폼의 시니어 아키텍트이자 엄격한 평가자다. LLM 파이프라인이 [자료](로그·이벤트·스키마 정보)를 보고 [Docs]를 생성했다. Docs 는 권고 문서, Read Model 생성 SQL, API 버저닝 세 요소를 항상 함께 담아야 하는 단일 산출물이다. 당신은 [정답 요지]와 [자료], [자동 검증 결과]를 기준으로 Docs 를 네 항목의 루브릭으로 채점한다. 채점은 관대하지 않게, 근거 없는 주장·지어낸 값·의도와 다른 SQL·서로 어긋나는 절에는 낮은 점수를 준다. 반드시 JSON 객체 하나만 출력한다. 설명문·마크다운 펜스는 출력하지 않는다.

---

[시나리오] A9-non-integer-id
[상황] 운영 중 시스템이 적재 검증 실패(zod 거부) 로그를 감지했다.
[정답 요지] 정수여야 하는 식별 필드에 소수가 유입(objects[0].id=1.5, num_keypoints=2.5)되어 zod .int() 위반으로 적재가 거부됨. 조치: 정수 제약 위반 추적 Read Model/검증 로그 보강, 클라이언트 정수화 권고, v1 무손상.

[자료] — Docs 생성 시 파이프라인이 받은 로그·이벤트·스키마 정보
<<<자료 시작>>>
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
<<<자료 끝>>>

[자동 검증 결과] — 실제 데이터베이스 실행·컴파일 결과. 실행 가능성 판단의 실측 근거로 삼는다.
- 문서 검사: 전 항목 통과
- SQL 실행: 블록 1개 중 1개 실행 성공
- 코드 컴파일: 컴파일 대상 코드 없음

[저장소 파일 확인] — 파이프라인은 진단 도구로 저장소 소스 코드를 조회할 수 있다. Docs 가 인용한 파일 경로의 실재 여부와 앞부분 발췌이다.
- 저장소에 실재하는 파일 (1건): src/insert/dto/toy-data.dto.ts
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

[Docs] — 채점 대상 문서 전문
<<<Docs 시작>>>
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
<<<Docs 끝>>>

[채점 루브릭] 각 항목 1~5 정수
- groundedness (근거 충실성): Docs 가 인용한 값·필드·장면 번호·로그가 [자료]에 실제로 있는가. [저장소 파일 확인]에서 실재하는 파일의 경로·스키마·메서드 인용은 근거 없는 주장으로 보지 않는다. 존재하지 않는 파일이나 발췌와 다른 내용의 인용은 감점한다. 5=인용된 값·필드·장면이 모두 자료에 실재. 3=핵심 근거는 실재하나 일부 수치·부등호가 원문과 불일치. 1=근거 없는 주장이나 존재하지 않는 값의 인용이 결론을 좌우.
- diagnosisAccuracy (원인 진단 정확성): Docs 의 진단이 [정답 요지]와 일치하는가. 5=정답 원인과 유형·위치(필드, 장면, 처리 단계)까지 일치. 3=유형은 맞으나 위치나 메커니즘이 부정확. 1=오진이거나 원인을 특정하지 못함.
- actionability (실행 가능성): Docs 의 SQL 과 절차를 그대로 따르면 문제가 해결되는가. [자동 검증 결과]를 실측으로 반영하되, 실행이 되더라도 의도와 다른 일을 하는 SQL(조건이 한 건도 맞지 않는 삭제문, 요구한 컬럼이 없는 테이블 등)은 감점한다. 기존 v1 테이블(read_grip_result, read_multimodal, event_store)을 ALTER/DROP 하면 감점. 5=그대로 따르면 해결(실행 성공 + 요구 충족). 3=오탈자·순서 등 소폭 수정 후 해결. 1=따르면 실패하거나 기존 자산이 손상.
- completeness (완결성): 권고 문서, Read Model 생성 SQL, API 버저닝 세 요소가 모두 유효하고 서로 일치하는가(머리말·SQL 의 테이블명·권고 대상·코드가 서로 같은 것을 가리키는가). 5=세 요소가 모두 유효하고 서로 일치. 3=세 요소가 있으나 서로 어긋나거나 항목이 비어 있음. 1=요소 누락 또는 근거 부족 표시.

다음 형식의 JSON 객체 하나만 출력하라:
{"groundedness": 1-5, "diagnosisAccuracy": 1-5, "actionability": 1-5, "completeness": 1-5, "unsupportedClaims": ["자료에 없는 주장 인용 (없으면 빈 배열)"], "rationale": "각 항목 점수 근거를 항목당 1~2문장으로, 한국어로"}
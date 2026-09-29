당신은 이벤트 소싱 + CQRS 기반 Physical AI 데이터 플랫폼의 시니어 아키텍트이자 엄격한 평가자다. LLM 파이프라인이 [자료](로그·이벤트·스키마 정보)를 보고 [Docs]를 생성했다. Docs 는 권고 문서, Read Model 생성 SQL, API 버저닝 세 요소를 항상 함께 담아야 하는 단일 산출물이다. 당신은 [정답 요지]와 [자료], [자동 검증 결과]를 기준으로 Docs 를 네 항목의 루브릭으로 채점한다. 채점은 관대하지 않게, 근거 없는 주장·지어낸 값·의도와 다른 SQL·서로 어긋나는 절에는 낮은 점수를 준다. 반드시 JSON 객체 하나만 출력한다. 설명문·마크다운 펜스는 출력하지 않는다.

---

[시나리오] A10-null-intrinsic-param
[상황] 운영 중 시스템이 적재 검증 실패(zod 거부) 로그를 감지했다.
[정답 요지] 카메라 내부 파라미터(cody, fx)에 null 이 유입되어 zod 검증에 걸려 거부됨(codx 만 nullable 인 스키마 비대칭). 조치: null 유입 추적 Read Model/검증 로그 보강, 스키마 비대칭 정리 권고, v1 무손상.

[자료] — Docs 생성 시 파이프라인이 받은 로그·이벤트·스키마 정보
<<<자료 시작>>>
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
<<<Docs 끝>>>

[채점 루브릭] 각 항목 1~5 정수
- groundedness (근거 충실성): Docs 가 인용한 값·필드·장면 번호·로그가 [자료]에 실제로 있는가. [저장소 파일 확인]에서 실재하는 파일의 경로·스키마·메서드 인용은 근거 없는 주장으로 보지 않는다. 존재하지 않는 파일이나 발췌와 다른 내용의 인용은 감점한다. 5=인용된 값·필드·장면이 모두 자료에 실재. 3=핵심 근거는 실재하나 일부 수치·부등호가 원문과 불일치. 1=근거 없는 주장이나 존재하지 않는 값의 인용이 결론을 좌우.
- diagnosisAccuracy (원인 진단 정확성): Docs 의 진단이 [정답 요지]와 일치하는가. 5=정답 원인과 유형·위치(필드, 장면, 처리 단계)까지 일치. 3=유형은 맞으나 위치나 메커니즘이 부정확. 1=오진이거나 원인을 특정하지 못함.
- actionability (실행 가능성): Docs 의 SQL 과 절차를 그대로 따르면 문제가 해결되는가. [자동 검증 결과]를 실측으로 반영하되, 실행이 되더라도 의도와 다른 일을 하는 SQL(조건이 한 건도 맞지 않는 삭제문, 요구한 컬럼이 없는 테이블 등)은 감점한다. 기존 v1 테이블(read_grip_result, read_multimodal, event_store)을 ALTER/DROP 하면 감점. 5=그대로 따르면 해결(실행 성공 + 요구 충족). 3=오탈자·순서 등 소폭 수정 후 해결. 1=따르면 실패하거나 기존 자산이 손상.
- completeness (완결성): 권고 문서, Read Model 생성 SQL, API 버저닝 세 요소가 모두 유효하고 서로 일치하는가(머리말·SQL 의 테이블명·권고 대상·코드가 서로 같은 것을 가리키는가). 5=세 요소가 모두 유효하고 서로 일치. 3=세 요소가 있으나 서로 어긋나거나 항목이 비어 있음. 1=요소 누락 또는 근거 부족 표시.

다음 형식의 JSON 객체 하나만 출력하라:
{"groundedness": 1-5, "diagnosisAccuracy": 1-5, "actionability": 1-5, "completeness": 1-5, "unsupportedClaims": ["자료에 없는 주장 인용 (없으면 빈 배열)"], "rationale": "각 항목 점수 근거를 항목당 1~2문장으로, 한국어로"}
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
<<<자료 끝>>>

[자동 검증 결과] — 실제 데이터베이스 실행·컴파일 결과. 실행 가능성 판단의 실측 근거로 삼는다.
- 문서 검사: 전 항목 통과
- SQL 실행: 블록 1개 중 1개 실행 성공
- 코드 컴파일: 컴파일 대상 코드 없음

[저장소 파일 확인] — 파이프라인은 진단 도구로 저장소 소스 코드를 조회할 수 있다. Docs 가 인용한 파일 경로의 실재 여부와 앞부분 발췌이다.
- 저장소에 실재하는 파일 (5건): src/insert/dto/toy-data.dto.ts, src/projection/projector/multimodal.projector.ts, src/projection/repository/event-store-reader.repository.ts, src/shared/database/schema/service/read-multimodal.ts, src/shared/logger/logging-context.ts
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

<<<src/projection/projector/multimodal.projector.ts 앞부분 80행>>>
import { Injectable } from '@nestjs/common';
import { InferInsertModel } from 'drizzle-orm';
import { PinoLogger } from 'nestjs-pino';
import { ToyDataDto, toyDataSchema } from '@/insert/dto/toy-data.dto';
import { IntegrityViolation, Projector } from '@/projection/projector/projector';
import { DrizzleTx } from '@/shared/database/drizzle.provider';
import { readMultimodal } from '@/shared/database/schema';
import { LogAction, LogContext } from '@/shared/logger/logging-context';
import { EventStoreEventRow } from '../repository/event-store-reader.repository';

type ReadMultimodalInsert = InferInsertModel<typeof readMultimodal>;

// 모달 파일명(2D/video 등)에서 scene(5자리)·attempt(2자리)를 확장자 불문으로 뽑는다.
// 예: ..._00001_01_20230923.jpg → { sceneNum: "00001", attemptNum: 1 }
const MODAL_FILE_NAME_RE: RegExp = /_(\d{5})_(\d{2})_\d{8}\.[A-Za-z0-9]+$/;

// scene_key 는 ..._{sceneNum} 로 끝난다(파서 규칙). 끝의 5자리를 권위 있는 scene 으로 본다.
const SCENE_KEY_NUM_RE: RegExp = /_(\d{5})$/;

type ParsedModalFileName = {
  sceneNum: string;
  attemptNum: number;
};

function parseModalFileName(fileName: string): ParsedModalFileName | null {
  const matched = MODAL_FILE_NAME_RE.exec(fileName);

  if (matched === null) {
    return null;
  }

  return { sceneNum: matched[1], attemptNum: Number(matched[2]) };
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

@Injectable()
export class MultiModalProjector implements Projector<ReadMultimodalInsert> {
  readonly name: string = "multimodal-projector";

  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(MultiModalProjector.name);
  }

  map(event: EventStoreEventRow): ReadMultimodalInsert {
    let payload: ToyDataDto;
    try {
      payload = toyDataSchema.parse(event.payload);
    } catch (err) {
      this.logger.error(
        {
          action: LogAction.MAP_FAILED,
          err,
          [LogContext.EVENT_ID]: event.eventId,
          [LogContext.STREAM_ID]: event.streamId,
          [LogContext.ATTEMPT_NUM]: event.attemptNum,
          [LogContext.GLOBAL_SEQ]: event.globalSeq,
        },
        "이벤트 매핑(검증) 실패",
      );

      throw err;
    }

    this.logger.debug(
      {
        action: LogAction.EVENT_MAPPED,
        [LogContext.PROJECTOR_NAME]: this.name,
        [LogContext.SCENE_KEY]: event.streamId.replace(/^grip-attempt:/, ""),
        [LogContext.ATTEMPT_NUM]: event.attemptNum,
        [LogContext.GLOBAL_SEQ]: event.globalSeq,
      },
      "이벤트 매핑",
    );

    return {
      sceneKey: event.streamId.replace(/^grip-attempt:/, ""),
      attemptNum: event.attemptNum,
<<<발췌 끝>>>

<<<src/projection/repository/event-store-reader.repository.ts 앞부분 80행>>>
export type EventStoreEventRow = {
  globalSeq: number;
  eventId: string;
  streamId: string;
  attemptNum: number;
  eventType: string;
  occurredAt: Date;
  recordedAt: Date;
  payload: unknown;
};

export interface EventStoreReaderRepository {
  fetchAfter(lastSeq: number, limit: number): Promise<EventStoreEventRow[]>;
}

export const EVENT_STORE_READER: unique symbol = Symbol("EVENT_STORE_READER");

<<<발췌 끝>>>

<<<src/shared/database/schema/service/read-multimodal.ts 앞부분 80행>>>
import { bigint, pgTable, primaryKey, smallint, text, timestamp, varchar } from 'drizzle-orm/pg-core';

export const readMultimodal = pgTable(
  "read_multimodal",
  {
    sceneKey: varchar("scene_key").notNull(),
    attemptNum: smallint("attempt_num").notNull(),

    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),

    image2dFileName: varchar("image_2d_file_name"),
    image2dUri: text("image_2d_uri"),

    videoFileName: varchar("video_file_name"),
    videoUri: text("video_uri"),

    streamId: varchar("stream_id").notNull(),
    globalSeq: bigint("global_seq", { mode: "number" }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.sceneKey, t.attemptNum] })],
);

<<<발췌 끝>>>

<<<src/shared/logger/logging-context.ts 앞부분 80행>>>
export const LogContext = {
  EVENT_ID: "eventId",
  STREAM_ID: "streamId",
  ATTEMPT_NUM: "attemptNum",
  GLOBAL_SEQ: "globalSeq",
  EVENT_TYPE: "eventType",

  CORRELATION_ID: "correlationId",
  PROJECTOR_NAME: "projectorName",

  // projection 정합성 위반(제네릭 이상 방출)
  READ_MODEL_NAME: "readModelName",
  RULE_NAME: "ruleName",
  AFFECTED_COLUMNS: "affectedColumns",
  OBSERVED_VALUE: "observedValue",
  EXPECTED: "expected",

  SCENE_KEY: "sceneKey",
  OBJECT_NAME: "objectName",

  ACTION: "action",
  DURATION_MS: "durationMs",
  FILE: "file",
  TOTAL_FILES: "totalFiles",
  INSERTED: "inserted",
  SKIPPED: "skipped",
  FAILED: "failed",
  BATCH_FETCHED: "batchFetched",
  FROM_SEQ: "fromSeq",
  TO_SEQ: "toSeq",
  PROCESSED: "processed",
  REASON: "reason",
  ROUTE: "route",
  INDEX: "index",

  // log-collector
  SOURCE_FILE: "sourceFile",
  BYTE_OFFSET: "byteOffset",
  FROM_OFFSET: "fromOffset",
  TO_OFFSET: "toOffset",
  LINE_COUNT: "lineCount",
  INGESTED: "ingested",
  LINE: "line",
  COUNT: "count",

  // insight read
  ENTITY_NAME: "entityName",
  ENTITY_COUNT: "entityCount",
  RENDERED_COUNT: "renderedCount",

  // 드리프트 관측기
  NEW_KEYS: "newKeys",
  MISSING_CARD_TABLES: "missingCardTables",

  // sensor-observer 관찰 판정(윈도우 단위 채점·귀속용)
  OFFENDING_SCENE_KEYS: "offendingSceneKeys",
  BATCH_SCENE_KEYS: "batchSceneKeys",

  REPORT_PATH: "reportPath",
} as const;

export const LogAction = {
  // insert
  INSERT_REQUEST: "insert.request",
  INSERT_BATCH_START: "insert.batch.start",
  INSERT_BATCH_DONE: "insert.batch.done",
  INSERT_FILE_OK: "insert.file.ok",
  INSERT_FILE_SKIPPED: "insert.file.skipped",
  INSERT_FILE_FAILED: "insert.file.failed",
  EVENT_APPEND_FAILED: "event.append.failed",

  // projection
  PROJECTION_REQUEST: "projection.request",
  PROJECTION_START: "projection.start",
  PROJECTION_BATCH: "projection.batch",
  CURSOR_ADVANCED: "projection.cursor.advanced",
  PROJECTION_DONE: "projection.done",
  EVENT_MAPPED: "projection.event.mapped",
  MAP_FAILED: "projection.map.failed",
  PROJECTION_INTEGRITY_VIOLATION: "projection.integrity.violation",
<<<발췌 끝>>>

[Docs] — 채점 대상 문서 전문
<<<Docs 시작>>>
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
<<<Docs 끝>>>

[채점 루브릭] 각 항목 1~5 정수
- groundedness (근거 충실성): Docs 가 인용한 값·필드·장면 번호·로그가 [자료]에 실제로 있는가. [저장소 파일 확인]에서 실재하는 파일의 경로·스키마·메서드 인용은 근거 없는 주장으로 보지 않는다. 존재하지 않는 파일이나 발췌와 다른 내용의 인용은 감점한다. 5=인용된 값·필드·장면이 모두 자료에 실재. 3=핵심 근거는 실재하나 일부 수치·부등호가 원문과 불일치. 1=근거 없는 주장이나 존재하지 않는 값의 인용이 결론을 좌우.
- diagnosisAccuracy (원인 진단 정확성): Docs 의 진단이 [정답 요지]와 일치하는가. 5=정답 원인과 유형·위치(필드, 장면, 처리 단계)까지 일치. 3=유형은 맞으나 위치나 메커니즘이 부정확. 1=오진이거나 원인을 특정하지 못함.
- actionability (실행 가능성): Docs 의 SQL 과 절차를 그대로 따르면 문제가 해결되는가. [자동 검증 결과]를 실측으로 반영하되, 실행이 되더라도 의도와 다른 일을 하는 SQL(조건이 한 건도 맞지 않는 삭제문, 요구한 컬럼이 없는 테이블 등)은 감점한다. 기존 v1 테이블(read_grip_result, read_multimodal, event_store)을 ALTER/DROP 하면 감점. 5=그대로 따르면 해결(실행 성공 + 요구 충족). 3=오탈자·순서 등 소폭 수정 후 해결. 1=따르면 실패하거나 기존 자산이 손상.
- completeness (완결성): 권고 문서, Read Model 생성 SQL, API 버저닝 세 요소가 모두 유효하고 서로 일치하는가(머리말·SQL 의 테이블명·권고 대상·코드가 서로 같은 것을 가리키는가). 5=세 요소가 모두 유효하고 서로 일치. 3=세 요소가 있으나 서로 어긋나거나 항목이 비어 있음. 1=요소 누락 또는 근거 부족 표시.

다음 형식의 JSON 객체 하나만 출력하라:
{"groundedness": 1-5, "diagnosisAccuracy": 1-5, "actionability": 1-5, "completeness": 1-5, "unsupportedClaims": ["자료에 없는 주장 인용 (없으면 빈 배열)"], "rationale": "각 항목 점수 근거를 항목당 1~2문장으로, 한국어로"}
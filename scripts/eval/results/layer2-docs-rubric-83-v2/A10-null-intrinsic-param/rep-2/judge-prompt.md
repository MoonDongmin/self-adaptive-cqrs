당신은 이벤트 소싱 + CQRS 기반 Physical AI 데이터 플랫폼의 시니어 아키텍트이자 엄격한 평가자다. LLM 파이프라인이 [자료](로그·이벤트·스키마 정보)를 보고 [Docs]를 생성했다. Docs 는 권고 문서, Read Model 생성 SQL, API 버저닝 세 요소를 항상 함께 담아야 하는 단일 산출물이다. 당신은 [정답 요지]와 [자료], [자동 검증 결과]를 기준으로 Docs 를 네 항목의 루브릭으로 채점한다. 채점은 관대하지 않게, 근거 없는 주장·지어낸 값·의도와 다른 SQL·서로 어긋나는 절에는 낮은 점수를 준다. 실행·컴파일이 통과했다는 사실만으로 실행 가능성이나 완결성에 높은 점수를 주지 않는다. SQL 과 코드 블록을 실제로 읽고 루브릭의 점검 항목을 하나씩 확인한다. 반드시 JSON 객체 하나만 출력한다. 설명문·마크다운 펜스는 출력하지 않는다.

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
<<<자료 끝>>>

[자동 검증 결과] — 실제 데이터베이스 실행·컴파일 결과. 실행 가능성 판단의 실측 근거로 삼는다.
- 문서 검사: 전 항목 통과
- SQL 실행: 블록 1개 중 1개 실행 성공
- 코드 컴파일: 컴파일 대상 코드 없음

[저장소 파일 확인] — 파이프라인은 진단 도구로 저장소 소스 코드를 조회할 수 있다. Docs 가 인용한 파일 경로의 실재 여부와 앞부분 발췌이다.
- Docs 가 인용한 저장소 파일 경로 없음

[Docs] — 채점 대상 문서 전문
<<<Docs 시작>>>
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
<<<Docs 끝>>>

[채점 루브릭] 각 항목 1~5 정수
- groundedness (근거 충실성): Docs 가 인용한 값·필드·장면 번호·로그가 [자료]에 실제로 있는가. [저장소 파일 확인]에서 실재하는 파일의 경로·스키마·메서드 인용은 근거 없는 주장으로 보지 않는다. 존재하지 않는 파일이나 발췌와 다른 내용의 인용은 감점한다. 5=인용된 값·필드·장면이 모두 자료에 실재. 3=핵심 근거는 실재하나 일부 수치·부등호가 원문과 불일치. 1=근거 없는 주장이나 존재하지 않는 값의 인용이 결론을 좌우.
- diagnosisAccuracy (원인 진단 정확성): Docs 의 진단이 [정답 요지]와 일치하는가. 5=정답 원인과 유형·위치(필드, 장면, 처리 단계)까지 일치. 3=유형은 맞으나 위치나 메커니즘이 부정확. 1=오진이거나 원인을 특정하지 못함.
- actionability (실행 가능성): Docs 의 SQL 과 절차를 그대로 따르면 문제가 해결되는가. [자동 검증 결과]를 실측으로 반영하되, 실행·컴파일이 되더라도 의도와 다른 일을 하는 코드는 감점한다. 반드시 다음을 직접 확인한다: (1) 프로젝션 로직이 DDL 의 NOT NULL 컬럼에 null 이나 TODO 를 넣어 실제 적재 시 실패하지 않는가, (2) upsert 의 excluded. 뒤 식별자가 DDL 의 실제 컬럼명(snake_case)인가, (3) 비율·평균 계산이 정수 나눗셈으로 0/1 만 저장되지 않는가, (4) 정답이 요구한 값(성공률·실패율 등)이 실제 컬럼으로 존재하는가, (5) CHECK 제약이 플래그로 격리해야 할 바로 그 행의 적재를 막아 설계와 모순되지 않는가, (6) 기각했다고 쓴 조치(DELETE 등)를 즉시 격리 SQL 로 그대로 싣지 않았는가, (7) 기존 v1 테이블(read_grip_result, read_multimodal, event_store)의 행을 ALTER/DROP/DELETE 하지 않는가, (8) 정답 요지가 Read Model 보강을 요구하는데 검증용 SELECT 만 있지 않은가. 5=그대로 따르면 해결(실행 성공 + 요구 충족, 위 결함 없음). 4=위 결함 중 사소한 것 1개. 3=오탈자·순서·식별자 등 소폭 수정 후 해결. 2=따르면 적재·투영이 실패하거나 요구한 값을 얻지 못함. 1=따르면 기존 자산이 손상되거나 무관함.
- completeness (완결성): 권고 문서, Read Model 생성 SQL, API 버저닝 세 요소가 모두 유효하고 서로 일치하는가. 반드시 다음을 직접 확인한다: (1) TL;DR·머리말의 대상 테이블과 DDL 의 테이블명이 같은가, (2) 권고(Decision Outcome, Non-Goals)와 실제 SQL·코드가 모순되지 않는가(예: '보강한다'고 쓰고 '구조 변경 없음'이라 함, '기존 확장'이라 쓰고 신규 테이블을 만듦), (3) 코드 블록 사이의 클래스명·파일명·라우트명·export 경로가 서로 같은가, (4) DDL 의 nullable 과 ORM 스키마의 notNull 이 일치하는가, (5) 권고 절이 '재실행 권장'·'최소 근거만 수록' 같은 대체 스텁이 아닌가, (6) API 버저닝 절이 비어 있거나 문장이 끊기지 않았는가. 5=세 요소가 모두 유효하고 서로 일치. 4=사소한 불일치 1개. 3=세 요소가 있으나 서로 어긋나거나 항목이 비어 있음. 2=한 요소가 실질적으로 비어 있음(예: DDL 절에 검증 SELECT 만). 1=요소 누락 또는 근거 부족 표시.

다음 형식의 JSON 객체 하나만 출력하라:
{"groundedness": 1-5, "diagnosisAccuracy": 1-5, "actionability": 1-5, "completeness": 1-5, "unsupportedClaims": ["자료에 없는 주장 인용 (없으면 빈 배열)"], "rationale": "각 항목 점수 근거를 항목당 1~2문장으로, 한국어로"}
당신은 이벤트 소싱 + CQRS 기반 Physical AI 데이터 플랫폼의 시니어 아키텍트이자 엄격한 평가자다. LLM 파이프라인이 [자료](로그·이벤트·스키마 정보)를 보고 [Docs]를 생성했다. Docs 는 권고 문서, Read Model 생성 SQL, API 버저닝 세 요소를 항상 함께 담아야 하는 단일 산출물이다. 당신은 [정답 요지]와 [자료], [자동 검증 결과]를 기준으로 Docs 를 네 항목의 루브릭으로 채점한다. 채점은 관대하지 않게, 근거 없는 주장·지어낸 값·의도와 다른 SQL·서로 어긋나는 절에는 낮은 점수를 준다. 반드시 JSON 객체 하나만 출력한다. 설명문·마크다운 펜스는 출력하지 않는다.

---

[시나리오] A3-missing-field
[상황] 운영 중 시스템이 적재 검증 실패(zod 거부) 로그를 감지했다.
[정답 요지] 필수 필드(grip_data, robot_tf)가 삭제된 payload 가 zod 파싱 자체에 실패해 적재가 거부됨. 조치: 누락 필드별 거부 추적 Read Model/검증 로그 보강과 클라이언트 스키마 안내, v1 무손상.

[자료] — Docs 생성 시 파이프라인이 받은 로그·이벤트·스키마 정보
<<<자료 시작>>>
<logging_context>
## 이상 로그 맥락 (±N 윈도우)
> 빈도: 최근 1h — `insert.request`(level 30) 1회, `insert.file.failed`(level 40) 1회, `insert.batch.start`(level 30) 1회, `log.delete.request`(level 30) 1회, `log.delete.done`(level 30) 1회, `insert.file.ok`(level 20) 50회, `-`(level 30) 1회.

| time | level | action | correlation_id | stream_id | attempt | global_seq | msg | detail |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 10:10:07.830 | 30 | insert.batch.start | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | - | - | - | Toy-Data 적재 시작 | - |
| 10:10:07.830 | 30 | insert.request | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | - | - | - | Insert Event Store 요청 수신 | - |
| 10:10:07.835 | 20 | insert.file.ok | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00120 | 2 | 1 | 이벤트 append | - |
| 10:10:07.835 | 20 | insert.file.ok | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00120 | 2 | 1 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00120_02_20230923.json |
| 10:10:07.836 | 20 | insert.file.ok | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00121 | 2 | 2 | 이벤트 append | - |
| 10:10:07.836 | 20 | insert.file.ok | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00133 | 1 | 3 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00133_01_20230923.json |
| 10:10:07.836 | 20 | insert.file.ok | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00121 | 2 | 2 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00121_02_20230923.json |
| 10:10:07.836 | 20 | insert.file.ok | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00133 | 1 | 3 | 이벤트 append | - |
| 10:10:07.838 | 20 | insert.file.ok | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00133 | 2 | 4 | 이벤트 append | - |
| 10:10:07.838 | 20 | insert.file.ok | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00133 | 2 | 4 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00133_02_20230923.json |
| 10:10:07.839 | 20 | insert.file.ok | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00134 | 1 | 5 | 이벤트 append | - |
| 10:10:07.839 | 20 | insert.file.ok | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00134 | 1 | 5 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00134_01_20230923.json |
| 10:10:07.840 | 20 | insert.file.ok | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00134 | 2 | 6 | 이벤트 append | - |
| 10:10:07.840 | 20 | insert.file.ok | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00134 | 2 | 6 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00134_02_20230923.json |
| 10:10:07.841 | 20 | insert.file.ok | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00147 | 1 | 8 | 이벤트 append | - |
| 10:10:07.841 | 20 | insert.file.ok | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00135 | 2 | 7 | 이벤트 append | - |
| 10:10:07.841 | 20 | insert.file.ok | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00135 | 2 | 7 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00135_02_20230923.json |
| 10:10:07.841 | 20 | insert.file.ok | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00147 | 1 | 8 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00147_01_20230923.json |
| 10:10:07.842 | 20 | insert.file.ok | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00154 | 1 | 9 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00154_01_20230923.json |
| 10:10:07.842 | 20 | insert.file.ok | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00154 | 1 | 9 | 이벤트 append | - |
| 10:10:07.843 | 20 | insert.file.ok | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00155 | 2 | 10 | 이벤트 append | - |
| 10:10:07.844 | 20 | insert.file.ok | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00157 | 1 | 11 | 이벤트 append | - |
| 10:10:07.844 | 20 | insert.file.ok | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00155 | 2 | 10 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00155_02_20230923.json |
| 10:10:07.844 | 20 | insert.file.ok | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00157 | 1 | 11 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00157_01_20230923.json |
| 10:10:07.845 | 20 | insert.file.ok | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00163 | 2 | 12 | 이벤트 append | - |
| 10:10:07.845 | 20 | insert.file.ok | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00163 | 2 | 12 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00163_02_20230923.json |
| 10:10:07.846 | 20 | insert.file.ok | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00163 | 3 | 13 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00163_03_20230923.json |
| 10:10:07.846 | 20 | insert.file.ok | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00163 | 3 | 13 | 이벤트 append | - |
| 10:10:07.847 | 20 | insert.file.ok | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00167 | 3 | 14 | 이벤트 append | - |
| 10:10:07.847 | 20 | insert.file.ok | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00167 | 3 | 14 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00167_03_20230923.json |
| 10:10:07.847 | 20 | insert.file.ok | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00168 | 3 | 15 | 이벤트 append | - |
| 10:10:07.847 | 20 | insert.file.ok | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00168 | 3 | 15 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00168_03_20230923.json |
| 10:10:07.848 | 20 | insert.file.ok | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00169 | 2 | 16 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00169_02_20230923.json |
| 10:10:07.848 | 20 | insert.file.ok | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00169 | 2 | 16 | 이벤트 append | - |
| 10:10:07.849 | 20 | insert.file.ok | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00188 | 2 | 17 | 이벤트 append | - |
| 10:10:07.849 | 20 | insert.file.ok | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00188 | 2 | 17 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00188_02_20230923.json |
| 10:10:07.850 | 20 | insert.file.ok | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00189 | 3 | 18 | 이벤트 append | - |
| 10:10:07.850 | 20 | insert.file.ok | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00189 | 3 | 18 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00189_03_20230923.json |
| 10:10:07.851 | 20 | insert.file.ok | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00190 | 1 | 19 | 이벤트 append | - |
| 10:10:07.851 | 20 | insert.file.ok | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00190 | 1 | 19 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00190_01_20230923.json |
| 10:10:07.852 | 20 | insert.file.ok | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00192 | 1 | 21 | 이벤트 append | - |
| 10:10:07.852 | 20 | insert.file.ok | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00190 | 3 | 20 | 이벤트 append | - |
| 10:10:07.852 | 20 | insert.file.ok | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00190 | 3 | 20 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00190_03_20230923.json |
| 10:10:07.852 | 20 | insert.file.ok | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00192 | 1 | 21 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00192_01_20230923.json |
| 10:10:07.853 | 20 | insert.file.ok | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00197 | 3 | 22 | 이벤트 append | - |
| 10:10:07.853 | 20 | insert.file.ok | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00197 | 3 | 22 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00197_03_20230923.json |
| 10:10:07.854 | 20 | insert.file.ok | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00204 | 1 | 23 | 이벤트 append | - |
| 10:10:07.854 | 20 | insert.file.ok | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00204 | 1 | 23 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00204_01_20230923.json |
| 10:10:07.855 | 20 | insert.file.ok | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00206 | 2 | 25 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00206_02_20230923.json |
| 10:10:07.855 | 20 | insert.file.ok | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00206 | 1 | 24 | 이벤트 append | - |
| 10:10:07.855 | 20 | insert.file.ok | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00206 | 1 | 24 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00206_01_20230923.json |
| 10:10:07.855 | 20 | insert.file.ok | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00206 | 2 | 25 | 이벤트 append | - |
| 10:10:07.856 | 40 | insert.file.failed | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | - | - | - | toy-data 파일 적재 실패 ← 트립 앵커 | reason=[   {     "expected": "object",     "code": "invalid_type",     "path": [       "grip_data"     ],     "message": "Invalid input: expected object, received undefined"   } ] · file=반려동물용품_CR01_강아지공룡알장난감_02004_01_20230923.json |
| 10:10:07.857 | 30 | insert.batch.done | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | - | - | - | toy-data 적재 완료 | - |
| 10:10:07.857 | 40 | insert.file.failed | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | - | - | - | toy-data 파일 적재 실패 | reason=[   {     "expected": "object",     "code": "invalid_type",     "path": [       "robot_tf"     ],     "message": "Invalid input: expected object, received undefined"   } ] · file=반려동물용품_CR01_강아지공룡알장난감_02005_01_20230923.json |
| 10:10:07.857 | 30 | - | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | - | - | - | request completed | - |
| 10:10:07.859 | 30 | projection.request | cd9fff02-80e8-4c22-80a4-852da6ea9d86 | - | - | - | projection 요청 수신 | - |
| 10:10:07.861 | 30 | projection.start | cd9fff02-80e8-4c22-80a4-852da6ea9d86 | - | - | - | catch-up 시작 | projector=multimodal-projector |
| 10:10:07.861 | 20 | - | cd9fff02-80e8-4c22-80a4-852da6ea9d86 | - | - | - | 커서 조회 | projector=multimodal-projector |
| 10:10:07.863 | 20 | - | cd9fff02-80e8-4c22-80a4-852da6ea9d86 | - | - | - | 이벤트 조회 | - |
| 10:10:07.863 | 20 | projection.event.mapped | cd9fff02-80e8-4c22-80a4-852da6ea9d86 | - | 2 | 1 | 이벤트 매핑 | projector=multimodal-projector |
| 10:10:07.864 | 20 | projection.event.mapped | cd9fff02-80e8-4c22-80a4-852da6ea9d86 | - | 2 | 2 | 이벤트 매핑 | projector=multimodal-projector |
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
- 문서 검사: 실패 항목 hanCharacterFree
- SQL 실행: 블록 1개 중 1개 실행 성공
- 코드 컴파일: 컴파일 대상 코드 없음

[Docs] — 채점 대상 문서 전문
<<<Docs 시작>>>
---
docId: analysis-b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d
generatedAt: 2026-08-12T10:10:15.488Z
targetReadModel: read_grip_result
sqlDialect: postgres
sufficientEvidence: true
apiVersion:
  from: null
  to: null
  affectedEndpoints: []
evidenceSources:
  - { origin: developer-logging, anchorId: "b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d" }
constraints:
  - "v1 자산(테이블/엔드포인트/프로젝터 name) 무손상"
  - "PK (scene_key, attempt_num) 유지"
  - "TypeScript any 금지"
  - "식별자 전체 단어"
  - "DDL 실행·API 컷오버는 인간 승인 후에만 (human-in-the-loop)"
  - "Read Model 테이블명은 read_ 접두 스네이크 케이스"
---

# Self-Adaptive CQRS Docs — read_grip_result

> 결론(TL;DR): `read_grip_result`을(를) 보강한다 — Toy-data 배치 적재 중 두 파일이 GripAttemptRecorded 이벤트 스키마 필수 필드(grip_data, robot_tf) 결결로 적재 단계 Zod 검증에서 거절되었다. 파일 단위 try/catch 적용되어 배치와 후속 투영은 정상 진행. (이상 유형: 적재 Zod 검증 실패 · 심각도: warning)

<logging_context>

## 이상 로그 맥락 (±N 윈도우)
> 빈도: 최근 1h — `insert.request`(level 30) 1회, `insert.file.failed`(level 40) 1회, `insert.batch.start`(level 30) 1회, `log.delete.request`(level 30) 1회, `log.delete.done`(level 30) 1회, `insert.file.ok`(level 20) 50회, `-`(level 30) 1회.

| time | level | action | correlation_id | stream_id | attempt | global_seq | msg | detail |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 10:10:07.830 | 30 | insert.batch.start | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | - | - | - | Toy-Data 적재 시작 | - |
| 10:10:07.830 | 30 | insert.request | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | - | - | - | Insert Event Store 요청 수신 | - |
| 10:10:07.835 | 20 | insert.file.ok | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00120 | 2 | 1 | 이벤트 append | - |
| 10:10:07.835 | 20 | insert.file.ok | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00120 | 2 | 1 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00120_02_20230923.json |
| 10:10:07.836 | 20 | insert.file.ok | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00121 | 2 | 2 | 이벤트 append | - |
| 10:10:07.836 | 20 | insert.file.ok | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00133 | 1 | 3 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00133_01_20230923.json |
| 10:10:07.836 | 20 | insert.file.ok | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00121 | 2 | 2 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00121_02_20230923.json |
| 10:10:07.836 | 20 | insert.file.ok | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00133 | 1 | 3 | 이벤트 append | - |
| 10:10:07.838 | 20 | insert.file.ok | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00133 | 2 | 4 | 이벤트 append | - |
| 10:10:07.838 | 20 | insert.file.ok | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00133 | 2 | 4 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00133_02_20230923.json |
| 10:10:07.839 | 20 | insert.file.ok | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00134 | 1 | 5 | 이벤트 append | - |
| 10:10:07.839 | 20 | insert.file.ok | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00134 | 1 | 5 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00134_01_20230923.json |
| 10:10:07.840 | 20 | insert.file.ok | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00134 | 2 | 6 | 이벤트 append | - |
| 10:10:07.840 | 20 | insert.file.ok | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00134 | 2 | 6 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00134_02_20230923.json |
| 10:10:07.841 | 20 | insert.file.ok | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00147 | 1 | 8 | 이벤트 append | - |
| 10:10:07.841 | 20 | insert.file.ok | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00135 | 2 | 7 | 이벤트 append | - |
| 10:10:07.841 | 20 | insert.file.ok | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00135 | 2 | 7 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00135_02_20230923.json |
| 10:10:07.841 | 20 | insert.file.ok | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00147 | 1 | 8 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00147_01_20230923.json |
| 10:10:07.842 | 20 | insert.file.ok | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00154 | 1 | 9 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00154_01_20230923.json |
| 10:10:07.842 | 20 | insert.file.ok | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00154 | 1 | 9 | 이벤트 append | - |
| 10:10:07.843 | 20 | insert.file.ok | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00155 | 2 | 10 | 이벤트 append | - |
| 10:10:07.844 | 20 | insert.file.ok | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00157 | 1 | 11 | 이벤트 append | - |
| 10:10:07.844 | 20 | insert.file.ok | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00155 | 2 | 10 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00155_02_20230923.json |
| 10:10:07.844 | 20 | insert.file.ok | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00157 | 1 | 11 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00157_01_20230923.json |
| 10:10:07.845 | 20 | insert.file.ok | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00163 | 2 | 12 | 이벤트 append | - |
| 10:10:07.845 | 20 | insert.file.ok | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00163 | 2 | 12 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00163_02_20230923.json |
| 10:10:07.846 | 20 | insert.file.ok | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00163 | 3 | 13 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00163_03_20230923.json |
| 10:10:07.846 | 20 | insert.file.ok | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00163 | 3 | 13 | 이벤트 append | - |
| 10:10:07.847 | 20 | insert.file.ok | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00167 | 3 | 14 | 이벤트 append | - |
| 10:10:07.847 | 20 | insert.file.ok | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00167 | 3 | 14 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00167_03_20230923.json |
| 10:10:07.847 | 20 | insert.file.ok | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00168 | 3 | 15 | 이벤트 append | - |
| 10:10:07.847 | 20 | insert.file.ok | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00168 | 3 | 15 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00168_03_20230923.json |
| 10:10:07.848 | 20 | insert.file.ok | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00169 | 2 | 16 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00169_02_20230923.json |
| 10:10:07.848 | 20 | insert.file.ok | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00169 | 2 | 16 | 이벤트 append | - |
| 10:10:07.849 | 20 | insert.file.ok | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00188 | 2 | 17 | 이벤트 append | - |
| 10:10:07.849 | 20 | insert.file.ok | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00188 | 2 | 17 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00188_02_20230923.json |
| 10:10:07.850 | 20 | insert.file.ok | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00189 | 3 | 18 | 이벤트 append | - |
| 10:10:07.850 | 20 | insert.file.ok | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00189 | 3 | 18 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00189_03_20230923.json |
| 10:10:07.851 | 20 | insert.file.ok | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00190 | 1 | 19 | 이벤트 append | - |
| 10:10:07.851 | 20 | insert.file.ok | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00190 | 1 | 19 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00190_01_20230923.json |
| 10:10:07.852 | 20 | insert.file.ok | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00192 | 1 | 21 | 이벤트 append | - |
| 10:10:07.852 | 20 | insert.file.ok | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00190 | 3 | 20 | 이벤트 append | - |
| 10:10:07.852 | 20 | insert.file.ok | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00190 | 3 | 20 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00190_03_20230923.json |
| 10:10:07.852 | 20 | insert.file.ok | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00192 | 1 | 21 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00192_01_20230923.json |
| 10:10:07.853 | 20 | insert.file.ok | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00197 | 3 | 22 | 이벤트 append | - |
| 10:10:07.853 | 20 | insert.file.ok | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00197 | 3 | 22 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00197_03_20230923.json |
| 10:10:07.854 | 20 | insert.file.ok | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00204 | 1 | 23 | 이벤트 append | - |
| 10:10:07.854 | 20 | insert.file.ok | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00204 | 1 | 23 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00204_01_20230923.json |
| 10:10:07.855 | 20 | insert.file.ok | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00206 | 2 | 25 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00206_02_20230923.json |
| 10:10:07.855 | 20 | insert.file.ok | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00206 | 1 | 24 | 이벤트 append | - |
| 10:10:07.855 | 20 | insert.file.ok | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00206 | 1 | 24 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00206_01_20230923.json |
| 10:10:07.855 | 20 | insert.file.ok | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00206 | 2 | 25 | 이벤트 append | - |
| 10:10:07.856 | 40 | insert.file.failed | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | - | - | - | toy-data 파일 적재 실패 ← 트립 앵커 | reason=[   {     "expected": "object",     "code": "invalid_type",     "path": [       "grip_data"     ],     "message": "Invalid input: expected object, received undefined"   } ] · file=반려동물용품_CR01_강아지공룡알장난감_02004_01_20230923.json |
| 10:10:07.857 | 30 | insert.batch.done | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | - | - | - | toy-data 적재 완료 | - |
| 10:10:07.857 | 40 | insert.file.failed | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | - | - | - | toy-data 파일 적재 실패 | reason=[   {     "expected": "object",     "code": "invalid_type",     "path": [       "robot_tf"     ],     "message": "Invalid input: expected object, received undefined"   } ] · file=반려동물용품_CR01_강아지공룡알장난감_02005_01_20230923.json |
| 10:10:07.857 | 30 | - | b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d | - | - | - | request completed | - |
| 10:10:07.859 | 30 | projection.request | cd9fff02-80e8-4c22-80a4-852da6ea9d86 | - | - | - | projection 요청 수신 | - |
| 10:10:07.861 | 30 | projection.start | cd9fff02-80e8-4c22-80a4-852da6ea9d86 | - | - | - | catch-up 시작 | projector=multimodal-projector |
| 10:10:07.861 | 20 | - | cd9fff02-80e8-4c22-80a4-852da6ea9d86 | - | - | - | 커서 조회 | projector=multimodal-projector |
| 10:10:07.863 | 20 | - | cd9fff02-80e8-4c22-80a4-852da6ea9d86 | - | - | - | 이벤트 조회 | - |
| 10:10:07.863 | 20 | projection.event.mapped | cd9fff02-80e8-4c22-80a4-852da6ea9d86 | - | 2 | 1 | 이벤트 매핑 | projector=multimodal-projector |
| 10:10:07.864 | 20 | projection.event.mapped | cd9fff02-80e8-4c22-80a4-852da6ea9d86 | - | 2 | 2 | 이벤트 매핑 | projector=multimodal-projector |

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
- (level 40, `insert.file.failed`) toy-data 파일 적재 실패 ← 트립 앵커 → 원천 파일의 필수 필드 누락/타입 위반 (grip_data 미존) [corr:b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d]
- (level 40, `insert.file.failed`) toy-data 파일 적재 실패 → 원천 파일의 필수 필드 누락/타입 위반 (robot_tf 미존) [corr:b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d]
- toyDataSchema in src/insert/dto/toy-data.dto.ts 정의에서 grip_data: gripDataSchema와 robot_tf: robotTfSchema는 .optional() 미적 적용되어 필수 검증이强制执行. Zod 거절은 시스템의 의도한 방어 동작이다.
- GripResultProjector.map in src/projection/projector/grip-result.projector.ts 호출 시 toyDataSchema.parse(event.payload) 실패 시 throw error 발생. 적재 단계 거절된 파일은 event_store 미유입이므로 projector 매핑 경로가 차단된다.
- read_grip_result Insight 카드의 grip_2d_pose(2D 파지점), robot_tf(로봇 변환행렬) 컬럼은 원천 payload 필드 매핑 출처이나, 미유입 이벤트는 Read Model 행 생성/수정하지. 결함 값이 Read Model에 유입되지 확인된다.
- MultiModalProjector in src/projection/projector/multimodal.projector.ts 또한 동적 스키마 파싱을 수행하나, failed 파일은 batch 완료 이후 projection start 시점에서 이미 걸러진 상태.

### Decision Drivers
- Data Integrity (reject invalid at source boundary)
- System Boundary (Zod validation layer as gatekeeper)
- Operational Overhead (minimize projection/DB impact)
- Auditability (traceable failure logs for source correction)

### Considered Options
#### 거절 유지 + 원천 데이터 수정 요청
- 접근: Zod 검증 스키마 미수 변경. insert.file.failed 로그 모니터링 보강으로 원천 파일 재발송/보완 요청 workflow 연계.
- 제안 필드: monitoringAlert, sourceFixRequest
- 트레이드오프: projection pipeline zero impact, data integrity preserved, but requires external manual correction step.
```typescript
// src/insert/insert.service.ts (감시 로직 예지) if (failedFiles.length > 0) { logger.warn({ action: LogAction.FILE_REJECTED }, `Zod 검증 거절 ${failedFiles.length}건 발생. 원천 데이터 보완 요청 대기.`); }
```

#### 무유입 검증 절차
- 접근: batch 완료 시점 event_store 조회로 미유입 확인.
- 제안 필드: auditQuery, isolationConfirm
- 트레이드오프: adds DB read overhead per batch, guarantees Read Model purity, but query execution latency in high-throughput scenarios.
```typescript
const auditResult = await db.select({ count: sql`count(*)` }).from(eventStoreTable).where(sql`stream_id = ${targetStreamId} AND attempt_num = ${targetAttemptNum}`);
```

#### Zod schema 완화 (optional 화)
- 접근: grip_data, robot_tf 필드 .optional() 적용.
- 제안 필드: schemaRelaxation
- 트레이드오프: violates defect value sanitization principle, allows invalid/undefined data into Read Model columns, loses evidence of source defect. Fails Data Integrity Driver.
```typescript
// src/insert/dto/toy-data.dto.ts (기각 대안) grip_data: gripDataSchema.optional(), robot_tf: robotTfSchema.optional(),
```

### Decision Outcome
거절 유지 + 원천 데이터 수정 요청

### Consequences
- (+) Maintains strict schema enforcement
- (+) Prevents poison events in Read Model
- (+) Clear audit trail via insert.file.failed logs
- (−) Requires manual source data fix workflow
- (−) No automatic recovery in current pipeline

### Non-Goals
- Modifying Zod schema to coerce defaults
- Altering projector logic to handle missing fields
- Creating new ReadModel tables for tracking

## 2. Read Model 생성 SQL (Read Model DDL)

> 실행 게이트: 아래 변경은 인간 승인 후에만 적용한다 (human-in-the-loop).

### 격리(containment) SQL — 신규 Read Model DDL 불필요, 결함 데이터 무해화가 조치다

```sql
-- 무유입 검증: zod 거절된 파일의 이벤트가 event_store 에 유입되지 않았음을 확인한다 (기대값 0)
SELECT count(*) AS rejected_event_count FROM event_store WHERE (stream_id, attempt_num) IN (('grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02004', 1), ('grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02005', 1));
```

## 3. API Versioning

### 버전 영향

변 변경 없음. Zod 검증 스키마와 Read Model 테이블/엔드포인트가 불변 유지하며, 격리 SQL은 운영/감시용 검증 절차만 추가하여 외부 API 호환성 및 클라이언트 계약이 무영 영향을 받는다.

## Guardrails (constraints)

- v1 자산(테이블/엔드포인트/프로젝터 name) 무손상
- PK (scene_key, attempt_num) 유지
- TypeScript any 금지
- 식별자 전체 단어
- DDL 실행·API 컷오버는 인간 승인 후에만 (human-in-the-loop)
- Read Model 테이블명은 read_ 접두 스네이크 케이스
<<<Docs 끝>>>

[채점 루브릭] 각 항목 1~5 정수
- groundedness (근거 충실성): Docs 가 인용한 값·필드·장면 번호·로그가 [자료]에 실제로 있는가. 5=인용된 값·필드·장면이 모두 자료에 실재. 3=핵심 근거는 실재하나 일부 수치·부등호가 원문과 불일치. 1=근거 없는 주장이나 존재하지 않는 값의 인용이 결론을 좌우.
- diagnosisAccuracy (원인 진단 정확성): Docs 의 진단이 [정답 요지]와 일치하는가. 5=정답 원인과 유형·위치(필드, 장면, 처리 단계)까지 일치. 3=유형은 맞으나 위치나 메커니즘이 부정확. 1=오진이거나 원인을 특정하지 못함.
- actionability (실행 가능성): Docs 의 SQL 과 절차를 그대로 따르면 문제가 해결되는가. [자동 검증 결과]를 실측으로 반영하되, 실행이 되더라도 의도와 다른 일을 하는 SQL(조건이 한 건도 맞지 않는 삭제문, 요구한 컬럼이 없는 테이블 등)은 감점한다. 기존 v1 테이블(read_grip_result, read_multimodal, event_store)을 ALTER/DROP 하면 감점. 5=그대로 따르면 해결(실행 성공 + 요구 충족). 3=오탈자·순서 등 소폭 수정 후 해결. 1=따르면 실패하거나 기존 자산이 손상.
- completeness (완결성): 권고 문서, Read Model 생성 SQL, API 버저닝 세 요소가 모두 유효하고 서로 일치하는가(머리말·SQL 의 테이블명·권고 대상·코드가 서로 같은 것을 가리키는가). 5=세 요소가 모두 유효하고 서로 일치. 3=세 요소가 있으나 서로 어긋나거나 항목이 비어 있음. 1=요소 누락 또는 근거 부족 표시.

다음 형식의 JSON 객체 하나만 출력하라:
{"groundedness": 1-5, "diagnosisAccuracy": 1-5, "actionability": 1-5, "completeness": 1-5, "unsupportedClaims": ["자료에 없는 주장 인용 (없으면 빈 배열)"], "rationale": "각 항목 점수 근거를 항목당 1~2문장으로"}
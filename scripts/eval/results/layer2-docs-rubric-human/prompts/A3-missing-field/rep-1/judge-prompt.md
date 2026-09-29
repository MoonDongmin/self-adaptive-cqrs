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
| 16:18:37.909 | 30 | insert.request | f8148686-8f42-4e6f-bd96-71f8891488dc | - | - | - | Insert Event Store 요청 수신 | - |
| 16:18:37.909 | 30 | insert.batch.start | f8148686-8f42-4e6f-bd96-71f8891488dc | - | - | - | Toy-Data 적재 시작 | - |
| 16:18:37.914 | 20 | insert.file.ok | f8148686-8f42-4e6f-bd96-71f8891488dc | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00120 | 2 | 1 | 이벤트 append | - |
| 16:18:37.914 | 20 | insert.file.ok | f8148686-8f42-4e6f-bd96-71f8891488dc | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00120 | 2 | 1 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00120_02_20230923.json |
| 16:18:37.915 | 20 | insert.file.ok | f8148686-8f42-4e6f-bd96-71f8891488dc | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00121 | 2 | 2 | 이벤트 append | - |
| 16:18:37.915 | 20 | insert.file.ok | f8148686-8f42-4e6f-bd96-71f8891488dc | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00121 | 2 | 2 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00121_02_20230923.json |
| 16:18:37.916 | 20 | insert.file.ok | f8148686-8f42-4e6f-bd96-71f8891488dc | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00133 | 1 | 3 | 이벤트 append | - |
| 16:18:37.916 | 20 | insert.file.ok | f8148686-8f42-4e6f-bd96-71f8891488dc | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00133 | 1 | 3 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00133_01_20230923.json |
| 16:18:37.918 | 20 | insert.file.ok | f8148686-8f42-4e6f-bd96-71f8891488dc | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00134 | 1 | 5 | 이벤트 append | - |
| 16:18:37.918 | 20 | insert.file.ok | f8148686-8f42-4e6f-bd96-71f8891488dc | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00133 | 2 | 4 | 이벤트 append | - |
| 16:18:37.918 | 20 | insert.file.ok | f8148686-8f42-4e6f-bd96-71f8891488dc | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00133 | 2 | 4 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00133_02_20230923.json |
| 16:18:37.919 | 20 | insert.file.ok | f8148686-8f42-4e6f-bd96-71f8891488dc | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00134 | 1 | 5 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00134_01_20230923.json |
| 16:18:37.920 | 20 | insert.file.ok | f8148686-8f42-4e6f-bd96-71f8891488dc | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00135 | 2 | 7 | 이벤트 append | - |
| 16:18:37.920 | 20 | insert.file.ok | f8148686-8f42-4e6f-bd96-71f8891488dc | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00134 | 2 | 6 | 이벤트 append | - |
| 16:18:37.920 | 20 | insert.file.ok | f8148686-8f42-4e6f-bd96-71f8891488dc | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00134 | 2 | 6 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00134_02_20230923.json |
| 16:18:37.920 | 20 | insert.file.ok | f8148686-8f42-4e6f-bd96-71f8891488dc | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00135 | 2 | 7 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00135_02_20230923.json |
| 16:18:37.921 | 20 | insert.file.ok | f8148686-8f42-4e6f-bd96-71f8891488dc | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00147 | 1 | 8 | 이벤트 append | - |
| 16:18:37.921 | 20 | insert.file.ok | f8148686-8f42-4e6f-bd96-71f8891488dc | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00147 | 1 | 8 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00147_01_20230923.json |
| 16:18:37.922 | 20 | insert.file.ok | f8148686-8f42-4e6f-bd96-71f8891488dc | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00154 | 1 | 9 | 이벤트 append | - |
| 16:18:37.922 | 20 | insert.file.ok | f8148686-8f42-4e6f-bd96-71f8891488dc | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00154 | 1 | 9 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00154_01_20230923.json |
| 16:18:37.923 | 20 | insert.file.ok | f8148686-8f42-4e6f-bd96-71f8891488dc | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00155 | 2 | 10 | 이벤트 append | - |
| 16:18:37.923 | 20 | insert.file.ok | f8148686-8f42-4e6f-bd96-71f8891488dc | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00155 | 2 | 10 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00155_02_20230923.json |
| 16:18:37.924 | 20 | insert.file.ok | f8148686-8f42-4e6f-bd96-71f8891488dc | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00157 | 1 | 11 | 이벤트 append | - |
| 16:18:37.924 | 20 | insert.file.ok | f8148686-8f42-4e6f-bd96-71f8891488dc | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00157 | 1 | 11 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00157_01_20230923.json |
| 16:18:37.925 | 20 | insert.file.ok | f8148686-8f42-4e6f-bd96-71f8891488dc | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00163 | 2 | 12 | 이벤트 append | - |
| 16:18:37.925 | 20 | insert.file.ok | f8148686-8f42-4e6f-bd96-71f8891488dc | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00163 | 2 | 12 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00163_02_20230923.json |
| 16:18:37.926 | 20 | insert.file.ok | f8148686-8f42-4e6f-bd96-71f8891488dc | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00163 | 3 | 13 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00163_03_20230923.json |
| 16:18:37.926 | 20 | insert.file.ok | f8148686-8f42-4e6f-bd96-71f8891488dc | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00163 | 3 | 13 | 이벤트 append | - |
| 16:18:37.927 | 20 | insert.file.ok | f8148686-8f42-4e6f-bd96-71f8891488dc | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00167 | 3 | 14 | 이벤트 append | - |
| 16:18:37.927 | 20 | insert.file.ok | f8148686-8f42-4e6f-bd96-71f8891488dc | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00167 | 3 | 14 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00167_03_20230923.json |
| 16:18:37.927 | 20 | insert.file.ok | f8148686-8f42-4e6f-bd96-71f8891488dc | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00168 | 3 | 15 | 이벤트 append | - |
| 16:18:37.927 | 20 | insert.file.ok | f8148686-8f42-4e6f-bd96-71f8891488dc | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00168 | 3 | 15 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00168_03_20230923.json |
| 16:18:37.928 | 20 | insert.file.ok | f8148686-8f42-4e6f-bd96-71f8891488dc | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00169 | 2 | 16 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00169_02_20230923.json |
| 16:18:37.928 | 20 | insert.file.ok | f8148686-8f42-4e6f-bd96-71f8891488dc | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00169 | 2 | 16 | 이벤트 append | - |
| 16:18:37.930 | 20 | insert.file.ok | f8148686-8f42-4e6f-bd96-71f8891488dc | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00188 | 2 | 17 | 이벤트 append | - |
| 16:18:37.930 | 20 | insert.file.ok | f8148686-8f42-4e6f-bd96-71f8891488dc | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00188 | 2 | 17 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00188_02_20230923.json |
| 16:18:37.931 | 20 | insert.file.ok | f8148686-8f42-4e6f-bd96-71f8891488dc | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00190 | 1 | 19 | 이벤트 append | - |
| 16:18:37.931 | 20 | insert.file.ok | f8148686-8f42-4e6f-bd96-71f8891488dc | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00189 | 3 | 18 | 이벤트 append | - |
| 16:18:37.931 | 20 | insert.file.ok | f8148686-8f42-4e6f-bd96-71f8891488dc | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00189 | 3 | 18 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00189_03_20230923.json |
| 16:18:37.931 | 20 | insert.file.ok | f8148686-8f42-4e6f-bd96-71f8891488dc | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00190 | 1 | 19 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00190_01_20230923.json |
| 16:18:37.932 | 20 | insert.file.ok | f8148686-8f42-4e6f-bd96-71f8891488dc | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00190 | 3 | 20 | 이벤트 append | - |
| 16:18:37.932 | 20 | insert.file.ok | f8148686-8f42-4e6f-bd96-71f8891488dc | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00190 | 3 | 20 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00190_03_20230923.json |
| 16:18:37.933 | 20 | insert.file.ok | f8148686-8f42-4e6f-bd96-71f8891488dc | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00192 | 1 | 21 | 이벤트 append | - |
| 16:18:37.933 | 20 | insert.file.ok | f8148686-8f42-4e6f-bd96-71f8891488dc | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00192 | 1 | 21 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00192_01_20230923.json |
| 16:18:37.934 | 20 | insert.file.ok | f8148686-8f42-4e6f-bd96-71f8891488dc | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00197 | 3 | 22 | 이벤트 append | - |
| 16:18:37.934 | 20 | insert.file.ok | f8148686-8f42-4e6f-bd96-71f8891488dc | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00197 | 3 | 22 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00197_03_20230923.json |
| 16:18:37.935 | 20 | insert.file.ok | f8148686-8f42-4e6f-bd96-71f8891488dc | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00206 | 1 | 24 | 이벤트 append | - |
| 16:18:37.935 | 20 | insert.file.ok | f8148686-8f42-4e6f-bd96-71f8891488dc | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00204 | 1 | 23 | 이벤트 append | - |
| 16:18:37.935 | 20 | insert.file.ok | f8148686-8f42-4e6f-bd96-71f8891488dc | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00204 | 1 | 23 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00204_01_20230923.json |
| 16:18:37.935 | 20 | insert.file.ok | f8148686-8f42-4e6f-bd96-71f8891488dc | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00206 | 1 | 24 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00206_01_20230923.json |
| 16:18:37.936 | 20 | insert.file.ok | f8148686-8f42-4e6f-bd96-71f8891488dc | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00206 | 2 | 25 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00206_02_20230923.json |
| 16:18:37.936 | 20 | insert.file.ok | f8148686-8f42-4e6f-bd96-71f8891488dc | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00206 | 2 | 25 | 이벤트 append | - |
| 16:18:37.936 | 40 | insert.file.failed | f8148686-8f42-4e6f-bd96-71f8891488dc | - | - | - | toy-data 파일 적재 실패 ← 트립 앵커 | reason=[   {     "expected": "object",     "code": "invalid_type",     "path": [       "grip_data"     ],     "message": "Invalid input: expected object, received undefined"   } ] · file=반려동물용품_CR01_강아지공룡알장난감_02004_01_20230923.json |
| 16:18:37.938 | 30 | insert.batch.done | f8148686-8f42-4e6f-bd96-71f8891488dc | - | - | - | toy-data 적재 완료 | - |
| 16:18:37.938 | 40 | insert.file.failed | f8148686-8f42-4e6f-bd96-71f8891488dc | - | - | - | toy-data 파일 적재 실패 | reason=[   {     "expected": "object",     "code": "invalid_type",     "path": [       "robot_tf"     ],     "message": "Invalid input: expected object, received undefined"   } ] · file=반려동물용품_CR01_강아지공룡알장난감_02005_01_20230923.json |
| 16:18:37.938 | 30 | - | f8148686-8f42-4e6f-bd96-71f8891488dc | - | - | - | request completed | - |
| 16:18:37.940 | 30 | projection.request | e026a814-3cc0-4a3e-8ba5-0cb2c6e852ca | - | - | - | projection 요청 수신 | - |
| 16:18:37.942 | 30 | projection.start | e026a814-3cc0-4a3e-8ba5-0cb2c6e852ca | - | - | - | catch-up 시작 | projector=multimodal-projector |
| 16:18:37.942 | 20 | - | e026a814-3cc0-4a3e-8ba5-0cb2c6e852ca | - | - | - | 커서 조회 | projector=multimodal-projector |
| 16:18:37.944 | 20 | - | e026a814-3cc0-4a3e-8ba5-0cb2c6e852ca | - | - | - | 이벤트 조회 | - |
| 16:18:37.944 | 20 | projection.event.mapped | e026a814-3cc0-4a3e-8ba5-0cb2c6e852ca | - | 2 | 1 | 이벤트 매핑 | projector=multimodal-projector |
| 16:18:37.946 | 20 | projection.event.mapped | e026a814-3cc0-4a3e-8ba5-0cb2c6e852ca | - | 2 | 2 | 이벤트 매핑 | projector=multimodal-projector |
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
- 저장소에 실재하는 파일 (2건): src/insert/dto/toy-data.dto.ts, src/projection/repository/event-store-reader.repository.ts
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

[Docs] — 채점 대상 문서 전문
<<<Docs 시작>>>
---
docId: analysis-f8148686-8f42-4e6f-bd96-71f8891488dc
generatedAt: 2026-08-10T16:18:44.909Z
targetReadModel: read_grip_result
sqlDialect: postgres
sufficientEvidence: true
apiVersion:
  from: null
  to: null
  affectedEndpoints: []
evidenceSources:
  - { origin: developer-logging, anchorId: "f8148686-8f42-4e6f-bd96-71f8891488dc" }
constraints:
  - "v1 자산(테이블/엔드포인트/프로젝터 name) 무손상"
  - "PK (scene_key, attempt_num) 유지"
  - "TypeScript any 금지"
  - "식별자 전체 단어"
  - "DDL 실행·API 컷오버는 인간 승인 후에만 (human-in-the-loop)"
  - "Read Model 테이블명은 read_ 접두 스네이크 케이스"
---

# Self-Adaptive CQRS Docs — read_grip_result

> 결론(TL;DR): `read_grip_result`을(를) 보강한다 — 적재 단계 Zod 검증 거절로 두 Toy-Data 파일이 event_store append가 배제된, 나머지 배치와 후속 투영은 무병하게Proceed. (이상 유형: 요청 충족 실패 · 심각도: warning)

<logging_context>

## 이상 로그 맥락 (±N 윈도우)
> 빈도: 최근 1h — `insert.request`(level 30) 1회, `insert.file.failed`(level 40) 1회, `insert.batch.start`(level 30) 1회, `log.delete.request`(level 30) 1회, `log.delete.done`(level 30) 1회, `insert.file.ok`(level 20) 50회, `-`(level 30) 1회.

| time | level | action | correlation_id | stream_id | attempt | global_seq | msg | detail |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 16:18:37.909 | 30 | insert.request | f8148686-8f42-4e6f-bd96-71f8891488dc | - | - | - | Insert Event Store 요청 수신 | - |
| 16:18:37.909 | 30 | insert.batch.start | f8148686-8f42-4e6f-bd96-71f8891488dc | - | - | - | Toy-Data 적재 시작 | - |
| 16:18:37.914 | 20 | insert.file.ok | f8148686-8f42-4e6f-bd96-71f8891488dc | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00120 | 2 | 1 | 이벤트 append | - |
| 16:18:37.914 | 20 | insert.file.ok | f8148686-8f42-4e6f-bd96-71f8891488dc | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00120 | 2 | 1 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00120_02_20230923.json |
| 16:18:37.915 | 20 | insert.file.ok | f8148686-8f42-4e6f-bd96-71f8891488dc | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00121 | 2 | 2 | 이벤트 append | - |
| 16:18:37.915 | 20 | insert.file.ok | f8148686-8f42-4e6f-bd96-71f8891488dc | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00121 | 2 | 2 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00121_02_20230923.json |
| 16:18:37.916 | 20 | insert.file.ok | f8148686-8f42-4e6f-bd96-71f8891488dc | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00133 | 1 | 3 | 이벤트 append | - |
| 16:18:37.916 | 20 | insert.file.ok | f8148686-8f42-4e6f-bd96-71f8891488dc | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00133 | 1 | 3 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00133_01_20230923.json |
| 16:18:37.918 | 20 | insert.file.ok | f8148686-8f42-4e6f-bd96-71f8891488dc | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00134 | 1 | 5 | 이벤트 append | - |
| 16:18:37.918 | 20 | insert.file.ok | f8148686-8f42-4e6f-bd96-71f8891488dc | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00133 | 2 | 4 | 이벤트 append | - |
| 16:18:37.918 | 20 | insert.file.ok | f8148686-8f42-4e6f-bd96-71f8891488dc | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00133 | 2 | 4 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00133_02_20230923.json |
| 16:18:37.919 | 20 | insert.file.ok | f8148686-8f42-4e6f-bd96-71f8891488dc | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00134 | 1 | 5 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00134_01_20230923.json |
| 16:18:37.920 | 20 | insert.file.ok | f8148686-8f42-4e6f-bd96-71f8891488dc | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00135 | 2 | 7 | 이벤트 append | - |
| 16:18:37.920 | 20 | insert.file.ok | f8148686-8f42-4e6f-bd96-71f8891488dc | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00134 | 2 | 6 | 이벤트 append | - |
| 16:18:37.920 | 20 | insert.file.ok | f8148686-8f42-4e6f-bd96-71f8891488dc | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00134 | 2 | 6 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00134_02_20230923.json |
| 16:18:37.920 | 20 | insert.file.ok | f8148686-8f42-4e6f-bd96-71f8891488dc | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00135 | 2 | 7 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00135_02_20230923.json |
| 16:18:37.921 | 20 | insert.file.ok | f8148686-8f42-4e6f-bd96-71f8891488dc | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00147 | 1 | 8 | 이벤트 append | - |
| 16:18:37.921 | 20 | insert.file.ok | f8148686-8f42-4e6f-bd96-71f8891488dc | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00147 | 1 | 8 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00147_01_20230923.json |
| 16:18:37.922 | 20 | insert.file.ok | f8148686-8f42-4e6f-bd96-71f8891488dc | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00154 | 1 | 9 | 이벤트 append | - |
| 16:18:37.922 | 20 | insert.file.ok | f8148686-8f42-4e6f-bd96-71f8891488dc | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00154 | 1 | 9 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00154_01_20230923.json |
| 16:18:37.923 | 20 | insert.file.ok | f8148686-8f42-4e6f-bd96-71f8891488dc | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00155 | 2 | 10 | 이벤트 append | - |
| 16:18:37.923 | 20 | insert.file.ok | f8148686-8f42-4e6f-bd96-71f8891488dc | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00155 | 2 | 10 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00155_02_20230923.json |
| 16:18:37.924 | 20 | insert.file.ok | f8148686-8f42-4e6f-bd96-71f8891488dc | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00157 | 1 | 11 | 이벤트 append | - |
| 16:18:37.924 | 20 | insert.file.ok | f8148686-8f42-4e6f-bd96-71f8891488dc | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00157 | 1 | 11 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00157_01_20230923.json |
| 16:18:37.925 | 20 | insert.file.ok | f8148686-8f42-4e6f-bd96-71f8891488dc | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00163 | 2 | 12 | 이벤트 append | - |
| 16:18:37.925 | 20 | insert.file.ok | f8148686-8f42-4e6f-bd96-71f8891488dc | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00163 | 2 | 12 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00163_02_20230923.json |
| 16:18:37.926 | 20 | insert.file.ok | f8148686-8f42-4e6f-bd96-71f8891488dc | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00163 | 3 | 13 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00163_03_20230923.json |
| 16:18:37.926 | 20 | insert.file.ok | f8148686-8f42-4e6f-bd96-71f8891488dc | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00163 | 3 | 13 | 이벤트 append | - |
| 16:18:37.927 | 20 | insert.file.ok | f8148686-8f42-4e6f-bd96-71f8891488dc | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00167 | 3 | 14 | 이벤트 append | - |
| 16:18:37.927 | 20 | insert.file.ok | f8148686-8f42-4e6f-bd96-71f8891488dc | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00167 | 3 | 14 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00167_03_20230923.json |
| 16:18:37.927 | 20 | insert.file.ok | f8148686-8f42-4e6f-bd96-71f8891488dc | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00168 | 3 | 15 | 이벤트 append | - |
| 16:18:37.927 | 20 | insert.file.ok | f8148686-8f42-4e6f-bd96-71f8891488dc | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00168 | 3 | 15 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00168_03_20230923.json |
| 16:18:37.928 | 20 | insert.file.ok | f8148686-8f42-4e6f-bd96-71f8891488dc | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00169 | 2 | 16 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00169_02_20230923.json |
| 16:18:37.928 | 20 | insert.file.ok | f8148686-8f42-4e6f-bd96-71f8891488dc | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00169 | 2 | 16 | 이벤트 append | - |
| 16:18:37.930 | 20 | insert.file.ok | f8148686-8f42-4e6f-bd96-71f8891488dc | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00188 | 2 | 17 | 이벤트 append | - |
| 16:18:37.930 | 20 | insert.file.ok | f8148686-8f42-4e6f-bd96-71f8891488dc | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00188 | 2 | 17 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00188_02_20230923.json |
| 16:18:37.931 | 20 | insert.file.ok | f8148686-8f42-4e6f-bd96-71f8891488dc | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00190 | 1 | 19 | 이벤트 append | - |
| 16:18:37.931 | 20 | insert.file.ok | f8148686-8f42-4e6f-bd96-71f8891488dc | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00189 | 3 | 18 | 이벤트 append | - |
| 16:18:37.931 | 20 | insert.file.ok | f8148686-8f42-4e6f-bd96-71f8891488dc | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00189 | 3 | 18 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00189_03_20230923.json |
| 16:18:37.931 | 20 | insert.file.ok | f8148686-8f42-4e6f-bd96-71f8891488dc | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00190 | 1 | 19 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00190_01_20230923.json |
| 16:18:37.932 | 20 | insert.file.ok | f8148686-8f42-4e6f-bd96-71f8891488dc | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00190 | 3 | 20 | 이벤트 append | - |
| 16:18:37.932 | 20 | insert.file.ok | f8148686-8f42-4e6f-bd96-71f8891488dc | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00190 | 3 | 20 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00190_03_20230923.json |
| 16:18:37.933 | 20 | insert.file.ok | f8148686-8f42-4e6f-bd96-71f8891488dc | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00192 | 1 | 21 | 이벤트 append | - |
| 16:18:37.933 | 20 | insert.file.ok | f8148686-8f42-4e6f-bd96-71f8891488dc | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00192 | 1 | 21 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00192_01_20230923.json |
| 16:18:37.934 | 20 | insert.file.ok | f8148686-8f42-4e6f-bd96-71f8891488dc | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00197 | 3 | 22 | 이벤트 append | - |
| 16:18:37.934 | 20 | insert.file.ok | f8148686-8f42-4e6f-bd96-71f8891488dc | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00197 | 3 | 22 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00197_03_20230923.json |
| 16:18:37.935 | 20 | insert.file.ok | f8148686-8f42-4e6f-bd96-71f8891488dc | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00206 | 1 | 24 | 이벤트 append | - |
| 16:18:37.935 | 20 | insert.file.ok | f8148686-8f42-4e6f-bd96-71f8891488dc | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00204 | 1 | 23 | 이벤트 append | - |
| 16:18:37.935 | 20 | insert.file.ok | f8148686-8f42-4e6f-bd96-71f8891488dc | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00204 | 1 | 23 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00204_01_20230923.json |
| 16:18:37.935 | 20 | insert.file.ok | f8148686-8f42-4e6f-bd96-71f8891488dc | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00206 | 1 | 24 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00206_01_20230923.json |
| 16:18:37.936 | 20 | insert.file.ok | f8148686-8f42-4e6f-bd96-71f8891488dc | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00206 | 2 | 25 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00206_02_20230923.json |
| 16:18:37.936 | 20 | insert.file.ok | f8148686-8f42-4e6f-bd96-71f8891488dc | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00206 | 2 | 25 | 이벤트 append | - |
| 16:18:37.936 | 40 | insert.file.failed | f8148686-8f42-4e6f-bd96-71f8891488dc | - | - | - | toy-data 파일 적재 실패 ← 트립 앵커 | reason=[   {     "expected": "object",     "code": "invalid_type",     "path": [       "grip_data"     ],     "message": "Invalid input: expected object, received undefined"   } ] · file=반려동물용품_CR01_강아지공룡알장난감_02004_01_20230923.json |
| 16:18:37.938 | 30 | insert.batch.done | f8148686-8f42-4e6f-bd96-71f8891488dc | - | - | - | toy-data 적재 완료 | - |
| 16:18:37.938 | 40 | insert.file.failed | f8148686-8f42-4e6f-bd96-71f8891488dc | - | - | - | toy-data 파일 적재 실패 | reason=[   {     "expected": "object",     "code": "invalid_type",     "path": [       "robot_tf"     ],     "message": "Invalid input: expected object, received undefined"   } ] · file=반려동물용품_CR01_강아지공룡알장난감_02005_01_20230923.json |
| 16:18:37.938 | 30 | - | f8148686-8f42-4e6f-bd96-71f8891488dc | - | - | - | request completed | - |
| 16:18:37.940 | 30 | projection.request | e026a814-3cc0-4a3e-8ba5-0cb2c6e852ca | - | - | - | projection 요청 수신 | - |
| 16:18:37.942 | 30 | projection.start | e026a814-3cc0-4a3e-8ba5-0cb2c6e852ca | - | - | - | catch-up 시작 | projector=multimodal-projector |
| 16:18:37.942 | 20 | - | e026a814-3cc0-4a3e-8ba5-0cb2c6e852ca | - | - | - | 커서 조회 | projector=multimodal-projector |
| 16:18:37.944 | 20 | - | e026a814-3cc0-4a3e-8ba5-0cb2c6e852ca | - | - | - | 이벤트 조회 | - |
| 16:18:37.944 | 20 | projection.event.mapped | e026a814-3cc0-4a3e-8ba5-0cb2c6e852ca | - | 2 | 1 | 이벤트 매핑 | projector=multimodal-projector |
| 16:18:37.946 | 20 | projection.event.mapped | e026a814-3cc0-4a3e-8ba5-0cb2c6e852ca | - | 2 | 2 | 이벤트 매핑 | projector=multimodal-projector |

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
- (level 40, `insert.file.failed`) toy-data 파일 적재 실패 ← 트립 앵커 → Zod 검증에서 grip_data 필드 누결(undefined)으로 원천 Toy-Data 파일의 필수 구조 위반이 발생. [corr:f8148686-8f42-4e6f-bd96-71f8891488dc]
- (level 40, `insert.file.failed`) toy-data 파일 적재 실패 → Zod 검증에서 robot_tf 필드 누결(undefined)으로 원천 Toy-Data 파일의 필수 구조 위반이 발생. [corr:f8148686-8f42-4e6f-bd96-71f8891488dc]
- src/insert/dto/toy-data.dto.ts 의 toyDataSchema 정의는 grip_data와 robot_tf로 z.object() 강제하지만, 로그의 reason detail은 received undefined를 보고하여 원천 파일의 필드 누결이 Zod 거절(insert.file.failed)을 유발. [corr:f8148686-8f42-4e6f-bd96-71f8891488dc]
- 적재 실패 시 event_store append가 배제되며, 후속 projection.request 및 catch-up 파이프라인은 정상 이어나가 Read Model 구조는 무병. [corr:f8148686-8f42-4e6f-bd96-71f8891488dc]
- MultiModalProjector.map() 구현에서 image2dUri와 videoUri는 null 고정할당으로, 현재 시그니처·스타일 준수하여 추가 필드 주입 권고에 배제. [corr:f8148686-8f42-4e6f-bd96-71f8891488dc]

### Decision Drivers
- Zod 거절은 시스템의 의도된 원천 데이터 방어 동작이므로 스키마 완화/기본값 치환 금지
- 결함 파일이 event_store 미유입이므로 Read Model 격리는 무유입 검증에 국한
- API 호환성 및 DB 스키마 변경 최소화 요구사항
- downstream 원천 데이터 파이프라인 수정 요청의 책임 분리

### Considered Options
#### 거절 유지 & 원천 데이터 수락 요청
- 접근: src/insert/dto/toy-data.dto.ts Zod 검증(strict) 유지, insert.file.failed 로그 모니터링 보강으로 downstream 데이터 파이프라인 수정 요청 유도.
- 제안 필드: src/insert/dto/toy-data.dto.ts, LogAction.FILE_FAILED
- 트레이드오프: Projection code 변경 제로, 데이터 무해화 보장. decisionDrivers[API 호환성] 동부족으로 DB/프로젝터 변경을 배제.
```typescript
this.logger.warn({ action: LogAction.FILE_FAILED }, '원천 Toy-Data 필드 누결 감지 — downstream 데이터 수락 요청');
```

#### 무유입 격리 검증 SQL
- 접근: event_store 조회를 실패한 파일의 scene_key/attempt_num 대조로 미유입(0)을 격리 확인.
- 제안 필드: src/projection/repository/event-store-reader.repository.ts
- 트레이드오프: 추가 SELECT overhead 발생, but guarantees poison event absence in ES. decisionDrivers[downstream 책임 분리] 동부족으로 external data pipeline 조정 지연 시 batch 처리 가용.
```typescript
SELECT count(*) FROM event_store WHERE stream_id = 'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02004' AND attempt_num = 1 OR stream_id = 'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02005' AND attempt_num = 1;
```

### Decision Outcome
거절 유지 & 원천 데이터 수락 요청

### Consequences
- (+) ES 오염 유입 차단
- (+) Read Model 스키마·엔드포인트 불변
- (+) downstream 파이프라인 책임 분리 명확화
- (−) external 원천 데이터 수락 요청 지연 시 batch 처리 가용
- (−) 추가 monitoring/alert 로직 유지 필요

### Non-Goals
- Zod 스키ma 완화/optional 화
- default value/coerce 주입
- 신격 격리 테이블 생성
- projection map() 수정

## 2. Read Model 생성 SQL (Read Model DDL)

> 실행 게이트: 아래 변경은 인간 승인 후에만 적용한다 (human-in-the-loop).

### 격리(containment) SQL — 신규 Read Model DDL 불필요, 결함 데이터 무해화가 조치다

```sql
-- 무유입 검증: zod 거절된 파일의 이벤트가 event_store 에 유입되지 않았음을 확인한다 (기대값 0)
SELECT count(*) AS rejected_event_count FROM event_store WHERE (stream_id, attempt_num) IN (('grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02004', 1), ('grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02005', 1));
```

## 3. API Versioning

### 버전 영향

변경 없음. 본 권고는 Zod 검증 유지와 event_store 무유입 검증 절차만 추가할 뿐, Read Model 스키마·엔드포인트·DB 구조를 그대로 보존하여 API 호환성 및 하위 버전 호환을 보장.

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
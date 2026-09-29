<logging_context>
## 이상 로그 맥락 (±N 윈도우)
> 빈도: 최근 1h — `insert.request`(level 30) 1회, `insert.file.failed`(level 40) 1회, `insert.batch.start`(level 30) 1회, `log.delete.request`(level 30) 1회, `log.delete.done`(level 30) 1회, `insert.file.ok`(level 20) 50회, `-`(level 30) 1회.

| time | level | action | correlation_id | stream_id | attempt | global_seq | msg | detail |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 16:08:20.989 | 30 | insert.request | 3e1426e4-85dd-41c3-aa39-04c9e140fdad | - | - | - | Insert Event Store 요청 수신 | - |
| 16:08:20.989 | 30 | insert.batch.start | 3e1426e4-85dd-41c3-aa39-04c9e140fdad | - | - | - | Toy-Data 적재 시작 | - |
| 16:08:20.994 | 20 | insert.file.ok | 3e1426e4-85dd-41c3-aa39-04c9e140fdad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00051 | 2 | 1 | 이벤트 append | - |
| 16:08:20.994 | 20 | insert.file.ok | 3e1426e4-85dd-41c3-aa39-04c9e140fdad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00051 | 2 | 1 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00051_02_20230923.json |
| 16:08:20.995 | 20 | insert.file.ok | 3e1426e4-85dd-41c3-aa39-04c9e140fdad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00055 | 3 | 2 | 이벤트 append | - |
| 16:08:20.995 | 20 | insert.file.ok | 3e1426e4-85dd-41c3-aa39-04c9e140fdad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00055 | 3 | 2 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00055_03_20230923.json |
| 16:08:20.996 | 20 | insert.file.ok | 3e1426e4-85dd-41c3-aa39-04c9e140fdad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00056 | 2 | 3 | 이벤트 append | - |
| 16:08:20.996 | 20 | insert.file.ok | 3e1426e4-85dd-41c3-aa39-04c9e140fdad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00056 | 2 | 3 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00056_02_20230923.json |
| 16:08:20.997 | 20 | insert.file.ok | 3e1426e4-85dd-41c3-aa39-04c9e140fdad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00059 | 2 | 4 | 이벤트 append | - |
| 16:08:20.997 | 20 | insert.file.ok | 3e1426e4-85dd-41c3-aa39-04c9e140fdad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00059 | 2 | 4 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00059_02_20230923.json |
| 16:08:20.998 | 20 | insert.file.ok | 3e1426e4-85dd-41c3-aa39-04c9e140fdad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00061 | 3 | 5 | 이벤트 append | - |
| 16:08:20.998 | 20 | insert.file.ok | 3e1426e4-85dd-41c3-aa39-04c9e140fdad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00061 | 3 | 5 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00061_03_20230923.json |
| 16:08:20.999 | 20 | insert.file.ok | 3e1426e4-85dd-41c3-aa39-04c9e140fdad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00071 | 3 | 6 | 이벤트 append | - |
| 16:08:20.999 | 20 | insert.file.ok | 3e1426e4-85dd-41c3-aa39-04c9e140fdad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00071 | 3 | 6 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00071_03_20230923.json |
| 16:08:21.000 | 20 | insert.file.ok | 3e1426e4-85dd-41c3-aa39-04c9e140fdad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00072 | 1 | 7 | 이벤트 append | - |
| 16:08:21.000 | 20 | insert.file.ok | 3e1426e4-85dd-41c3-aa39-04c9e140fdad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00072 | 1 | 7 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00072_01_20230923.json |
| 16:08:21.001 | 20 | insert.file.ok | 3e1426e4-85dd-41c3-aa39-04c9e140fdad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00074 | 3 | 8 | 이벤트 append | - |
| 16:08:21.001 | 20 | insert.file.ok | 3e1426e4-85dd-41c3-aa39-04c9e140fdad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00074 | 3 | 8 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00074_03_20230923.json |
| 16:08:21.002 | 20 | insert.file.ok | 3e1426e4-85dd-41c3-aa39-04c9e140fdad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00080 | 2 | 10 | 이벤트 append | - |
| 16:08:21.002 | 20 | insert.file.ok | 3e1426e4-85dd-41c3-aa39-04c9e140fdad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00079 | 2 | 9 | 이벤트 append | - |
| 16:08:21.002 | 20 | insert.file.ok | 3e1426e4-85dd-41c3-aa39-04c9e140fdad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00079 | 2 | 9 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00079_02_20230923.json |
| 16:08:21.002 | 20 | insert.file.ok | 3e1426e4-85dd-41c3-aa39-04c9e140fdad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00080 | 2 | 10 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00080_02_20230923.json |
| 16:08:21.003 | 20 | insert.file.ok | 3e1426e4-85dd-41c3-aa39-04c9e140fdad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00097 | 1 | 11 | 이벤트 append | - |
| 16:08:21.003 | 20 | insert.file.ok | 3e1426e4-85dd-41c3-aa39-04c9e140fdad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00097 | 1 | 11 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00097_01_20230923.json |
| 16:08:21.004 | 20 | insert.file.ok | 3e1426e4-85dd-41c3-aa39-04c9e140fdad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00100 | 2 | 12 | 이벤트 append | - |
| 16:08:21.004 | 20 | insert.file.ok | 3e1426e4-85dd-41c3-aa39-04c9e140fdad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00100 | 2 | 12 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00100_02_20230923.json |
| 16:08:21.005 | 20 | insert.file.ok | 3e1426e4-85dd-41c3-aa39-04c9e140fdad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00103 | 1 | 13 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00103_01_20230923.json |
| 16:08:21.005 | 20 | insert.file.ok | 3e1426e4-85dd-41c3-aa39-04c9e140fdad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00103 | 1 | 13 | 이벤트 append | - |
| 16:08:21.006 | 20 | insert.file.ok | 3e1426e4-85dd-41c3-aa39-04c9e140fdad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00103 | 2 | 14 | 이벤트 append | - |
| 16:08:21.006 | 20 | insert.file.ok | 3e1426e4-85dd-41c3-aa39-04c9e140fdad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00103 | 2 | 14 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00103_02_20230923.json |
| 16:08:21.006 | 20 | insert.file.ok | 3e1426e4-85dd-41c3-aa39-04c9e140fdad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00106 | 1 | 15 | 이벤트 append | - |
| 16:08:21.006 | 20 | insert.file.ok | 3e1426e4-85dd-41c3-aa39-04c9e140fdad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00106 | 1 | 15 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00106_01_20230923.json |
| 16:08:21.007 | 20 | insert.file.ok | 3e1426e4-85dd-41c3-aa39-04c9e140fdad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00108 | 2 | 16 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00108_02_20230923.json |
| 16:08:21.007 | 20 | insert.file.ok | 3e1426e4-85dd-41c3-aa39-04c9e140fdad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00108 | 2 | 16 | 이벤트 append | - |
| 16:08:21.008 | 20 | insert.file.ok | 3e1426e4-85dd-41c3-aa39-04c9e140fdad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00110 | 3 | 18 | 이벤트 append | - |
| 16:08:21.008 | 20 | insert.file.ok | 3e1426e4-85dd-41c3-aa39-04c9e140fdad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00109 | 1 | 17 | 이벤트 append | - |
| 16:08:21.008 | 20 | insert.file.ok | 3e1426e4-85dd-41c3-aa39-04c9e140fdad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00109 | 1 | 17 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00109_01_20230923.json |
| 16:08:21.008 | 20 | insert.file.ok | 3e1426e4-85dd-41c3-aa39-04c9e140fdad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00110 | 3 | 18 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00110_03_20230923.json |
| 16:08:21.010 | 20 | insert.file.ok | 3e1426e4-85dd-41c3-aa39-04c9e140fdad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00112 | 3 | 19 | 이벤트 append | - |
| 16:08:21.010 | 20 | insert.file.ok | 3e1426e4-85dd-41c3-aa39-04c9e140fdad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00112 | 3 | 19 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00112_03_20230923.json |
| 16:08:21.011 | 20 | insert.file.ok | 3e1426e4-85dd-41c3-aa39-04c9e140fdad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00120 | 2 | 21 | 이벤트 append | - |
| 16:08:21.011 | 20 | insert.file.ok | 3e1426e4-85dd-41c3-aa39-04c9e140fdad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00117 | 3 | 20 | 이벤트 append | - |
| 16:08:21.011 | 20 | insert.file.ok | 3e1426e4-85dd-41c3-aa39-04c9e140fdad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00117 | 3 | 20 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00117_03_20230923.json |
| 16:08:21.011 | 20 | insert.file.ok | 3e1426e4-85dd-41c3-aa39-04c9e140fdad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00120 | 2 | 21 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00120_02_20230923.json |
| 16:08:21.012 | 20 | insert.file.ok | 3e1426e4-85dd-41c3-aa39-04c9e140fdad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00121 | 2 | 22 | 이벤트 append | - |
| 16:08:21.012 | 20 | insert.file.ok | 3e1426e4-85dd-41c3-aa39-04c9e140fdad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00121 | 2 | 22 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00121_02_20230923.json |
| 16:08:21.013 | 20 | insert.file.ok | 3e1426e4-85dd-41c3-aa39-04c9e140fdad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00133 | 1 | 23 | 이벤트 append | - |
| 16:08:21.013 | 20 | insert.file.ok | 3e1426e4-85dd-41c3-aa39-04c9e140fdad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00133 | 1 | 23 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00133_01_20230923.json |
| 16:08:21.014 | 20 | insert.file.ok | 3e1426e4-85dd-41c3-aa39-04c9e140fdad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00134 | 1 | 25 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00134_01_20230923.json |
| 16:08:21.014 | 20 | insert.file.ok | 3e1426e4-85dd-41c3-aa39-04c9e140fdad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00133 | 2 | 24 | 이벤트 append | - |
| 16:08:21.014 | 20 | insert.file.ok | 3e1426e4-85dd-41c3-aa39-04c9e140fdad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00133 | 2 | 24 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00133_02_20230923.json |
| 16:08:21.014 | 20 | insert.file.ok | 3e1426e4-85dd-41c3-aa39-04c9e140fdad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00134 | 1 | 25 | 이벤트 append | - |
| 16:08:21.015 | 40 | insert.file.failed | 3e1426e4-85dd-41c3-aa39-04c9e140fdad | - | - | - | toy-data 파일 적재 실패 ← 트립 앵커 | reason=[   {     "expected": "number",     "code": "invalid_type",     "path": [       "grip_succeed"     ],     "message": "Invalid input: expected number, received string"   } ] · file=반려동물용품_CR01_강아지공룡알장난감_02002_01_20230923.json |
| 16:08:21.016 | 30 | insert.batch.done | 3e1426e4-85dd-41c3-aa39-04c9e140fdad | - | - | - | toy-data 적재 완료 | - |
| 16:08:21.016 | 40 | insert.file.failed | 3e1426e4-85dd-41c3-aa39-04c9e140fdad | - | - | - | toy-data 파일 적재 실패 | reason=[   {     "origin": "number",     "code": "too_big",     "maximum": 1,     "inclusive": true,     "path": [       "grip_succeed"     ],     "message": "Too big: expected number to be <=1"   } ] · file=반려동물용품_CR01_강아지공룡알장난감_02003_01_20230923.json |
| 16:08:21.016 | 30 | - | 3e1426e4-85dd-41c3-aa39-04c9e140fdad | - | - | - | request completed | - |
| 16:08:21.018 | 30 | projection.request | 1827f27b-b2b6-4beb-984e-94de312ed890 | - | - | - | projection 요청 수신 | - |
| 16:08:21.020 | 30 | projection.start | 1827f27b-b2b6-4beb-984e-94de312ed890 | - | - | - | catch-up 시작 | projector=multimodal-projector |
| 16:08:21.020 | 20 | - | 1827f27b-b2b6-4beb-984e-94de312ed890 | - | - | - | 커서 조회 | projector=multimodal-projector |
| 16:08:21.021 | 20 | - | 1827f27b-b2b6-4beb-984e-94de312ed890 | - | - | - | 이벤트 조회 | - |
| 16:08:21.022 | 20 | projection.event.mapped | 1827f27b-b2b6-4beb-984e-94de312ed890 | - | 2 | 1 | 이벤트 매핑 | projector=multimodal-projector |
| 16:08:21.023 | 20 | projection.event.mapped | 1827f27b-b2b6-4beb-984e-94de312ed890 | - | 3 | 2 | 이벤트 매핑 | projector=multimodal-projector |
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
<logging_context>
## 이상 로그 맥락 (±N 윈도우)
> 빈도: 최근 1h — `insert.request`(level 30) 1회, `insert.batch.start`(level 30) 1회, `log.delete.request`(level 30) 1회, `payload.schema.drift`(level 40) 1회, `log.delete.done`(level 30) 1회, `insert.file.ok`(level 20) 54회, `-`(level 30) 2회, `insert.batch.done`(level 30) 1회.

| time | level | action | correlation_id | stream_id | attempt | global_seq | msg | detail |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 18:58:13.523 | 30 | insert.request | e18ec5e8-31f8-42c6-b105-533fdc7373ad | - | - | - | Insert Event Store 요청 수신 | - |
| 18:58:13.523 | 30 | insert.batch.start | e18ec5e8-31f8-42c6-b105-533fdc7373ad | - | - | - | Toy-Data 적재 시작 | - |
| 18:58:13.528 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00001 | 1 | 1 | 이벤트 append | - |
| 18:58:13.528 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00001 | 1 | 1 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00001_01_20230923.json |
| 18:58:13.529 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00002 | 3 | 2 | 이벤트 append | - |
| 18:58:13.529 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00002 | 3 | 2 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00002_03_20230923.json |
| 18:58:13.529 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00005 | 3 | 3 | 이벤트 append | - |
| 18:58:13.529 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00005 | 3 | 3 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00005_03_20230923.json |
| 18:58:13.531 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00009 | 1 | 4 | 이벤트 append | - |
| 18:58:13.531 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00009 | 1 | 4 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00009_01_20230923.json |
| 18:58:13.531 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00009 | 3 | 5 | 이벤트 append | - |
| 18:58:13.531 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00009 | 3 | 5 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00009_03_20230923.json |
| 18:58:13.532 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00011 | 2 | 6 | 이벤트 append | - |
| 18:58:13.532 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00011 | 2 | 6 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00011_02_20230923.json |
| 18:58:13.533 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00011 | 3 | 7 | 이벤트 append | - |
| 18:58:13.533 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00011 | 3 | 7 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00011_03_20230923.json |
| 18:58:13.534 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00015 | 1 | 8 | 이벤트 append | - |
| 18:58:13.534 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00015 | 1 | 8 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00015_01_20230923.json |
| 18:58:13.535 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00018 | 1 | 9 | 이벤트 append | - |
| 18:58:13.535 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00018 | 1 | 9 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00018_01_20230923.json |
| 18:58:13.535 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00019 | 3 | 10 | 이벤트 append | - |
| 18:58:13.535 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00019 | 3 | 10 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00019_03_20230923.json |
| 18:58:13.536 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00021 | 2 | 11 | 이벤트 append | - |
| 18:58:13.536 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00021 | 2 | 11 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00021_02_20230923.json |
| 18:58:13.537 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00026 | 2 | 12 | 이벤트 append | - |
| 18:58:13.537 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00026 | 2 | 12 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00026_02_20230923.json |
| 18:58:13.537 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00027 | 2 | 13 | 이벤트 append | - |
| 18:58:13.537 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00027 | 2 | 13 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00027_02_20230923.json |
| 18:58:13.538 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00027 | 3 | 14 | 이벤트 append | - |
| 18:58:13.538 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00027 | 3 | 14 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00027_03_20230923.json |
| 18:58:13.539 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00029 | 3 | 15 | 이벤트 append | - |
| 18:58:13.539 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00029 | 3 | 15 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00029_03_20230923.json |
| 18:58:13.539 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00030 | 2 | 16 | 이벤트 append | - |
| 18:58:13.539 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00030 | 2 | 16 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00030_02_20230923.json |
| 18:58:13.540 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00036 | 3 | 17 | 이벤트 append | - |
| 18:58:13.540 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00036 | 3 | 17 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00036_03_20230923.json |
| 18:58:13.541 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00039 | 2 | 18 | 이벤트 append | - |
| 18:58:13.541 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00039 | 2 | 18 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00039_02_20230923.json |
| 18:58:13.541 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00041 | 2 | 19 | 이벤트 append | - |
| 18:58:13.541 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00041 | 2 | 19 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00041_02_20230923.json |
| 18:58:13.542 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00047 | 1 | 20 | 이벤트 append | - |
| 18:58:13.542 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00047 | 1 | 20 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00047_01_20230923.json |
| 18:58:13.542 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00051 | 2 | 21 | 이벤트 append | - |
| 18:58:13.543 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00051 | 2 | 21 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00051_02_20230923.json |
| 18:58:13.543 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00055 | 3 | 22 | 이벤트 append | - |
| 18:58:13.543 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00055 | 3 | 22 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00055_03_20230923.json |
| 18:58:13.544 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00056 | 2 | 23 | 이벤트 append | - |
| 18:58:13.544 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00056 | 2 | 23 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00056_02_20230923.json |
| 18:58:13.545 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00059 | 2 | 24 | 이벤트 append | - |
| 18:58:13.545 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00059 | 2 | 24 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00059_02_20230923.json |
| 18:58:13.545 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00061 | 3 | 25 | 이벤트 append | - |
| 18:58:13.545 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00061 | 3 | 25 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00061_03_20230923.json |
| 18:58:13.546 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02000 | 1 | 26 | 이벤트 append | - |
| 18:58:13.546 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02000 | 1 | 26 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_02000_01_20230923.json |
| 18:58:13.546 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02001 | 1 | 27 | 이벤트 append | - |
| 18:58:13.546 | 20 | insert.file.ok | e18ec5e8-31f8-42c6-b105-533fdc7373ad | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02001 | 1 | 27 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_02001_01_20230923.json |
| 18:58:13.547 | 40 | payload.schema.drift | e18ec5e8-31f8-42c6-b105-533fdc7373ad | - | - | - | payload 에 스키마가 모르는 신규 키 유입 — 적재 시 유실됨(Read Model 후보) ← 트립 앵커 | newKeys={"conveyor_speed": "1.2", "gripper_temperature": "36.5"} |
| 18:58:13.547 | 30 | insert.batch.done | e18ec5e8-31f8-42c6-b105-533fdc7373ad | - | - | - | toy-data 적재 완료 | - |
| 18:58:13.547 | 30 | - | e18ec5e8-31f8-42c6-b105-533fdc7373ad | - | - | - | request completed | - |
| 18:58:13.549 | 30 | projection.request | 3edf385f-e53f-4eb8-a11b-9044ae88fa9b | - | - | - | projection 요청 수신 | - |
| 18:58:13.550 | 20 | - | 3edf385f-e53f-4eb8-a11b-9044ae88fa9b | - | - | - | 커서 조회 | projector=multimodal-projector |
| 18:58:13.550 | 30 | projection.start | 3edf385f-e53f-4eb8-a11b-9044ae88fa9b | - | - | - | catch-up 시작 | projector=multimodal-projector |
| 18:58:13.551 | 20 | - | 3edf385f-e53f-4eb8-a11b-9044ae88fa9b | - | - | - | 이벤트 조회 | - |
| 18:58:13.552 | 20 | projection.event.mapped | 3edf385f-e53f-4eb8-a11b-9044ae88fa9b | - | 1 | 1 | 이벤트 매핑 | projector=multimodal-projector |
| 18:58:13.553 | 20 | projection.event.mapped | 3edf385f-e53f-4eb8-a11b-9044ae88fa9b | - | 3 | 2 | 이벤트 매핑 | projector=multimodal-projector |
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